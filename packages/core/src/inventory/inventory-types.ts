/**
 * Sutra Materials Management (MM) - Types & Data Models
 * Equivalent to SAP MM Material Master, Movement Types, and Stock Valuation
 */

export type MaterialType = 
  | 'ROH'   // Raw Materials (purchased, not sold)
  | 'HALB'  // Semi-Finished Products (manufactured in-house, used in assembly)
  | 'FERT'  // Finished Products (manufactured in-house, sold to customers)
  | 'HAWA'  // Trading Goods (purchased and resold without processing)
  | 'DIEN'; // Services (non-stock, intangible)

export type StockType = 
  | 'UNRESTRICTED'       // Available for use/sale
  | 'QUALITY_INSPECTION' // Held in QA review before release
  | 'BLOCKED'            // Damaged, expired, or quarantine stock
  | 'RESERVED';          // Allocated to confirmed sales/production orders

export type MovementType = 
  | '101' // Goods Receipt for Purchase Order into Warehouse (increases stock, updates MAP)
  | '102' // Goods Receipt Reversal
  | '201' // Goods Issue for Cost Center / Internal Consumption (decreases stock, posts expense)
  | '261' // Goods Issue for Production Order
  | '301' // Transfer Posting: Plant to Plant
  | '311' // Transfer Posting: Storage Location to Storage Location
  | '601' // Goods Issue for Sales Delivery (decreases stock, posts COGS)
  | '602'; // Goods Issue Reversal for Sales Delivery

export interface MaterialMaster {
  sku: string;
  name: string;
  description: string;
  materialType: MaterialType;
  baseUom: string; // Unit of Measure: EA, KG, LTR, MTR, etc.
  hsnCode: string; // Harmonized System Nomenclature (GST classification)
  standardPrice: number;
  movingAvgPrice: number;
  totalStock: number;
  safetyStock: number;
  reorderPoint: number;
  valuationClass: string; // Links to GL Account (e.g., 3000 Raw Materials, 7920 Finished Goods)
  glInventoryAccount: string;
  glConsumptionAccount: string;
  glCogsAccount: string;
  createdAt: string;
  updatedAt: string;
}

export interface StorageLocationStock {
  plantId: string;
  storageLocationId: string;
  sku: string;
  unrestrictedQty: number;
  qualityInspectionQty: number;
  blockedQty: number;
  reservedQty: number;
}

export interface StockMovementInput {
  movementType: MovementType;
  sku: string;
  quantity: number;
  unitCost?: number; // Used in 101 Goods Receipt for MAP recalculation
  fromPlant?: string;
  fromStorageLocation?: string;
  toPlant?: string;
  toStorageLocation?: string;
  targetStockType?: StockType; // Default: UNRESTRICTED
  referenceDocument?: string; // PO number, Sales Order, Production Order
  costCenter?: string;
  performedBy?: string;
}

export interface StockMovementResult {
  movementDocumentId: string;
  movementType: MovementType;
  sku: string;
  quantity: number;
  previousStock: number;
  currentStock: number;
  previousMovingAvgPrice: number;
  newMovingAvgPrice: number;
  totalValuation: number;
  reorderAlert: boolean;
  reorderAlertMessage?: string;
  glPostingRequired: boolean;
  journalLines?: Array<{
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
    costCenter?: string;
    description: string;
  }>;
  timestamp: string;
}
