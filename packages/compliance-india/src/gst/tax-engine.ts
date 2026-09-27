/**
 * Sutra India GST Tax Computation Engine
 * Determines Intra-state vs Inter-state transactions and breaks down CGST, SGST, IGST.
 */

export interface TaxCalculationInput {
  supplierGstin: string;
  recipientGstin?: string;
  placeOfSupplyStateCode: string; // 2-digit code e.g. '27' for MH
  hsnSacCode: string;
  taxableAmount: number;
  customTaxRate?: number; // In percent, e.g. 18 for 18%
}

export interface TaxBreakdown {
  isInterState: boolean;
  taxRate: number;
  taxableAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
  totalInvoiceAmount: number;
}

// Common Standard HSN/SAC Rates in India
export const STANDARD_HSN_RATES: Record<string, number> = {
  '998313': 18, // IT Software & SaaS Services
  '998314': 18, // IT consulting & support
  '8471': 18,   // Automatic data processing machines (Laptops/Computers)
  '8517': 18,   // Telephones / Smartphones
  '9965': 5,    // Goods transport services (GTA)
  '4901': 0,    // Books & printed materials (Exempt)
};

export class IndianTaxEngine {
  /**
   * Calculates GST breakdown according to Indian GST Acts (CGST/SGST/IGST).
   */
  public static calculate(input: TaxCalculationInput): TaxBreakdown {
    const supplierState = input.supplierGstin.trim().substring(0, 2);
    const posState = input.placeOfSupplyStateCode.trim();

    // Determine rate: either custom, or lookup from HSN, or default 18%
    const taxRate = input.customTaxRate ?? (STANDARD_HSN_RATES[input.hsnSacCode] ?? 18);

    // Rule: If Supplier State == Place of Supply -> Intra-State (CGST + SGST split 50/50)
    // Rule: If Supplier State != Place of Supply -> Inter-State (IGST 100%)
    const isInterState = supplierState !== posState;

    const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

    let cgstRate = 0;
    let cgstAmount = 0;
    let sgstRate = 0;
    let sgstAmount = 0;
    let igstRate = 0;
    let igstAmount = 0;

    if (isInterState) {
      igstRate = taxRate;
      igstAmount = round2((input.taxableAmount * igstRate) / 100);
    } else {
      cgstRate = round2(taxRate / 2);
      sgstRate = round2(taxRate / 2);
      cgstAmount = round2((input.taxableAmount * cgstRate) / 100);
      sgstAmount = round2((input.taxableAmount * sgstRate) / 100);
    }

    const totalTax = round2(cgstAmount + sgstAmount + igstAmount);
    const totalInvoiceAmount = round2(input.taxableAmount + totalTax);

    return {
      isInterState,
      taxRate,
      taxableAmount: input.taxableAmount,
      cgstRate,
      cgstAmount,
      sgstRate,
      sgstAmount,
      igstRate,
      igstAmount,
      totalTax,
      totalInvoiceAmount,
    };
  }
}
