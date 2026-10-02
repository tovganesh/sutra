/**
 * Sutra DuPont Financial Performance Decomposition Engine
 * Computes 3-Step and 5-Step DuPont Analysis for ROE / ROA decomposition and capital efficiency.
 */

export interface DuPontInput {
  revenue: number;
  cogs: number;
  operatingExpenses: number;
  interestExpense: number;
  taxes: number;
  netIncome: number;
  totalAssets: number;
  totalEquity: number;
}

export interface ThreeStepDuPont {
  netProfitMargin: number; // Net Income / Revenue (ratio)
  netProfitMarginPercent: number; // %
  assetTurnover: number; // Revenue / Total Assets (multiplier)
  equityMultiplier: number; // Total Assets / Total Equity (Financial Leverage)
  returnOnEquityPercent: number; // ROE %
  returnOnAssetsPercent: number; // ROA %
}

export interface FiveStepDuPont {
  operatingMarginPercent: number; // EBIT / Revenue %
  assetTurnover: number; // Revenue / Total Assets
  interestBurdenRatio: number; // EBT / EBIT
  taxBurdenRatio: number; // Net Income / EBT
  equityMultiplier: number; // Total Assets / Total Equity
  returnOnEquityPercent: number; // ROE % from 5-step product
}

export interface DuPontAnalysisResult {
  threeStep: ThreeStepDuPont;
  fiveStep: FiveStepDuPont;
  metrics: {
    ebit: number; // Operating profit
    ebt: number; // Earnings before tax
    netIncome: number;
    effectiveTaxRate: number; // Taxes / EBT %
    financialLeverageRatio: number;
  };
  healthAssessment: {
    profitabilityDriver: 'MARGIN' | 'EFFICIENCY' | 'LEVERAGE';
    leverageRisk: 'LOW' | 'MODERATE' | 'HIGH';
    capitalEfficiencyRating: 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION';
    insights: string[];
  };
}

export class DuPontEngine {
  private static round4(val: number): number {
    return Math.round((val + Number.EPSILON) * 10000) / 10000;
  }

  private static round2(val: number): number {
    return Math.round((val + Number.EPSILON) * 100) / 100;
  }

  /**
   * Decomposes corporate performance into operational efficiency, asset productivity, and capital structure.
   */
  public static analyze(input: DuPontInput): DuPontAnalysisResult {
    const r2 = this.round2;
    const r4 = this.round4;

    const grossProfit = input.revenue - input.cogs;
    const ebit = r2(grossProfit - input.operatingExpenses);
    const ebt = r2(ebit - input.interestExpense);
    const netIncome = input.netIncome;

    const rev = Math.max(1, input.revenue);
    const assets = Math.max(1, input.totalAssets);
    const equity = Math.max(1, input.totalEquity);

    // 3-Step DuPont
    const netProfitMargin = r4(netIncome / rev);
    const netProfitMarginPercent = r2(netProfitMargin * 100);
    const assetTurnover = r4(rev / assets);
    const equityMultiplier = r4(assets / equity);

    const roe3 = r2(netProfitMargin * assetTurnover * equityMultiplier * 100);
    const roa = r2(netProfitMargin * assetTurnover * 100);

    // 5-Step DuPont
    const operatingMargin = rev > 0 ? ebit / rev : 0;
    const operatingMarginPercent = r2(operatingMargin * 100);
    const interestBurdenRatio = ebit !== 0 ? r4(ebt / ebit) : 1;
    const taxBurdenRatio = ebt !== 0 ? r4(netIncome / ebt) : 1;
    const roe5 = r2(
      operatingMargin * assetTurnover * interestBurdenRatio * taxBurdenRatio * equityMultiplier * 100
    );

    const effectiveTaxRate = ebt > 0 ? r2((input.taxes / ebt) * 100) : 0;

    // Health Evaluation & Driver Analysis
    let profitabilityDriver: 'MARGIN' | 'EFFICIENCY' | 'LEVERAGE' = 'MARGIN';
    if (assetTurnover >= 1.5 && netProfitMarginPercent < 12) {
      profitabilityDriver = 'EFFICIENCY';
    } else if (equityMultiplier >= 2.5 && netProfitMarginPercent < 15) {
      profitabilityDriver = 'LEVERAGE';
    } else {
      profitabilityDriver = 'MARGIN';
    }

    let leverageRisk: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW';
    if (equityMultiplier >= 3.0) {
      leverageRisk = 'HIGH';
    } else if (equityMultiplier >= 2.0) {
      leverageRisk = 'MODERATE';
    } else {
      leverageRisk = 'LOW';
    }

    let capitalEfficiencyRating: 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION' = 'GOOD';
    if (roe3 >= 20) {
      capitalEfficiencyRating = 'EXCELLENT';
    } else if (roe3 >= 10) {
      capitalEfficiencyRating = 'GOOD';
    } else {
      capitalEfficiencyRating = 'NEEDS_ATTENTION';
    }

    const insights: string[] = [];
    if (profitabilityDriver === 'MARGIN') {
      insights.push(`Strong operating margin of ${netProfitMarginPercent}% is the primary engine of ROE generation.`);
    } else if (profitabilityDriver === 'EFFICIENCY') {
      insights.push(`High asset velocity (${assetTurnover}x turnover) compensates for moderate unit margins.`);
    } else {
      insights.push(`Shareholder return is substantially boosted by financial leverage (${equityMultiplier}x equity multiplier).`);
    }

    if (leverageRisk === 'HIGH') {
      insights.push(`High equity multiplier (${equityMultiplier}x) introduces solvency and debt sensitivity.`);
    } else {
      insights.push(`Conservative leverage structure maintains resilient balance sheet cushion.`);
    }

    return {
      threeStep: {
        netProfitMargin,
        netProfitMarginPercent,
        assetTurnover,
        equityMultiplier,
        returnOnEquityPercent: roe3,
        returnOnAssetsPercent: roa,
      },
      fiveStep: {
        operatingMarginPercent,
        assetTurnover,
        interestBurdenRatio,
        taxBurdenRatio,
        equityMultiplier,
        returnOnEquityPercent: roe5,
      },
      metrics: {
        ebit,
        ebt,
        netIncome,
        effectiveTaxRate,
        financialLeverageRatio: equityMultiplier,
      },
      healthAssessment: {
        profitabilityDriver,
        leverageRisk,
        capitalEfficiencyRating,
        insights,
      },
    };
  }
}
