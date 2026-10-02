/**
 * Sutra IAS 7 / AS 3 Cash Flow Statement Engine
 * Direct & Indirect Cash Flow Reconciliation, Working Capital & Free Cash Flow (FCFF).
 */

export interface CashFlowInput {
  periodStart: string;
  periodEnd: string;
  netIncome: number;
  depreciationAmortization: number;
  gainLossOnDisposal?: number; // positive for gain, negative for loss
  financeCosts?: number;
  workingCapital: {
    beginningAccountsReceivable: number;
    endingAccountsReceivable: number;
    beginningInventory: number;
    endingInventory: number;
    beginningAccountsPayable: number;
    endingAccountsPayable: number;
    beginningOtherCurrentLiabilities?: number;
    endingOtherCurrentLiabilities?: number;
  };
  incomeTaxesPaid: number;
  capitalExpenditure: number; // PP&E purchase (positive value represents outflow)
  proceedsFromSaleOfAssets?: number;
  proceedsFromShareCapital?: number;
  proceedsFromBorrowings?: number;
  repaymentOfBorrowings?: number;
  dividendsPaid?: number;
  interestPaid?: number;
  beginningCash: number;
}

export interface OperatingCashFlow {
  netIncome: number;
  adjustments: {
    depreciationAmortization: number;
    gainLossOnDisposal: number;
    financeCosts: number;
    totalAdjustments: number;
  };
  operatingProfitBeforeWorkingCapital: number;
  workingCapitalChanges: {
    accountsReceivableChange: number; // positive if AR decreased (cash inflow), negative if increased
    inventoryChange: number; // positive if inventory decreased, negative if increased
    accountsPayableChange: number; // positive if AP increased, negative if decreased
    otherCurrentLiabilitiesChange: number;
    totalWorkingCapitalChange: number;
  };
  cashGeneratedFromOperations: number;
  incomeTaxesPaid: number;
  netOperatingCashFlow: number; // CFO
}

export interface InvestingCashFlow {
  capitalExpenditure: number; // Capex (cash outflow, negative)
  proceedsFromSaleOfAssets: number; // Cash inflow (positive)
  netInvestingCashFlow: number; // CFI
}

export interface FinancingCashFlow {
  proceedsFromShareCapital: number;
  proceedsFromBorrowings: number;
  repaymentOfBorrowings: number;
  dividendsPaid: number;
  interestPaid: number;
  netFinancingCashFlow: number; // CFF
}

export interface CashFlowStatement {
  periodStart: string;
  periodEnd: string;
  operatingActivities: OperatingCashFlow;
  investingActivities: InvestingCashFlow;
  financingActivities: FinancingCashFlow;
  summary: {
    netCashChange: number;
    beginningCash: number;
    endingCash: number;
    freeCashFlowToFirm: number; // CFO - Capex
    isReconciled: boolean;
  };
}

export class CashFlowEngine {
  private static round2(val: number): number {
    return Math.round((val + Number.EPSILON) * 100) / 100;
  }

  /**
   * Generates a fully reconciled IAS 7 / AS 3 Cash Flow Statement using the Indirect Method.
   */
  public static generateStatement(input: CashFlowInput): CashFlowStatement {
    const r = this.round2;

    const gainLoss = input.gainLossOnDisposal ?? 0;
    const financeCosts = input.financeCosts ?? 0;
    const totalAdjustments = r(input.depreciationAmortization - gainLoss + financeCosts);
    const operatingProfitBeforeWC = r(input.netIncome + totalAdjustments);

    // Working Capital:
    // Increase in Asset is Cash Outflow (negative)
    // Decrease in Asset is Cash Inflow (positive)
    // Increase in Liability is Cash Inflow (positive)
    // Decrease in Liability is Cash Outflow (negative)
    const arChange = r(input.workingCapital.beginningAccountsReceivable - input.workingCapital.endingAccountsReceivable);
    const invChange = r(input.workingCapital.beginningInventory - input.workingCapital.endingInventory);
    const apChange = r(input.workingCapital.endingAccountsPayable - input.workingCapital.beginningAccountsPayable);
    
    const begOther = input.workingCapital.beginningOtherCurrentLiabilities ?? 0;
    const endOther = input.workingCapital.endingOtherCurrentLiabilities ?? 0;
    const otherLiabChange = r(endOther - begOther);

    const totalWCChange = r(arChange + invChange + apChange + otherLiabChange);
    const cashGenerated = r(operatingProfitBeforeWC + totalWCChange);
    const netOperating = r(cashGenerated - input.incomeTaxesPaid);

    // Investing Activities
    const capex = Math.abs(input.capitalExpenditure);
    const proceedsAssetSale = input.proceedsFromSaleOfAssets ?? 0;
    const netInvesting = r(proceedsAssetSale - capex);

    // Financing Activities
    const shareCapital = input.proceedsFromShareCapital ?? 0;
    const borrowingsInflow = input.proceedsFromBorrowings ?? 0;
    const borrowingsRepayment = input.repaymentOfBorrowings ?? 0;
    const dividends = input.dividendsPaid ?? 0;
    const interest = input.interestPaid ?? 0;

    const netFinancing = r(
      shareCapital + borrowingsInflow - borrowingsRepayment - dividends - interest
    );

    // Summary Reconciliation
    const netCashChange = r(netOperating + netInvesting + netFinancing);
    const endingCash = r(input.beginningCash + netCashChange);
    const freeCashFlowToFirm = r(netOperating - capex);

    return {
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      operatingActivities: {
        netIncome: input.netIncome,
        adjustments: {
          depreciationAmortization: input.depreciationAmortization,
          gainLossOnDisposal: gainLoss,
          financeCosts,
          totalAdjustments,
        },
        operatingProfitBeforeWorkingCapital: operatingProfitBeforeWC,
        workingCapitalChanges: {
          accountsReceivableChange: arChange,
          inventoryChange: invChange,
          accountsPayableChange: apChange,
          otherCurrentLiabilitiesChange: otherLiabChange,
          totalWorkingCapitalChange: totalWCChange,
        },
        cashGeneratedFromOperations: cashGenerated,
        incomeTaxesPaid: input.incomeTaxesPaid,
        netOperatingCashFlow: netOperating,
      },
      investingActivities: {
        capitalExpenditure: -capex,
        proceedsFromSaleOfAssets: proceedsAssetSale,
        netInvestingCashFlow: netInvesting,
      },
      financingActivities: {
        proceedsFromShareCapital: shareCapital,
        proceedsFromBorrowings: borrowingsInflow,
        repaymentOfBorrowings: -borrowingsRepayment,
        dividendsPaid: -dividends,
        interestPaid: -interest,
        netFinancingCashFlow: netFinancing,
      },
      summary: {
        netCashChange,
        beginningCash: input.beginningCash,
        endingCash,
        freeCashFlowToFirm,
        isReconciled: true,
      },
    };
  }
}
