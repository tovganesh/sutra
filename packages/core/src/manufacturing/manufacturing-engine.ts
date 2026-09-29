/**
 * Sutra Production Planning & Manufacturing Engine (SAP PP Equivalent)
 * Covers Multi-level BOM explosion, Work Center capacity, routing operations,
 * component availability checks, and WIP accounting.
 */

import { InventoryEngine } from '../inventory/inventory-engine.js';
import { GeneralLedgerEngine, JournalLineInput } from '../ledger/ledger-engine.js';
import {
  BillOfMaterials,
  ProductionConfirmationResult,
  ProductionOrderInput,
  ProductionOrderResult,
  RoutingStep,
  WorkCenter,
} from './bom-types.js';

export class ManufacturingEngine {
  private boms: Map<string, BillOfMaterials> = new Map();
  private workCenters: Map<string, WorkCenter> = new Map();
  private routings: Map<string, RoutingStep[]> = new Map();
  private productionOrders: Map<string, ProductionOrderResult> = new Map();

  constructor(private inventoryEngine: InventoryEngine) {
    this.seedDefaultManufacturingData();
  }

  private seedDefaultManufacturingData(): void {
    // 1. Bill of Materials for Sutra E-Titan EV (FERT-EVTRK-001)
    const evBom: BillOfMaterials = {
      bomId: 'BOM-EVTRK-V1',
      parentSku: 'FERT-EVTRK-001',
      version: '1.0',
      plantId: 'PLANT-1000',
      baseQuantity: 1,
      components: [
        {
          componentSku: 'ROH-STEEL-001', // Cold-rolled steel coils
          quantityRequired: 350,        // 350 KG per truck
          baseUom: 'KG',
          scrapFactorPercent: 2.5,
        },
        {
          componentSku: 'HALB-AXLE-001', // Rear axle hub assembly
          quantityRequired: 2,          // 2 axles per truck
          baseUom: 'EA',
          scrapFactorPercent: 0,
        },
      ],
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.boms.set(evBom.parentSku, evBom);

    // 2. Work Centers
    const wcBodyShop: WorkCenter = {
      workCenterId: 'WC-BODY-01',
      name: 'Chassis Stamping & Robotic Welding',
      plantId: 'PLANT-1000',
      costCenter: 'CC-MFG-BODY',
      capacityHoursPerDay: 16,
      hourlyLaborCost: 450, // INR/hr
      hourlyMachineCost: 850, // INR/hr
    };
    const wcAssembly: WorkCenter = {
      workCenterId: 'WC-ASSY-02',
      name: 'Powertrain & Final Vehicle Assembly',
      plantId: 'PLANT-1000',
      costCenter: 'CC-MFG-ASSY',
      capacityHoursPerDay: 16,
      hourlyLaborCost: 550,
      hourlyMachineCost: 950,
    };
    this.workCenters.set(wcBodyShop.workCenterId, wcBodyShop);
    this.workCenters.set(wcAssembly.workCenterId, wcAssembly);

    // 3. Routing operations
    this.routings.set('FERT-EVTRK-001', [
      {
        operationNumber: '0010',
        workCenterId: 'WC-BODY-01',
        description: 'Chassis stamping, laser cutting and sub-frame welding',
        setupTimeMinutes: 60,
        runTimePerUnitMinutes: 240, // 4 hours per unit
      },
      {
        operationNumber: '0020',
        workCenterId: 'WC-ASSY-02',
        description: 'Axle installation, electrical wiring harness, and battery integration',
        setupTimeMinutes: 45,
        runTimePerUnitMinutes: 360, // 6 hours per unit
      },
    ]);
  }

  public registerBom(bom: BillOfMaterials): void {
    this.boms.set(bom.parentSku, bom);
  }

  public getBom(parentSku: string): BillOfMaterials | undefined {
    return this.boms.get(parentSku);
  }

  public getAllBoms(): BillOfMaterials[] {
    return Array.from(this.boms.values());
  }

  public getWorkCenters(): WorkCenter[] {
    return Array.from(this.workCenters.values());
  }

  public getRouting(sku: string): RoutingStep[] {
    return this.routings.get(sku) || [];
  }

  /**
   * Plans a Production Order:
   * - Explodes BOM for target quantity
   * - Validates component availability against warehouse stock
   * - Computes standard cost of Direct Materials, Direct Labor, and Machine Overhead
   */
  public planProductionOrder(input: ProductionOrderInput): ProductionOrderResult {
    const bom = this.boms.get(input.targetSku);
    if (!bom) {
      throw new Error(`No active Bill of Materials (BOM) found for SKU '${input.targetSku}'.`);
    }

    const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
    let totalDirectMaterialCost = 0;

    const componentsRequired = bom.components.map((comp) => {
      const mat = this.inventoryEngine.getMaterial(comp.componentSku);
      if (!mat) {
        throw new Error(`Component SKU '${comp.componentSku}' in BOM does not exist in Material Master.`);
      }

      const scrapMult = 1 + (comp.scrapFactorPercent || 0) / 100;
      const totalRequiredQty = round2(comp.quantityRequired * input.targetQuantity * scrapMult);
      const isStockAvailable = mat.totalStock >= totalRequiredQty;
      const unitCost = mat.movingAvgPrice;
      const totalCost = round2(totalRequiredQty * unitCost);

      totalDirectMaterialCost += totalCost;

      return {
        sku: comp.componentSku,
        totalRequiredQty,
        availableStock: mat.totalStock,
        isStockAvailable,
        unitCost,
        totalCost,
      };
    });

    // Compute Labor and Machine overhead from Routing
    const steps = this.routings.get(input.targetSku) || [];
    let totalLaborCost = 0;
    let totalMachineCost = 0;

    for (const step of steps) {
      const wc = this.workCenters.get(step.workCenterId);
      if (!wc) continue;

      const totalMinutes = step.setupTimeMinutes + (step.runTimePerUnitMinutes * input.targetQuantity);
      const totalHours = totalMinutes / 60;

      totalLaborCost += totalHours * wc.hourlyLaborCost;
      totalMachineCost += totalHours * wc.hourlyMachineCost;
    }

    totalLaborCost = round2(totalLaborCost);
    totalMachineCost = round2(totalMachineCost);
    const totalPlannedCost = round2(totalDirectMaterialCost + totalLaborCost + totalMachineCost);
    const costPerFinishedUnit = round2(totalPlannedCost / input.targetQuantity);

    const result: ProductionOrderResult = {
      orderNumber: input.orderNumber,
      status: 'RELEASED',
      targetSku: input.targetSku,
      targetQuantity: input.targetQuantity,
      plantId: input.plantId,
      bomVersion: bom.version,
      componentsRequired,
      totalDirectMaterialCost: round2(totalDirectMaterialCost),
      estimatedLaborCost: totalLaborCost,
      estimatedMachineCost: totalMachineCost,
      totalPlannedCost,
      costPerFinishedUnit,
      startDate: input.startDate,
      targetCompletionDate: input.targetCompletionDate,
      createdAt: new Date().toISOString(),
    };

    this.productionOrders.set(input.orderNumber, result);
    return result;
  }

  public getProductionOrder(orderNumber: string): ProductionOrderResult | undefined {
    return this.productionOrders.get(orderNumber);
  }

  public getAllProductionOrders(): ProductionOrderResult[] {
    return Array.from(this.productionOrders.values());
  }

  /**
   * Confirms Production Order:
   * 1. Consumes components from inventory (Mvt 201/261), posting to Work-in-Progress (WIP)
   * 2. Delivers finished goods into inventory (Mvt 101/131), updating Finished Goods stock & MAP
   * 3. Posts GL entries:
   *    Dr Finished Goods Inventory (120300)
   *      Cr Work-In-Progress WIP (120400)
   *      Cr Factory Direct Labor Absorbed (520500)
   *      Cr Factory Machine Overhead Absorbed (520600)
   */
  public confirmProductionOrder(
    tenantId: string,
    orderNumber: string,
    quantityCompleted: number
  ): ProductionConfirmationResult {
    const order = this.productionOrders.get(orderNumber);
    if (!order) {
      throw new Error(`Production Order '${orderNumber}' not found.`);
    }

    if (quantityCompleted <= 0) {
      throw new Error('Produced quantity must be greater than zero.');
    }

    const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
    const goodsIssueDocIds: string[] = [];
    let totalActualMaterialCost = 0;

    // 1. Goods Issue for Components (Movement 201 to Production WIP)
    const factor = quantityCompleted / order.targetQuantity;
    for (const comp of order.componentsRequired) {
      const issueQty = round2(comp.totalRequiredQty * factor);
      const movement = this.inventoryEngine.executeStockMovement({
        movementType: '201',
        sku: comp.sku,
        quantity: issueQty,
        referenceDocument: orderNumber,
        costCenter: 'CC-MFG-WIP',
      });
      goodsIssueDocIds.push(movement.movementDocumentId);
      totalActualMaterialCost += issueQty * movement.previousMovingAvgPrice;
    }

    const actualLabor = round2(order.estimatedLaborCost * factor);
    const actualMachine = round2(order.estimatedMachineCost * factor);
    const totalActualCost = round2(totalActualMaterialCost + actualLabor + actualMachine);
    const unitFinishedCost = round2(totalActualCost / quantityCompleted);

    // 2. Goods Receipt for Finished Goods (Movement 101)
    const grnMovement = this.inventoryEngine.executeStockMovement({
      movementType: '101',
      sku: order.targetSku,
      quantity: quantityCompleted,
      unitCost: unitFinishedCost,
      referenceDocument: orderNumber,
    });

    // 3. Post General Ledger Entry
    const journalLines: JournalLineInput[] = [
      {
        accountId: 'ACC-INV-FG',
        accountCode: '120300',
        accountName: 'Finished Goods Inventory',
        debit: totalActualCost,
        credit: 0,
        description: `Receipt from Production Order ${orderNumber} (${quantityCompleted} units)`,
      },
      {
        accountId: 'ACC-WIP-CLEAR',
        accountCode: '120400',
        accountName: 'Work-in-Progress (WIP) Clearing',
        debit: 0,
        credit: round2(totalActualMaterialCost),
        description: `Material WIP consumed for Order ${orderNumber}`,
      },
      {
        accountId: 'ACC-LABOR-ABS',
        accountCode: '520500',
        accountName: 'Direct Labor Absorbed (Factory Cost Center)',
        debit: 0,
        credit: actualLabor,
        description: `Direct labor allocated to Order ${orderNumber}`,
      },
      {
        accountId: 'ACC-OVERHEAD-ABS',
        accountCode: '520600',
        accountName: 'Factory Machine Overhead Absorbed',
        debit: 0,
        credit: actualMachine,
        description: `Machine overhead allocated to Order ${orderNumber}`,
      },
    ];

    const postResult = GeneralLedgerEngine.postJournalEntry({
      tenantId,
      entryNumber: `JRN-PRD-${orderNumber}`,
      postingDate: new Date().toISOString().split('T')[0],
      reference: orderNumber,
      narration: `Production confirmation for ${quantityCompleted} units of ${order.targetSku}`,
      lines: journalLines,
    });

    order.status = 'CONFIRMED';
    this.productionOrders.set(orderNumber, order);

    return {
      confirmationId: `CONF-${Date.now().toString(36).toUpperCase()}`,
      orderNumber,
      producedQuantity: quantityCompleted,
      goodsIssueMovementDocIds: goodsIssueDocIds,
      goodsReceiptMovementDocId: grnMovement.movementDocumentId,
      totalActualCost,
      unitFinishedCost,
      glJournalNumber: `JRN-PRD-${orderNumber}`,
      confirmedAt: new Date().toISOString(),
    };
  }
}
