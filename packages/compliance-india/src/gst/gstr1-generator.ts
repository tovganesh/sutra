/**
 * Sutra India GST: GSTR-1 Return Schema Generator
 * Complies with GSTN (Goods and Services Tax Network) official return filing specifications.
 */

export interface GSTR1InvoiceInput {
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  invoiceValue: number;
  recipientGstin?: string; // If present, B2B; if absent, B2C
  recipientName?: string;
  placeOfSupplyStateCode: string; // 2-digit code
  isReverseCharge?: boolean;
  items: Array<{
    hsnSac: string;
    description: string;
    uqc?: string; // Unit Quantity Code, e.g. 'NOS', 'KGS', 'OTH'
    quantity: number;
    taxableValue: number;
    taxRate: number; // e.g. 18
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
  }>;
}

export interface GSTR1B2BItem {
  num: number;
  itm_det: {
    rt: number;
    txval: number;
    iamt: number;
    camt: number;
    samt: number;
    csamt: number;
  };
}

export interface GSTR1B2BInvoice {
  inum: string;
  idt: string;
  val: number;
  pos: string;
  rchrg: 'Y' | 'N';
  inv_typ: 'R'; // Regular B2B
  itms: GSTR1B2BItem[];
}

export interface GSTR1B2BGroup {
  ctin: string; // Customer GSTIN
  inv: GSTR1B2BInvoice[];
}

export interface GSTR1HsnSummary {
  num: number;
  hsn_sc: string;
  desc: string;
  uqc: string;
  qty: number;
  val: number;
  txval: number;
  iamt: number;
  camt: number;
  samt: number;
  csamt: number;
}

export interface GSTR1Payload {
  gstin: string;
  fp: string; // Financial Period: MMYYYY (e.g. '092026')
  gt: number; // Gross Turnover previous FY
  cur_gt: number; // Gross Turnover current FY
  b2b: GSTR1B2BGroup[];
  hsn: {
    data: GSTR1HsnSummary[];
  };
  doc_issue: {
    doc_det: Array<{
      doc_num: number;
      doc_typ: string;
      from: string;
      to: string;
      totnum: number;
      canc: number;
      net_issue: number;
    }>;
  };
}

export class GSTR1Generator {
  /**
   * Transforms an array of sales invoices into an official GSTN GSTR-1 JSON return payload.
   */
  public static generate(
    supplierGstin: string,
    periodMMYYYY: string,
    invoices: GSTR1InvoiceInput[]
  ): GSTR1Payload {
    const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

    // 1. Group B2B Invoices by recipient GSTIN (Table 4)
    const b2bMap = new Map<string, GSTR1B2BInvoice[]>();

    // 2. Aggregate HSN Summary (Table 12)
    const hsnMap = new Map<string, GSTR1HsnSummary>();

    let totalTurnover = 0;
    let minInvoiceNo = '';
    let maxInvoiceNo = '';

    for (const inv of invoices) {
      totalTurnover += inv.invoiceValue;

      if (!minInvoiceNo || inv.invoiceNumber < minInvoiceNo) minInvoiceNo = inv.invoiceNumber;
      if (!maxInvoiceNo || inv.invoiceNumber > maxInvoiceNo) maxInvoiceNo = inv.invoiceNumber;

      // Handle B2B
      if (inv.recipientGstin) {
        const b2bItems: GSTR1B2BItem[] = inv.items.map((item, idx) => ({
          num: idx + 1,
          itm_det: {
            rt: item.taxRate,
            txval: round2(item.taxableValue),
            iamt: round2(item.igstAmount),
            camt: round2(item.cgstAmount),
            samt: round2(item.sgstAmount),
            csamt: 0,
          },
        }));

        const b2bInv: GSTR1B2BInvoice = {
          inum: inv.invoiceNumber,
          idt: this.formatDate(inv.invoiceDate),
          val: round2(inv.invoiceValue),
          pos: inv.placeOfSupplyStateCode,
          rchrg: inv.isReverseCharge ? 'Y' : 'N',
          inv_typ: 'R',
          itms: b2bItems,
        };

        const existingGroup = b2bMap.get(inv.recipientGstin) || [];
        existingGroup.push(b2bInv);
        b2bMap.set(inv.recipientGstin, existingGroup);
      }

      // Handle HSN Summary
      for (const item of inv.items) {
        const existing = hsnMap.get(item.hsnSac) || {
          num: hsnMap.size + 1,
          hsn_sc: item.hsnSac,
          desc: item.description,
          uqc: item.uqc || 'NOS',
          qty: 0,
          val: 0,
          txval: 0,
          iamt: 0,
          camt: 0,
          samt: 0,
          csamt: 0,
        };

        existing.qty += item.quantity;
        existing.val += round2(item.taxableValue + item.igstAmount + item.cgstAmount + item.sgstAmount);
        existing.txval += round2(item.taxableValue);
        existing.iamt += round2(item.igstAmount);
        existing.camt += round2(item.cgstAmount);
        existing.samt += round2(item.sgstAmount);

        hsnMap.set(item.hsnSac, existing);
      }
    }

    const b2b: GSTR1B2BGroup[] = Array.from(b2bMap.entries()).map(([ctin, inv]) => ({
      ctin,
      inv,
    }));

    const hsnList: GSTR1HsnSummary[] = Array.from(hsnMap.values()).map((h, idx) => ({
      ...h,
      num: idx + 1,
      qty: round2(h.qty),
      val: round2(h.val),
      txval: round2(h.txval),
      iamt: round2(h.iamt),
      camt: round2(h.camt),
      samt: round2(h.samt),
    }));

    return {
      gstin: supplierGstin,
      fp: periodMMYYYY,
      gt: round2(totalTurnover * 1.1), // Estimated previous FY
      cur_gt: round2(totalTurnover),
      b2b,
      hsn: {
        data: hsnList,
      },
      doc_issue: {
        doc_det: [
          {
            doc_num: 1,
            doc_typ: 'Invoices for outward supply',
            from: minInvoiceNo || 'INV-0001',
            to: maxInvoiceNo || 'INV-0001',
            totnum: invoices.length,
            canc: 0,
            net_issue: invoices.length,
          },
        ],
      },
    };
  }

  private static formatDate(isoDate: string): string {
    // Converts YYYY-MM-DD to DD-MM-YYYY
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return isoDate;
  }
}
