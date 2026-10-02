/**
 * Sutra SAP S/4HANA CO-PA Margin & Segment Profitability Engine
 * Multi-tier Contribution Margin waterfall (CM I -> CM II -> CM III -> Operating Profit)
 * & Multi-dimensional Segment Breakdown (Product Line, Region, Customer Tier).
 */

export type SegmentCategory = 'PRODUCT_LINE' | 'SALES_REGION' | 'CUSTOMER_TIER';

export interface ProfitabilitySegmentInput {
  segmentId: string;
  segmentName: string;
  category: SegmentCategory;
  grossRevenue: number;
  discountsAndRebates: number; // sales deductions
  directMaterialCost: number; // COGS raw materials
  variableProductionCost: number; // direct labor, machine utilities
  freightAndLogisticsCost: number; // shipping & distribution
  directSalesAndMarketingCost: number; // segment-specific ad spend & commissions
  allocatedFixedOverheads: number; // plant depreciation, shared admin/G&A
}

export interface ContributionMarginWaterfall {
  segmentId: string;
  segmentName: string;
  category: SegmentCategory;
  grossRevenue: number;
  discountsAndRebates: number;
  netRevenue: number; // Gross - deductions
  directMaterialCost: number;
  contributionMarginI: number; // Net Revenue - Direct Materials
  contributionMarginIRatio: number; // CM I / Net Revenue * 100
  variableProductionCost: number;
  freightAndLogisticsCost: number;
  variableProductionAndFreight: number;
  contributionMarginII: number; // CM I - Variable Production & Freight
  contributionMarginIIRatio: number; // CM II / Net Revenue * 100
  directSalesAndMarketingCost: number;
  contributionMarginIII: number; // CM II - Direct Sales & Marketing
  contributionMarginIIIRatio: number; // CM III / Net Revenue * 100
  allocatedFixedOverheads: number;
  operatingProfit: number; // CM III - Allocated Fixed Overheads
  operatingMarginRatio: number; // Operating Profit / Net Revenue * 100
  breakevenRevenue: number; // (Fixed Overheads + S&M) / (CM II Ratio / 100)
}

export interface CopaProfitabilitySummary {
  totalGrossRevenue: number;
  totalNetRevenue: number;
  totalDirectMaterials: number;
  totalContributionMarginI: number;
  overallCMIPercent: number;
  totalContributionMarginII: number;
  overallCMIIPercent: number;
  totalContributionMarginIII: number;
  overallCMIIIPercent: number;
  totalOperatingProfit: number;
  overallOperatingMarginPercent: number;
  totalBreakevenRevenue: number;
  topPerformingSegment: string;
  lowestPerformingSegment: string;
}

export interface CopaProfitabilityReport {
  periodStart: string;
  periodEnd: string;
  segments: ContributionMarginWaterfall[];
  summary: CopaProfitabilitySummary;
}

export class ProfitabilityEngine {
  private static round2(val: number): number {
    return Math.round((val + Number.EPSILON) * 100) / 100;
  }

  /**
   * Computes the multi-tier Contribution Margin waterfall for a single segment.
   */
  public static evaluateSegment(input: ProfitabilitySegmentInput): ContributionMarginWaterfall {
    const r = this.round2;

    const netRevenue = r(input.grossRevenue - input.discountsAndRebates);
    const cmI = r(netRevenue - input.directMaterialCost);
    const cmIRatio = netRevenue > 0 ? r((cmI / netRevenue) * 100) : 0;

    const variableProductionAndFreight = r(input.variableProductionCost + input.freightAndLogisticsCost);
    const cmII = r(cmI - variableProductionAndFreight);
    const cmIIRatio = netRevenue > 0 ? r((cmII / netRevenue) * 100) : 0;

    const cmIII = r(cmII - input.directSalesAndMarketingCost);
    const cmIIIRatio = netRevenue > 0 ? r((cmIII / netRevenue) * 100) : 0;

    const operatingProfit = r(cmIII - input.allocatedFixedOverheads);
    const operatingMarginRatio = netRevenue > 0 ? r((operatingProfit / netRevenue) * 100) : 0;

    // Breakeven revenue: Fixed burden / CM II ratio
    const fixedBurden = input.allocatedFixedOverheads + input.directSalesAndMarketingCost;
    const breakevenRevenue = cmIIRatio > 0 ? r(fixedBurden / (cmIIRatio / 100)) : 0;

    return {
      segmentId: input.segmentId,
      segmentName: input.segmentName,
      category: input.category,
      grossRevenue: input.grossRevenue,
      discountsAndRebates: input.discountsAndRebates,
      netRevenue,
      directMaterialCost: input.directMaterialCost,
      contributionMarginI: cmI,
      contributionMarginIRatio: cmIRatio,
      variableProductionCost: input.variableProductionCost,
      freightAndLogisticsCost: input.freightAndLogisticsCost,
      variableProductionAndFreight,
      contributionMarginII: cmII,
      contributionMarginIIRatio: cmIIRatio,
      directSalesAndMarketingCost: input.directSalesAndMarketingCost,
      contributionMarginIII: cmIII,
      contributionMarginIIIRatio: cmIIIRatio,
      allocatedFixedOverheads: input.allocatedFixedOverheads,
      operatingProfit,
      operatingMarginRatio,
      breakevenRevenue,
    };
  }

  /**
   * Generates a complete CO-PA Profitability Report across multiple segments with aggregated summary KPIs.
   */
  public static generateCopaReport(
    inputs: ProfitabilitySegmentInput[],
    periodStart: string,
    periodEnd: string
  ): CopaProfitabilityReport {
    const r = this.round2;
    const segments = inputs.map((inp) => this.evaluateSegment(inp));

    const totalGrossRevenue = r(segments.reduce((acc, s) => acc + s.grossRevenue, 0));
    const totalNetRevenue = r(segments.reduce((acc, s) => acc + s.netRevenue, 0));
    const totalDirectMaterials = r(segments.reduce((acc, s) => acc + s.directMaterialCost, 0));
    const totalContributionMarginI = r(segments.reduce((acc, s) => acc + s.contributionMarginI, 0));
    const overallCMIPercent = totalNetRevenue > 0 ? r((totalContributionMarginI / totalNetRevenue) * 100) : 0;

    const totalContributionMarginII = r(segments.reduce((acc, s) => acc + s.contributionMarginII, 0));
    const overallCMIIPercent = totalNetRevenue > 0 ? r((totalContributionMarginII / totalNetRevenue) * 100) : 0;

    const totalContributionMarginIII = r(segments.reduce((acc, s) => acc + s.contributionMarginIII, 0));
    const overallCMIIIPercent = totalNetRevenue > 0 ? r((totalContributionMarginIII / totalNetRevenue) * 100) : 0;

    const totalOperatingProfit = r(segments.reduce((acc, s) => acc + s.operatingProfit, 0));
    const overallOperatingMarginPercent = totalNetRevenue > 0 ? r((totalOperatingProfit / totalNetRevenue) * 100) : 0;

    const totalBreakevenRevenue = r(segments.reduce((acc, s) => acc + s.breakevenRevenue, 0));

    let topSegment = '';
    let lowSegment = '';
    if (segments.length > 0) {
      const sortedByProfit = [...segments].sort((a, b) => b.operatingProfit - a.operatingProfit);
      topSegment = sortedByProfit[0].segmentName;
      lowSegment = sortedByProfit[sortedByProfit.length - 1].segmentName;
    }

    return {
      periodStart,
      periodEnd,
      segments,
      summary: {
        totalGrossRevenue,
        totalNetRevenue,
        totalDirectMaterials,
        totalContributionMarginI,
        overallCMIPercent,
        totalContributionMarginII,
        overallCMIIPercent,
        totalContributionMarginIII,
        overallCMIIIPercent,
        totalOperatingProfit,
        overallOperatingMarginPercent,
        totalBreakevenRevenue,
        topPerformingSegment: topSegment,
        lowestPerformingSegment: lowSegment,
      },
    };
  }

  /**
   * Filters report segments by specific category (e.g. PRODUCT_LINE, SALES_REGION, CUSTOMER_TIER).
   */
  public static filterByCategory(
    report: CopaProfitabilityReport,
    category: SegmentCategory
  ): ContributionMarginWaterfall[] {
    return report.segments.filter((s) => s.category === category);
  }
}
