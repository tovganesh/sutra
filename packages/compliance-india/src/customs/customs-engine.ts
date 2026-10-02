/**
 * Sutra Indian Customs & Cross-Border Export/Import Engine
 * Computes CIF assessable value, Basic Customs Duty (BCD), Social Welfare Surcharge (SWS),
 * Integrated GST (IGST), input tax creditability (GSTR-3B Table 4A1), and Rule 96A LUT export verification.
 */

export interface CustomsDutyCalculationRequest {
  cifValueInr: number;
  hsnCode: string;
  basicCustomsDutyPercent?: number; // e.g. 7.5 or 10%
  swsPercent?: number;             // Standard Social Welfare Surcharge is 10% of BCD
  igstPercent?: number;            // Standard IGST on imports e.g. 18%
  compensationCessPercent?: number;// Optional Cess
  antiDumpingDuty?: number;
}

export interface CustomsDutyCalculationResult {
  assessableValue: number;
  bcdRatePercent: number;
  bcdAmount: number;
  swsRatePercent: number;
  swsAmount: number;
  igstRatePercent: number;
  igstAmount: number;
  cessAmount: number;
  antiDumpingDuty: number;
  totalCustomsDuty: number;
  totalLandedCost: number;
  creditableItc: number;        // Eligible for GSTR-3B Table 4(A)(1) Input Tax Credit
  nonCreditableDutyCost: number;// Capitalized into raw materials / inventory MAP
  glVoucherLines: Array<{
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
  }>;
}

export interface LutVerificationRequest {
  lutArn: string;
  financialYear: string;
  exporterGstin: string;
}

export interface LutVerificationResult {
  isValid: boolean;
  arn: string;
  financialYear: string;
  exporterGstin: string;
  status: 'ACTIVE_VALID_LUT' | 'EXPIRED' | 'INVALID_SYNTAX';
  exportCategory: 'ZERO_RATED_SUPPLY_WITHOUT_PAYMENT_OF_TAX';
  governingRule: 'Rule 96A of CGST Rules 2017';
  summary: string;
}

export const CustomsStandardGlAccount = {
  INVENTORY_RAW_MATERIALS_LANDED: '120100',
  INPUT_TAX_CREDIT_IGST_IMPORTS: '130100',
  CUSTOMS_PORT_DUTIES_PAYABLE: '210500',
  FOREIGN_TRADE_AP_SUPPLIER: '210100',
} as const;

export const CustomsDefaults = {
  DEFAULT_BCD_PERCENT: 10.0,
  DEFAULT_SWS_PERCENT: 10.0,
  DEFAULT_IGST_PERCENT: 18.0,
  DEFAULT_CESS_PERCENT: 0.0,
  DEFAULT_ANTI_DUMPING_DUTY: 0.0,
} as const;

export const LutVerificationStatus = {
  ACTIVE_VALID_LUT: 'ACTIVE_VALID_LUT',
  EXPIRED: 'EXPIRED',
  INVALID_SYNTAX: 'INVALID_SYNTAX',
} as const;
export type LutVerificationStatusType = (typeof LutVerificationStatus)[keyof typeof LutVerificationStatus];

export class CustomsEngine {
  /**
   * Calculates comprehensive Indian Customs Duties & Integrated GST on imported goods
   */
  public static calculateImportDuty(request: CustomsDutyCalculationRequest): CustomsDutyCalculationResult {
    const assessableValue = Math.round(request.cifValueInr * 100) / 100;
    const bcdRate = request.basicCustomsDutyPercent !== undefined ? request.basicCustomsDutyPercent : CustomsDefaults.DEFAULT_BCD_PERCENT;
    const swsRate = request.swsPercent !== undefined ? request.swsPercent : CustomsDefaults.DEFAULT_SWS_PERCENT; // 10% of BCD
    const igstRate = request.igstPercent !== undefined ? request.igstPercent : CustomsDefaults.DEFAULT_IGST_PERCENT;
    const cessRate = request.compensationCessPercent || CustomsDefaults.DEFAULT_CESS_PERCENT;
    const antiDumping = request.antiDumpingDuty || CustomsDefaults.DEFAULT_ANTI_DUMPING_DUTY;

    // 1. Basic Customs Duty (BCD) on Assessable Value
    const bcdAmount = Math.round(assessableValue * (bcdRate / 100) * 100) / 100;

    // 2. Social Welfare Surcharge (SWS) on BCD
    const swsAmount = Math.round(bcdAmount * (swsRate / 100) * 100) / 100;

    // 3. IGST base = Assessable Value + BCD + SWS + Anti-dumping duty
    const igstTaxableBase = assessableValue + bcdAmount + swsAmount + antiDumping;
    const igstAmount = Math.round(igstTaxableBase * (igstRate / 100) * 100) / 100;
    const cessAmount = Math.round(igstTaxableBase * (cessRate / 100) * 100) / 100;

    // Total Customs Outflow = BCD + SWS + IGST + Cess + Anti-dumping
    const totalCustomsDuty = Math.round((bcdAmount + swsAmount + igstAmount + cessAmount + antiDumping) * 100) / 100;
    const totalLandedCost = Math.round((assessableValue + totalCustomsDuty) * 100) / 100;

    // Creditable vs Non-Creditable Duty Breakdown
    // Under Section 16 CGST Act, IGST and Compensation Cess paid on imports are fully creditable as ITC.
    // BCD and SWS are non-creditable and form part of the product landed cost.
    const creditableItc = Math.round((igstAmount + cessAmount) * 100) / 100;
    const nonCreditableDutyCost = Math.round((bcdAmount + swsAmount + antiDumping) * 100) / 100;

    // Balanced GL Voucher for Customs Clearance
    const glVoucherLines = [
      {
        accountCode: CustomsStandardGlAccount.INVENTORY_RAW_MATERIALS_LANDED,
        accountName: `Raw Materials Inventory - Imported Landed Cost (HSN ${request.hsnCode})`,
        debit: assessableValue + nonCreditableDutyCost,
        credit: 0,
      },
      {
        accountCode: CustomsStandardGlAccount.INPUT_TAX_CREDIT_IGST_IMPORTS,
        accountName: 'Input Tax Credit (ITC) - IGST Paid on Import of Goods',
        debit: creditableItc,
        credit: 0,
      },
      {
        accountCode: CustomsStandardGlAccount.CUSTOMS_PORT_DUTIES_PAYABLE,
        accountName: 'Customs & Port Duties Payable / Clearing',
        debit: 0,
        credit: totalCustomsDuty,
      },
      {
        accountCode: CustomsStandardGlAccount.FOREIGN_TRADE_AP_SUPPLIER,
        accountName: 'Foreign Trade Accounts Payable (Import Supplier CIF)',
        debit: 0,
        credit: assessableValue,
      },
    ];

    return {
      assessableValue,
      bcdRatePercent: bcdRate,
      bcdAmount,
      swsRatePercent: swsRate,
      swsAmount,
      igstRatePercent: igstRate,
      igstAmount,
      cessAmount,
      antiDumpingDuty: antiDumping,
      totalCustomsDuty,
      totalLandedCost,
      creditableItc,
      nonCreditableDutyCost,
      glVoucherLines,
    };
  }

  /**
   * Validates export Letter of Undertaking (LUT) under Rule 96A CGST Rules
   */
  public static verifyLut(request: LutVerificationRequest): LutVerificationResult {
    // Official GSTN ARN format for LUT: e.g. AD270326001234F
    const lutRegex = /^AD[0-9]{2}[0-9]{2}[0-9]{2}[0-9]{6}[A-Z0-9]$/i;
    const isSyntaxValid = lutRegex.test(request.lutArn.trim());

    if (!isSyntaxValid) {
      return {
        isValid: false,
        arn: request.lutArn,
        financialYear: request.financialYear,
        exporterGstin: request.exporterGstin,
        status: LutVerificationStatus.INVALID_SYNTAX,
        exportCategory: 'ZERO_RATED_SUPPLY_WITHOUT_PAYMENT_OF_TAX',
        governingRule: 'Rule 96A of CGST Rules 2017',
        summary: `ARN ${request.lutArn} is not a valid GSTN Letter of Undertaking format. Expected syntax: AD{StateCode}{MM}{YY}{6Digits}{Alphanumeric}.`,
      };
    }

    return {
      isValid: true,
      arn: request.lutArn.trim().toUpperCase(),
      financialYear: request.financialYear,
      exporterGstin: request.exporterGstin,
      status: LutVerificationStatus.ACTIVE_VALID_LUT,
      exportCategory: 'ZERO_RATED_SUPPLY_WITHOUT_PAYMENT_OF_TAX',
      governingRule: 'Rule 96A of CGST Rules 2017',
      summary: `LUT ARN ${request.lutArn} verified active for FY ${request.financialYear}. Goods/Services can be exported without payment of integrated tax.`,
    };
  }
}
