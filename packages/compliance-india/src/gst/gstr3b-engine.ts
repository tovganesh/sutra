/**
 * Sutra India GST: GSTR-3B Monthly Return & Tax Settlement Engine
 * Computes outward tax liability, eligible Input Tax Credit (ITC), reverse charge, and cash payment liability.
 */

export interface GSTR3BOutwardSupply {
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess?: number;
}

export interface GSTR3BITCEntitlement {
  importOfGoods?: { igst: number; cess?: number };
  importOfServices?: { igst: number; cess?: number };
  inwardReverseCharge?: { igst: number; cgst: number; sgst: number };
  allOtherITC: { igst: number; cgst: number; sgst: number };
}

export interface GSTR3BComputationInput {
  gstin: string;
  returnPeriod: string; // e.g. '092026'
  outwardTaxableSupplies: GSTR3BOutwardSupply;
  outwardZeroRatedSupplies?: { taxableValue: number; igst: number };
  inwardSuppliesReverseCharge?: GSTR3BOutwardSupply;
  itcAvailable: GSTR3BITCEntitlement;
  itcReversed?: { igst: number; cgst: number; sgst: number };
}

export interface GSTR3BTaxLiabilitySummary {
  gstin: string;
  period: string;
  totalOutwardTax: {
    igst: number;
    cgst: number;
    sgst: number;
    total: number;
  };
  netEligibleITC: {
    igst: number;
    cgst: number;
    sgst: number;
    total: number;
  };
  taxPayableCash: {
    igst: number;
    cgst: number;
    sgst: number;
    total: number;
  };
  remainingITCBalance: {
    igst: number;
    cgst: number;
    sgst: number;
  };
}

export class GSTR3BEngine {
  /**
   * Computes monthly GSTR-3B return summary and applies statutory GST ITC Set-Off Rules:
   * Rule 88A: IGST ITC must be completely exhausted before CGST/SGST ITC can be utilized.
   */
  public static computeSummary(input: GSTR3BComputationInput): GSTR3BTaxLiabilitySummary {
    const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

    // 1. Calculate Gross Outward Tax Liability (Table 3.1)
    const outIgst = round2(
      input.outwardTaxableSupplies.igst +
      (input.outwardZeroRatedSupplies?.igst || 0) +
      (input.inwardSuppliesReverseCharge?.igst || 0)
    );
    const outCgst = round2(
      input.outwardTaxableSupplies.cgst +
      (input.inwardSuppliesReverseCharge?.cgst || 0)
    );
    const outSgst = round2(
      input.outwardTaxableSupplies.sgst +
      (input.inwardSuppliesReverseCharge?.sgst || 0)
    );

    // 2. Calculate Net Eligible Input Tax Credit (Table 4)
    const itcRev = input.itcReversed || { igst: 0, cgst: 0, sgst: 0 };
    let itcIgst = round2(
      (input.itcAvailable.importOfGoods?.igst || 0) +
      (input.itcAvailable.importOfServices?.igst || 0) +
      (input.itcAvailable.inwardReverseCharge?.igst || 0) +
      input.itcAvailable.allOtherITC.igst -
      itcRev.igst
    );
    let itcCgst = round2(
      (input.itcAvailable.inwardReverseCharge?.cgst || 0) +
      input.itcAvailable.allOtherITC.cgst -
      itcRev.cgst
    );
    let itcSgst = round2(
      (input.itcAvailable.inwardReverseCharge?.sgst || 0) +
      input.itcAvailable.allOtherITC.sgst -
      itcRev.sgst
    );

    itcIgst = Math.max(0, itcIgst);
    itcCgst = Math.max(0, itcCgst);
    itcSgst = Math.max(0, itcSgst);

    // 3. Set-Off Rule 88A:
    // Step 3a: Utilize IGST ITC against Output IGST
    let balOutIgst = outIgst;
    if (itcIgst >= balOutIgst) {
      itcIgst = round2(itcIgst - balOutIgst);
      balOutIgst = 0;
    } else {
      balOutIgst = round2(balOutIgst - itcIgst);
      itcIgst = 0;
    }

    // Step 3b: Any remaining IGST ITC can offset Output CGST and SGST in any order
    let balOutCgst = outCgst;
    let balOutSgst = outSgst;

    if (itcIgst > 0 && balOutCgst > 0) {
      if (itcIgst >= balOutCgst) {
        itcIgst = round2(itcIgst - balOutCgst);
        balOutCgst = 0;
      } else {
        balOutCgst = round2(balOutCgst - itcIgst);
        itcIgst = 0;
      }
    }

    if (itcIgst > 0 && balOutSgst > 0) {
      if (itcIgst >= balOutSgst) {
        itcIgst = round2(itcIgst - balOutSgst);
        balOutSgst = 0;
      } else {
        balOutSgst = round2(balOutSgst - itcIgst);
        itcIgst = 0;
      }
    }

    // Step 3c: Utilize CGST ITC against remaining Output CGST (cannot offset SGST)
    if (itcCgst >= balOutCgst) {
      itcCgst = round2(itcCgst - balOutCgst);
      balOutCgst = 0;
    } else {
      balOutCgst = round2(balOutCgst - itcCgst);
      itcCgst = 0;
    }

    // Step 3d: Utilize SGST ITC against remaining Output SGST (cannot offset CGST)
    if (itcSgst >= balOutSgst) {
      itcSgst = round2(itcSgst - balOutSgst);
      balOutSgst = 0;
    } else {
      balOutSgst = round2(balOutSgst - itcSgst);
      itcSgst = 0;
    }

    return {
      gstin: input.gstin,
      period: input.returnPeriod,
      totalOutwardTax: {
        igst: outIgst,
        cgst: outCgst,
        sgst: outSgst,
        total: round2(outIgst + outCgst + outSgst),
      },
      netEligibleITC: {
        igst: round2(input.itcAvailable.allOtherITC.igst),
        cgst: round2(input.itcAvailable.allOtherITC.cgst),
        sgst: round2(input.itcAvailable.allOtherITC.sgst),
        total: round2(input.itcAvailable.allOtherITC.igst + input.itcAvailable.allOtherITC.cgst + input.itcAvailable.allOtherITC.sgst),
      },
      taxPayableCash: {
        igst: balOutIgst,
        cgst: balOutCgst,
        sgst: balOutSgst,
        total: round2(balOutIgst + balOutCgst + balOutSgst),
      },
      remainingITCBalance: {
        igst: itcIgst,
        cgst: itcCgst,
        sgst: itcSgst,
      },
    };
  }
}
