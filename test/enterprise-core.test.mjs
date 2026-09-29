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
});

