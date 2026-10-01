/**
 * Sutra Materials Management (MM) - Types & Data Models
 * Equivalent to SAP MM Material Master, Movement Types, and Stock Valuation
 */

import {
  type MaterialTypeCode,
  type StockTypeCode,
  type InventoryMovementTypeCode,
} from '../common/constants.js';

export type MovementType = InventoryMovementTypeCode;

export interface MaterialMaster {
  sku: string;
  name: string;
  description: string;
  materialType: MaterialTypeCode;
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
  targetStockType?: StockTypeCode; // Default: UNRESTRICTED
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
