import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  ConsolidationStatus,
  IntercompanyEliminationType,
  ConsolidationMethod,
} from '../packages/core/dist/index.js';
import {
  ConsolidationEngine,
} from '../packages/analytics/dist/index.js';

describe('Sutra Group Financial Consolidation & Intercompany Elimination Suite (IFRS 10 / Ind AS 110)', () => {
  const sampleGroupEntities = [
    {
      entity: {
        entityId: 'ENTITY-HOLDING-01',
        legalName: 'Sutra Global Enterprises Ltd (Parent Holding)',
        country: 'India',
        functionalCurrency: 'INR',
        ownershipPercentage: 100,
        consolidationMethod: ConsolidationMethod.FULL_CONSOLIDATION,
        isParent: true,
      },
      revenue: 55000000,
      costOfGoodsSold: 22000000,
      grossProfit: 33000000,
      operatingExpenses: 12000000,
      operatingProfit: 21000000,
      intercompanyRevenue: 15000000,
      intercompanyCogs: 6000000,
      cashAndEquivalents: 18000000,
      accountsReceivable: 14000000,
      intercompanyReceivables: 6500000,
      inventory: 12000000,
      intercompanyInventoryHeld: 0,
      fixedAssets: 25000000,
      totalAssets: 75500000,
      accountsPayable: 9500000,
      intercompanyPayables: 0,
      otherLiabilities: 6000000,
      totalLiabilities: 15500000,
      shareCapital: 30000000,
      retainedEarnings: 30000000,
      totalEquity: 60000000,
    },
    {
      entity: {
        entityId: 'ENTITY-SUB-EU-02',
        legalName: 'Sutra Advanced Engineering GmbH (Europe)',
        country: 'Germany',
        functionalCurrency: 'EUR',
        ownershipPercentage: 100,
        consolidationMethod: ConsolidationMethod.FULL_CONSOLIDATION,
        isParent: false,
      },
      revenue: 28000000,
      costOfGoodsSold: 13000000,
      grossProfit: 15000000,
      operatingExpenses: 6500000,
      operatingProfit: 8500000,
      intercompanyRevenue: 0,
      intercompanyCogs: 9000000,
      cashAndEquivalents: 8500000,
      accountsReceivable: 7200000,
      intercompanyReceivables: 0,
      inventory: 9000000,
      intercompanyInventoryHeld: 3000000,
      fixedAssets: 12000000,
      totalAssets: 36700000,
      accountsPayable: 4200000,
      intercompanyPayables: 4000000,
      otherLiabilities: 3500000,
      totalLiabilities: 11700000,
      shareCapital: 10000000,
      retainedEarnings: 15000000,
      totalEquity: 25000000,
    },
    {
      entity: {
        entityId: 'ENTITY-SUB-US-03',
        legalName: 'Sutra Robotics Inc (Americas - 80% Majority)',
        country: 'United States',
        functionalCurrency: 'USD',
        ownershipPercentage: 80,
        consolidationMethod: ConsolidationMethod.FULL_CONSOLIDATION,
        isParent: false,
      },
      revenue: 22000000,
      costOfGoodsSold: 10000000,
      grossProfit: 12000000,
      operatingExpenses: 5200000,
      operatingProfit: 6800000,
      intercompanyRevenue: 0,
      intercompanyCogs: 6000000,
      cashAndEquivalents: 6000000,
      accountsReceivable: 5800000,
      intercompanyReceivables: 0,
      inventory: 7500000,
      intercompanyInventoryHeld: 2000000,
      fixedAssets: 9500000,
      totalAssets: 28800000,
      accountsPayable: 3500000,
      intercompanyPayables: 2500000,
      otherLiabilities: 2800000,
      totalLiabilities: 8800000,
      shareCapital: 8000000,
      retainedEarnings: 12000000,
      totalEquity: 20000000,
    },
  ];

  describe('Intercompany Balance Reconciliation', () => {
    test('reconciles bilateral balances and detects variances', () => {
      const reconciliations = ConsolidationEngine.reconcileIntercompanyBalances(sampleGroupEntities);

      assert.equal(reconciliations.length, 2);
      assert.equal(reconciliations[0].entityAId, 'ENTITY-HOLDING-01');
      assert.equal(reconciliations[0].entityBId, 'ENTITY-SUB-EU-02');
      assert.equal(reconciliations[0].payableRecordedByB, 4000000);
      assert.equal(reconciliations[1].entityAId, 'ENTITY-HOLDING-01');
      assert.equal(reconciliations[1].entityBId, 'ENTITY-SUB-US-03');
      assert.equal(reconciliations[1].payableRecordedByB, 2500000);
    });
  });

  describe('Automated Elimination Journal Entry Generation', () => {
    test('generates trading revenue and COGS elimination voucher under IFRS 10.B86(c)', () => {
      const eliminations = ConsolidationEngine.generateEliminationEntries(sampleGroupEntities, 0.20);
      const tradingElim = eliminations.find((e) => e.type === IntercompanyEliminationType.TRADING_REVENUE_COGS);

      assert.ok(tradingElim);
      assert.equal(tradingElim.amount, 15000000);
      assert.equal(tradingElim.accountDebited, '410000 Intercompany Sales Revenue');
      assert.equal(tradingElim.accountCredited, '510000 Intercompany Cost of Goods Sold');
    });

    test('generates balance sheet IC debts elimination voucher under IFRS 10.B86(b)', () => {
      const eliminations = ConsolidationEngine.generateEliminationEntries(sampleGroupEntities, 0.20);
      const balanceElim = eliminations.find((e) => e.type === IntercompanyEliminationType.BALANCES_RECEIVABLE_PAYABLE);

      assert.ok(balanceElim);
      // Min of receivables (6.5M) and payables (4.0M + 2.5M = 6.5M) -> 6,500,000
      assert.equal(balanceElim.amount, 6500000);
      assert.equal(balanceElim.accountDebited, '210200 Intercompany Accounts Payable');
      assert.equal(balanceElim.accountCredited, '120200 Intercompany Accounts Receivable');
    });

    test('generates unrealized inventory profit mark-up elimination voucher', () => {
      const eliminations = ConsolidationEngine.generateEliminationEntries(sampleGroupEntities, 0.20);
      const invElim = eliminations.find((e) => e.type === IntercompanyEliminationType.UNREALIZED_INVENTORY_PROFIT);

      assert.ok(invElim);
      // Total held inventory = 3,000,000 + 2,000,000 = 5,000,000 * 20% = 1,000,000
      assert.equal(invElim.amount, 1000000);
      assert.ok(invElim.accountDebited.includes('Cost of Goods Sold'));
      assert.ok(invElim.accountCredited.includes('Inventory Valuation Reserve'));
    });

    test('generates Non-Controlling Interest (NCI) allocation voucher for minority stakes', () => {
      const eliminations = ConsolidationEngine.generateEliminationEntries(sampleGroupEntities, 0.20);
      const nciElim = eliminations.find((e) => e.type === IntercompanyEliminationType.NON_CONTROLLING_INTEREST);

      assert.ok(nciElim);
      // Sub US total equity 20,000,000 * 20% = 4,000,000
      assert.equal(nciElim.amount, 4000000);
      assert.equal(nciElim.accountCredited, '330100 Non-Controlling Interest (Equity)');
    });
  });

  describe('Full Consolidation Pipeline & Statement Generation', () => {
    test('produces consolidated financial statements with perfect balance sheet equality', () => {
      const consolidated = ConsolidationEngine.generateConsolidatedStatements({
        period: 'FY2025-Q4',
        groupCurrency: 'INR',
        entities: sampleGroupEntities,
        inventoryMarkupPercent: 0.20,
      });

      // Status
      assert.equal(consolidated.status, ConsolidationStatus.RECONCILED);
      assert.equal(consolidated.period, 'FY2025-Q4');
      assert.equal(consolidated.groupCurrency, 'INR');

      // KPIs
      assert.equal(consolidated.kpis.eliminatedTradingVolume, 15000000);
      assert.equal(consolidated.kpis.eliminatedUnrealizedProfit, 1000000);
      assert.equal(consolidated.kpis.eliminatedBalanceSheetDebt, 13000000);
      assert.equal(consolidated.kpis.groupRevenue, 90000000);
      assert.equal(consolidated.kpis.subsidiariesCount, 2);

      // Income Statement
      // Raw: 105M - 15M IC = 90M
      assert.equal(consolidated.incomeStatement.totalRevenue, 90000000);
      // COGS: 45M - 15M + 1M (unrealized profit adjustment) = 31M
      assert.equal(consolidated.incomeStatement.costOfGoodsSold, 31000000);
      // Gross Profit: 90M - 31M = 59M
      assert.equal(consolidated.incomeStatement.grossProfit, 59000000);
      assert.equal(consolidated.incomeStatement.operatingExpenses, 23700000);
      // Operating Profit: 59M - 23.7M = 35.3M
      assert.equal(consolidated.incomeStatement.operatingProfit, 35300000);

      // NCI Profit: Sub US (80% owned) operating profit 6,800,000 * 20% = 1,360,000
      assert.equal(consolidated.incomeStatement.profitAttributableToNci, 1360000);
      // Parent Profit: 35,300,000 - 1,360,000 = 33,940,000
      assert.equal(consolidated.incomeStatement.profitAttributableToParent, 33940000);

      // Balance Sheet
      // Assets: Cash (32.5M) + AR (27M) + Inventory (28.5M - 1M = 27.5M) + Fixed Assets (46.5M) = 133.5M
      assert.equal(consolidated.balanceSheet.cashAndEquivalents, 32500000);
      assert.equal(consolidated.balanceSheet.accountsReceivable, 27000000);
      assert.equal(consolidated.balanceSheet.inventory, 27500000);
      assert.equal(consolidated.balanceSheet.fixedAssets, 46500000);
      assert.equal(consolidated.balanceSheet.totalAssets, 133500000);

      // Liabilities & Equity
      // Liabilities: AP (17.2M) + Other (12.3M) = 29.5M
      assert.equal(consolidated.balanceSheet.totalLiabilities, 29500000);
      // NCI Equity: 20M * 20% = 4M
      assert.equal(consolidated.balanceSheet.nonControllingInterest, 4000000);
      // Parent Equity: 133.5M - 29.5M - 4M = 100M
      assert.equal(consolidated.balanceSheet.equityAttributableToParent, 100000000);
      // Total Equity: 104M
      assert.equal(consolidated.balanceSheet.totalEquity, 104000000);

      // Audit Balance Equality Verification
      assert.equal(consolidated.balanceSheet.isBalanced, true);
      assert.equal(consolidated.balanceSheet.reconciliationDifference, 0);
      assert.equal(
        consolidated.balanceSheet.totalAssets,
        consolidated.balanceSheet.totalLiabilities + consolidated.balanceSheet.totalEquity
      );

      // Worksheet Rows Audit
      assert.ok(consolidated.worksheet.length >= 10);
      const revRow = consolidated.worksheet.find((w) => w.accountCode === '410000');
      assert.ok(revRow);
      assert.equal(revRow.aggregatedTotal, 105000000);
      assert.equal(revRow.eliminationDebit, 15000000);
      assert.equal(revRow.consolidatedTotal, 90000000);

      const invRow = consolidated.worksheet.find((w) => w.accountCode === '130100');
      assert.ok(invRow);
      assert.equal(invRow.aggregatedTotal, 28500000);
      assert.equal(invRow.eliminationCredit, 1000000);
      assert.equal(invRow.consolidatedTotal, 27500000);
    });
  });
});
