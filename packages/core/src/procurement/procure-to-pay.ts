/**
 * Sutra Procure-to-Pay (P2P) Engine (SAP MM / FI-AP Equivalent)
 * Covers Purchase Orders, Goods Receipt (GRN), 3-Way Match Verification,
 * Indian TDS Withholding (Sec 194Q / 194C / 194J), MSME 43B(h) compliance,
 * and automated GR/IR clearing GL journal postings.
 */

import { InventoryEngine } from '../inventory/inventory-engine.js';
import { GeneralLedgerEngine, JournalLineInput } from '../ledger/ledger-engine.js';
import {
  PurchaseOrderStatus,
  type PurchaseOrderStatusType,
  ThreeWayMatchStatus,
  type ThreeWayMatchStatusType,
  InventoryMovementType,
  SystemDefaults,
  GstRate,
  TdsSection,
  type TdsSectionType,
  TdsRatePercent,
} from '../common/constants.js';

export interface VendorMaster {
  vendorId: string;
  name: string;
  gstin?: string;
  pan?: string;
  stateCode: string; // 2-digit GST state code
  isMsme: boolean;
  msmeCategory?: 'MICRO' | 'SMALL' | 'MEDIUM';
  udyamRegistrationNumber?: string;
  paymentTermsDays: number; // For MSME: capped at 45 days per Section 43B(h)
  bankAccountNumber?: string;
  bankIfsc?: string;
  email: string;
  address: string;
}

export interface PurchaseOrderItemInput {
  sku: string;
  quantity: number;
  unitPrice: number;
  hsnCode?: string;
}

export interface PurchaseOrderInput {
  tenantId: string;
  poNumber: string;
  vendorId: string;
  supplierStateCode: string; // Company / Receiving Plant state code
  items: PurchaseOrderItemInput[];
  deliveryPlant: string;
  createdBy?: string;
}

export interface PurchaseOrderResult {
  poNumber: string;
  status: PurchaseOrderStatusType;
  vendor: VendorMaster;
  items: Array<PurchaseOrderItemInput & { lineTotal: number }>;
  taxableTotal: number;
  estimatedGst: number;
  totalPoValue: number;
  msmePrompt: boolean;
  msmeMaxPaymentDays: number;
  createdAt: string;
}

export interface GoodsReceiptNoteResult {
  grnNumber: string;
  poNumber: string;
  receivedItems: Array<{
    sku: string;
    receivedQty: number;
    inventoryDocId: string;
    newMovingAvgPrice: number;
  }>;
  totalGrnValue: number;
  grIrClearingAccount: string;
  receivedAt: string;
}

export interface ThreeWayMatchResult {
  matched: boolean;
  status: ThreeWayMatchStatusType;
  poPrice: number;
  invoicePrice: number;
  orderedQty: number;
  receivedQty: number;
  invoicedQty: number;
  priceVariancePercent: number;
  quantityDiscrepancy: number;
  toleranceAllowed: boolean;
  notes: string[];
}

export interface VendorInvoiceVerificationInput {
  tenantId: string;
  vendorInvoiceNumber: string;
  poNumber: string;
  grnNumber: string;
  invoiceDate: string;
  invoicedItems: Array<{
    sku: string;
    invoicedQty: number;
    invoicedUnitPrice: number;
  }>;
  applyTdsSection?: '194Q' | '194C' | '194J'; // 194Q: 0.1% Goods, 194C: 2% Contractors, 194J: 10% Professional
}

export interface VendorInvoiceVerificationResult {
  verificationDocumentId: string;
  poNumber: string;
  vendorInvoiceNumber: string;
  threeWayMatch: ThreeWayMatchResult;
  taxableAmount: number;
  inputGstCredit: {
    cgst: number;
    sgst: number;
    igst: number;
    totalGst: number;
  };
  tdsDeduction: {
    section: string;
    ratePercent: number;
    deductionAmount: number;
  };
  netPayableToVendor: number;
  msmeDueDate: string; // Sec 43B(h) statutory deadline
  glJournalLines: JournalLineInput[];
  glPostingSuccess: boolean;
  verifiedAt: string;
}

export class ProcureToPayEngine {
  private vendors: Map<string, VendorMaster> = new Map();
  private purchaseOrders: Map<string, PurchaseOrderResult> = new Map();
  private goodsReceipts: Map<string, GoodsReceiptNoteResult> = new Map();

  constructor(private inventoryEngine: InventoryEngine) {
    this.seedDefaultVendors();
  }

  private seedDefaultVendors(): void {
    const defaults: VendorMaster[] = [
      {
        vendorId: 'VEND-JINDAL-001',
        name: 'Jindal Steel & Power Ltd',
        gstin: '27AAACJ2345K1Z3',
        pan: 'AAACJ2345K',
        stateCode: '27', // Maharashtra
        isMsme: false,
        paymentTermsDays: 60,
        email: 'b2b@jindalsteel.com',
        address: 'Bandra Kurla Complex, Mumbai, Maharashtra 400051',
      },
      {
        vendorId: 'VEND-MICROTECH-002',
        name: 'MicroTech Precision Forgings MSME',
        gstin: '27AABCM6789D1Z4',
        pan: 'AABCM6789D',
        stateCode: '27',
        isMsme: true,
        msmeCategory: 'SMALL',
        udyamRegistrationNumber: 'UDYAM-MH-01-0045231',
        paymentTermsDays: 45, // Capped by Section 43B(h)
        email: 'orders@microtechforgings.in',
        address: 'MIDC Bhosari, Pune, Maharashtra 411026',
      },
    ];

    for (const v of defaults) {
      this.vendors.set(v.vendorId, v);
    }
  }

  public getVendor(vendorId: string): VendorMaster | undefined {
    return this.vendors.get(vendorId);
  }

  public getAllVendors(): VendorMaster[] {
    return Array.from(this.vendors.values());
  }

  public registerVendor(vendor: VendorMaster): void {
    this.vendors.set(vendor.vendorId, vendor);
  }

  /**
   * Creates an approved Purchase Order (PO)
   */
  public createPurchaseOrder(input: PurchaseOrderInput): PurchaseOrderResult {
    const vendor = this.vendors.get(input.vendorId);
    if (!vendor) {
      throw new Error(`Vendor ID '${input.vendorId}' not found.`);
    }

    const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

    let taxableTotal = 0;
    const itemsWithTotals = input.items.map((i) => {
      const lineTotal = round2(i.quantity * i.unitPrice);
      taxableTotal += lineTotal;
      return { ...i, lineTotal };
    });

    const isInterState = input.supplierStateCode !== vendor.stateCode;
    const estimatedGst = round2(taxableTotal * GstRate.STANDARD_TOTAL); // 18% standard rate
    const totalPoValue = round2(taxableTotal + estimatedGst);

    const result: PurchaseOrderResult = {
      poNumber: input.poNumber,
      status: PurchaseOrderStatus.APPROVED,
      vendor,
      items: itemsWithTotals,
      taxableTotal: round2(taxableTotal),
      estimatedGst,
      totalPoValue,
      msmePrompt: vendor.isMsme,
      msmeMaxPaymentDays: vendor.isMsme ? 45 : vendor.paymentTermsDays,
      createdAt: new Date().toISOString(),
    };

    this.purchaseOrders.set(input.poNumber, result);
    return result;
  }

  /**
   * Receives goods at the warehouse dock:
   * Triggers Movement 101 in InventoryEngine (updating stock & Moving Average Price)
   */
  public processGoodsReceipt(poNumber: string, grnNumber: string): GoodsReceiptNoteResult {
    const po = this.purchaseOrders.get(poNumber);
    if (!po) {
      throw new Error(`Purchase Order '${poNumber}' not found.`);
    }

    let totalGrnValue = 0;
    const receivedItems = [];

    for (const item of po.items) {
      const movement = this.inventoryEngine.executeStockMovement({
        movementType: InventoryMovementType.GR_PURCHASE_ORDER,
        sku: item.sku,
        quantity: item.quantity,
        unitCost: item.unitPrice,
        referenceDocument: `${poNumber}:${grnNumber}`,
      });

      const lineVal = item.quantity * item.unitPrice;
      totalGrnValue += lineVal;

      receivedItems.push({
        sku: item.sku,
        receivedQty: item.quantity,
        inventoryDocId: movement.movementDocumentId,
        newMovingAvgPrice: movement.newMovingAvgPrice,
      });
    }

    const result: GoodsReceiptNoteResult = {
      grnNumber,
      poNumber,
      receivedItems,
      totalGrnValue: Math.round(totalGrnValue * 100) / 100,
      grIrClearingAccount: '210500',
      receivedAt: new Date().toISOString(),
    };

    this.goodsReceipts.set(grnNumber, result);
    return result;
  }

  /**
   * Performs 3-Way Matching and verifies Vendor Invoice:
   * PO Price/Qty vs GRN Physical Qty vs Invoiced Qty/Price
   */
  public verifyVendorInvoice(input: VendorInvoiceVerificationInput): VendorInvoiceVerificationResult {
    const po = this.purchaseOrders.get(input.poNumber);
    if (!po) throw new Error(`PO '${input.poNumber}' not found.`);

    const grn = this.goodsReceipts.get(input.grnNumber);
    if (!grn) throw new Error(`GRN '${input.grnNumber}' not found.`);

    const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

    // 3-Way Match evaluation
    let totalPoPrice = 0;
    let totalInvoicePrice = 0;
    let totalOrderedQty = 0;
    let totalReceivedQty = 0;
    let totalInvoicedQty = 0;
    const notes: string[] = [];

    for (const invItem of input.invoicedItems) {
      const poItem = po.items.find((p) => p.sku === invItem.sku);
      const grnItem = grn.receivedItems.find((g) => g.sku === invItem.sku);

      if (!poItem || !grnItem) {
        throw new Error(`Item ${invItem.sku} in vendor invoice was not found in original PO or GRN.`);
      }

      totalPoPrice += poItem.unitPrice * invItem.invoicedQty;
      totalInvoicePrice += invItem.invoicedUnitPrice * invItem.invoicedQty;
      totalOrderedQty += poItem.quantity;
      totalReceivedQty += grnItem.receivedQty;
      totalInvoicedQty += invItem.invoicedQty;

      if (invItem.invoicedQty > grnItem.receivedQty) {
        notes.push(`Quantity alert: Invoiced ${invItem.invoicedQty} exceeds physically received ${grnItem.receivedQty} for SKU ${invItem.sku}.`);
      }
    }

    const priceDiff = Math.abs(totalInvoicePrice - totalPoPrice);
    const priceVariancePercent = totalPoPrice > 0 ? (priceDiff / totalPoPrice) * 100 : 0;
    const quantityDiscrepancy = totalInvoicedQty - totalReceivedQty;

    const toleranceAllowed = priceVariancePercent <= 1.0 && quantityDiscrepancy <= 0;
    let matchStatus: ThreeWayMatchStatusType = ThreeWayMatchStatus.PERFECT_MATCH;

    if (quantityDiscrepancy > 0) {
      matchStatus = ThreeWayMatchStatus.QUANTITY_VARIANCE;
    } else if (priceVariancePercent > 1.0) {
      matchStatus = ThreeWayMatchStatus.PRICE_VARIANCE;
    }

    const threeWayMatch: ThreeWayMatchResult = {
      matched: toleranceAllowed,
      status: matchStatus,
      poPrice: round2(totalPoPrice),
      invoicePrice: round2(totalInvoicePrice),
      orderedQty: totalOrderedQty,
      receivedQty: totalReceivedQty,
      invoicedQty: totalInvoicedQty,
      priceVariancePercent: round2(priceVariancePercent),
      quantityDiscrepancy,
      toleranceAllowed,
      notes,
    };

    const taxableAmount = round2(totalInvoicePrice);

    // GST Input Tax Credit calculation
    const isInterState = po.vendor.stateCode !== SystemDefaults.DEFAULT_SUPPLIER_STATE_CODE;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (isInterState) {
      igst = round2(taxableAmount * GstRate.STANDARD_IGST);
    } else {
      cgst = round2(taxableAmount * GstRate.STANDARD_CGST);
      sgst = round2(taxableAmount * GstRate.STANDARD_SGST);
    }
    const totalGst = round2(cgst + sgst + igst);

    // TDS Withholding calculation
    const tdsSection = (input.applyTdsSection as TdsSectionType) ?? TdsSection.SEC_194Q;
    const tdsRate = TdsRatePercent[tdsSection] ?? 0;

    const tdsDeductionAmount = round2((taxableAmount * tdsRate) / 100);
    const netPayableToVendor = round2(taxableAmount + totalGst - tdsDeductionAmount);

    // MSME Due Date Calculation per Section 43B(h)
    const invDate = new Date(input.invoiceDate);
    const maxDays = po.vendor.isMsme ? 45 : po.vendor.paymentTermsDays;
    const msmeDueDate = new Date(invDate.getTime() + maxDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Build Accounting Lines:
    // Dr GR/IR Clearing Account (210500)
    // Dr Input GST Tax Credit (130100 / 130200 / 130300)
    //   Cr Accounts Payable - Vendor (210100)
    //   Cr TDS Withholding Payable (220500)
    const journalLines: JournalLineInput[] = [
      {
        accountId: 'ACC-GRIR-CLEAR',
        accountCode: '210500',
        accountName: 'Goods Receipt / Invoice Receipt (GR/IR) Clearing',
        debit: taxableAmount,
        credit: 0,
        description: `Clear GR/IR for PO ${input.poNumber} Inv ${input.vendorInvoiceNumber}`,
      },
    ];

    if (cgst > 0) {
      journalLines.push({
        accountId: 'ACC-ITC-CGST',
        accountCode: '130100',
        accountName: 'Input Central GST (CGST) Tax Credit',
        debit: cgst,
        credit: 0,
        description: `Input CGST 9% on Vendor Inv ${input.vendorInvoiceNumber}`,
      });
    }

    if (sgst > 0) {
      journalLines.push({
        accountId: 'ACC-ITC-SGST',
        accountCode: '130200',
        accountName: 'Input State GST (SGST) Tax Credit',
        debit: sgst,
        credit: 0,
        description: `Input SGST 9% on Vendor Inv ${input.vendorInvoiceNumber}`,
      });
    }

    if (igst > 0) {
      journalLines.push({
        accountId: 'ACC-ITC-IGST',
        accountCode: '130300',
        accountName: 'Input Integrated GST (IGST) Tax Credit',
        debit: igst,
        credit: 0,
        description: `Input IGST 18% on Vendor Inv ${input.vendorInvoiceNumber}`,
      });
    }

    if (tdsDeductionAmount > 0) {
      journalLines.push({
        accountId: 'ACC-TDS-PAYABLE',
        accountCode: '220500',
        accountName: `TDS Payable u/s ${tdsSection}`,
        debit: 0,
        credit: tdsDeductionAmount,
        description: `TDS @ ${tdsRate}% on Inv ${input.vendorInvoiceNumber}`,
      });
    }

    journalLines.push({
      accountId: 'ACC-AP-VENDOR',
      accountCode: '210100',
      accountName: `Accounts Payable - ${po.vendor.name}`,
      debit: 0,
      credit: netPayableToVendor,
      description: `Net payable for Inv ${input.vendorInvoiceNumber}`,
    });

    const postResult = GeneralLedgerEngine.postJournalEntry({
      tenantId: input.tenantId,
      entryNumber: `JRN-AP-${input.vendorInvoiceNumber}`,
      postingDate: input.invoiceDate,
      reference: input.vendorInvoiceNumber,
      narration: `Vendor Invoice ${input.vendorInvoiceNumber} from ${po.vendor.name}`,
      lines: journalLines,
    });

    return {
      verificationDocumentId: `VIV-${Date.now().toString(36).toUpperCase()}`,
      poNumber: input.poNumber,
      vendorInvoiceNumber: input.vendorInvoiceNumber,
      threeWayMatch,
      taxableAmount,
      inputGstCredit: {
        cgst,
        sgst,
        igst,
        totalGst,
      },
      tdsDeduction: {
        section: tdsSection,
        ratePercent: tdsRate,
        deductionAmount: tdsDeductionAmount,
      },
      netPayableToVendor,
      msmeDueDate,
      glJournalLines: journalLines,
      glPostingSuccess: postResult.success,
      verifiedAt: new Date().toISOString(),
    };
  }
}
