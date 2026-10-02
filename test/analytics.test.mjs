import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  CashFlowEngine,
  ProfitabilityEngine,
  DuPontEngine,
} from '../packages/analytics/dist/index.js';

describe('Sutra Corporate Financial Analytics & Management Accounting Suite', () => {
  describe('IAS 7 / AS 3 Cash Flow Statement Engine', () => {
    test('calculates Indirect Method Operating, Investing, and Financing Cash Flows with complete audit reconciliation', () => {
      const statement = CashFlowEngine.generateStatement({
        periodStart: '2026-04-01',
        periodEnd: '2027-03-31',
        netIncome: 3500000,
        depreciationAmortization: 800000,
        gainLossOnDisposal: 0,
        financeCosts: 150000,
        workingCapital: {
          beginningAccountsReceivable: 4200000,
          endingAccountsReceivable: 5000000, // +800,000 AR -> Outflow -800,000
          beginningInventory: 2600000,
          endingInventory: 3000000, // +400,000 Inv -> Outflow -400,000
          beginningAccountsPayable: 2100000,
          endingAccountsPayable: 2500000, // +400,000 AP -> Inflow +400,000
          beginningOtherCurrentLiabilities: 800000,
          endingOtherCurrentLiabilities: 1000000, // +200,000 Other Liab -> Inflow +200,000
        },
        incomeTaxesPaid: 950000,
        capitalExpenditure: 1200000,
        proceedsFromSaleOfAssets: 100000,
        proceedsFromShareCapital: 0,
        proceedsFromBorrowings: 500000,
        repaymentOfBorrowings: 200000,
        dividendsPaid: 600000,
        interestPaid: 150000,
        beginningCash: 3500000,
      });

      // Operating Profit Before Working Capital = 3,500,000 + 800,000 (depr) + 150,000 (interest) = 4,450,000
      assert.equal(statement.operatingActivities.operatingProfitBeforeWorkingCapital, 4450000);

      // Working Capital Change = -800,000 (AR) - 400,000 (Inv) + 400,000 (AP) + 200,000 (Other) = -600,000
      assert.equal(statement.operatingActivities.workingCapitalChanges.totalWorkingCapitalChange, -600000);

      // Cash Generated From Operations = 4,450,000 - 600,000 = 3,850,000
      assert.equal(statement.operatingActivities.cashGeneratedFromOperations, 3850000);

      // Net Operating Cash Flow (CFO) = 3,850,000 - 950,000 (tax) = 2,900,000
      assert.equal(statement.operatingActivities.netOperatingCashFlow, 2900000);

      // Net Investing Cash Flow (CFI) = 100,000 (proceeds) - 1,200,000 (capex) = -1,100,000
      assert.equal(statement.investingActivities.netInvestingCashFlow, -1100000);

      // Net Financing Cash Flow (CFF) = 500,000 (borrowings) - 200,000 (repay) - 600,000 (div) - 150,000 (int) = -450,000
      assert.equal(statement.financingActivities.netFinancingCashFlow, -450000);

      // Net Cash Change = 2,900,000 - 1,100,000 - 450,000 = 1,350,000
      assert.equal(statement.summary.netCashChange, 1350000);

      // Ending Cash = 3,500,000 + 1,350,000 = 4,850,000
      assert.equal(statement.summary.endingCash, 4850000);

      // Free Cash Flow to Firm (FCFF) = CFO - Capex = 2,900,000 - 1,200,000 = 1,700,000
      assert.equal(statement.summary.freeCashFlowToFirm, 1700000);

      // Audit Reconciliation
      assert.equal(statement.summary.isReconciled, true);
      assert.equal(statement.summary.beginningCash + statement.summary.netCashChange, statement.summary.endingCash);
    });
  });

  describe('SAP S/4HANA CO-PA Margin & Segment Profitability Engine', () => {
    test('computes multi-tier Contribution Margin waterfall (CM I -> CM II -> CM III -> EBIT) and breakeven point', () => {
      const segmentResult = ProfitabilityEngine.evaluateSegment({
        segmentId: 'SEG-PROD-01',
        segmentName: 'Enterprise ERP & Cloud Core',
        category: 'PRODUCT_LINE',
        grossRevenue: 7500000,
        discountsAndRebates: 300000,
        directMaterialCost: 1400000,
        variableProductionCost: 650000,
        freightAndLogisticsCost: 150000,
        directSalesAndMarketingCost: 850000,
        allocatedFixedOverheads: 1100000,
      });

      // Net Revenue = 7,500,000 - 300,000 = 7,200,000
      assert.equal(segmentResult.netRevenue, 7200000);

      // CM I = 7,200,000 - 1,400,000 = 5,800,000 (80.56%)
      assert.equal(segmentResult.contributionMarginI, 5800000);
      assert.equal(segmentResult.contributionMarginIRatio, 80.56);

      // CM II = 5,800,000 - (650,000 + 150,000) = 5,000,000 (69.44%)
      assert.equal(segmentResult.contributionMarginII, 5000000);
      assert.equal(segmentResult.contributionMarginIIRatio, 69.44);

      // CM III = 5,000,000 - 850,000 = 4,150,000 (57.64%)
      assert.equal(segmentResult.contributionMarginIII, 4150000);
      assert.equal(segmentResult.contributionMarginIIIRatio, 57.64);

      // Operating Profit (CO-PA EBIT) = 4,150,000 - 1,100,000 = 3,050,000 (42.36%)
      assert.equal(segmentResult.operatingProfit, 3050000);
      assert.equal(segmentResult.operatingMarginRatio, 42.36);

      // Breakeven Net Revenue = (1,100,000 + 850,000) / 0.6944 = 2,808,179.72
      assert.ok(segmentResult.breakevenRevenue > 0);
      assert.ok(segmentResult.breakevenRevenue < segmentResult.netRevenue);
    });

    test('generates cross-segment CO-PA summary report and filters by dimension', () => {
      const sampleSegments = [
        {
          segmentId: 'SEG-PROD-01',
          segmentName: 'Enterprise ERP',
          category: 'PRODUCT_LINE',
          grossRevenue: 7500000,
          discountsAndRebates: 300000,
          directMaterialCost: 1400000,
          variableProductionCost: 650000,
          freightAndLogisticsCost: 150000,
          directSalesAndMarketingCost: 850000,
          allocatedFixedOverheads: 1100000,
        },
        {
          segmentId: 'SEG-PROD-02',
          segmentName: 'Logistics Cockpit',
          category: 'PRODUCT_LINE',
          grossRevenue: 3200000,
          discountsAndRebates: 100000,
          directMaterialCost: 950000,
          variableProductionCost: 400000,
          freightAndLogisticsCost: 180000,
          directSalesAndMarketingCost: 420000,
          allocatedFixedOverheads: 550000,
        },
        {
          segmentId: 'SEG-REG-NORTH',
          segmentName: 'North Zone',
          category: 'SALES_REGION',
          grossRevenue: 4200000,
          discountsAndRebates: 150000,
          directMaterialCost: 900000,
          variableProductionCost: 420000,
          freightAndLogisticsCost: 110000,
          directSalesAndMarketingCost: 450000,
          allocatedFixedOverheads: 650000,
        },
      ];

      const report = ProfitabilityEngine.generateCopaReport(sampleSegments, '2026-04-01', '2027-03-31');

      assert.equal(report.segments.length, 3);
      assert.equal(report.summary.topPerformingSegment, 'Enterprise ERP');
      assert.ok(report.summary.totalOperatingProfit > 0);

      const filteredProductLines = ProfitabilityEngine.filterByCategory(report, 'PRODUCT_LINE');
      assert.equal(filteredProductLines.length, 2);
      assert.equal(filteredProductLines[0].category, 'PRODUCT_LINE');
      assert.equal(filteredProductLines[1].category, 'PRODUCT_LINE');
    });
  });

  describe('DuPont Financial Performance Decomposition Engine', () => {
    test('decomposes corporate ROE via 3-step and 5-step DuPont formulas with strict mathematical convergence', () => {
      const dupont = DuPontEngine.analyze({
        revenue: 12000000,
        cogs: 4800000,
        operatingExpenses: 3700000,
        interestExpense: 150000,
        taxes: 950000,
        netIncome: 3500000,
        totalAssets: 16500000,
        totalEquity: 8500000,
      });

      // 3-Step DuPont:
      // Net Profit Margin = 3,500,000 / 12,000,000 = 0.2917 (29.17%)
      assert.equal(dupont.threeStep.netProfitMargin, 0.2917);
      assert.equal(dupont.threeStep.netProfitMarginPercent, 29.17);

      // Asset Turnover = 12,000,000 / 16,500,000 = 0.7273x
      assert.equal(dupont.threeStep.assetTurnover, 0.7273);

      // Financial Leverage (Equity Multiplier) = 16,500,000 / 8,500,000 = 1.9412x
      assert.equal(dupont.threeStep.equityMultiplier, 1.9412);

      // ROE = NPM * Asset Turnover * Equity Multiplier = 0.2917 * 0.7273 * 1.9412 * 100 = 41.18%
      assert.equal(dupont.threeStep.returnOnEquityPercent, 41.18);

      // ROA = NPM * Asset Turnover = 21.22%
      assert.equal(dupont.threeStep.returnOnAssetsPercent, 21.22);


      // 5-Step DuPont:
      // Operating Margin = EBIT / Rev = (12M - 4.8M - 3.7M) / 12M = 3.5M / 12M = 29.17%
      assert.equal(dupont.fiveStep.operatingMarginPercent, 29.17);
      assert.equal(dupont.fiveStep.returnOnEquityPercent, 41.18);

      // Strategic Health Assessment:
      assert.equal(dupont.healthAssessment.profitabilityDriver, 'MARGIN');
      assert.equal(dupont.healthAssessment.leverageRisk, 'LOW');
      assert.equal(dupont.healthAssessment.capitalEfficiencyRating, 'EXCELLENT');
      assert.ok(dupont.healthAssessment.insights.length >= 2);
    });
  });
});
