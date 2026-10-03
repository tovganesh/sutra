import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  CreditRating,
  CreditCheckStatus,
  CreditBlockReason,
  DunningLevel,
  CreditDefaults,
  CreditManagementEngine,
} from '../packages/core/dist/index.js';

describe('Sutra Credit Risk Management & Automated Dunning Engine (SAP FSCM-CR & F150 Parity)', () => {
  const engine = new CreditManagementEngine();

  describe('1. Credit Exposure Calculation', () => {
    test('calculates total exposure, available credit, and utilization percentage accurately', () => {
      const exposure = engine.calculateCreditExposure(
        'CUST-001',
        1000000, // 10 Lakhs limit
        250000,  // Open orders
        150000,  // Open deliveries
        200000   // Open unpaid invoices
      );

      assert.equal(exposure.customerId, 'CUST-001');
      assert.equal(exposure.creditLimit, 1000000);
      assert.equal(exposure.openOrdersValue, 250000);
      assert.equal(exposure.openDeliveriesValue, 150000);
      assert.equal(exposure.openInvoicesValue, 200000);
      assert.equal(exposure.totalExposure, 600000);
      assert.equal(exposure.availableCredit, 400000);
      assert.equal(exposure.utilizationPercent, 60);
    });

    test('handles zero credit limit or over-limit exposure without negative available credit', () => {
      const exposure = engine.calculateCreditExposure(
        'CUST-OVER',
        500000,
        300000,
        200000,
        150000
      );

      assert.equal(exposure.totalExposure, 650000);
      assert.equal(exposure.availableCredit, 0); // Math.max(0, limit - exposure)
      assert.equal(exposure.utilizationPercent, 130);
    });
  });

  describe('2. Customer Risk Evaluation & Credit Rating Scoring', () => {
    test('assigns AAA credit rating to pristine customer with low utilization and zero overdue', () => {
      const invoices = [
        {
          invoiceNumber: 'INV-101',
          customerId: 'CUST-PRISTINE',
          customerName: 'Pristine Corp',
          customerEmail: 'ar@pristine.com',
          invoiceDate: '2026-08-01',
          dueDate: '2026-08-31',
          amount: 50000,
          paidAmount: 50000,
          isPaid: true,
        },
      ];

      const profile = engine.evaluateCustomerRisk(
        'CUST-PRISTINE',
        'Pristine Corp',
        5000000,
        100000,
        50000,
        invoices,
        '2026-09-01'
      );

      assert.equal(profile.creditRating, CreditRating.AAA);
      assert.ok(profile.riskScore >= 90);
      assert.equal(profile.isBlocked, false);
      assert.equal(profile.oldestOverdueDays, 0);
      assert.equal(profile.totalOverdueAmount, 0);
      assert.equal(profile.blockReason, undefined);
    });

    test('assigns D rating and blocks customer when overdue exceeds 60 days tolerance', () => {
      const invoices = [
        {
          invoiceNumber: 'INV-OLD-1',
          customerId: 'CUST-DELINQUENT',
          customerName: 'Delinquent Traders',
          customerEmail: 'finance@delinquent.com',
          invoiceDate: '2026-06-01',
          dueDate: '2026-06-30', // 75 days overdue as of 2026-09-13
          amount: 800000,
          paidAmount: 0,
          isPaid: false,
        },
      ];

      const profile = engine.evaluateCustomerRisk(
        'CUST-DELINQUENT',
        'Delinquent Traders',
        2000000,
        100000,
        100000,
        invoices,
        '2026-09-13'
      );

      assert.equal(profile.isBlocked, true);
      assert.equal(profile.blockReason, CreditBlockReason.OVERDUE_INVOICE_EXCEEDED);
      assert.ok(profile.oldestOverdueDays > CreditDefaults.DEFAULT_MAX_OVERDUE_DAYS_ALLOWED);
      assert.equal(profile.totalOverdueAmount, 800000);
    });

    test('blocks customer when existing exposure exceeds credit limit', () => {
      const invoices = [
        {
          invoiceNumber: 'INV-BIG-1',
          customerId: 'CUST-EXCEEDED',
          customerName: 'Over Limit Ltd',
          customerEmail: 'ops@overlimit.com',
          invoiceDate: '2026-09-01',
          dueDate: '2026-09-30',
          amount: 600000,
          paidAmount: 0,
          isPaid: false,
        },
      ];

      const profile = engine.evaluateCustomerRisk(
        'CUST-EXCEEDED',
        'Over Limit Ltd',
        500000, // Limit 5 Lakhs, but open invoices 600k
        0,
        0,
        invoices,
        '2026-09-10'
      );

      assert.equal(profile.isBlocked, true);
      assert.equal(profile.blockReason, CreditBlockReason.EXPOSURE_EXCEEDED);
      assert.ok(profile.exposure.utilizationPercent > 100);
    });
  });

  describe('3. Dynamic Credit Check on Sales Order Entry (SAP FSCM-CR)', () => {
    test('approves order when projected exposure is within conservative limits (<80%)', () => {
      const mockProfile = {
        customerId: 'CUST-GOOD',
        customerName: 'Good Customer',
        creditLimit: 1000000,
        creditRating: CreditRating.AA,
        riskScore: 85,
        paymentHistoryPunctualityPercent: 100,
        averageDsoDays: 32,
        oldestOverdueDays: 0,
        totalOverdueAmount: 0,
        isBlocked: false,
        exposure: {
          customerId: 'CUST-GOOD',
          openOrdersValue: 100000,
          openDeliveriesValue: 50000,
          openInvoicesValue: 150000,
          totalExposure: 300000, // 30%
          creditLimit: 1000000,
          availableCredit: 700000,
          utilizationPercent: 30,
        },
      };

      const result = engine.performCreditCheck('SO-1001', mockProfile, 200000); // 300k + 200k = 500k (50%)
      assert.equal(result.status, CreditCheckStatus.APPROVED);
      assert.equal(result.passed, true);
      assert.equal(result.projectedExposure, 500000);
      assert.equal(result.utilizationPercent, 50);
    });

    test('returns WARNING when projected exposure reaches or exceeds warning threshold (80%)', () => {
      const mockProfile = {
        customerId: 'CUST-WARN',
        customerName: 'Warn Customer',
        creditLimit: 1000000,
        creditRating: CreditRating.A,
        riskScore: 75,
        paymentHistoryPunctualityPercent: 95,
        averageDsoDays: 35,
        oldestOverdueDays: 0,
        totalOverdueAmount: 0,
        isBlocked: false,
        exposure: {
          customerId: 'CUST-WARN',
          openOrdersValue: 400000,
          openDeliveriesValue: 200000,
          openInvoicesValue: 100000,
          totalExposure: 700000,
          creditLimit: 1000000,
          availableCredit: 300000,
          utilizationPercent: 70,
        },
      };

      const result = engine.performCreditCheck('SO-1002', mockProfile, 150000); // 700k + 150k = 850k (85%)
      assert.equal(result.status, CreditCheckStatus.WARNING);
      assert.equal(result.passed, true);
      assert.equal(result.projectedExposure, 850000);
      assert.equal(result.utilizationPercent, 85);
    });

    test('blocks order and places it into Blocked Queue when projected exposure exceeds credit limit', () => {
      const mockProfile = {
        customerId: 'CUST-BLOCK-1',
        customerName: 'Apex Industries',
        creditLimit: 1000000,
        creditRating: CreditRating.BBB,
        riskScore: 65,
        paymentHistoryPunctualityPercent: 88,
        averageDsoDays: 45,
        oldestOverdueDays: 10,
        totalOverdueAmount: 50000,
        isBlocked: false,
        exposure: {
          customerId: 'CUST-BLOCK-1',
          openOrdersValue: 500000,
          openDeliveriesValue: 200000,
          openInvoicesValue: 250000,
          totalExposure: 950000,
          creditLimit: 1000000,
          availableCredit: 50000,
          utilizationPercent: 95,
        },
      };

      const result = engine.performCreditCheck('SO-1003', mockProfile, 200000); // 950k + 200k = 1.15M
      assert.equal(result.status, CreditCheckStatus.BLOCKED);
      assert.equal(result.passed, false);
      assert.equal(result.blockReason, CreditBlockReason.EXPOSURE_EXCEEDED);
      assert.equal(result.projectedExposure, 1150000);
      assert.equal(result.utilizationPercent, 115);

      const blockedOrders = engine.getBlockedOrders();
      const blocked = blockedOrders.find((b) => b.orderNumber === 'SO-1003');
      assert.ok(blocked);
      assert.equal(blocked.status, CreditCheckStatus.BLOCKED);
      assert.equal(blocked.orderAmount, 200000);
    });

    test('blocks order when customer account has overdue invoice exceeding tolerance (> 60 days)', () => {
      const mockProfile = {
        customerId: 'CUST-OVERDUE-BLOCK',
        customerName: 'Late Payers Ltd',
        creditLimit: 2000000,
        creditRating: CreditRating.CCC,
        riskScore: 30,
        paymentHistoryPunctualityPercent: 50,
        averageDsoDays: 75,
        oldestOverdueDays: 65, // > 60 days threshold
        totalOverdueAmount: 120000,
        isBlocked: false,
        exposure: {
          customerId: 'CUST-OVERDUE-BLOCK',
          openOrdersValue: 0,
          openDeliveriesValue: 0,
          openInvoicesValue: 120000,
          totalExposure: 120000,
          creditLimit: 2000000,
          availableCredit: 1880000,
          utilizationPercent: 6,
        },
      };

      const result = engine.performCreditCheck('SO-1004', mockProfile, 50000);
      assert.equal(result.status, CreditCheckStatus.BLOCKED);
      assert.equal(result.passed, false);
      assert.equal(result.blockReason, CreditBlockReason.OVERDUE_INVOICE_EXCEEDED);
    });
  });

  describe('4. Credit Release Cockpit & Audit Trail (SAP VKM1 / VKM3 Parity)', () => {
    test('successfully releases a blocked order with formal justification and audit trail', () => {
      const released = engine.releaseBlockedOrder(
        'SO-1003',
        'Chief Credit Officer (Rajesh Kumar)',
        'Customer wired 20% advance bank guarantee BG/2026/8911.'
      );

      assert.equal(released.orderNumber, 'SO-1003');
      assert.equal(released.status, CreditCheckStatus.RELEASED);
      assert.ok(released.releaseDetails);
      assert.equal(released.releaseDetails.releasedBy, 'Chief Credit Officer (Rajesh Kumar)');
      assert.ok(released.releaseDetails.justification.includes('advance bank guarantee'));
      assert.ok(released.releaseDetails.releasedAt);
    });

    test('successfully rejects a blocked order with reason', () => {
      // First create a blocked order
      const mockProfile = {
        customerId: 'CUST-REJECT',
        customerName: 'High Risk Corp',
        creditLimit: 100000,
        creditRating: CreditRating.D,
        riskScore: 10,
        paymentHistoryPunctualityPercent: 20,
        averageDsoDays: 90,
        oldestOverdueDays: 95,
        totalOverdueAmount: 150000,
        isBlocked: true,
        blockReason: CreditBlockReason.OVERDUE_INVOICE_EXCEEDED,
        exposure: {
          customerId: 'CUST-REJECT',
          openOrdersValue: 0,
          openDeliveriesValue: 0,
          openInvoicesValue: 150000,
          totalExposure: 150000,
          creditLimit: 100000,
          availableCredit: 0,
          utilizationPercent: 150,
        },
      };

      engine.performCreditCheck('SO-1005', mockProfile, 75000);

      const rejected = engine.rejectBlockedOrder(
        'SO-1005',
        'Senior Credit Analyst (Priya Menon)',
        'Insolvency dispute pending in NCLT court.'
      );

      assert.equal(rejected.orderNumber, 'SO-1005');
      assert.equal(rejected.status, CreditCheckStatus.REJECTED);
      assert.ok(rejected.rejectionDetails);
      assert.equal(rejected.rejectionDetails.rejectedBy, 'Senior Credit Analyst (Priya Menon)');
      assert.ok(rejected.rejectionDetails.reason.includes('NCLT court'));
    });

    test('throws error when releasing or rejecting non-existent order', () => {
      assert.throws(() => {
        engine.releaseBlockedOrder('NON-EXISTENT', 'Admin', 'Justification');
      }, /Blocked order 'NON-EXISTENT' not found/);

      assert.throws(() => {
        engine.rejectBlockedOrder('NON-EXISTENT', 'Admin', 'Reason');
      }, /Blocked order 'NON-EXISTENT' not found/);
    });
  });

  describe('5. Automated Dunning Engine (SAP F150 & Section 16 India MSMED Act 2006)', () => {
    test('generates 3-tier dunning notices with statutory compound interest', () => {
      const invoices = [
        // Level 1: 10 days overdue
        {
          invoiceNumber: 'INV-DUN-1',
          customerId: 'CUST-DUN-1',
          customerName: 'Customer One Pvt Ltd',
          customerEmail: 'accounts@one.com',
          invoiceDate: '2026-09-01',
          dueDate: '2026-09-20', // 10 days overdue as of 2026-09-30
          amount: 100000,
          paidAmount: 0,
          isPaid: false,
        },
        // Level 2: 25 days overdue
        {
          invoiceNumber: 'INV-DUN-2',
          customerId: 'CUST-DUN-2',
          customerName: 'Customer Two Logistics',
          customerEmail: 'finance@two.com',
          invoiceDate: '2026-08-15',
          dueDate: '2026-09-05', // 25 days overdue as of 2026-09-30
          amount: 200000,
          paidAmount: 0,
          isPaid: false,
        },
        // Level 3: 45 days overdue (Section 16 MSMED compound interest)
        {
          invoiceNumber: 'INV-DUN-3',
          customerId: 'CUST-DUN-3',
          customerName: 'Customer Three Engineering',
          customerEmail: 'ar@three.com',
          invoiceDate: '2026-07-15',
          dueDate: '2026-08-16', // 45 days overdue as of 2026-09-30
          amount: 500000,
          paidAmount: 0,
          isPaid: false,
        },
      ];

      const notices = engine.executeDunningRun(invoices, {
        runDate: '2026-09-30',
        rbiRepoRatePercent: 6.5,
      });

      assert.equal(notices.length, 3);

      // Verify Level 1 Notice
      const notice1 = notices.find((n) => n.customerId === 'CUST-DUN-1');
      assert.ok(notice1);
      assert.equal(notice1.dunningLevel, DunningLevel.LEVEL_1_REMINDER);
      assert.equal(notice1.dunningFee, 0);
      assert.equal(notice1.totalInterest, 0);
      assert.equal(notice1.totalPrincipalOverdue, 100000);
      assert.equal(notice1.grandTotalDemand, 100000);

      // Verify Level 2 Notice
      const notice2 = notices.find((n) => n.customerId === 'CUST-DUN-2');
      assert.ok(notice2);
      assert.equal(notice2.dunningLevel, DunningLevel.LEVEL_2_DEMAND);
      assert.equal(notice2.dunningFee, CreditDefaults.DUNNING_LEVEL_2_FEE_INR); // 1500
      assert.ok(notice2.totalInterest > 0);
      assert.equal(notice2.interestRatePercent, 12);
      assert.equal(notice2.grandTotalDemand, 200000 + notice2.totalInterest + CreditDefaults.DUNNING_LEVEL_2_FEE_INR);

      // Verify Level 3 Legal Notice (Section 16 MSMED Act 2006)
      const notice3 = notices.find((n) => n.customerId === 'CUST-DUN-3');
      assert.ok(notice3);
      assert.equal(notice3.dunningLevel, DunningLevel.LEVEL_3_LEGAL);
      assert.equal(notice3.dunningFee, CreditDefaults.DUNNING_LEVEL_3_FEE_INR); // 5000
      assert.equal(notice3.interestRatePercent, 19.5); // 3x 6.5% repo rate
      assert.ok(notice3.legalCitation.includes('Section 16 of the Micro, Small and Medium Enterprises Development (MSMED) Act, 2006'));
      assert.ok(notice3.legalCitation.includes('19.5% p.a.'));

      // Check compound interest formula: (1 + 19.5% / 12)^(45/30) - 1
      const monthlyRate = 0.195 / 12;
      const compoundFactor = Math.pow(1 + monthlyRate, 45 / 30) - 1;
      const expectedInterest = Math.round((500000 * compoundFactor + Number.EPSILON) * 100) / 100;
      assert.equal(notice3.totalInterest, expectedInterest);
      assert.equal(notice3.grandTotalDemand, 500000 + expectedInterest + CreditDefaults.DUNNING_LEVEL_3_FEE_INR);
      assert.equal(notice3.remedyDeadlineDate, '2026-10-07');
    });

    test('ignores fully paid invoices or invoices that are not yet overdue', () => {
      const invoices = [
        {
          invoiceNumber: 'INV-PAID',
          customerId: 'CUST-PAID',
          customerName: 'Paid Customer',
          customerEmail: 'paid@corp.com',
          invoiceDate: '2026-08-01',
          dueDate: '2026-08-31',
          amount: 100000,
          paidAmount: 100000,
          isPaid: true,
        },
        {
          invoiceNumber: 'INV-FUTURE',
          customerId: 'CUST-FUTURE',
          customerName: 'Future Customer',
          customerEmail: 'future@corp.com',
          invoiceDate: '2026-09-25',
          dueDate: '2026-10-25',
          amount: 200000,
          paidAmount: 0,
          isPaid: false,
        },
      ];

      const notices = engine.executeDunningRun(invoices, {
        runDate: '2026-09-30',
      });

      assert.equal(notices.length, 0);
    });
  });
});
