/**
 * Sutra Executive & Financial KPI Engine
 */

export interface ExecutiveKPIs {
  daysSalesOutstanding: number; // In days
  workingCapital: number;        // Current Assets - Current Liabilities
  currentRatio: number;          // Current Assets / Current Liabilities
  quickRatio: number;            // (Current Assets - Inventory) / Current Liabilities
  grossMarginPercentage: number; // (Gross Profit / Revenue) * 100
  netMarginPercentage: number;   // (Net Profit / Revenue) * 100
}

export class KPIEvaluator {
  public static evaluate(metrics: {
    accountsReceivable: number;
    annualCreditSales: number;
    daysInPeriod: number;
    currentAssets: number;
    currentLiabilities: number;
    inventoryValue: number;
    grossProfit: number;
    netProfit: number;
    totalRevenue: number;
  }): ExecutiveKPIs {
    const round2 = (val: number) => Math.round((val + Number.EPSILON) * 100) / 100;

    // Days Sales Outstanding (DSO)
    const dso = metrics.annualCreditSales > 0
      ? round2((metrics.accountsReceivable / metrics.annualCreditSales) * metrics.daysInPeriod)
      : 0;

    // Working Capital
    const workingCapital = round2(metrics.currentAssets - metrics.currentLiabilities);

    // Current Ratio
    const currentRatio = metrics.currentLiabilities > 0
      ? round2(metrics.currentAssets / metrics.currentLiabilities)
      : 0;

    // Quick Ratio (Acid-Test)
    const quickRatio = metrics.currentLiabilities > 0
      ? round2((metrics.currentAssets - metrics.inventoryValue) / metrics.currentLiabilities)
      : 0;

    // Profit Margins
    const grossMargin = metrics.totalRevenue > 0
      ? round2((metrics.grossProfit / metrics.totalRevenue) * 100)
      : 0;

    const netMargin = metrics.totalRevenue > 0
      ? round2((metrics.netProfit / metrics.totalRevenue) * 100)
      : 0;

    return {
      daysSalesOutstanding: dso,
      workingCapital,
      currentRatio,
      quickRatio,
      grossMarginPercentage: grossMargin,
      netMarginPercentage: netMargin,
    };
  }
}
