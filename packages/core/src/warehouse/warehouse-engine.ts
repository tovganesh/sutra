/**
 * Sutra Extended Warehouse Management Engine (SAP EWM Equivalent)
 * Manages bin master topologies, capacity algorithms, automated putaway,
 * FIFO/FEFO picking algorithms, stock transfers, and physical inventory cycle counting.
 */

import {
  StorageBin,
  StorageBinType,
  BinStoredItem,
  PutawayRequest,
  PutawayResult,
  PickingRequest,
  PickingResult,
  BinPickAllocation,
  StockTransferRequest,
  CycleCountRecord,
} from './warehouse-types.js';
import { WarehouseTaskStatus } from '../common/constants.js';

export class WarehouseEngine {
  private bins: Map<string, StorageBin> = new Map();
  private cycleCounts: Map<string, CycleCountRecord> = new Map();

  constructor() {
    this.seedDefaultStorageBins();
  }

  /**
   * Register a new storage bin in the warehouse topology
   */
  public registerBin(binData: {
    binId: string;
    warehouseId: string;
    zone: string;
    aisle: string;
    rack: string;
    shelf: string;
    position: string;
    binType: StorageBinType;
    maxWeightKg: number;
    maxVolumeCbm: number;
    isBlocked?: boolean;
  }): StorageBin {
    if (this.bins.has(binData.binId)) {
      throw new Error(`Storage bin ${binData.binId} is already registered.`);
    }

    const bin: StorageBin = {
      ...binData,
      currentWeightKg: 0,
      currentVolumeCbm: 0,
      isBlocked: binData.isBlocked ?? false,
      isOccupied: false,
      items: [],
    };

    this.bins.set(bin.binId, bin);
    return bin;
  }

  public getBins(warehouseId?: string): StorageBin[] {
    const all = Array.from(this.bins.values());
    if (warehouseId) {
      return all.filter((b) => b.warehouseId === warehouseId);
    }
    return all;
  }

  public getBin(binId: string): StorageBin | undefined {
    return this.bins.get(binId);
  }

  /**
   * Search and find the optimal bin for incoming goods putaway based on:
   * 1. Target warehouse matching
   * 2. Bin not blocked
   * 3. Compatible bin type (e.g. COLD_STORAGE, HAZARDOUS, or STANDARD/HIGH_BAY)
   * 4. Remaining weight and volume capacity
   */
  public findOptimalPutawayBin(request: PutawayRequest): StorageBin | null {
    const requiredWeight = request.quantity * request.unitWeightKg;
    const requiredVolume = request.quantity * request.unitVolumeCbm;

    const candidates = Array.from(this.bins.values()).filter((bin) => {
      if (bin.warehouseId !== request.warehouseId) return false;
      if (bin.isBlocked) return false;
      if (request.requiredBinType && bin.binType !== request.requiredBinType) return false;

      const remainingWeight = bin.maxWeightKg - bin.currentWeightKg;
      const remainingVolume = bin.maxVolumeCbm - bin.currentVolumeCbm;

      return remainingWeight >= requiredWeight && remainingVolume >= requiredVolume;
    });

    if (candidates.length === 0) return null;

    // Preference: Empty bin first, or bin already containing same SKU/batch
    candidates.sort((a, b) => {
      const aHasSameSku = a.items.some((i) => i.sku === request.sku);
      const bHasSameSku = b.items.some((i) => i.sku === request.sku);
      if (aHasSameSku && !bHasSameSku) return -1;
      if (!aHasSameSku && bHasSameSku) return 1;
      return (a.currentWeightKg / a.maxWeightKg) - (b.currentWeightKg / b.maxWeightKg);
    });

    return candidates[0];
  }

  /**
   * Execute putaway into the optimal bin or designated bin
   */
  public executePutaway(request: PutawayRequest, designatedBinId?: string): PutawayResult {
    let targetBin: StorageBin | null = null;

    if (designatedBinId) {
      targetBin = this.bins.get(designatedBinId) || null;
      if (!targetBin) {
        throw new Error(`Designated bin ${designatedBinId} not found.`);
      }
      if (targetBin.isBlocked) {
        throw new Error(`Designated bin ${designatedBinId} is blocked for maintenance.`);
      }
    } else {
      targetBin = this.findOptimalPutawayBin(request);
      if (!targetBin) {
        throw new Error(`No available storage bin in warehouse ${request.warehouseId} with sufficient capacity.`);
      }
    }

    const totalWeight = request.quantity * request.unitWeightKg;
    const totalVolume = request.quantity * request.unitVolumeCbm;

    if (targetBin.currentWeightKg + totalWeight > targetBin.maxWeightKg) {
      throw new Error(`Putaway exceeds bin ${targetBin.binId} maximum weight capacity.`);
    }

    // Check if item already exists in bin
    const existing = targetBin.items.find(
      (i) => i.sku === request.sku && i.batchNumber === request.batchNumber
    );

    if (existing) {
      existing.quantity += request.quantity;
      existing.weightKg += totalWeight;
      existing.volumeCbm += totalVolume;
    } else {
      const newItem: BinStoredItem = {
        sku: request.sku,
        materialName: request.materialName,
        batchNumber: request.batchNumber,
        quantity: request.quantity,
        baseUom: request.baseUom,
        weightKg: totalWeight,
        volumeCbm: totalVolume,
        receiptDate: new Date().toISOString(),
        expiryDate: request.expiryDate,
      };
      targetBin.items.push(newItem);
    }

    targetBin.currentWeightKg += totalWeight;
    targetBin.currentVolumeCbm += totalVolume;
    targetBin.isOccupied = true;

    const taskId = `WT-PUT-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    return {
      taskId,
      targetBinId: targetBin.binId,
      warehouseId: targetBin.warehouseId,
      sku: request.sku,
      batchNumber: request.batchNumber,
      quantity: request.quantity,
      status: WarehouseTaskStatus.CONFIRMED,
      confirmedAt: new Date().toISOString(),
    };
  }

  /**
   * Execute picking using FIFO or FEFO strategy across storage bins
   */
  public executePicking(request: PickingRequest): PickingResult {
    const strategy = request.strategy || 'FIFO';
    const matchingBins: Array<{ bin: StorageBin; item: BinStoredItem }> = [];

    for (const bin of this.bins.values()) {
      if (bin.warehouseId !== request.warehouseId || bin.isBlocked) continue;
      for (const item of bin.items) {
        if (item.sku === request.sku && item.quantity > 0) {
          matchingBins.push({ bin, item });
        }
      }
    }

    if (matchingBins.length === 0) {
      throw new Error(`SKU ${request.sku} is not available in warehouse ${request.warehouseId}.`);
    }

    // Sort according to strategy
    if (strategy === 'FEFO') {
      matchingBins.sort((a, b) => {
        const expA = a.item.expiryDate ? new Date(a.item.expiryDate).getTime() : Infinity;
        const expB = b.item.expiryDate ? new Date(b.item.expiryDate).getTime() : Infinity;
        return expA - expB;
      });
    } else {
      // FIFO by receipt date
      matchingBins.sort((a, b) => {
        return new Date(a.item.receiptDate).getTime() - new Date(b.item.receiptDate).getTime();
      });
    }

    let remainingToPick = request.quantityRequested;
    const allocations: BinPickAllocation[] = [];

    for (const match of matchingBins) {
      if (remainingToPick <= 0) break;

      const pickQty = Math.min(match.item.quantity, remainingToPick);
      const unitWeight = match.item.weightKg / match.item.quantity;
      const unitVolume = match.item.volumeCbm / match.item.quantity;

      match.item.quantity -= pickQty;
      match.item.weightKg -= pickQty * unitWeight;
      match.item.volumeCbm -= pickQty * unitVolume;

      match.bin.currentWeightKg = Math.max(0, match.bin.currentWeightKg - (pickQty * unitWeight));
      match.bin.currentVolumeCbm = Math.max(0, match.bin.currentVolumeCbm - (pickQty * unitVolume));

      // Remove item if quantity reached zero
      if (match.item.quantity <= 0) {
        match.bin.items = match.bin.items.filter((i) => i !== match.item);
      }

      if (match.bin.items.length === 0) {
        match.bin.isOccupied = false;
        match.bin.currentWeightKg = 0;
        match.bin.currentVolumeCbm = 0;
      }

      allocations.push({
        binId: match.bin.binId,
        batchNumber: match.item.batchNumber,
        quantityToPick: pickQty,
        expiryDate: match.item.expiryDate,
      });

      remainingToPick -= pickQty;
    }

    if (remainingToPick > 0) {
      throw new Error(
        `Insufficient stock for SKU ${request.sku}. Requested: ${request.quantityRequested}, Picked: ${request.quantityRequested - remainingToPick}.`
      );
    }

    const taskId = `WT-PICK-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    return {
      taskId,
      warehouseId: request.warehouseId,
      sku: request.sku,
      totalQuantityPicked: request.quantityRequested,
      allocations,
      status: WarehouseTaskStatus.CONFIRMED,
      confirmedAt: new Date().toISOString(),
    };
  }

  /**
   * Internal bin-to-bin stock transfer
   */
  public executeBinTransfer(request: StockTransferRequest): {
    taskId: string;
    sourceBinId: string;
    targetBinId: string;
    sku: string;
    batchNumber: string;
    quantity: number;
    status: string;
  } {
    const sourceBin = this.bins.get(request.sourceBinId);
    const targetBin = this.bins.get(request.targetBinId);

    if (!sourceBin) throw new Error(`Source bin ${request.sourceBinId} not found.`);
    if (!targetBin) throw new Error(`Target bin ${request.targetBinId} not found.`);
    if (targetBin.isBlocked) throw new Error(`Target bin ${request.targetBinId} is blocked.`);

    const sourceItem = sourceBin.items.find(
      (i) => i.sku === request.sku && i.batchNumber === request.batchNumber
    );
    if (!sourceItem || sourceItem.quantity < request.quantity) {
      throw new Error(`Insufficient stock in source bin ${request.sourceBinId} for SKU ${request.sku}.`);
    }

    const unitWeight = sourceItem.weightKg / sourceItem.quantity;
    const unitVolume = sourceItem.volumeCbm / sourceItem.quantity;
    const transferWeight = request.quantity * unitWeight;
    const transferVolume = request.quantity * unitVolume;

    if (targetBin.currentWeightKg + transferWeight > targetBin.maxWeightKg) {
      throw new Error(`Target bin ${request.targetBinId} would exceed maximum weight limit.`);
    }

    // Deduct from source
    sourceItem.quantity -= request.quantity;
    sourceItem.weightKg -= transferWeight;
    sourceItem.volumeCbm -= transferVolume;
    sourceBin.currentWeightKg = Math.max(0, sourceBin.currentWeightKg - transferWeight);
    sourceBin.currentVolumeCbm = Math.max(0, sourceBin.currentVolumeCbm - transferVolume);

    if (sourceItem.quantity <= 0) {
      sourceBin.items = sourceBin.items.filter((i) => i !== sourceItem);
    }
    if (sourceBin.items.length === 0) {
      sourceBin.isOccupied = false;
    }

    // Add to target
    const targetItem = targetBin.items.find(
      (i) => i.sku === request.sku && i.batchNumber === request.batchNumber
    );
    if (targetItem) {
      targetItem.quantity += request.quantity;
      targetItem.weightKg += transferWeight;
      targetItem.volumeCbm += transferVolume;
    } else {
      targetBin.items.push({
        sku: request.sku,
        materialName: sourceItem.materialName,
        batchNumber: request.batchNumber,
        quantity: request.quantity,
        baseUom: sourceItem.baseUom,
        weightKg: transferWeight,
        volumeCbm: transferVolume,
        receiptDate: new Date().toISOString(),
        expiryDate: sourceItem.expiryDate,
      });
    }

    targetBin.currentWeightKg += transferWeight;
    targetBin.currentVolumeCbm += transferVolume;
    targetBin.isOccupied = true;

    return {
      taskId: `WT-XFER-${Date.now().toString(36).toUpperCase()}`,
      sourceBinId: sourceBin.binId,
      targetBinId: targetBin.binId,
      sku: request.sku,
      batchNumber: request.batchNumber,
      quantity: request.quantity,
      status: WarehouseTaskStatus.CONFIRMED,
    };
  }

  /**
   * Record physical inventory cycle count and generate balanced GL adjustment voucher
   */
  public recordCycleCount(countData: {
    warehouseId: string;
    binId: string;
    sku: string;
    batchNumber: string;
    physicalCountedQuantity: number;
    unitCost: number;
  }): CycleCountRecord {
    const bin = this.bins.get(countData.binId);
    if (!bin) throw new Error(`Bin ${countData.binId} not found.`);

    const item = bin.items.find((i) => i.sku === countData.sku && i.batchNumber === countData.batchNumber);
    const bookQty = item ? item.quantity : 0;
    const varianceQty = countData.physicalCountedQuantity - bookQty;
    const varianceVal = Math.round(Math.abs(varianceQty) * countData.unitCost);

    const countId = `CC-${Date.now().toString(36).toUpperCase()}`;

    // Adjust bin quantity to match physical count
    if (item) {
      item.quantity = countData.physicalCountedQuantity;
      if (item.quantity === 0) {
        bin.items = bin.items.filter((i) => i !== item);
        if (bin.items.length === 0) {
          bin.isOccupied = false;
          bin.currentWeightKg = 0;
          bin.currentVolumeCbm = 0;
        }
      }
    }

    // Build balanced GL voucher for discrepancy
    const glVoucherLines: Array<{ accountCode: string; accountName: string; debit: number; credit: number }> = [];

    if (varianceQty < 0) {
      // Shortage / Shrinkage expense
      glVoucherLines.push({
        accountCode: '540100',
        accountName: 'Inventory Shrinkage & Discrepancy Expense',
        debit: varianceVal,
        credit: 0,
      });
      glVoucherLines.push({
        accountCode: '120100',
        accountName: `Inventory Clearing Adjustment (${countData.sku})`,
        debit: 0,
        credit: varianceVal,
      });
    } else if (varianceQty > 0) {
      // Overage / Inventory Gain
      glVoucherLines.push({
        accountCode: '120100',
        accountName: `Inventory Clearing Adjustment (${countData.sku})`,
        debit: varianceVal,
        credit: 0,
      });
      glVoucherLines.push({
        accountCode: '430100',
        accountName: 'Inventory Count Overage / Gain',
        debit: 0,
        credit: varianceVal,
      });
    }

    const record: CycleCountRecord = {
      countId,
      warehouseId: countData.warehouseId,
      binId: countData.binId,
      sku: countData.sku,
      batchNumber: countData.batchNumber,
      bookQuantity: bookQty,
      physicalCountedQuantity: countData.physicalCountedQuantity,
      varianceQuantity: varianceQty,
      unitCost: countData.unitCost,
      varianceValue: varianceVal,
      glVoucherLines: glVoucherLines.length > 0 ? glVoucherLines : undefined,
      countedAt: new Date().toISOString(),
    };

    this.cycleCounts.set(countId, record);
    return record;
  }

  private seedDefaultStorageBins() {
    const wh = 'WH-PUNE-CENTRAL';
    // Zone A: High Bay Heavy Raw Materials
    this.registerBin({
      binId: 'BIN-PUN-ZA-01',
      warehouseId: wh,
      zone: 'ZONE-A-HEAVY',
      aisle: 'A01',
      rack: 'R01',
      shelf: 'S01',
      position: 'P01',
      binType: 'HIGH_BAY',
      maxWeightKg: 5000,
      maxVolumeCbm: 12.0,
    });
    this.registerBin({
      binId: 'BIN-PUN-ZA-02',
      warehouseId: wh,
      zone: 'ZONE-A-HEAVY',
      aisle: 'A01',
      rack: 'R01',
      shelf: 'S02',
      position: 'P01',
      binType: 'HIGH_BAY',
      maxWeightKg: 5000,
      maxVolumeCbm: 12.0,
    });

    // Zone B: Standard Parts & Assemblies
    this.registerBin({
      binId: 'BIN-PUN-ZB-01',
      warehouseId: wh,
      zone: 'ZONE-B-STANDARD',
      aisle: 'A02',
      rack: 'R01',
      shelf: 'S01',
      position: 'P01',
      binType: 'STANDARD',
      maxWeightKg: 1000,
      maxVolumeCbm: 4.0,
    });

    // Pre-populate BIN-PUN-ZA-01 with some initial raw material coils
    this.executePutaway({
      warehouseId: wh,
      sku: 'ROH-STEEL-001',
      materialName: 'Cold-Rolled Steel Coils (CRCA 1.2mm)',
      batchNumber: 'LOT-STL-2026-08',
      quantity: 50,
      baseUom: 'KG',
      unitWeightKg: 1.0,
      unitVolumeCbm: 0.002,
      requiredBinType: 'HIGH_BAY',
      expiryDate: '2028-12-31',
    }, 'BIN-PUN-ZA-01');
  }
}
