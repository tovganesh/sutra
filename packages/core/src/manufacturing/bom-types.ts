/**
 * Sutra Production Planning & Manufacturing (PP) - Types & Data Models
 * Equivalent to SAP PP Bill of Materials (BOM), Work Centers, Routings, and Production Orders.
 */

export interface BomComponentItem {
  componentSku: string;
  quantityRequired: number; // Quantity per 1 unit of parent
  baseUom: string;
  scrapFactorPercent?: number; // Allowance for manufacturing waste/scrap
  issueStorageLocation?: string;
}

export interface BillOfMaterials {
  bomId: string;
  parentSku: string;
  version: string;
  plantId: string;
  baseQuantity: number; // Typically 1
  components: BomComponentItem[];
  isActive: boolean;
  createdAt: string;
}

export interface WorkCenter {
  workCenterId: string;
  name: string;
  plantId: string;
  costCenter: string;
  capacityHoursPerDay: number;
  hourlyLaborCost: number;
  hourlyMachineCost: number;
}

export interface RoutingStep {
  operationNumber: string; // e.g. '0010', '0020'
  workCenterId: string;
  description: string;
  setupTimeMinutes: number;
  runTimePerUnitMinutes: number;
}

export interface ProductionOrderInput {
  tenantId: string;
  orderNumber: string;
  targetSku: string;
  targetQuantity: number;
  plantId: string;
  startDate: string;
  targetCompletionDate: string;
  createdBy?: string;
}

export interface ProductionOrderResult {
  orderNumber: string;
  status: 'PLANNED' | 'RELEASED' | 'CONFIRMED' | 'CLOSED';
  targetSku: string;
  targetQuantity: number;
  plantId: string;
  bomVersion: string;
  componentsRequired: Array<{
    sku: string;
    totalRequiredQty: number;
    availableStock: number;
    isStockAvailable: boolean;
    unitCost: number;
    totalCost: number;
  }>;
  totalDirectMaterialCost: number;
  estimatedLaborCost: number;
  estimatedMachineCost: number;
  totalPlannedCost: number;
  costPerFinishedUnit: number;
  startDate: string;
  targetCompletionDate: string;
  createdAt: string;
}

export interface ProductionConfirmationResult {
  confirmationId: string;
  orderNumber: string;
  producedQuantity: number;
  goodsIssueMovementDocIds: string[]; // Mvt 261 docs
  goodsReceiptMovementDocId: string;   // Mvt 131 doc
  totalActualCost: number;
  unitFinishedCost: number;
  glJournalNumber: string;
  confirmedAt: string;
}
