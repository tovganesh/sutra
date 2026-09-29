/**
 * Sutra Quality Management (QM) & Batch Traceability Engine (SAP QM Equivalent)
 * Manages Inspection Lots, In-process & Goods Receipt Quality Control,
 * Usage Decisions (UD), Certificates of Analysis (CoA), and Full Batch Genealogy.
 */

import crypto from 'node:crypto';
import { InventoryEngine } from '../inventory/inventory-engine.js';
import {
  BatchGenealogyTrace,
  BatchRecord,
  CertificateOfAnalysis,
  InspectionCharacteristic,
  InspectionLot,
  InspectionOrigin,
  RecordedResult,
  UsageDecision,
  UsageDecisionStatus,
} from './quality-types.js';

export class QualityEngine {
  private inspectionLots: Map<string, InspectionLot> = new Map();
  private inspectionPlans: Map<string, InspectionCharacteristic[]> = new Map();
  private batchRegistry: Map<string, BatchRecord> = new Map();

  constructor(private inventoryEngine?: InventoryEngine) {
    this.seedDefaultQualityData();
  }

  private seedDefaultQualityData(): void {
    // 1. Standard Inspection Plan for Raw Material: Cold-Rolled Steel (ROH-STEEL-001)
    this.inspectionPlans.set('ROH-STEEL-001', [
      {
        charId: 'QC-STEEL-THICK',
        name: 'Sheet Thickness (mm)',
        type: 'QUANTITATIVE',
        targetValue: 1.2,
        lowerLimit: 1.15,
        upperLimit: 1.25,
        uom: 'MM',
      },
      {
        charId: 'QC-STEEL-TENSILE',
        name: 'Ultimate Tensile Strength (MPa)',
        type: 'QUANTITATIVE',
        targetValue: 340,
        lowerLimit: 310,
        upperLimit: 390,
        uom: 'MPA',
      },
      {
        charId: 'QC-STEEL-SURFACE',
        name: 'Surface Visual Imperfections & Rust',
        type: 'QUALITATIVE',
        expectedText: 'DEFECT_FREE',
      },
    ]);

    // 2. Standard Inspection Plan for Finished Good: Sutra E-Titan EV (FERT-EVTRK-001)
    this.inspectionPlans.set('FERT-EVTRK-001', [
      {
        charId: 'QC-EV-BATTERY-V',
        name: 'High Voltage Traction Battery Pack Output (V)',
        type: 'QUANTITATIVE',
        targetValue: 400.0,
        lowerLimit: 385.0,
        upperLimit: 415.0,
        uom: 'V',
      },
      {
        charId: 'QC-EV-BRAKE-DECEL',
        name: 'Regenerative Braking Deceleration (m/s²)',
        type: 'QUANTITATIVE',
        targetValue: 6.8,
        lowerLimit: 6.2,
        upperLimit: 7.5,
        uom: 'M/S2',
      },
      {
        charId: 'QC-EV-TELEMATICS',
        name: 'AIS-140 Telematics GPS Fix & CAN Telemetry',
        type: 'QUALITATIVE',
        expectedText: 'CONNECTED',
      },
    ]);

    // 3. Seed initial batch records with genealogy links
    this.registerBatch({
      batchNumber: 'BATCH-2026-ST-088',
      materialSku: 'ROH-STEEL-001',
      plantId: 'PLANT-1000',
      status: 'UNRESTRICTED',
      manufacturingDate: '2026-08-15',
      vendorBatch: 'JINDAL-CRCA-B459',
      totalQuantity: 5000,
      parentBatches: [],
      childBatches: ['BATCH-2026-EV-001'],
      deliveredSalesOrders: [],
      createdAt: new Date('2026-08-16').toISOString(),
    });

    this.registerBatch({
      batchNumber: 'BATCH-2026-EV-001',
      materialSku: 'FERT-EVTRK-001',
      plantId: 'PLANT-1000',
      status: 'UNRESTRICTED',
      manufacturingDate: '2026-09-10',
      totalQuantity: 10,
      parentBatches: ['BATCH-2026-ST-088'],
      childBatches: [],
      deliveredSalesOrders: ['SO-2026-0042'],
      createdAt: new Date('2026-09-11').toISOString(),
    });
  }

  /**
   * Automatically generate an Inspection Lot on Goods Receipt (Mvt 101) or Production Confirmation (Mvt 131)
   */
  public createInspectionLot(params: {
    origin: InspectionOrigin;
    materialSku: string;
    batchNumber: string;
    quantity: number;
    baseUom: string;
    plantId: string;
    referenceDocument: string;
  }): InspectionLot {
    const lotId = `LOT-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
    const characteristics = this.inspectionPlans.get(params.materialSku) || [
      {
        charId: 'QC-GEN-VISUAL',
        name: 'General Visual & Packaging Inspection',
        type: 'QUALITATIVE',
        expectedText: 'PASS',
      },
    ];

    const lot: InspectionLot = {
      lotId,
      origin: params.origin,
      materialSku: params.materialSku,
      batchNumber: params.batchNumber,
      quantity: params.quantity,
      baseUom: params.baseUom,
      plantId: params.plantId,
      referenceDocument: params.referenceDocument,
      characteristics,
      results: [],
      status: 'CREATED',
      createdAt: new Date().toISOString(),
    };

    this.inspectionLots.set(lotId, lot);

    // Also register the batch in quality hold
    if (!this.batchRegistry.has(params.batchNumber)) {
      this.batchRegistry.set(params.batchNumber, {
        batchNumber: params.batchNumber,
        materialSku: params.materialSku,
        plantId: params.plantId,
        status: 'IN_QUALITY',
        manufacturingDate: new Date().toISOString().split('T')[0],
        totalQuantity: params.quantity,
        parentBatches: [],
        childBatches: [],
        deliveredSalesOrders: [],
        createdAt: new Date().toISOString(),
      });
    }

    return lot;
  }

  /**
   * Record testing results against inspection lot characteristics
   */
  public recordResults(
    lotId: string,
    resultsInput: Array<{
      charId: string;
      numericValue?: number;
      textValue?: string;
      remarks?: string;
      inspector: string;
    }>
  ): InspectionLot {
    const lot = this.inspectionLots.get(lotId);
    if (!lot) {
      throw new Error(`Inspection Lot '${lotId}' does not exist.`);
    }

    const recorded: RecordedResult[] = [];

    for (const input of resultsInput) {
      const char = lot.characteristics.find((c) => c.charId === input.charId);
      if (!char) {
        throw new Error(`Characteristic '${input.charId}' not found in inspection lot '${lotId}'.`);
      }

      let conforms = true;
      if (char.type === 'QUANTITATIVE') {
        if (input.numericValue === undefined) {
          throw new Error(`Quantitative characteristic '${char.name}' requires a numeric value.`);
        }
        if (char.lowerLimit !== undefined && input.numericValue < char.lowerLimit) {
          conforms = false;
        }
        if (char.upperLimit !== undefined && input.numericValue > char.upperLimit) {
          conforms = false;
        }
      } else {
        if (char.expectedText && input.textValue && char.expectedText.toUpperCase() !== input.textValue.toUpperCase()) {
          conforms = false;
        }
      }

      recorded.push({
        charId: char.charId,
        charName: char.name,
        type: char.type,
        numericValue: input.numericValue,
        textValue: input.textValue,
        conforms,
        remarks: input.remarks,
        testedAt: new Date().toISOString(),
        inspector: input.inspector,
      });
    }

    lot.results = recorded;
    lot.status = 'RESULTS_RECORDED';
    return lot;
  }

  /**
   * Post Usage Decision (UD): Accept to Unrestricted (321), Reject to Blocked (350), or Scrap (551)
   */
  public recordUsageDecision(params: {
    lotId: string;
    decision: UsageDecisionStatus;
    decidedBy: string;
    notes?: string;
  }): { lot: InspectionLot; usageDecision: UsageDecision } {
    const lot = this.inspectionLots.get(params.lotId);
    if (!lot) {
      throw new Error(`Inspection Lot '${params.lotId}' does not exist.`);
    }

    if (lot.results.length === 0) {
      throw new Error(`Cannot post Usage Decision for Lot '${params.lotId}' without recording test results first.`);
    }

    let movementType: '321' | '350' | '551' = '321';
    let decisionCode = 'UD-ACC-UNRESTRICTED';

    if (params.decision === 'ACCEPTED') {
      movementType = '321'; // Quality Inspection to Unrestricted Stock
      decisionCode = 'UD-ACC-UNRESTRICTED';
    } else if (params.decision === 'REJECTED') {
      movementType = '350'; // Quality Inspection to Blocked Stock
      decisionCode = 'UD-REJ-BLOCKED';
    } else if (params.decision === 'SCRAPPED') {
      movementType = '551'; // Scrap from Quality Inspection
      decisionCode = 'UD-SCRAP-EXPENSED';
    } else {
      throw new Error(`Invalid Usage Decision: '${params.decision}'. Must be ACCEPTED, REJECTED, or SCRAPPED.`);
    }

    const usageDecision: UsageDecision = {
      decision: params.decision,
      decisionCode,
      movementType,
      decidedBy: params.decidedBy,
      decidedAt: new Date().toISOString(),
      notes: params.notes,
    };

    lot.usageDecision = usageDecision;
    lot.status = 'UD_COMPLETED';

    // Update batch status
    const batch = this.batchRegistry.get(lot.batchNumber);
    if (batch) {
      if (params.decision === 'ACCEPTED') {
        batch.status = 'UNRESTRICTED';
      } else if (params.decision === 'REJECTED') {
        batch.status = 'BLOCKED';
      } else if (params.decision === 'SCRAPPED') {
        batch.status = 'RESTRICTED';
      }
    }

    return { lot, usageDecision };
  }

  /**
   * Generates a digitally signed Certificate of Analysis (CoA)
   */
  public generateCertificateOfAnalysis(lotId: string, qaManager: string): CertificateOfAnalysis {
    const lot = this.inspectionLots.get(lotId);
    if (!lot) {
      throw new Error(`Inspection Lot '${lotId}' does not exist.`);
    }

    if (!lot.usageDecision) {
      throw new Error(`Usage Decision has not been posted for lot '${lotId}'. CoA cannot be issued.`);
    }

    const testedParameters = lot.results.map((r) => {
      const char = lot.characteristics.find((c) => c.charId === r.charId);
      const spec =
        char?.type === 'QUANTITATIVE'
          ? `${char.lowerLimit ?? ''} - ${char.upperLimit ?? ''} ${char.uom ?? ''}`
          : char?.expectedText ?? 'PASS';
      const observed = r.type === 'QUANTITATIVE' ? `${r.numericValue} ${char?.uom ?? ''}` : r.textValue ?? 'PASS';

      return {
        parameter: r.charName,
        specification: spec,
        observedValue: observed,
        conformance: r.conforms ? ('CONFORMS' as const) : ('NON_CONFORMING' as const),
      };
    });

    const isPassed = lot.usageDecision.decision === 'ACCEPTED';
    const rawPayload = `${lot.lotId}:${lot.batchNumber}:${lot.materialSku}:${new Date().toISOString()}:${qaManager}`;
    const digitalSignatureHash = crypto.createHash('sha256').update(rawPayload).digest('hex');

    return {
      coaNumber: `COA-${Date.now().toString(36).toUpperCase()}`,
      inspectionLotId: lot.lotId,
      materialSku: lot.materialSku,
      materialName: lot.materialSku.includes('EVTRK') ? 'Sutra E-Titan 1.5T Commercial EV' : 'Industrial Material',
      batchNumber: lot.batchNumber,
      manufacturingDate: new Date().toISOString().split('T')[0],
      testedParameters,
      overallConclusion: isPassed ? 'PASSED_FOR_RELEASE' : 'REJECTED_QUARANTINE',
      digitalSignatureHash,
      qaManager,
      issuedAt: new Date().toISOString(),
    };
  }

  /**
   * Registers a batch in the system
   */
  public registerBatch(batch: BatchRecord): BatchRecord {
    this.batchRegistry.set(batch.batchNumber, batch);
    return batch;
  }

  /**
   * Traces upstream raw material suppliers and downstream customer shipments (Batch Genealogy)
   */
  public traceBatchGenealogy(batchNumber: string): BatchGenealogyTrace {
    const batch = this.batchRegistry.get(batchNumber);
    if (!batch) {
      throw new Error(`Batch number '${batchNumber}' not found in registry.`);
    }

    const upstreamRawBatches: Array<{ batchNumber: string; componentSku: string; vendorPoNumber?: string }> = [];
    for (const parent of batch.parentBatches) {
      const parentRecord = this.batchRegistry.get(parent);
      upstreamRawBatches.push({
        batchNumber: parent,
        componentSku: parentRecord?.materialSku || 'ROH-UNKNOWN',
        vendorPoNumber: parentRecord?.vendorBatch ? `PO-${parent.slice(-4)}` : undefined,
      });
    }

    const downstreamFinishedBatches: Array<{ batchNumber: string; finishedSku: string; productionOrderNumber?: string }> = [];
    for (const child of batch.childBatches) {
      const childRecord = this.batchRegistry.get(child);
      downstreamFinishedBatches.push({
        batchNumber: child,
        finishedSku: childRecord?.materialSku || 'FERT-UNKNOWN',
        productionOrderNumber: `ORD-PP-${child.slice(-4)}`,
      });
    }

    const affectedCustomers: Array<{ salesOrderNumber: string; customerId?: string }> = [];
    for (const so of batch.deliveredSalesOrders) {
      affectedCustomers.push({
        salesOrderNumber: so,
        customerId: 'CUST-MAH-001',
      });
    }

    return {
      searchedBatch: batchNumber,
      materialSku: batch.materialSku,
      direction: 'BIDIRECTIONAL',
      upstreamRawBatches,
      downstreamFinishedBatches,
      affectedCustomers,
    };
  }

  public getAllInspectionLots(): InspectionLot[] {
    return Array.from(this.inspectionLots.values());
  }

  public getInspectionLot(lotId: string): InspectionLot | undefined {
    return this.inspectionLots.get(lotId);
  }

  public getAllBatches(): BatchRecord[] {
    return Array.from(this.batchRegistry.values());
  }
}
