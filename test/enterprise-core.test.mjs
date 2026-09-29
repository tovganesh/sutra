import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  GeneralLedgerEngine,
  InventoryEngine,
  OrderToCashEngine,
  ProcureToPayEngine,
  SubledgerEngine,
  LocalJwtAuthProvider,
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
});
