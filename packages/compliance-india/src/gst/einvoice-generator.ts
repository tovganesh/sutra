import * as crypto from 'crypto';

export interface EInvoiceSellerDetails {
  gstin: string;
  legalName: string;
  tradeName?: string;
  addressLine1: string;
  location: string;
  pincode: number;
  stateCode: string;
}

export interface EInvoiceBuyerDetails {
  gstin: string;
  legalName: string;
  placeOfSupply: string;
  addressLine1: string;
  location: string;
  pincode: number;
  stateCode: string;
}

export interface EInvoiceLineItem {
  itemIndex: number;
  productDescription: string;
  isService: boolean;
  hsnCode: string;
  quantity: number;
  unitPrice: number;
  totalTaxableValue: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalItemValue: number;
}

export interface EInvoicePayload {
  version: string;
  tranDetails: {
    taxScheme: 'GST';
    supplyType: 'B2B' | 'B2G' | 'EXP';
    regRev?: 'Y' | 'N';
  };
  docDetails: {
    docType: 'INV' | 'CRN' | 'DBN';
    docNo: string;
    docDate: string; // DD/MM/YYYY
  };
  sellerDetails: EInvoiceSellerDetails;
  buyerDetails: EInvoiceBuyerDetails;
  itemList: EInvoiceLineItem[];
  valDetails: {
    totalTaxableValue: number;
    cgstValue: number;
    sgstValue: number;
    igstValue: number;
    totalInvoiceValue: number;
  };
}

export class EInvoiceService {
  /**
   * Generates the 64-character Invoice Reference Number (IRN) SHA-256 hash.
   * Standard NIC Formula: SHA256(SupplierGSTIN + FinancialYear + DocType + DocNumber)
   */
  public static generateIRN(
    supplierGstin: string,
    financialYear: string, // e.g. '2026-27'
    docType: string,       // 'INV'
    docNumber: string
  ): string {
    const rawString = `${supplierGstin}${financialYear}${docType}${docNumber}`;
    return crypto.createHash('sha256').update(rawString).digest('hex').toLowerCase();
  }

  /**
   * Generates a signed QR payload preview for Indian E-Invoicing.
   */
  public static generateQRPayload(
    irn: string,
    supplierGstin: string,
    buyerGstin: string,
    docNo: string,
    docDate: string,
    totalValue: number,
    itemCount: number
  ): string {
    const qrData = {
      IRN: irn,
      SGSTIN: supplierGstin,
      BGSTIN: buyerGstin,
      DocNo: docNo,
      DocDt: docDate,
      TotVal: totalValue,
      ItemCnt: itemCount,
      AckNo: `ACK${Date.now()}`,
      AckDt: new Date().toISOString(),
    };
    return Buffer.from(JSON.stringify(qrData)).toString('base64');
  }
}
