import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  GeneralLedgerEngine,
  InventoryEngine,
  OrderToCashEngine,
  ProcureToPayEngine,
  SubledgerEngine,
  LocalJwtAuthProvider,
  ManufacturingEngine,
  FixedAssetEngine,
  QualityEngine,
  ControllingEngine,
  MaintenanceEngine,
  TreasuryEngine,
  HcmEngine,
  ProjectSystemsEngine,
  WarehouseEngine,
  MultiCurrencyEngine,
} from '../packages/core/dist/index.js';

describe('Sutra Enterprise Core Platform Suite', () => {
  describe('General Ledger & Double-Entry Accounting Engine', () => {
    test('successfully posts a balanced journal entry', () => {
      const result = GeneralLedgerEngine.postJournalEntry({
        tenantId: '00000000-0000-0000-0000-000000000001',
        entryNumber: 'JRN-TEST-001',
        postingDate: '2026-09-29',
        reference: 'TEST-REF',
        lines: [
          {
            accountId: '1',
            accountCode: '110000',
            accountName: 'HDFC Bank Operating Account',
            debit: 50000,
            credit: 0,
            description: 'Customer payment received',
          },
          {
            accountId: '2',
            accountCode: '120000',
            accountName: 'Accounts Receivable - Tata Motors',
            debit: 0,
            credit: 50000,
            description: 'Customer payment clearance',
          },
        ],
      });

      assert.equal(result.success, true);
      assert.equal(result.status, 'POSTED');
      assert.equal(result.isBalanced, true);
      assert.equal(result.totalDebit, 50000);
      assert.equal(result.totalCredit, 50000);
    });

    test('strictly rejects an unbalanced journal entry', () => {
      const result = GeneralLedgerEngine.postJournalEntry({
        tenantId: '00000000-0000-0000-0000-000000000001',
        entryNumber: 'JRN-TEST-002',
        postingDate: '2026-09-29',
        lines: [
          {
            accountId: '1',
            accountCode: '110000',
            accountName: 'HDFC Bank Operating Account',
            debit: 75000,
            credit: 0,
          },
          {
            accountId: '2',
            accountCode: '120000',
            accountName: 'Accounts Receivable',
            debit: 0,
            credit: 50000, // Difference of 25,000
          },
        ],
      });

      assert.equal(result.success, false);
      assert.equal(result.status, 'REJECTED');
      assert.match(result.rejectionReason, /Out of balance/i);
    });

    test('rejects negative debit or credit amounts', () => {
      const result = GeneralLedgerEngine.postJournalEntry({
        tenantId: '00000000-0000-0000-0000-000000000001',
        entryNumber: 'JRN-TEST-003',
        postingDate: '2026-09-29',
        lines: [
          { accountId: '1', accountCode: '1100', accountName: 'Cash', debit: -100, credit: 0 },
          { accountId: '2', accountCode: '1200', accountName: 'Revenue', debit: 0, credit: -100 },
        ],
      });

      assert.equal(result.success, false);
      assert.match(result.rejectionReason, /Negative debit or credit/i);
    });
  });

  describe('Materials Management (MM) & Inventory Engine', () => {
    test('accurately recalculates Moving Average Price (MAP) on Goods Receipt (Mvt 101)', () => {
      const inventory = new InventoryEngine();
      // Test formula: Current Qty = 100 @ ₹50, Inbound Qty = 100 @ ₹70 -> New MAP should be ₹60
      const newMap = inventory.calculateNewMovingAveragePrice(100, 50, 100, 70);
      assert.equal(newMap, 60);

      // Execute actual stock movement 101 for ROH-STEEL-001
      const matBefore = inventory.getMaterial('ROH-STEEL-001');
      assert.ok(matBefore);
      const initialStock = matBefore.totalStock;

      const result = inventory.executeStockMovement({
        movementType: '101',
        sku: 'ROH-STEEL-001',
        quantity: 500,
        unitCost: 70,
        referenceDocument: 'PO-TEST-001',
      });

      assert.equal(result.currentStock, initialStock + 500);
      assert.equal(result.glPostingRequired, true);
      assert.ok(result.journalLines && result.journalLines.length === 2);
    });

    test('prevents goods issue when requested quantity exceeds available stock', () => {
      const inventory = new InventoryEngine();
      assert.throws(
        () => {
          inventory.executeStockMovement({
            movementType: '201',
            sku: 'FERT-EVTRK-001',
            quantity: 999999, // Exceeds available stock
          });
        },
        {
          message: /Insufficient stock/,
        }
      );
    });
  });

  describe('Sales & Distribution (SD) - Order-to-Cash Engine', () => {
    test('creates sales order with ATP and India GST tax calculation', () => {
      const inventory = new InventoryEngine();
      const o2c = new OrderToCashEngine(inventory);

      const order = o2c.createSalesOrder({
        tenantId: '00000000-0000-0000-0000-000000000001',
        orderNumber: 'SO-TEST-001',
        customerId: 'CUST-MAH-001', // Maharashtra customer
        supplierGstin: '27AABCS1429B1ZB', // Maharashtra supplier
        supplierStateCode: '27',
        items: [
          { sku: 'FERT-EVTRK-001', quantity: 2, unitPrice: 950000 },
        ],
        deliveryAddress: 'Pune Hub',
      });

      assert.equal(order.status, 'CONFIRMED');
      assert.equal(order.taxableValue, 1900000);
      // Intra-state: 9% CGST (171,000) + 9% SGST (171,000)
      assert.equal(order.isInterState, false);
      assert.equal(order.cgst, 171000);
      assert.equal(order.sgst, 171000);
      assert.equal(order.igst, 0);
      assert.equal(order.grandTotal, 2242000);
    });

    test('rejects sales order if customer credit limit is exceeded', () => {
      const inventory = new InventoryEngine();
      const o2c = new OrderToCashEngine(inventory);

      // Customer credit limit is 2.5 Crore (25,000,000)
      // Attempting to order 50 units @ 950,000 = 47,500,000
      const order = o2c.createSalesOrder({
        tenantId: '00000000-0000-0000-0000-000000000001',
        orderNumber: 'SO-TEST-002',
        customerId: 'CUST-MAH-001',
        supplierGstin: '27AABCS1429B1ZB',
        supplierStateCode: '27',
        items: [
          { sku: 'FERT-EVTRK-001', quantity: 30, unitPrice: 950000 },
        ],
        deliveryAddress: 'Pune Hub',
      });

      assert.equal(order.status, 'REJECTED');
      assert.equal(order.creditCheckPassed, false);
      assert.match(order.rejectionReason, /Credit Limit Exceeded/i);
    });

    test('generates billing invoice with NIC E-Invoice IRN & E-Way Bill requirement', () => {
      const inventory = new InventoryEngine();
      const o2c = new OrderToCashEngine(inventory);

      o2c.createSalesOrder({
        tenantId: '00000000-0000-0000-0000-000000000001',
        orderNumber: 'SO-TEST-003',
        customerId: 'CUST-MAH-001',
        supplierGstin: '27AABCS1429B1ZB',
        supplierStateCode: '27',
        items: [{ sku: 'FERT-EVTRK-001', quantity: 1, unitPrice: 950000 }],
        deliveryAddress: 'Pune Hub',
      });

      const invoice = o2c.generateBillingInvoice('00000000-0000-0000-0000-000000000001', 'SO-TEST-003');
      assert.ok(invoice.invoiceNumber);
      assert.equal(invoice.eWayBillRequired, true); // Invoice > 50,000 INR
      assert.ok(invoice.eInvoiceIrn);
      assert.equal(invoice.glPostingSuccess, true);
    });
  });

  describe('Procure-to-Pay (P2P) Engine & 3-Way Match', () => {
    test('executes PO -> GRN -> 3-Way Match with Indian Section 194Q TDS', () => {
      const inventory = new InventoryEngine();
      const p2p = new ProcureToPayEngine(inventory);

      // 1. Create Purchase Order
      const po = p2p.createPurchaseOrder({
        tenantId: '00000000-0000-0000-0000-000000000001',
        poNumber: 'PO-2026-001',
        vendorId: 'VEND-MICROTECH-002', // MSME Vendor
        supplierStateCode: '27',
        items: [{ sku: 'HALB-AXLE-001', quantity: 20, unitPrice: 1800 }],
        deliveryPlant: 'PLANT-1000',
      });

      assert.equal(po.status, 'APPROVED');
      assert.equal(po.msmePrompt, true);
      assert.equal(po.msmeMaxPaymentDays, 45); // Sec 43B(h) cap

      // 2. Process Goods Receipt (GRN)
      const grn = p2p.processGoodsReceipt('PO-2026-001', 'GRN-2026-001');
      assert.equal(grn.receivedItems.length, 1);
      assert.equal(grn.receivedItems[0].receivedQty, 20);

      // 3. Verify Vendor Invoice (3-Way Match)
      const verification = p2p.verifyVendorInvoice({
        tenantId: '00000000-0000-0000-0000-000000000001',
        vendorInvoiceNumber: 'VINV-0988',
        poNumber: 'PO-2026-001',
        grnNumber: 'GRN-2026-001',
        invoiceDate: '2026-09-29',
        invoicedItems: [{ sku: 'HALB-AXLE-001', invoicedQty: 20, invoicedUnitPrice: 1800 }],
        applyTdsSection: '194Q',
      });

      assert.equal(verification.threeWayMatch.matched, true);
      assert.equal(verification.threeWayMatch.status, 'PERFECT_MATCH');
      assert.equal(verification.tdsDeduction.section, '194Q');
      assert.ok(verification.tdsDeduction.deductionAmount > 0);
      assert.equal(verification.glPostingSuccess, true);
    });
  });

  describe('Subledger Engine & Aging Analysis', () => {
    test('calculates aging buckets (0-30, 31-60, 61-90, 90+) and DSO/DPO', () => {
      const subledger = new SubledgerEngine();
      const report = subledger.generateAgingReport();

      assert.ok(report.receivables.summary.totalOutstanding > 0);
      assert.ok(report.payables.summary.totalOutstanding > 0);
      assert.ok(report.receivables.dsoDays > 0);
      assert.ok(report.payables.dpoDays > 0);
      assert.ok(report.netWorkingCapitalExposure !== undefined);
    });
  });

  describe('Enterprise Authentication System', () => {
    test('issues and verifies standard JWT token with RBAC permissions', async () => {
      const provider = new LocalJwtAuthProvider({
        secretKey: 'test-secret-key-for-unit-tests-only',
        issuer: 'sutra-unit-test',
        tokenExpirationSeconds: 3600,
      });

      const authResult = await provider.authenticate({
        email: 'admin@sutra.local',
        password: 'admin123',
      });

      assert.equal(authResult.success, true);
      assert.ok(authResult.tokens?.accessToken);
      assert.equal(authResult.user?.email, 'admin@sutra.local');

      // Verify token
      const verified = await provider.validateToken(authResult.tokens.accessToken);
      assert.equal(verified.email, 'admin@sutra.local');
      assert.ok(verified.permissions.has('*'));
    });
  });

  describe('Production Planning & Manufacturing Engine (SAP PP)', () => {
    test('explodes BOM and verifies material availability for production order', () => {
      const inventory = new InventoryEngine();
      const mfg = new ManufacturingEngine(inventory);

      const order = mfg.planProductionOrder({
        tenantId: '00000000-0000-0000-0000-000000000001',
        orderNumber: 'PRD-TEST-001',
        targetSku: 'FERT-EVTRK-001',
        targetQuantity: 2,
        plantId: 'PLANT-1000',
        startDate: '2026-09-29',
        targetCompletionDate: '2026-10-05',
      });

      assert.equal(order.status, 'RELEASED');
      assert.equal(order.targetQuantity, 2);
      assert.equal(order.componentsRequired.length, 2);
      assert.ok(order.totalDirectMaterialCost > 0);
      assert.ok(order.estimatedLaborCost > 0);
      assert.ok(order.costPerFinishedUnit > 0);
    });

    test('confirms production order, consumes WIP components, and posts finished inventory', () => {
      const inventory = new InventoryEngine();
      const mfg = new ManufacturingEngine(inventory);

      mfg.planProductionOrder({
        tenantId: '00000000-0000-0000-0000-000000000001',
        orderNumber: 'PRD-TEST-002',
        targetSku: 'FERT-EVTRK-001',
        targetQuantity: 1,
        plantId: 'PLANT-1000',
        startDate: '2026-09-29',
        targetCompletionDate: '2026-10-05',
      });

      const confirmation = mfg.confirmProductionOrder(
        '00000000-0000-0000-0000-000000000001',
        'PRD-TEST-002',
        1
      );

      assert.equal(confirmation.producedQuantity, 1);
      assert.ok(confirmation.goodsIssueMovementDocIds.length > 0);
      assert.ok(confirmation.goodsReceiptMovementDocId);
      assert.ok(confirmation.unitFinishedCost > 0);
      assert.ok(confirmation.glJournalNumber);
    });
  });

  describe('Fixed Asset Accounting Engine (SAP FI-AA)', () => {
    test('calculates straight line (SLM) depreciation under Companies Act 2013', () => {
      const assetEngine = new FixedAssetEngine();
      const asset = assetEngine.getAsset('AST-PUNE-ROBOT-01');
      assert.ok(asset);

      // Cost = 65L, Salvage = 3.25L, Depreciable = 61.75L over 15 years (180 months) -> ~34,305.56/mo
      const monthly = assetEngine.calculateMonthlyDepreciation(asset);
      assert.ok(monthly > 34000 && monthly < 35000);
    });

    test('executes monthly depreciation run and posts balanced GL entries', () => {
      const assetEngine = new FixedAssetEngine();
      const result = assetEngine.executeMonthlyDepreciationRun(
        '00000000-0000-0000-0000-000000000001',
        '2026-09'
      );

      assert.ok(result.assetsProcessed >= 3);
      assert.ok(result.totalDepreciationAmount > 0);
      assert.ok(result.glJournalNumber);
    });
  });

  describe('Quality Management & Batch Traceability Engine (SAP QM)', () => {
    test('creates inspection lot on goods receipt, records conforming results, and issues CoA', () => {
      const qm = new QualityEngine();

      // 1. Create Lot on GR
      const lot = qm.createInspectionLot({
        origin: '01_GOODS_RECEIPT',
        materialSku: 'ROH-STEEL-001',
        batchNumber: 'BATCH-2026-ST-999',
        quantity: 2500,
        baseUom: 'KG',
        plantId: 'PLANT-1000',
        referenceDocument: 'PO-2026-0891',
      });

      assert.equal(lot.status, 'CREATED');
      assert.equal(lot.characteristics.length, 3);

      // 2. Record Conforming Results
      const updatedLot = qm.recordResults(lot.lotId, [
        { charId: 'QC-STEEL-THICK', numericValue: 1.21, inspector: 'QC_OFFICER_PATIL' },
        { charId: 'QC-STEEL-TENSILE', numericValue: 345, inspector: 'QC_OFFICER_PATIL' },
        { charId: 'QC-STEEL-SURFACE', textValue: 'DEFECT_FREE', inspector: 'QC_OFFICER_PATIL' },
      ]);

      assert.equal(updatedLot.status, 'RESULTS_RECORDED');
      assert.equal(updatedLot.results.every((r) => r.conforms), true);

      // 3. Usage Decision: Accept to Unrestricted (321)
      const { usageDecision } = qm.recordUsageDecision({
        lotId: lot.lotId,
        decision: 'ACCEPTED',
        decidedBy: 'QA_HEAD_DESHMUKH',
        notes: 'Cold-rolled steel passed ASTM & IS 513 standards.',
      });

      assert.equal(usageDecision.decision, 'ACCEPTED');
      assert.equal(usageDecision.movementType, '321');

      // 4. Generate Certificate of Analysis (CoA)
      const coa = qm.generateCertificateOfAnalysis(lot.lotId, 'QA_HEAD_DESHMUKH');
      assert.equal(coa.overallConclusion, 'PASSED_FOR_RELEASE');
      assert.ok(coa.digitalSignatureHash.length === 64);
    });

    test('rejects inspection lot and blocks batch when characteristics exceed tolerance limits', () => {
      const qm = new QualityEngine();

      const lot = qm.createInspectionLot({
        origin: '01_GOODS_RECEIPT',
        materialSku: 'ROH-STEEL-001',
        batchNumber: 'BATCH-2026-ST-DEFECT',
        quantity: 1000,
        baseUom: 'KG',
        plantId: 'PLANT-1000',
        referenceDocument: 'PO-2026-0899',
      });

      // Thickness 1.45mm exceeds upper limit 1.25mm
      const updatedLot = qm.recordResults(lot.lotId, [
        { charId: 'QC-STEEL-THICK', numericValue: 1.45, inspector: 'QC_OFFICER_PATIL' },
        { charId: 'QC-STEEL-TENSILE', numericValue: 280, inspector: 'QC_OFFICER_PATIL' }, // below 310 MPa
        { charId: 'QC-STEEL-SURFACE', textValue: 'SURFACE_CORROSION_FOUND', inspector: 'QC_OFFICER_PATIL' },
      ]);

      const thickResult = updatedLot.results.find((r) => r.charId === 'QC-STEEL-THICK');
      assert.equal(thickResult.conforms, false);

      // Post Usage Decision: Reject to Blocked Stock (350)
      const { usageDecision } = qm.recordUsageDecision({
        lotId: lot.lotId,
        decision: 'REJECTED',
        decidedBy: 'QA_HEAD_DESHMUKH',
        notes: 'Rejected due to sheet thickness deviation and low tensile strength.',
      });

      assert.equal(usageDecision.decision, 'REJECTED');
      assert.equal(usageDecision.movementType, '350');
    });

    test('traces bidirectional batch genealogy from raw material to finished goods and customer delivery', () => {
      const qm = new QualityEngine();

      // Trace upstream raw batch -> downstream vehicle
      const downstreamTrace = qm.traceBatchGenealogy('BATCH-2026-ST-088');
      assert.ok(downstreamTrace.downstreamFinishedBatches.some((b) => b.batchNumber === 'BATCH-2026-EV-001'));

      // Trace finished vehicle -> upstream supplier batch and customer sales order
      const upstreamTrace = qm.traceBatchGenealogy('BATCH-2026-EV-001');
      assert.ok(upstreamTrace.upstreamRawBatches.some((b) => b.batchNumber === 'BATCH-2026-ST-088'));
      assert.ok(upstreamTrace.affectedCustomers.some((c) => c.salesOrderNumber === 'SO-2026-0042'));
    });
  });

  describe('Controlling & Management Accounting Engine (SAP CO)', () => {
    test('executes periodic overhead cost assessment cycle and posts balanced secondary cost allocation', () => {
      const co = new ControllingEngine();

      const result = co.executeCostAllocationCycle({
        ruleId: 'ALLOC-RULE-IT-01',
        period: '2026-09',
        amountToAllocate: 1000000, // 10 Lakhs INR IT overhead
      });

      assert.equal(result.totalAmountAllocated, 1000000);
      assert.equal(result.allocations.length, 3);

      // Allocations: 40% Body Shop (4L), 45% Final Assembly (4.5L), 15% Logistics (1.5L)
      const bodyAlloc = result.allocations.find((a) => a.receiverCostCenter === 'CC-MFG-BODY');
      const assyAlloc = result.allocations.find((a) => a.receiverCostCenter === 'CC-MFG-ASSY');
      const logAlloc = result.allocations.find((a) => a.receiverCostCenter === 'CC-LOGISTICS');

      assert.equal(bodyAlloc.allocatedAmount, 400000);
      assert.equal(assyAlloc.allocatedAmount, 450000);
      assert.equal(logAlloc.allocatedAmount, 150000);

      // Verify balanced double entry: sum(debit) === sum(credit)
      const totalDebit = result.journalLines.reduce((s, l) => s + l.debit, 0);
      const totalCredit = result.journalLines.reduce((s, l) => s + l.credit, 0);
      assert.equal(totalDebit, 1000000);
      assert.equal(totalCredit, 1000000);
    });

    test('performs budget vs actual variance analysis identifying favorable and unfavorable variances', () => {
      const co = new ControllingEngine();

      // CC-SHARED-IT annual budget is 180L -> monthly planned budget is 15L
      // actualIncurred is 120L (exceeds 15L monthly budget -> UNFAVORABLE variance)
      const variance = co.analyzeVariance('CC-SHARED-IT', '2026-09');

      assert.equal(variance.costCenter, 'CC-SHARED-IT');
      assert.equal(variance.plannedBudget, 1500000);
      assert.equal(variance.varianceType, 'UNFAVORABLE');
      assert.ok(variance.varianceAmount < 0);
    });
  });

  describe('Plant Maintenance & Enterprise Asset Management Engine (SAP PM/EAM)', () => {
    test('manages maintenance lifecycle: breakdown -> work order -> parts issue -> completion -> settlement', () => {
      const pm = new MaintenanceEngine();

      // 1. Create Breakdown Notification
      const notif = pm.createNotification({
        equipmentNumber: 'EQ-ROBOT-01',
        type: 'BREAKDOWN',
        priority: 'VERY_HIGH',
        shortDescription: 'Axis 4 servo motor intermittent overload trip',
        reportedBy: 'Vikram Joshi (Shop Floor Lead)',
      });

      assert.equal(notif.status, 'NEW');
      const eqAfterNotif = pm.getEquipment('EQ-ROBOT-01');
      assert.equal(eqAfterNotif.status, 'BREAKDOWN');

      // 2. Create Maintenance Work Order
      const wo = pm.createWorkOrder({
        equipmentNumber: 'EQ-ROBOT-01',
        notificationNumber: notif.notificationNumber,
        orderType: 'CORRECTIVE',
        scheduledStart: '2026-09-29T08:00:00Z',
        scheduledEnd: '2026-09-29T14:00:00Z',
        assignedTechnician: 'Ramesh K (Senior Robotics Tech)',
        estimatedLaborHours: 5,
        laborHourlyRate: 800,
        spareParts: [
          { sku: 'SPARE-SERVO-01', name: 'AC Servo Motor 4kW', requiredQuantity: 1, unitCost: 45000 },
        ],
      });

      assert.equal(wo.status, 'CREATED');
      assert.equal(wo.costCenter, 'CC-MFG-100');

      // 3. Release Work Order
      const released = pm.releaseWorkOrder(wo.orderNumber);
      assert.equal(released.status, 'RELEASED');

      // 4. Issue Spare Parts
      const { workOrder: woWithParts, issuedPart } = pm.issueSpareParts(wo.orderNumber, 'SPARE-SERVO-01', 1);
      assert.equal(issuedPart.issuedQuantity, 1);
      assert.equal(woWithParts.totalMaterialCost, 45000);

      // 5. Complete Work Order with 4 hours labor and 3.5 hours downtime
      const completed = pm.completeWorkOrder(wo.orderNumber, 4, 3.5);
      assert.equal(completed.status, 'TECHNICALLY_COMPLETED');
      assert.equal(completed.actualLaborHours, 4);
      assert.equal(completed.totalLaborCost, 3200); // 4 * 800
      assert.equal(completed.totalActualCost, 48200); // 45000 + 3200

      // Equipment restored to OPERATIONAL
      const eqRestored = pm.getEquipment('EQ-ROBOT-01');
      assert.equal(eqRestored.status, 'OPERATIONAL');

      // 6. Settle Work Order to Cost Center
      const { workOrder: settledWo, settlement } = pm.settleWorkOrder(wo.orderNumber);
      assert.equal(settledWo.status, 'CLOSED');
      assert.equal(settlement.settledAmount, 48200);
      assert.equal(settlement.debitCostCenter, 'CC-MFG-100');
      assert.equal(settledWo.glSettlementEntry.debitAccount, '510300');
    });

    test('evaluates preventive maintenance schedules and calculates MTBF/MTTR reliability metrics', () => {
      const pm = new MaintenanceEngine();

      // Update operating hours to trigger usage-based maintenance (cycle 1000 hrs, last 4000)
      pm.updateOperatingHours('EQ-ROBOT-01', 800); // 4250 + 800 = 5050 hrs (> 5000 trigger threshold)
      const generated = pm.evaluatePreventiveSchedules();
      assert.ok(generated.length > 0);
      assert.equal(generated[0].orderType, 'PREVENTIVE');
      assert.equal(generated[0].equipmentNumber, 'EQ-ROBOT-01');

      // Calculate Reliability Metrics (MTBF, MTTR, Availability %)
      const reliability = pm.calculateEquipmentReliability('EQ-ROBOT-01');
      assert.equal(reliability.equipmentNumber, 'EQ-ROBOT-01');
      assert.ok(reliability.breakdownCount > 0);
      assert.ok(reliability.mtbfHours > 0);
      assert.ok(reliability.mttrHours > 0);
      assert.ok(reliability.availabilityPercentage >= 95.0);
    });
  });

  describe('Treasury & Bank Statement Reconciliation Engine (SAP TRM / FI-BL)', () => {
    test('executes automated 2-way bank statement reconciliation and calculates match confidence', () => {
      const trm = new TreasuryEngine();

      // Execute Auto Reconciliation on seeded statement BS-2026-09-01
      const result = trm.executeAutoReconciliation('BS-2026-09-01');

      assert.equal(result.statementId, 'BS-2026-09-01');
      assert.equal(result.matchedCount, 2);
      assert.equal(result.unmatchedCount, 0);
      assert.equal(result.matchedAmount, 1270000); // 850,000 + 420,000

      // Verify line items marked AUTO_CLEARED with 100 score
      const line1 = result.reconciledLines.find((l) => l.transactionReference === 'UTR-HDFC-9921');
      const line2 = result.reconciledLines.find((l) => l.transactionReference === 'CHQ-440192');
      assert.equal(line1.reconciliationStatus, 'AUTO_CLEARED');
      assert.equal(line1.matchScore, 100);
      assert.equal(line2.reconciliationStatus, 'AUTO_CLEARED');
      assert.equal(line2.matchScore, 100);
    });

    test('generates Bank Reconciliation Statement (BRS) with deposits in transit and unpresented cheques', () => {
      const trm = new TreasuryEngine();

      // First run auto reconciliation to clear matched items
      trm.executeAutoReconciliation('BS-2026-09-01');

      // Generate BRS
      const brs = trm.generateBRS('BA-HDFC-INR-01', '2026-09-07');

      assert.equal(brs.accountId, 'BA-HDFC-INR-01');
      assert.equal(brs.balanceAsPerBank, 12880000);

      // Uncleared items:
      // Deposit in transit: NEFT-AXIS-8812 (+350,000)
      // Unpresented cheque: CHQ-440193 (-150,000)
      // Adjusted Bank Balance: 12,880,000 + 350,000 - 150,000 = 13,080,000
      assert.ok(brs.addDepositsInTransit.some((d) => d.reference === 'NEFT-AXIS-8812'));
      assert.ok(brs.lessUnpresentedCheques.some((c) => c.reference === 'CHQ-440193'));
      assert.equal(brs.adjustedBankBalance, 13080000);
    });

    test('projects 30, 60, and 90-day cash liquidity forecasting', () => {
      const trm = new TreasuryEngine();

      const forecast = trm.forecastCashLiquidity('BA-HDFC-INR-01', 5000000, 3000000);

      assert.equal(forecast.currency, 'INR');
      assert.ok(forecast.currentCashBalance > 0);

      // 30 days: net +20L
      assert.equal(forecast.forecast30Days.netCashFlow, 2000000);
      assert.equal(
        forecast.forecast30Days.projectedClosingCash,
        forecast.currentCashBalance + 2000000
      );

      // 60 & 90 days projections
      assert.ok(forecast.forecast60Days.projectedClosingCash > forecast.forecast30Days.projectedClosingCash);
      assert.ok(forecast.forecast90Days.projectedClosingCash > forecast.forecast60Days.projectedClosingCash);
    });
  });

  describe('Human Capital Management & Core HR Engine (SAP HCM)', () => {
    test('calculates statutory salary, LOP deductions, and generates digital payslip', () => {
      const hcm = new HcmEngine();

      // Priya has 1 LOP day out of 22 working days
      const payslip = hcm.calculateEmployeeSalary('EMP-IND-0102', '2026-09');

      assert.equal(payslip.employeeId, 'EMP-IND-0102');
      assert.equal(payslip.costCenter, 'CC-MFG-ASSY');
      // Pro-rata factor = 21/22
      assert.ok(payslip.earnedGrossSalary < 65000);
      assert.ok(payslip.deductions.epfEmployee <= 1800); // EPF capped at 1,800
      assert.equal(payslip.deductions.professionalTax, 200); // Standard PT
      assert.ok(payslip.netPayableSalary > 0);
      assert.ok(payslip.bankAccountMasked.startsWith('****'));
    });

    test('executes monthly payroll run and generates balanced General Ledger payroll voucher', () => {
      const hcm = new HcmEngine();

      const run = hcm.executeMonthlyPayrollRun('2026-09');

      assert.equal(run.month, '2026-09');
      assert.equal(run.processedCount, 3);
      assert.ok(run.totalGrossSalaries > 0);
      assert.ok(run.totalNetSalariesDisbursed > 0);

      // Verify balanced double entry: Sum(Debit) === Sum(Credit)
      assert.equal(run.glPosting.isBalanced, true);
      const totalDebit = run.glPosting.journalLines.reduce((s, l) => s + l.debit, 0);
      const totalCredit = run.glPosting.journalLines.reduce((s, l) => s + l.credit, 0);
      assert.equal(Math.round(totalDebit), Math.round(totalCredit));

      // Verify liability accounts present (EPF, ESIC, PT, TDS, Net Salaries)
      const accounts = run.glPosting.journalLines.map((l) => l.accountCode);
      assert.ok(accounts.includes('510000')); // Salaries Expense
      assert.ok(accounts.includes('214100')); // EPF Payable
      assert.ok(accounts.includes('214200')); // ESIC Payable
      assert.ok(accounts.includes('214300')); // PT Payable
      assert.ok(accounts.includes('214400')); // TDS 192 Payable
      assert.ok(accounts.includes('214000')); // Net Salaries Payable
    });
  });

  describe('Project Systems & Capital Project Costing Engine (SAP PS)', () => {
    test('tracks WBS hierarchy, purchase commitments, and milestone completion (PoC)', () => {
      const ps = new ProjectSystemsEngine();

      const proj = ps.getProject('PRJ-EV-GIGA-01');
      assert.ok(proj);
      assert.equal(proj.totalApprovedBudget, 75000000);
      assert.equal(proj.wbsElements.length, 3);

      // 1. Record additional purchase commitment on WBS PRJ-EV-GIGA/03
      const updatedWbs = ps.recordCommitment('PRJ-EV-GIGA-01', 'PRJ-EV-GIGA/03', 2000000);
      assert.equal(updatedWbs.budgetCommitted, 7000000); // 5M + 2M

      // 2. Record actual cost incurred and reduce commitment
      const wbsWithActual = ps.recordActualCost('PRJ-EV-GIGA-01', 'PRJ-EV-GIGA/03', 2000000, 2000000);
      assert.equal(wbsWithActual.actualCostIncurred, 5000000);
      assert.equal(wbsWithActual.budgetCommitted, 5000000);

      // 3. Complete Milestone M3 and verify Percentage of Completion (PoC) reaches 100%
      const achieved = ps.achieveMilestone('PRJ-EV-GIGA-01', 'M3');
      assert.equal(achieved.isAchieved, true);

      const poc = ps.calculateProjectPoC('PRJ-EV-GIGA-01');
      assert.equal(poc.pocPercentage, 100);
      assert.equal(poc.achievedWeight, 100);
    });

    test('settles Capital Work-in-Progress (CWIP) into Fixed Asset register with balanced GL capitalization', () => {
      const fixedAssets = new FixedAssetEngine();
      const ps = new ProjectSystemsEngine(fixedAssets);

      // Settle project CWIP into capital Fixed Asset
      const settlement = ps.settleCwipToFixedAsset(
        'PRJ-EV-GIGA-01',
        'Gigafactory Pack Assembly Line 2 Infrastructure',
        'PLANT_MACHINERY',
        15
      );

      assert.equal(settlement.projectId, 'PRJ-EV-GIGA-01');
      assert.ok(settlement.capitalizedAssetTag.startsWith('AST-CWIP-'));
      assert.equal(settlement.costCenter, 'CC-MFG-BODY');
      assert.ok(settlement.totalSettledCost > 0);

      // Verify GL capitalization voucher: 140100 Dr, 140800 Cr
      assert.equal(settlement.glJournal.debitAccount, '140100');
      assert.equal(settlement.glJournal.creditAccount, '140800');
      assert.equal(settlement.glJournal.amount, settlement.totalSettledCost);

      // Verify asset exists in Fixed Asset register
      const asset = fixedAssets.getAsset(settlement.capitalizedAssetTag);
      assert.ok(asset);
      assert.equal(asset.currentBookValue, settlement.totalSettledCost);
      assert.equal(asset.assetClass, 'PLANT_MACHINERY');
    });
  });

  describe('Extended Warehouse Management Engine (SAP EWM)', () => {
    test('manages multi-zone warehouse topology, capacity checks, and automated putaway', () => {
      const ewm = new WarehouseEngine();
      const bins = ewm.getBins('WH-PUNE-CENTRAL');
      assert.ok(bins.length >= 3);

      // Register new cold storage bin
      const coldBin = ewm.registerBin({
        binId: 'BIN-PUN-COLD-01',
        warehouseId: 'WH-PUNE-CENTRAL',
        zone: 'ZONE-COLD',
        aisle: 'A03',
        rack: 'R01',
        shelf: 'S01',
        position: 'P01',
        binType: 'COLD_STORAGE',
        maxWeightKg: 2000,
        maxVolumeCbm: 8.0,
      });
      assert.equal(coldBin.binType, 'COLD_STORAGE');

      // Putaway into cold storage bin
      const putaway = ewm.executePutaway({
        warehouseId: 'WH-PUNE-CENTRAL',
        sku: 'CHEM-COOLANT-001',
        materialName: 'Battery Thermal Dielectric Coolant',
        batchNumber: 'LOT-COOL-2026-01',
        quantity: 20,
        baseUom: 'L',
        unitWeightKg: 1.1,
        unitVolumeCbm: 0.005,
        requiredBinType: 'COLD_STORAGE',
        expiryDate: '2027-06-30',
      });

      assert.equal(putaway.targetBinId, 'BIN-PUN-COLD-01');
      assert.equal(putaway.status, 'CONFIRMED');
      assert.equal(putaway.quantity, 20);

      const updatedBin = ewm.getBin('BIN-PUN-COLD-01');
      assert.ok(updatedBin.isOccupied);
      assert.equal(updatedBin.currentWeightKg, 22);
    });

    test('executes FIFO picking and physical inventory cycle counting with GL variance posting', () => {
      const ewm = new WarehouseEngine();

      // Execute FIFO picking for steel coils from BIN-PUN-ZA-01 (seeded with 50 KG)
      const pick = ewm.executePicking({
        warehouseId: 'WH-PUNE-CENTRAL',
        sku: 'ROH-STEEL-001',
        quantityRequested: 20,
        strategy: 'FIFO',
      });

      assert.equal(pick.status, 'CONFIRMED');
      assert.equal(pick.totalQuantityPicked, 20);
      assert.equal(pick.allocations.length, 1);
      assert.equal(pick.allocations[0].binId, 'BIN-PUN-ZA-01');

      const binAfterPick = ewm.getBin('BIN-PUN-ZA-01');
      assert.equal(binAfterPick.items[0].quantity, 30); // 50 - 20 = 30

      // Execute Cycle Count recording shortage (physical 28 vs book 30)
      const countRecord = ewm.recordCycleCount({
        warehouseId: 'WH-PUNE-CENTRAL',
        binId: 'BIN-PUN-ZA-01',
        sku: 'ROH-STEEL-001',
        batchNumber: 'LOT-STL-2026-08',
        physicalCountedQuantity: 28,
        unitCost: 65,
      });

      assert.equal(countRecord.bookQuantity, 30);
      assert.equal(countRecord.physicalCountedQuantity, 28);
      assert.equal(countRecord.varianceQuantity, -2);
      assert.equal(countRecord.varianceValue, 130); // 2 * 65

      // Balanced GL voucher for shrinkage: 540100 Dr, 120100 Cr
      assert.ok(countRecord.glVoucherLines);
      assert.equal(countRecord.glVoucherLines[0].accountCode, '540100');
      assert.equal(countRecord.glVoucherLines[0].debit, 130);
      assert.equal(countRecord.glVoucherLines[1].accountCode, '120100');
      assert.equal(countRecord.glVoucherLines[1].credit, 130);
    });
  });

  describe('Multi-Currency & Parallel Accounting Engine (SAP FI-GL Parallel Ledger)', () => {
    test('converts currency and posts balanced parallel journal across Leading (0L) and Non-Leading (2L) ledgers', () => {
      const mc = new MultiCurrencyEngine();

      // Convert USD to INR
      const converted = mc.convertAmount(1000, 'USD', 'INR', 'SPOT');
      assert.equal(converted, 83500); // 1000 * 83.50

      // Post parallel journal entry in group USD and operating INR
      const journal = mc.postParallelJournal({
        ledgerGroup: 'ALL',
        postingDate: '2026-09-30',
        reference: 'PAR-INV-001',
        narrative: 'Software Export Revenue & Receivables',
        transactionCurrency: 'USD',
        exchangeRateUsed: 83.50,
        lines: [
          {
            accountCode: '110100',
            accountName: 'Foreign Accounts Receivable (USD)',
            amountLocal: 835000,
            amountGroup: 10000,
            currency: 'USD',
            debit: 835000,
            credit: 0,
          },
          {
            accountCode: '410100',
            accountName: 'Export Revenue - Technology Services',
            amountLocal: 835000,
            amountGroup: 10000,
            currency: 'USD',
            debit: 0,
            credit: 835000,
          },
        ],
      });

      assert.ok(journal.documentNumber.startsWith('DOC-PAR-'));
      assert.equal(journal.lines[0].debit, journal.lines[1].credit);

      const allJournals = mc.getParallelJournals();
      assert.ok(allJournals.length >= 1);
    });

    test('executes IAS 21 / AS 11 Foreign Exchange revaluation with balanced GL gain/loss voucher', () => {
      const mc = new MultiCurrencyEngine();

      // Revalue open USD items at closing rate 84.00 (from original booking rate)
      const result = mc.executeForexRevaluation('USD', 84.00, '2026-09-30');

      assert.equal(result.currency, 'USD');
      assert.equal(result.closingRate, 84.00);
      assert.equal(result.itemsEvaluated, 2);

      // Receivable: 100k USD @ 82.50 -> 84.00 = +150,000 gain
      assert.equal(result.totalUnrealizedGain, 150000);

      // Payable: 40k USD @ 83.00 -> 84.00 = +40,000 loss
      assert.equal(result.totalUnrealizedLoss, 40000);
      assert.equal(result.netForexImpact, 110000);

      // Verify balanced GL voucher lines
      assert.equal(result.glVoucherLines.length, 4);
      const debitTotal = result.glVoucherLines.reduce((acc, l) => acc + l.debit, 0);
      const creditTotal = result.glVoucherLines.reduce((acc, l) => acc + l.credit, 0);
      assert.equal(debitTotal, creditTotal);
      assert.equal(debitTotal, 190000);
    });

    test('calculates statutory taxes across global jurisdictions (India, US, EU, UAE)', () => {
      const mc = new MultiCurrencyEngine();

      // India Inter-State: 18% IGST
      const inTax = mc.calculateJurisdictionTax('IN', {
        taxableAmount: 100000,
        customerStateOrRegion: '29-Karnataka',
        companyStateOrRegion: '27-Maharashtra',
      });
      assert.equal(inTax.taxRatePercent, 18);
      assert.equal(inTax.taxAmount, 18000);
      assert.equal(inTax.taxBreakdown.IGST, 18000);

      // US: California combined rate 8.25%
      const usTax = mc.calculateJurisdictionTax('US', {
        taxableAmount: 50000,
        customerStateOrRegion: 'CA',
      });
      assert.equal(usTax.taxRatePercent, 8.25);
      assert.equal(usTax.taxAmount, 4125);

      // EU: Intra-community B2B with valid VIES VAT number -> 0% Reverse Charge
      const euTax = mc.calculateJurisdictionTax('EU', {
        taxableAmount: 80000,
        taxRegistrationNumber: 'DE123456789',
      });
      assert.equal(euTax.taxRatePercent, 0);
      assert.equal(euTax.isReverseChargeApplicable, true);

      // UAE: 5% Federal VAT
      const uaeTax = mc.calculateJurisdictionTax('AE', {
        taxableAmount: 20000,
      });
      assert.equal(uaeTax.taxRatePercent, 5);
      assert.equal(uaeTax.taxAmount, 1000);
    });
  });
});

