/**
 * Sutra Enterprise Core Common Constants
 * Centralized named constants for enterprise entities, order statuses,
 * subledger states, lifecycle phases, and default configurations.
 */

// =================================================================
// 1. Order & Lifecycle Statuses
// =================================================================

export const SalesOrderStatus = {
  CONFIRMED: 'CONFIRMED',
  REJECTED: 'REJECTED',
} as const;
export type SalesOrderStatusType = (typeof SalesOrderStatus)[keyof typeof SalesOrderStatus];
export type SalesOrderStatus = SalesOrderStatusType;

export const LedgerEntryStatus = {
  POSTED: 'POSTED',
  REJECTED: 'REJECTED',
} as const;
export type LedgerEntryStatusType = (typeof LedgerEntryStatus)[keyof typeof LedgerEntryStatus];
export type LedgerEntryStatus = LedgerEntryStatusType;

export const SubledgerStatus = {
  OPEN: 'OPEN',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
  DISPUTED: 'DISPUTED',
} as const;
export type SubledgerStatusType = (typeof SubledgerStatus)[keyof typeof SubledgerStatus];
export type SubledgerStatus = SubledgerStatusType;

export const SubledgerEntryType = {
  RECEIVABLE: 'RECEIVABLE',
  PAYABLE: 'PAYABLE',
} as const;
export type SubledgerEntryType = (typeof SubledgerEntryType)[keyof typeof SubledgerEntryType];

export const PurchaseOrderStatus = {
  DRAFT: 'DRAFT',
  APPROVED: 'APPROVED',
} as const;
export type PurchaseOrderStatusType = (typeof PurchaseOrderStatus)[keyof typeof PurchaseOrderStatus];
export type PurchaseOrderStatus = PurchaseOrderStatusType;

export const ThreeWayMatchStatus = {
  PERFECT_MATCH: 'PERFECT_MATCH',
  PRICE_VARIANCE: 'PRICE_VARIANCE',
  QUANTITY_VARIANCE: 'QUANTITY_VARIANCE',
  DISCREPANCY: 'DISCREPANCY',
} as const;
export type ThreeWayMatchStatusType = (typeof ThreeWayMatchStatus)[keyof typeof ThreeWayMatchStatus];
export type ThreeWayMatchStatus = ThreeWayMatchStatusType;

export const ProductionOrderStatus = {
  PLANNED: 'PLANNED',
  RELEASED: 'RELEASED',
  CONFIRMED: 'CONFIRMED',
  CLOSED: 'CLOSED',
} as const;
export type ProductionOrderStatusType = (typeof ProductionOrderStatus)[keyof typeof ProductionOrderStatus];
export type ProductionOrderStatus = ProductionOrderStatusType;

export const AssetStatus = {
  ACTIVE: 'ACTIVE',
  RETIRED: 'RETIRED',
  UNDER_CONSTRUCTION: 'UNDER_CONSTRUCTION',
} as const;
export type AssetStatusType = (typeof AssetStatus)[keyof typeof AssetStatus];
export type AssetStatus = AssetStatusType;

export const QualityLotStatus = {
  CREATED: 'CREATED',
  RESULTS_RECORDED: 'RESULTS_RECORDED',
  UD_COMPLETED: 'UD_COMPLETED',
} as const;
export type QualityLotStatusType = (typeof QualityLotStatus)[keyof typeof QualityLotStatus];
export type QualityLotStatus = QualityLotStatusType;

export const QualityUsageDecision = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  SCRAPPED: 'SCRAPPED',
} as const;
export type QualityUsageDecisionType = (typeof QualityUsageDecision)[keyof typeof QualityUsageDecision];
export type QualityUsageDecision = QualityUsageDecisionType;

export const BatchStatus = {
  UNRESTRICTED: 'UNRESTRICTED',
  IN_QUALITY: 'IN_QUALITY',
  BLOCKED: 'BLOCKED',
  RESTRICTED: 'RESTRICTED',
} as const;
export type BatchStatusType = (typeof BatchStatus)[keyof typeof BatchStatus];
export type BatchStatus = BatchStatusType;

export const EquipmentStatus = {
  OPERATIONAL: 'OPERATIONAL',
  IN_MAINTENANCE: 'IN_MAINTENANCE',
  BREAKDOWN: 'BREAKDOWN',
  DECOMMISSIONED: 'DECOMMISSIONED',
} as const;
export type EquipmentStatusType = (typeof EquipmentStatus)[keyof typeof EquipmentStatus];
export type EquipmentStatus = EquipmentStatusType;

export const MaintenanceNotificationStatus = {
  NEW: 'NEW',
  IN_PROCESS: 'IN_PROCESS',
  ORDER_CREATED: 'ORDER_CREATED',
  COMPLETED: 'COMPLETED',
} as const;
export type MaintenanceNotificationStatusType =
  (typeof MaintenanceNotificationStatus)[keyof typeof MaintenanceNotificationStatus];
export type MaintenanceNotificationStatus = MaintenanceNotificationStatusType;

export const MaintenanceOrderStatus = {
  CREATED: 'CREATED',
  RELEASED: 'RELEASED',
  TECHNICALLY_COMPLETED: 'TECHNICALLY_COMPLETED',
  CLOSED: 'CLOSED',
} as const;
export type MaintenanceOrderStatusType = (typeof MaintenanceOrderStatus)[keyof typeof MaintenanceOrderStatus];
export type MaintenanceOrderStatus = MaintenanceOrderStatusType;

export const EmployeeStatus = {
  ACTIVE: 'ACTIVE',
  PROBATION: 'PROBATION',
  ON_LEAVE: 'ON_LEAVE',
  TERMINATED: 'TERMINATED',
} as const;
export type EmployeeStatusType = (typeof EmployeeStatus)[keyof typeof EmployeeStatus];
export type EmployeeStatus = EmployeeStatusType;

export const ProjectStatus = {
  CREATED: 'CREATED',
  APPROVED: 'APPROVED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CLOSED: 'CLOSED',
} as const;
export type ProjectStatusType = (typeof ProjectStatus)[keyof typeof ProjectStatus];
export type ProjectStatus = ProjectStatusType;

export const WbsStatus = {
  PLANNED: 'PLANNED',
  RELEASED: 'RELEASED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const;
export type WbsStatusType = (typeof WbsStatus)[keyof typeof WbsStatus];
export type WbsStatus = WbsStatusType;

export const WarehouseTransferStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
} as const;
export type WarehouseTransferStatusType = (typeof WarehouseTransferStatus)[keyof typeof WarehouseTransferStatus];
export type WarehouseTransferStatus = WarehouseTransferStatusType;

export const WarehouseTaskStatus = WarehouseTransferStatus;
export type WarehouseTaskStatusType = WarehouseTransferStatusType;
export type WarehouseTaskStatus = WarehouseTaskStatusType;

export const FreightOrderStatus = {
  PLANNED: 'PLANNED',
  DISPATCHED: 'DISPATCHED',
  IN_TRANSIT: 'IN_TRANSIT',
  ARRIVED: 'ARRIVED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;
export type FreightOrderStatusType = (typeof FreightOrderStatus)[keyof typeof FreightOrderStatus];
export type FreightOrderStatus = FreightOrderStatusType;

export const VehicleStatus = {
  AVAILABLE: 'AVAILABLE',
  IN_TRANSIT: 'IN_TRANSIT',
  MAINTENANCE: 'MAINTENANCE',
} as const;
export type VehicleStatusType = (typeof VehicleStatus)[keyof typeof VehicleStatus];
export type VehicleStatus = VehicleStatusType;

export const BankStatementStatus = {
  IMPORTED: 'IMPORTED',
  RECONCILED: 'RECONCILED',
  PARTIALLY_RECONCILED: 'PARTIALLY_RECONCILED',
} as const;
export type BankStatementStatusType = (typeof BankStatementStatus)[keyof typeof BankStatementStatus];
export type BankStatementStatus = BankStatementStatusType;

// =================================================================
// 2. Inventory Movement Types
// =================================================================

export const InventoryMovementType = {
  GR_PURCHASE_ORDER: '101',
  GR_REVERSAL: '102',
  GI_COST_CENTER: '201',
  GI_PRODUCTION_ORDER: '261',
  TRANSFER_PLANT_TO_PLANT: '301',
  TRANSFER_STORAGE_LOCATION: '311',
  TRANSFER_QI_TO_UNRESTRICTED: '321',
  TRANSFER_QI_TO_BLOCKED: '350',
  GI_SCRAP: '551',
  GI_SALES_DELIVERY: '601',
  GI_SALES_DELIVERY_REVERSAL: '602',
  CYCLE_COUNT_GAIN: '701',
  CYCLE_COUNT_LOSS: '702',
} as const;
export type InventoryMovementTypeCode = (typeof InventoryMovementType)[keyof typeof InventoryMovementType];
export type InventoryMovementType = InventoryMovementTypeCode;

export const MaterialType = {
  RAW_MATERIAL: 'ROH',
  SEMI_FINISHED: 'HALB',
  FINISHED_PRODUCT: 'FERT',
  TRADING_GOODS: 'HAWA',
  SERVICES: 'DIEN',
} as const;
export type MaterialTypeCode = (typeof MaterialType)[keyof typeof MaterialType];

export const StockType = {
  UNRESTRICTED: 'UNRESTRICTED',
  QUALITY_INSPECTION: 'QUALITY_INSPECTION',
  BLOCKED: 'BLOCKED',
  RESERVED: 'RESERVED',
} as const;
export type StockTypeCode = (typeof StockType)[keyof typeof StockType];

export const StandardGlAccount = {
  AR_DOMESTIC: '110000',
  INVENTORY_RAW_MATERIALS: '120100',
  INVENTORY_WIP: '120200',
  INVENTORY_FINISHED_GOODS: '120300',
  INPUT_CGST: '130100',
  INPUT_SGST: '130200',
  INPUT_IGST: '130300',
  FIXED_ASSET_CAPITAL: '140100',
  CWIP_ASSET_CLEARING: '140800',
  ACCUMULATED_DEPRECIATION: '170100',
  AP_DOMESTIC: '210100',
  AP_CARRIER: '210400',
  GRIR_CLEARING: '210500',
  TDS_SECTION_194C_PAYABLE: '210600',
  OUTPUT_CGST: '220100',
  OUTPUT_SGST: '220200',
  OUTPUT_IGST: '220300',
  TDS_PAYABLE: '220500',
  SALES_REVENUE: '410000',
  INVENTORY_GAIN_OVERAGE: '430100',
  COGS: '500100',
  RAW_MATERIAL_CONSUMPTION: '510100',
  FREIGHT_OUTWARD_EXPENSE: '520100',
  DEPRECIATION_EXPENSE: '520200',
  INVENTORY_SHRINKAGE_EXPENSE: '540100',
  SECONDARY_COST_ALLOCATION: '610000',
} as const;
export type StandardGlAccountCode = (typeof StandardGlAccount)[keyof typeof StandardGlAccount];

export const ParallelLedgerType = {
  LEADING: 'LEADING',
  NON_LEADING: 'NON_LEADING',
} as const;
export type ParallelLedgerTypeCode = (typeof ParallelLedgerType)[keyof typeof ParallelLedgerType];

export const ExchangeRateCategory = {
  SPOT: 'SPOT',
  CLOSING: 'CLOSING',
  AVERAGE: 'AVERAGE',
} as const;
export type ExchangeRateCategoryType = (typeof ExchangeRateCategory)[keyof typeof ExchangeRateCategory];

// =================================================================
// 3. Statutory, Tax & TDS Constants
// =================================================================

export const GstRate = {
  STANDARD_CGST: 0.09,
  STANDARD_SGST: 0.09,
  STANDARD_IGST: 0.18,
  STANDARD_TOTAL: 0.18,
} as const;

export const TdsSection = {
  SEC_194Q: '194Q',
  SEC_194C: '194C',
  SEC_194J: '194J',
} as const;
export type TdsSectionType = (typeof TdsSection)[keyof typeof TdsSection];
export type TdsSection = TdsSectionType;

export const TdsRatePercent = {
  [TdsSection.SEC_194Q]: 0.1, // 0.1% on purchase of goods > 50L
  [TdsSection.SEC_194C]: 2.0, // 2% for contractors (corporate)
  [TdsSection.SEC_194J]: 10.0, // 10% for professional fees
} as const;

// =================================================================
// 4. System Defaults & Thresholds
// =================================================================

export const SystemDefaults = {
  DEFAULT_TENANT_ID: '00000000-0000-0000-0000-000000000001',
  DEFAULT_CURRENCY: 'INR',
  DEFAULT_PLANT_ID: 'PLANT-1000',
  DEFAULT_COUNTRY_CODE: 'IN',
  DEFAULT_SUPPLIER_STATE_CODE: '27', // Maharashtra
  DEFAULT_SUPPLIER_GSTIN: '27AABCS1429B1ZB',
  DEFAULT_COST_CENTER: 'CC-OPERATIONS',
  DEFAULT_VALKEY_URL: 'valkey://localhost:6379',
  DEFAULT_MAX_RETRIES: 3,
  E_WAY_BILL_THRESHOLD_INR: 50000,
  TDS_SECTION_194Q_THRESHOLD_INR: 5000000, // ₹50 Lakhs
} as const;


