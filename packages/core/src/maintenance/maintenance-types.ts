/**
 * Sutra Plant Maintenance & Enterprise Asset Management (SAP PM/EAM Equivalent)
 * Types and interfaces for functional locations, equipment master,
 * maintenance notifications, work orders, spare parts reservation,
 * preventive maintenance plans, and MTBF/MTTR reliability metrics.
 */

export type EquipmentCategory = 
  | 'MACHINERY' 
  | 'VEHICLE' 
  | 'TOOLING' 
  | 'ELECTRICAL' 
  | 'HVAC' 
  | 'INSTRUMENTATION';

export type EquipmentStatus = 
  | 'OPERATIONAL' 
  | 'IN_MAINTENANCE' 
  | 'BREAKDOWN' 
  | 'DECOMMISSIONED';

export type NotificationType = 
  | 'BREAKDOWN' 
  | 'CORRECTIVE' 
  | 'PREVENTIVE' 
  | 'INSPECTION';

export type MaintenancePriority = 
  | 'VERY_HIGH' 
  | 'HIGH' 
  | 'MEDIUM' 
  | 'LOW';

export type NotificationStatus = 
  | 'NEW' 
  | 'IN_PROCESS' 
  | 'ORDER_CREATED' 
  | 'COMPLETED';

export type WorkOrderStatus = 
  | 'CREATED' 
  | 'RELEASED' 
  | 'TECHNICALLY_COMPLETED' 
  | 'CLOSED';

export type MaintenanceOrderType = 
  | 'CORRECTIVE' 
  | 'PREVENTIVE' 
  | 'OVERHAUL' 
  | 'CALIBRATION';

export interface FunctionalLocation {
  id: string;
  name: string;
  plantId: string;
  costCenter: string;
  parentLocationId?: string;
}

export interface EquipmentMaster {
  equipmentNumber: string;
  name: string;
  functionalLocationId: string;
  serialNumber: string;
  manufacturer: string;
  modelYear: number;
  category: EquipmentCategory;
  status: EquipmentStatus;
  operatingHours: number;
  fixedAssetTag?: string; // Link to SAP FI-AA Fixed Asset
  costCenter: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
}

export interface MaintenanceNotification {
  notificationNumber: string;
  equipmentNumber: string;
  type: NotificationType;
  priority: MaintenancePriority;
  shortDescription: string;
  reportedBy: string;
  reportedAt: string;
  status: NotificationStatus;
  breakdownDurationHours?: number;
  workOrderNumber?: string;
}

export interface WorkOrderSparePart {
  sku: string;
  name: string;
  requiredQuantity: number;
  issuedQuantity: number;
  unitCost: number;
  totalCost: number;
}

export interface MaintenanceWorkOrder {
  orderNumber: string;
  notificationNumber?: string;
  equipmentNumber: string;
  orderType: MaintenanceOrderType;
  status: WorkOrderStatus;
  scheduledStart: string;
  scheduledEnd: string;
  assignedTechnician: string;
  costCenter: string;
  estimatedLaborHours: number;
  actualLaborHours: number;
  laborHourlyRate: number;
  spareParts: WorkOrderSparePart[];
  totalLaborCost: number;
  totalMaterialCost: number;
  totalActualCost: number;
  settledCostCenter?: string;
  glSettlementEntry?: {
    debitAccount: string;
    creditAccount: string;
    amount: number;
  };
}

export interface PreventiveMaintenancePlan {
  planNumber: string;
  equipmentNumber: string;
  cycleType: 'TIME_BASED' | 'USAGE_BASED';
  cycleIntervalDays?: number;
  cycleIntervalHours?: number;
  taskDescription: string;
  estimatedHours: number;
  isActive: boolean;
  lastTriggeredDate?: string;
  lastTriggeredHours?: number;
}

export interface EquipmentReliabilityMetrics {
  equipmentNumber: string;
  equipmentName: string;
  totalOperationalHours: number;
  totalDowntimeHours: number;
  breakdownCount: number;
  mtbfHours: number; // Mean Time Between Failures
  mttrHours: number; // Mean Time To Repair
  availabilityPercentage: number; // Operational / (Operational + Downtime) * 100
}
