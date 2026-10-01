/**
 * Sutra Inventory & Materials Valuation Engine (SAP MM Equivalent)
 * Handles stock balances, Moving Average Price (MAP) recalculation,
 * storage location transfers, and automatic General Ledger journal generation.
 */

import {
  MaterialMaster,
  MovementType,
  StockMovementInput,
  StockMovementResult,
  StorageLocationStock,
} from './inventory-types.js';
import {
  MaterialType,
  InventoryMovementType,
  StandardGlAccount,
  SystemDefaults,
} from '../common/constants.js';

export class InventoryEngine {
  private materials: Map<string, MaterialMaster> = new Map();
  private stockLocations: Map<string, StorageLocationStock> = new Map();

  constructor() {
    this.seedDefaultMaterials();
  }

  private seedDefaultMaterials(): void {
    const defaults: MaterialMaster[] = [
      {
        sku: 'ROH-STEEL-001',
        name: 'Cold-Rolled Steel Coils (CRCA 1.2mm)',
        description: 'Prime grade cold-rolled steel coils for chassis manufacturing',
        materialType: MaterialType.RAW_MATERIAL,
        baseUom: 'KG',
        hsnCode: '7209',
        standardPrice: 65.0,
        movingAvgPrice: 62.5,
        totalStock: 12500,
        safetyStock: 2000,
        reorderPoint: 4000,
        valuationClass: '3000',
        glInventoryAccount: StandardGlAccount.INVENTORY_RAW_MATERIALS,
        glConsumptionAccount: StandardGlAccount.RAW_MATERIAL_CONSUMPTION,
        glCogsAccount: StandardGlAccount.COGS,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        sku: 'HALB-AXLE-001',
        name: 'Sub-Assembly Rear Axle Hub',
        description: 'Precision machined rear axle sub-assembly with bearings',
        materialType: MaterialType.SEMI_FINISHED,
        baseUom: 'EA',
        hsnCode: '8708',
        standardPrice: 1850.0,
        movingAvgPrice: 1820.0,
        totalStock: 350,
        safetyStock: 50,
        reorderPoint: 100,
        valuationClass: '7900',
        glInventoryAccount: StandardGlAccount.INVENTORY_WIP,
        glConsumptionAccount: '510200',
        glCogsAccount: StandardGlAccount.COGS,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        sku: 'FERT-EVTRK-001',
        name: 'Sutra E-Titan 1.5T Commercial EV',
        description: 'Fully assembled light commercial electric freight truck',
        materialType: MaterialType.FINISHED_PRODUCT,
        baseUom: 'EA',
        hsnCode: '8704',
        standardPrice: 950000.0,
        movingAvgPrice: 915000.0,
        totalStock: 42,
        safetyStock: 10,
        reorderPoint: 15,
        valuationClass: '7920',
        glInventoryAccount: StandardGlAccount.INVENTORY_FINISHED_GOODS,
        glConsumptionAccount: '510300',
        glCogsAccount: StandardGlAccount.COGS,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const m of defaults) {
      this.materials.set(m.sku, m);
      this.stockLocations.set(`${SystemDefaults.DEFAULT_PLANT_ID}:SLOC-0001:${m.sku}`, {
        plantId: SystemDefaults.DEFAULT_PLANT_ID,
        storageLocationId: 'SLOC-0001',
        sku: m.sku,
        unrestrictedQty: m.totalStock,
        qualityInspectionQty: 0,
        blockedQty: 0,
        reservedQty: 0,
      });
    }
  }

  public registerMaterial(material: MaterialMaster): void {
    this.materials.set(material.sku, material);
  }

  public getMaterial(sku: string): MaterialMaster | undefined {
    return this.materials.get(sku);
  }

  public getAllMaterials(): MaterialMaster[] {
    return Array.from(this.materials.values());
  }

  public getStockLocations(): StorageLocationStock[] {
    return Array.from(this.stockLocations.values());
  }

  /**
   * Recalculates Moving Average Price (MAP) on inbound receipt:
   * New MAP = ((Current Qty * Current MAP) + (Receipt Qty * Receipt Unit Cost)) / (Current Qty + Receipt Qty)
   */
  public calculateNewMovingAveragePrice(
    currentStock: number,
    currentMap: number,
    inboundQty: number,
    inboundUnitCost: number
  ): number {
    const totalQty = currentStock + inboundQty;
    if (totalQty <= 0) return currentMap;

    const currentTotalValuation = currentStock * currentMap;
    const inboundTotalValuation = inboundQty * inboundUnitCost;
    const newMap = (currentTotalValuation + inboundTotalValuation) / totalQty;
    return Math.round((newMap + Number.EPSILON) * 100) / 100;
  }

  /**
   * Executes a SAP-standard inventory movement (101, 102, 201, 301, 311, 601)
   */
  public executeStockMovement(input: StockMovementInput): StockMovementResult {
    const material = this.materials.get(input.sku);
    if (!material) {
      throw new Error(`Material SKU '${input.sku}' does not exist in Material Master.`);
    }

    if (input.quantity <= 0) {
      throw new Error(`Movement quantity must be greater than zero. Received: ${input.quantity}`);
    }

    const previousStock = material.totalStock;
    const previousMap = material.movingAvgPrice;
    let newStock = previousStock;
    let newMap = previousMap;
    let glPostingRequired = true;
    const journalLines: StockMovementResult['journalLines'] = [];

    const docId = `MATDOC-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
    const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

    switch (input.movementType) {
      case InventoryMovementType.GR_PURCHASE_ORDER: {
        // Goods Receipt for Purchase Order
        const unitCost = input.unitCost ?? material.standardPrice;
        newMap = this.calculateNewMovingAveragePrice(previousStock, previousMap, input.quantity, unitCost);
        newStock = previousStock + input.quantity;

        const totalValuation = round2(input.quantity * unitCost);
        // Accounting: Dr Inventory Account, Cr GR/IR Clearing Account
        journalLines.push(
          {
            accountCode: material.glInventoryAccount,
            accountName: `Inventory - ${material.name}`,
            debit: totalValuation,
            credit: 0,
            description: `Goods Receipt Mvt 101 PO:${input.referenceDocument ?? 'N/A'} for ${material.sku}`,
          },
          {
            accountCode: StandardGlAccount.GRIR_CLEARING, // GR/IR Clearing Account (Liability)
            accountName: 'Goods Receipt / Invoice Receipt (GR/IR) Clearing',
            debit: 0,
            credit: totalValuation,
            description: `GR/IR offset for Mvt 101 doc ${docId}`,
          }
        );
        break;
      }

      case InventoryMovementType.GR_REVERSAL: {
        // Goods Receipt Reversal
        if (previousStock < input.quantity) {
          throw new Error(`Cannot reverse goods receipt: available stock (${previousStock}) is less than reversal quantity (${input.quantity})`);
        }
        newStock = previousStock - input.quantity;
        const totalValuation = round2(input.quantity * previousMap);
        // Accounting: Dr GR/IR Clearing Account, Cr Inventory Account
        journalLines.push(
          {
            accountCode: StandardGlAccount.GRIR_CLEARING,
            accountName: 'Goods Receipt / Invoice Receipt (GR/IR) Clearing',
            debit: totalValuation,
            credit: 0,
            description: `Goods Receipt Reversal Mvt 102 doc ${docId}`,
          },
          {
            accountCode: material.glInventoryAccount,
            accountName: `Inventory - ${material.name}`,
            debit: 0,
            credit: totalValuation,
            description: `Reversal Mvt 102 for ${material.sku}`,
          }
        );
        break;
      }

      case InventoryMovementType.GI_COST_CENTER: {
        // Goods Issue for Cost Center / Internal Consumption
        if (previousStock < input.quantity) {
          throw new Error(`Insufficient stock for consumption. Available: ${previousStock}, Requested: ${input.quantity}`);
        }
        newStock = previousStock - input.quantity;
        const totalValuation = round2(input.quantity * previousMap);
        // Accounting: Dr Consumption Expense (with Cost Center), Cr Inventory Account
        journalLines.push(
          {
            accountCode: material.glConsumptionAccount,
            accountName: `Raw Material / Goods Consumption Expense`,
            debit: totalValuation,
            credit: 0,
            costCenter: input.costCenter ?? SystemDefaults.DEFAULT_COST_CENTER,
            description: `Consumption Mvt 201 for ${material.sku} to CC: ${input.costCenter ?? SystemDefaults.DEFAULT_COST_CENTER}`,
          },
          {
            accountCode: material.glInventoryAccount,
            accountName: `Inventory - ${material.name}`,
            debit: 0,
            credit: totalValuation,
            description: `Inventory reduction Mvt 201 doc ${docId}`,
          }
        );
        break;
      }

      case InventoryMovementType.TRANSFER_STORAGE_LOCATION: {
        // Storage Location to Storage Location Transfer (Valuation unchanged)
        if (previousStock < input.quantity) {
          throw new Error(`Insufficient stock for transfer. Available: ${previousStock}, Requested: ${input.quantity}`);
        }
        // Stock within company stays constant; only location updates
        glPostingRequired = false;
        break;
      }

      case InventoryMovementType.GI_SALES_DELIVERY: {
        // Goods Issue for Sales Delivery (Outbound Delivery)
        if (previousStock < input.quantity) {
          throw new Error(`Insufficient stock for sales delivery. Available: ${previousStock}, Requested: ${input.quantity}`);
        }
        newStock = previousStock - input.quantity;
        const totalValuation = round2(input.quantity * previousMap);
        // Accounting: Dr Cost of Goods Sold (COGS), Cr Inventory Account
        journalLines.push(
          {
            accountCode: material.glCogsAccount,
            accountName: 'Cost of Goods Sold (COGS)',
            debit: totalValuation,
            credit: 0,
            description: `COGS post Goods Issue Mvt 601 for Delivery ${input.referenceDocument ?? 'N/A'}`,
          },
          {
            accountCode: material.glInventoryAccount,
            accountName: `Inventory - ${material.name}`,
            debit: 0,
            credit: totalValuation,
            description: `Inventory release Mvt 601 for ${material.sku}`,
          }
        );
        break;
      }

      default:
        throw new Error(`Unsupported movement type: ${(input as any).movementType}`);
    }

    // Update material state
    material.totalStock = newStock;
    material.movingAvgPrice = newMap;
    material.updatedAt = new Date().toISOString();
    this.materials.set(material.sku, material);

    // Reorder Point check
    const reorderAlert = newStock <= material.reorderPoint;
    const reorderAlertMessage = reorderAlert
      ? `Stock level for SKU ${material.sku} (${newStock} ${material.baseUom}) is at or below reorder point (${material.reorderPoint} ${material.baseUom}). Safety stock is ${material.safetyStock} ${material.baseUom}. Automated replenishment advised.`
      : undefined;

    return {
      movementDocumentId: docId,
      movementType: input.movementType,
      sku: material.sku,
      quantity: input.quantity,
      previousStock,
      currentStock: newStock,
      previousMovingAvgPrice: previousMap,
      newMovingAvgPrice: newMap,
      totalValuation: round2(newStock * newMap),
      reorderAlert,
      reorderAlertMessage,
      glPostingRequired,
      journalLines: glPostingRequired ? journalLines : undefined,
      timestamp: new Date().toISOString(),
    };
  }
}
