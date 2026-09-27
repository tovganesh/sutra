/**
 * Indian TDS (Tax Deducted at Source) Computation Engine
 * Complies with the Income Tax Act, 1961.
 */

export interface TDSCategory {
  section: string;
  description: string;
  individualHufRate: number; // in percent
  companyFirmRate: number;    // in percent
  thresholdLimit: number;    // Single bill or FY threshold in INR
}

export const TDS_SECTIONS: Record<string, TDSCategory> = {
  '194C': {
    section: '194C',
    description: 'Payments to Contractors and Sub-contractors',
    individualHufRate: 1.0,
    companyFirmRate: 2.0,
    thresholdLimit: 30000, // Single payment threshold (or 100,000 aggregate)
  },
  '194J_TECH': {
    section: '194J(a)',
    description: 'Fees for Technical Services (FTS)',
    individualHufRate: 2.0,
    companyFirmRate: 2.0,
    thresholdLimit: 30000,
  },
  '194J_PROF': {
    section: '194J(b)',
    description: 'Fees for Professional Services & Royalty',
    individualHufRate: 10.0,
    companyFirmRate: 10.0,
    thresholdLimit: 30000,
  },
  '194Q': {
    section: '194Q',
    description: 'TDS on Purchase of Goods exceeding Rs. 50 Lakhs',
    individualHufRate: 0.1,
    companyFirmRate: 0.1,
    thresholdLimit: 5000000, // 50 Lakhs
  },
};

export interface TDSCalculationInput {
  sectionKey: keyof typeof TDS_SECTIONS;
  grossAmount: number;
  isCompanyOrFirm: boolean;
  hasValidPan: boolean;
  cumulativeFYAmount?: number;
}

export interface TDSCalculationResult {
  applicable: boolean;
  section: string;
  appliedRate: number;
  tdsAmount: number;
  netPayableAmount: number;
  reason?: string;
}

export class TDSEngine {
  /**
   * Evaluates TDS liability according to section rules and PAN status.
   */
  public static calculate(input: TDSCalculationInput): TDSCalculationResult {
    const sectionInfo = TDS_SECTIONS[input.sectionKey];
    if (!sectionInfo) {
      throw new Error(`Unsupported TDS section key: ${input.sectionKey}`);
    }

    const totalFY = (input.cumulativeFYAmount || 0) + input.grossAmount;
    if (totalFY < sectionInfo.thresholdLimit) {
      return {
        applicable: false,
        section: sectionInfo.section,
        appliedRate: 0,
        tdsAmount: 0,
        netPayableAmount: input.grossAmount,
        reason: `Cumulative amount ₹${totalFY} is under threshold ₹${sectionInfo.thresholdLimit}`,
      };
    }

    // Section 206AA: Higher rate (20%) if valid PAN is not furnished
    if (!input.hasValidPan) {
      const penaltyRate = 20.0;
      const tds = (input.grossAmount * penaltyRate) / 100;
      return {
        applicable: true,
        section: sectionInfo.section,
        appliedRate: penaltyRate,
        tdsAmount: tds,
        netPayableAmount: input.grossAmount - tds,
        reason: 'Higher TDS rate of 20% applied under Section 206AA due to invalid/missing PAN',
      };
    }

    const rate = input.isCompanyOrFirm
      ? sectionInfo.companyFirmRate
      : sectionInfo.individualHufRate;

    const tdsAmount = Math.round(((input.grossAmount * rate) / 100) * 100) / 100;

    return {
      applicable: true,
      section: sectionInfo.section,
      appliedRate: rate,
      tdsAmount,
      netPayableAmount: input.grossAmount - tdsAmount,
    };
  }
}
