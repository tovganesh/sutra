/**
 * Sutra Plant Maintenance & Enterprise Asset Management Engine (SAP PM/EAM Equivalent)
 * Manages equipment hierarchy, breakdown/preventive notifications,
 * work orders with spare parts and labor tracking, preventive maintenance cycles,
 * and MTBF / MTTR reliability analytics.
 */

import {
  EquipmentMaster,
  FunctionalLocation,
  MaintenanceNotification,
  MaintenanceWorkOrder,
  PreventiveMaintenancePlan,
  EquipmentReliabilityMetrics,
  WorkOrderSparePart,
} from './maintenance-types.js';
import { InventoryEngine } from '../inventory/inventory-engine.js';
import {
  EquipmentStatus,
  MaintenanceNotificationStatus,
  MaintenanceOrderStatus,
} from '../common/constants.js';

export class MaintenanceEngine {
  private functionalLocations: Map<string, FunctionalLocation> = new Map();
  private equipmentMap: Map<string, EquipmentMaster> = new Map();
  private notifications: Map<string, MaintenanceNotification> = new Map();
  private workOrders: Map<string, MaintenanceWorkOrder> = new Map();
  private maintenancePlans: Map<string, PreventiveMaintenancePlan> = new Map();
  private downtimeRecords: Map<string, Array<{ durationHours: number; date: string }>> = new Map();
  private inventoryEngine?: InventoryEngine;

  constructor(inventoryEngine?: InventoryEngine) {
    this.inventoryEngine = inventoryEngine;
    this.seedDefaults();
  }

  private seedDefaults(): void {
    const loc: FunctionalLocation = {
      id: 'FLOC-PUNE-LINE1',
      name: 'Automotive Stamping & Robotic Line 1, Pune',
      plantId: 'PLANT-1000',
      costCenter: 'CC-MFG-100',
    };
    this.functionalLocations.set(loc.id, loc);

    const eq1: EquipmentMaster = {
      equipmentNumber: 'EQ-ROBOT-01',
      name: '6-Axis High Precision Robotic Welding Center',
      functionalLocationId: loc.id,
      serialNumber: 'KUKA-KR60-9844',
      manufacturer: 'KUKA Robotics GmbH',
      modelYear: 2023,
      category: 'MACHINERY',
      status: EquipmentStatus.OPERATIONAL,
      operatingHours: 4250,
      fixedAssetTag: 'AST-CNC-001',
      costCenter: 'CC-MFG-100',
      lastMaintenanceDate: '2026-08-15',
      nextMaintenanceDate: '2026-11-15',
    };
    const eq2: EquipmentMaster = {
      equipmentNumber: 'EQ-PRESS-02',
      name: '250-Ton Heavy Hydraulic Stamping Press',
      functionalLocationId: loc.id,
      serialNumber: 'SCHULER-HP250-2021',
      manufacturer: 'Schuler AG',
      modelYear: 2021,
      category: 'MACHINERY',
      status: EquipmentStatus.OPERATIONAL,
      operatingHours: 8900,
      fixedAssetTag: 'AST-PRESS-002',
      costCenter: 'CC-MFG-100',
      lastMaintenanceDate: '2026-07-20',
      nextMaintenanceDate: '2026-10-20',
    };
    this.equipmentMap.set(eq1.equipmentNumber, eq1);
    this.equipmentMap.set(eq2.equipmentNumber, eq2);

    this.downtimeRecords.set(eq1.equipmentNumber, [
      { durationHours: 4.5, date: '2026-04-10' },
      { durationHours: 3.0, date: '2026-06-22' },
      { durationHours: 2.5, date: '2026-08-15' },
    ]);

    const plan1: PreventiveMaintenancePlan = {
      planNumber: 'PMP-ROBOT-Q1',
      equipmentNumber: 'EQ-ROBOT-01',
      cycleType: 'USAGE_BASED',
      cycleIntervalHours: 1000,
      taskDescription: 'Gearbox grease replenishment, servo motor calibration, and cable harness inspection',
      estimatedHours: 4,
      isActive: true,
      lastTriggeredHours: 4000,
    };
    this.maintenancePlans.set(plan1.planNumber, plan1);
  }

  // -------------------------------------------------------------
  // Functional Locations & Equipment Master
  // -------------------------------------------------------------

  public registerFunctionalLocation(loc: FunctionalLocation): FunctionalLocation {
    this.functionalLocations.set(loc.id, loc);
    return loc;
  }

  public listFunctionalLocations(): FunctionalLocation[] {
    return Array.from(this.functionalLocations.values());
  }

  public registerEquipment(eq: EquipmentMaster): EquipmentMaster {
    this.equipmentMap.set(eq.equipmentNumber, eq);
    return eq;
  }

  public getEquipment(equipmentNumber: string): EquipmentMaster | undefined {
    return this.equipmentMap.get(equipmentNumber);
  }

  public listEquipment(): EquipmentMaster[] {
    return Array.from(this.equipmentMap.values());
  }

  public updateOperatingHours(equipmentNumber: string, addedHours: number): EquipmentMaster {
    const eq = this.equipmentMap.get(equipmentNumber);
    if (!eq) {
      throw new Error(`Equipment ${equipmentNumber} not found`);
    }
    eq.operatingHours += addedHours;
    return eq;
  }

  // -------------------------------------------------------------
  // Maintenance Notifications
  // -------------------------------------------------------------

  public createNotification(input: {
    equipmentNumber: string;
    type: MaintenanceNotification['type'];
    priority: MaintenanceNotification['priority'];
    shortDescription: string;
    reportedBy: string;
  }): MaintenanceNotification {
    const eq = this.equipmentMap.get(input.equipmentNumber);
    if (!eq) {
      throw new Error(`Equipment ${input.equipmentNumber} not found`);
    }

    const count = this.notifications.size + 1;
    const notificationNumber = `MN-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

    const notification: MaintenanceNotification = {
      notificationNumber,
      equipmentNumber: input.equipmentNumber,
      type: input.type,
      priority: input.priority,
      shortDescription: input.shortDescription,
      reportedBy: input.reportedBy,
      reportedAt: new Date().toISOString(),
      status: MaintenanceNotificationStatus.NEW,
    };

    if (input.type === 'BREAKDOWN') {
      eq.status = EquipmentStatus.BREAKDOWN;
    }

    this.notifications.set(notificationNumber, notification);
    return notification;
  }

  public listNotifications(): MaintenanceNotification[] {
    return Array.from(this.notifications.values());
  }

  // -------------------------------------------------------------
  // Maintenance Work Orders
  // -------------------------------------------------------------

  public createWorkOrder(input: {
    equipmentNumber: string;
    notificationNumber?: string;
    orderType: MaintenanceWorkOrder['orderType'];
    scheduledStart: string;
    scheduledEnd: string;
    assignedTechnician: string;
    estimatedLaborHours: number;
    laborHourlyRate?: number;
    spareParts?: Array<{ sku: string; name: string; requiredQuantity: number; unitCost: number }>;
  }): MaintenanceWorkOrder {
    const eq = this.equipmentMap.get(input.equipmentNumber);
    if (!eq) {
      throw new Error(`Equipment ${input.equipmentNumber} not found`);
    }

    const count = this.workOrders.size + 1;
    const orderNumber = `WO-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

    const parts: WorkOrderSparePart[] = (input.spareParts || []).map((p) => ({
      sku: p.sku,
      name: p.name,
      requiredQuantity: p.requiredQuantity,
      issuedQuantity: 0,
      unitCost: p.unitCost,
      totalCost: 0,
    }));

    const hourlyRate = input.laborHourlyRate ?? 750; // default INR 750/hour

    const workOrder: MaintenanceWorkOrder = {
      orderNumber,
      notificationNumber: input.notificationNumber,
      equipmentNumber: input.equipmentNumber,
      orderType: input.orderType,
      status: MaintenanceOrderStatus.CREATED,
      scheduledStart: input.scheduledStart,
      scheduledEnd: input.scheduledEnd,
      assignedTechnician: input.assignedTechnician,
      costCenter: eq.costCenter,
      estimatedLaborHours: input.estimatedLaborHours,
      actualLaborHours: 0,
      laborHourlyRate: hourlyRate,
      spareParts: parts,
      totalLaborCost: 0,
      totalMaterialCost: 0,
      totalActualCost: 0,
    };

    if (input.notificationNumber) {
      const notif = this.notifications.get(input.notificationNumber);
      if (notif) {
        notif.status = MaintenanceNotificationStatus.ORDER_CREATED;
        notif.workOrderNumber = orderNumber;
      }
    }

    this.workOrders.set(orderNumber, workOrder);
    return workOrder;
  }

  public releaseWorkOrder(orderNumber: string): MaintenanceWorkOrder {
    const wo = this.workOrders.get(orderNumber);
    if (!wo) {
      throw new Error(`Work Order ${orderNumber} not found`);
    }
    if (wo.status !== MaintenanceOrderStatus.CREATED) {
      throw new Error(`Work Order cannot be released from status: ${wo.status}`);
    }

    wo.status = MaintenanceOrderStatus.RELEASED;
    const eq = this.equipmentMap.get(wo.equipmentNumber);
    if (eq && eq.status !== EquipmentStatus.BREAKDOWN) {
      eq.status = EquipmentStatus.IN_MAINTENANCE;
    }

    return wo;
  }

  public issueSpareParts(
    orderNumber: string,
    sku: string,
    quantity: number
  ): { workOrder: MaintenanceWorkOrder; issuedPart: WorkOrderSparePart } {
    const wo = this.workOrders.get(orderNumber);
    if (!wo) {
      throw new Error(`Work Order ${orderNumber} not found`);
    }
    if (wo.status !== 'RELEASED') {
      throw new Error(`Parts can only be issued to RELEASED work orders`);
    }

    const part = wo.spareParts.find((p) => p.sku === sku);
    if (!part) {
      throw new Error(`Spare part ${sku} not allocated to Work Order ${orderNumber}`);
    }

    // Optionally consume from inventory engine if integrated
    if (this.inventoryEngine) {
      try {
        this.inventoryEngine.executeStockMovement({
          movementType: '201', // Internal consumption
          sku,
          quantity,
          costCenter: wo.costCenter,
          referenceDocument: orderNumber,
        });
      } catch {
        // If spare location or stock not pre-configured, proceed with direct cost allocation
      }
    }

    part.issuedQuantity += quantity;
    part.totalCost = Math.round(part.issuedQuantity * part.unitCost * 100) / 100;

    wo.totalMaterialCost = Math.round(
      wo.spareParts.reduce((acc, p) => acc + p.totalCost, 0) * 100
    ) / 100;
    wo.totalActualCost = Math.round((wo.totalLaborCost + wo.totalMaterialCost) * 100) / 100;

    return { workOrder: wo, issuedPart: part };
  }

  public completeWorkOrder(
    orderNumber: string,
    actualLaborHours: number,
    downtimeDurationHours?: number
  ): MaintenanceWorkOrder {
    const wo = this.workOrders.get(orderNumber);
    if (!wo) {
      throw new Error(`Work Order ${orderNumber} not found`);
    }
    if (wo.status !== MaintenanceOrderStatus.RELEASED) {
      throw new Error(`Only RELEASED work orders can be technically completed`);
    }

    wo.actualLaborHours = actualLaborHours;
    wo.totalLaborCost = Math.round(actualLaborHours * wo.laborHourlyRate * 100) / 100;
    wo.totalActualCost = Math.round((wo.totalLaborCost + wo.totalMaterialCost) * 100) / 100;
    wo.status = MaintenanceOrderStatus.TECHNICALLY_COMPLETED;

    const eq = this.equipmentMap.get(wo.equipmentNumber);
    if (eq) {
      eq.status = EquipmentStatus.OPERATIONAL;
      eq.lastMaintenanceDate = new Date().toISOString().split('T')[0];
    }

    if (wo.notificationNumber) {
      const notif = this.notifications.get(wo.notificationNumber);
      if (notif) {
        notif.status = MaintenanceNotificationStatus.COMPLETED;
        if (downtimeDurationHours !== undefined) {
          notif.breakdownDurationHours = downtimeDurationHours;
        }
      }
    }

    if (downtimeDurationHours && downtimeDurationHours > 0) {
      const records = this.downtimeRecords.get(wo.equipmentNumber) || [];
      records.push({
        durationHours: downtimeDurationHours,
        date: new Date().toISOString().split('T')[0],
      });
      this.downtimeRecords.set(wo.equipmentNumber, records);
    }

    return wo;
  }

  public settleWorkOrder(orderNumber: string): {
    workOrder: MaintenanceWorkOrder;
    settlement: { debitCostCenter: string; glExpenseAccount: string; settledAmount: number };
  } {
    const wo = this.workOrders.get(orderNumber);
    if (!wo) {
      throw new Error(`Work Order ${orderNumber} not found`);
    }
    if (wo.status !== MaintenanceOrderStatus.TECHNICALLY_COMPLETED) {
      throw new Error(`Work order must be TECHNICALLY_COMPLETED before settlement`);
    }

    wo.status = MaintenanceOrderStatus.CLOSED;
    wo.settledCostCenter = wo.costCenter;
    wo.glSettlementEntry = {
      debitAccount: '510300', // Plant Machinery Maintenance & Repairs Expense
      creditAccount: '590100', // Maintenance Work Order Internal Clearing
      amount: wo.totalActualCost,
    };

    return {
      workOrder: wo,
      settlement: {
        debitCostCenter: wo.costCenter,
        glExpenseAccount: '510300',
        settledAmount: wo.totalActualCost,
      },
    };
  }

  public listWorkOrders(): MaintenanceWorkOrder[] {
    return Array.from(this.workOrders.values());
  }

  // -------------------------------------------------------------
  // Preventive Maintenance Plans & Reliability Metrics
  // -------------------------------------------------------------

  public createMaintenancePlan(plan: PreventiveMaintenancePlan): PreventiveMaintenancePlan {
    this.maintenancePlans.set(plan.planNumber, plan);
    return plan;
  }

  public listMaintenancePlans(): PreventiveMaintenancePlan[] {
    return Array.from(this.maintenancePlans.values());
  }

  public evaluatePreventiveSchedules(): MaintenanceWorkOrder[] {
    const generatedOrders: MaintenanceWorkOrder[] = [];

    for (const plan of this.maintenancePlans.values()) {
      if (!plan.isActive) continue;

      const eq = this.equipmentMap.get(plan.equipmentNumber);
      if (!eq) continue;

      let trigger = false;

      if (plan.cycleType === 'USAGE_BASED' && plan.cycleIntervalHours) {
        const lastHours = plan.lastTriggeredHours ?? 0;
        if (eq.operatingHours - lastHours >= plan.cycleIntervalHours) {
          trigger = true;
          plan.lastTriggeredHours = eq.operatingHours;
        }
      }

      if (trigger) {
        const wo = this.createWorkOrder({
          equipmentNumber: plan.equipmentNumber,
          orderType: 'PREVENTIVE',
          scheduledStart: new Date().toISOString().split('T')[0],
          scheduledEnd: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          assignedTechnician: 'Preventive Crew Lead',
          estimatedLaborHours: plan.estimatedHours,
        });
        generatedOrders.push(wo);
      }
    }

    return generatedOrders;
  }

  public calculateEquipmentReliability(equipmentNumber: string): EquipmentReliabilityMetrics {
    const eq = this.equipmentMap.get(equipmentNumber);
    if (!eq) {
      throw new Error(`Equipment ${equipmentNumber} not found`);
    }

    const downtimes = this.downtimeRecords.get(equipmentNumber) || [];
    const breakdownCount = downtimes.length;
    const totalDowntimeHours = Math.round(downtimes.reduce((sum, d) => sum + d.durationHours, 0) * 10) / 10;
    const totalOperationalHours = eq.operatingHours;

    const mtbfHours =
      breakdownCount > 0
        ? Math.round((totalOperationalHours / breakdownCount) * 10) / 10
        : totalOperationalHours;

    const mttrHours =
      breakdownCount > 0
        ? Math.round((totalDowntimeHours / breakdownCount) * 10) / 10
        : 0;

    const totalHours = totalOperationalHours + totalDowntimeHours;
    const availabilityPercentage =
      totalHours > 0
        ? Math.round((totalOperationalHours / totalHours) * 1000) / 10
        : 100.0;

    return {
      equipmentNumber: eq.equipmentNumber,
      equipmentName: eq.name,
      totalOperationalHours,
      totalDowntimeHours,
      breakdownCount,
      mtbfHours,
      mttrHours,
      availabilityPercentage,
    };
  }
}
