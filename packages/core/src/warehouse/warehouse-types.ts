/**
 * Sutra Extended Warehouse Management (SAP EWM Equivalent)
 * Types and interfaces for storage bin topologies, multi-zone warehouses,
 * putaway strategies, FEFO/FIFO picking waves, and physical inventory cycle counting.
 */

export type StorageBinType = 
  | 'STANDARD' 
  | 'HIGH_BAY' 
  | 'COLD_STORAGE' 
  | 'HAZARDOUS' 
  | 'STAGING';

export type WarehouseTaskType = 
  | 'PUTAWAY' 
  | 'PICKING' 
  | 'INTERNAL_TRANSFER' 
  | 'REPLENISHMENT';

export type WarehouseTaskStatus = 
  | 'OPEN' 
  | 'IN_PROGRESS' 
  | 'CONFIRMED' 
  | 'CANCELLED';

export interface BinStoredItem {
  sku: string;
  materialName: string;
  batchNumber: string;
  quantity: number;
  baseUom: string;
  weightKg: number;
  volumeCbm: number;
  receiptDate: string;
  expiryDate?: string;
}

export interface StorageBin {
  binId: string;
  warehouseId: string;
  zone: string;
  aisle: string;
  rack: string;
  shelf: string;
  position: string;
  binType: StorageBinType;
  maxWeightKg: number;
  currentWeightKg: number;
  maxVolumeCbm: number;
  currentVolumeCbm: number;
  isBlocked: boolean;
  isOccupied: boolean;
  items: BinStoredItem[];
}

export interface PutawayRequest {
  warehouseId: string;
  sku: string;
  materialName: string;
  batchNumber: string;
  quantity: number;
  baseUom: string;
  unitWeightKg: number;
  unitVolumeCbm: number;
  requiredBinType?: StorageBinType;
  expiryDate?: string;
}

export interface PutawayResult {
  taskId: string;
  targetBinId: string;
  warehouseId: string;
  sku: string;
  batchNumber: string;
  quantity: number;
  status: WarehouseTaskStatus;
  confirmedAt: string;
}

export interface PickingRequest {
  warehouseId: string;
  sku: string;
  quantityRequested: number;
  strategy?: 'FIFO' | 'FEFO';
}

export interface BinPickAllocation {
  binId: string;
  batchNumber: string;
  quantityToPick: number;
  expiryDate?: string;
}

export interface PickingResult {
  taskId: string;
  waveId?: string;
  warehouseId: string;
  sku: string;
  totalQuantityPicked: number;
  allocations: BinPickAllocation[];
  status: WarehouseTaskStatus;
  confirmedAt: string;
}

export interface StockTransferRequest {
  warehouseId: string;
  sourceBinId: string;
  targetBinId: string;
  sku: string;
  batchNumber: string;
  quantity: number;
}

export interface CycleCountRecord {
  countId: string;
  warehouseId: string;
  binId: string;
  sku: string;
  batchNumber: string;
  bookQuantity: number;
  physicalCountedQuantity: number;
  varianceQuantity: number;
  unitCost: number;
  varianceValue: number;
  glVoucherLines?: Array<{
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
  }>;
  countedAt: string;
}
