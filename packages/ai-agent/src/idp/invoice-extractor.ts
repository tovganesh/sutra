import { ILLMProvider } from '../providers/llm-provider.js';

export interface ExtractedInvoice {
  supplierName: string;
  supplierGstin?: string;
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  lineItems: Array<{
    description: string;
    hsnSac?: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
  }>;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  confidenceScore: number;
}

export class InvoiceExtractorAgent {
  constructor(private llm: ILLMProvider) {}

  /**
   * Extracts structured invoice data from OCR raw text or scanned receipts.
   */
  public async extract(ocrText: string): Promise<ExtractedInvoice> {
    const schemaDesc = `
    {
      "supplierName": string,
      "supplierGstin": string (optional, 15-char Indian GSTIN),
      "invoiceNumber": string,
      "invoiceDate": string (format YYYY-MM-DD),
      "lineItems": [
        {
          "description": string,
          "hsnSac": string,
          "quantity": number,
          "unitPrice": number,
          "totalAmount": number
        }
      ],
      "subtotal": number,
      "taxAmount": number,
      "totalAmount": number,
      "confidenceScore": number (0.0 to 1.0)
    }
    `;

    const prompt = `Extract all structured fields from this vendor invoice text:\n\n${ocrText}`;
    return this.llm.generateJSON<ExtractedInvoice>(prompt, schemaDesc);
  }
}
