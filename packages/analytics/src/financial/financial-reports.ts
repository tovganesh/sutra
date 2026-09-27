/**
 * Sutra Financial Reporting & Statement Engine
 * Computes Trial Balance, Profit & Loss (Income Statement), Balance Sheet, and GSTR-1 Summaries.
 */

export interface AccountBalance {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  totalDebit: number;
  totalCredit: number;
  netBalance: number;
}

export interface ProfitAndLossReport {
  periodStart: string;
  periodEnd: string;
  revenue: {
    accounts: AccountBalance[];
    totalRevenue: number;
  };
  cogs: {
    accounts: AccountBalance[];
    totalCogs: number;
  };
  grossProfit: number;
  operatingExpenses: {
    accounts: AccountBalance[];
    totalExpenses: number;
  };
  netOperatingIncome: number;
}

export interface BalanceSheetReport {
  asOfDate: string;
  assets: {
    accounts: AccountBalance[];
    totalAssets: number;
  };
  liabilities: {
    accounts: AccountBalance[];
    totalLiabilities: number;
  };
  equity: {
    accounts: AccountBalance[];
    totalEquity: number;
  };
  isBalanced: boolean; // Assets === Liabilities + Equity
}

export class FinancialReportGenerator {
  /**
   * Generates a standard P&L report from raw account balance aggregations.
   */
  public static generateProfitAndLoss(
    balances: AccountBalance[],
    periodStart: string,
    periodEnd: string
  ): ProfitAndLossReport {
    const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

    const revenueAccounts = balances.filter((b) => b.accountType === 'REVENUE');
    const totalRevenue = round2(
      revenueAccounts.reduce((sum, a) => sum + (a.totalCredit - a.totalDebit), 0)
    );

    const cogsAccounts = balances.filter(
      (b) => b.accountType === 'EXPENSE' && b.accountCode.startsWith('50')
    );
    const totalCogs = round2(
      cogsAccounts.reduce((sum, a) => sum + (a.totalDebit - a.totalCredit), 0)
    );

    const grossProfit = round2(totalRevenue - totalCogs);

    const opexAccounts = balances.filter(
      (b) => b.accountType === 'EXPENSE' && !b.accountCode.startsWith('50')
    );
    const totalExpenses = round2(
      opexAccounts.reduce((sum, a) => sum + (a.totalDebit - a.totalCredit), 0)
    );

    const netOperatingIncome = round2(grossProfit - totalExpenses);

    return {
      periodStart,
      periodEnd,
      revenue: { accounts: revenueAccounts, totalRevenue },
      cogs: { accounts: cogsAccounts, totalCogs },
      grossProfit,
      operatingExpenses: { accounts: opexAccounts, totalExpenses },
      netOperatingIncome,
    };
  }

  /**
   * Generates a Balance Sheet statement.
   */
  public static generateBalanceSheet(
    balances: AccountBalance[],
    asOfDate: string,
    retainedEarningsAdjustment = 0
  ): BalanceSheetReport {
    const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

    const assets = balances.filter((b) => b.accountType === 'ASSET');
    const totalAssets = round2(
      assets.reduce((sum, a) => sum + (a.totalDebit - a.totalCredit), 0)
    );

    const liabilities = balances.filter((b) => b.accountType === 'LIABILITY');
    const totalLiabilities = round2(
      liabilities.reduce((sum, a) => sum + (a.totalCredit - a.totalDebit), 0)
    );

    const equity = balances.filter((b) => b.accountType === 'EQUITY');
    const baseEquity = equity.reduce((sum, a) => sum + (a.totalCredit - a.totalDebit), 0);
    const totalEquity = round2(baseEquity + retainedEarningsAdjustment);

    const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;

    return {
      asOfDate,
      assets: { accounts: assets, totalAssets },
      liabilities: { accounts: liabilities, totalLiabilities },
      equity: { accounts: equity, totalEquity },
      isBalanced,
    };
  }
}
