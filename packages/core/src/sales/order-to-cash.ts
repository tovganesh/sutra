/**
 * Sutra Sales & Distribution (SD) - Order-to-Cash (O2C) Engine
 * Equivalent to SAP SD Sales Orders, Outbound Deliveries, and Billing.
 * Deeply integrates with Inventory (PGI Mvt 601), India Compliance (GST / E-Invoice / E-Way Bill),
 * and the General Ledger Engine.
 */

import { InventoryEngine } from '../inventory/inventory-engine.js';
import { GeneralLedgerEngine, JournalLineInput } from '../ledger/ledger-engine.js';
import {
  SalesOrderStatus,
  type SalesOrderStatusType,
  InventoryMovementType,
  SystemDefaults,
  GstRate,
  StandardGlAccount,
} from '../common/constants.js';

export interface CustomerMaster {
  customerId: string;
  name: string;
  gstin?: string;
  pan?: string;
  stateCode: string; // 2-digit GST state code (e.g., '27' for Maharashtra, '29' for Karnataka)
  creditLimit: number;
  currentOutstanding: number;
  paymentTermsDays: number;
  email: string;
  address: string;
}

export interface SalesOrderItemInput {
  sku: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  hsnCode?: string;
}

export interface SalesOrderInput {
  tenantId: string;
  orderNumber: string;
  customerId: string;
  supplierGstin: string; // Supplier's GSTIN (e.g., '27AABCS1429B1ZB')
  supplierStateCode: string;
  items: SalesOrderItemInput[];
  deliveryAddress: string;
  currency?: string; // Default: 'INR'
  createdBy?: string;
}

export interface SalesOrderResult {
  orderNumber: string;
  status: SalesOrderStatusType;
  customer: CustomerMaster;
  items: Array<SalesOrderItemInput & { lineTotal: number }>;
  subtotal: number;
  discountTotal: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  grandTotal: number;
  isInterState: boolean;
  creditCheckPassed: boolean;
  rejectionReason?: string;
  createdAt: string;
}

export interface PostGoodsIssueResult {
  deliveryDocumentId: string;
  orderNumber: string;
  itemsDelivered: Array<{
    sku: string;
    quantity: number;
    inventoryMovementDocId: string;
    cogsDebit: number;
  }>;
  totalCogs: number;
  glJournalNumber: string;
  deliveredAt: string;
}

export interface BillingInvoiceResult {
  invoiceNumber: string;
  orderNumber: string;
  customerGstin?: string;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalInvoiceAmount: number;
  eInvoiceIrn?: string;
  eWayBillRequired: boolean;
  eWayBillThreshold: number; // 50,000 INR
  glPostingSuccess: boolean;
  journalLines: JournalLineInput[];
  generatedAt: string;
}

export class OrderToCashEngine {
  private customers: Map<string, CustomerMaster> = new Map();
  private orders: Map<string, SalesOrderResult> = new Map();

  constructor(private inventoryEngine: InventoryEngine) {
    this.seedDefaultCustomers();
  }

  private seedDefaultCustomers(): void {
    const defaults: CustomerMaster[] = [
      {
        customerId: 'CUST-MAH-001',
        name: 'Tata Motors Fleet Solutions Ltd',
        gstin: '27AABCT2345K1Z8',
        pan: 'AABCT2345K',
        stateCode: '27', // Maharashtra (Intra-state if supplier is in MH)
        creditLimit: 25000000, // ₹2.5 Crore
        currentOutstanding: 4500000,
        paymentTermsDays: 45,
        email: 'billing@tatamotorsfleet.com',
        address: 'Pimpri Industrial Area, Pune, Maharashtra 411018',
      },
      {
        customerId: 'CUST-BLR-002',
        name: 'Bangalore Metro Rail Logistics Corp',
        gstin: '29AABCB8976C1ZG',
        pan: 'AABCB8976C',
        stateCode: '29', // Karnataka (Inter-state if supplier is in MH)
        creditLimit: 50000000, // ₹5 Crore
        currentOutstanding: 12000000,
        paymentTermsDays: 60,
        email: 'accounts@bmrl-logistics.org',
        address: 'MG Road Metro Complex, Bangalore, Karnataka 560001',
      },
    ];

    for (const c of defaults) {
      this.customers.set(c.customerId, c);
    }
  }

  public getCustomer(customerId: string): CustomerMaster | undefined {
    return this.customers.get(customerId);
  }

  public getAllCustomers(): CustomerMaster[] {
    return Array.from(this.customers.values());
  }

  public registerCustomer(customer: CustomerMaster): void {
    this.customers.set(customer.customerId, customer);
  }

  /**
   * Creates and validates a Sales Order:
   * - Credit check against Customer Master limit
   * - Inventory Availability check (ATP)
   * - India GST Intra vs Inter state tax breakdown (CGST+SGST vs IGST)
   */
  public createSalesOrder(input: SalesOrderInput): SalesOrderResult {
    const customer = this.customers.get(input.customerId);
    if (!customer) {
      throw new Error(`Customer ID '${input.customerId}' not found in Customer Master.`);
    }

    const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

    let subtotal = 0;
    let discountTotal = 0;
    const computedItems: Array<SalesOrderItemInput & { lineTotal: number }> = [];

    // Calculate item totals and verify ATP
    for (const item of input.items) {
      const material = this.inventoryEngine.getMaterial(item.sku);
      if (!material) {
        throw new Error(`Material SKU '${item.sku}' not found in Material Master.`);
      }

      if (material.totalStock < item.quantity) {
        return {
          orderNumber: input.orderNumber,
          status: SalesOrderStatus.REJECTED,
          customer,
          items: [],
          subtotal: 0,
          discountTotal: 0,
          taxableValue: 0,
          cgst: 0,
          sgst: 0,
          igst: 0,
          totalTax: 0,
          grandTotal: 0,
          isInterState: false,
          creditCheckPassed: true,
          rejectionReason: `ATP Check Failed: SKU ${item.sku} has insufficient stock (Available: ${material.totalStock}, Requested: ${item.quantity})`,
          createdAt: new Date().toISOString(),
        };
      }

      const gross = item.quantity * item.unitPrice;
      const discount = item.discountPercent ? (gross * item.discountPercent) / 100 : 0;
      const lineNet = gross - discount;

      subtotal += gross;
      discountTotal += discount;
      computedItems.push({
        ...item,
        lineTotal: round2(lineNet),
      });
    }

    const taxableValue = round2(subtotal - discountTotal);

    // Credit limit check
    const projectedOutstanding = customer.currentOutstanding + taxableValue;
    if (projectedOutstanding > customer.creditLimit) {
      return {
        orderNumber: input.orderNumber,
        status: SalesOrderStatus.REJECTED,
        customer,
        items: computedItems,
        subtotal: round2(subtotal),
        discountTotal: round2(discountTotal),
        taxableValue,
        cgst: 0,
        sgst: 0,
        igst: 0,
        totalTax: 0,
        grandTotal: 0,
        isInterState: false,
        creditCheckPassed: false,
        rejectionReason: `Credit Limit Exceeded: Order value ₹${taxableValue} pushes customer outstanding to ₹${round2(projectedOutstanding)}, exceeding authorized limit ₹${customer.creditLimit}.`,
        createdAt: new Date().toISOString(),
      };
    }

    // Determine GST tax split:
    // If supplier state code === customer state code -> Intra-state: 9% CGST + 9% SGST (standard 18%)
    // If supplier state code !== customer state code -> Inter-state: 18% IGST
    const isInterState = input.supplierStateCode !== customer.stateCode;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (isInterState) {
      igst = round2(taxableValue * GstRate.STANDARD_IGST);
    } else {
      cgst = round2(taxableValue * GstRate.STANDARD_CGST);
      sgst = round2(taxableValue * GstRate.STANDARD_SGST);
    }

    const totalTax = round2(cgst + sgst + igst);
    const grandTotal = round2(taxableValue + totalTax);

    const result: SalesOrderResult = {
      orderNumber: input.orderNumber,
      status: SalesOrderStatus.CONFIRMED,
      customer,
      items: computedItems,
      subtotal: round2(subtotal),
      discountTotal: round2(discountTotal),
      taxableValue,
      cgst,
      sgst,
      igst,
      totalTax,
      grandTotal,
      isInterState,
      creditCheckPassed: true,
      createdAt: new Date().toISOString(),
    };

    this.orders.set(input.orderNumber, result);
    return result;
  }

  /**
   * Posts Goods Issue (PGI) for an Outbound Delivery:
   * Triggers Inventory Movement 601 (decreases stock, posts COGS in General Ledger)
   */
  public postGoodsIssue(orderNumber: string): PostGoodsIssueResult {
    const order = this.orders.get(orderNumber);
    if (!order) {
      throw new Error(`Sales Order '${orderNumber}' not found.`);
    }

    if (order.status !== SalesOrderStatus.CONFIRMED) {
      throw new Error(`Cannot deliver Sales Order '${orderNumber}' in status '${order.status}'.`);
    }

    const deliveryDocId = `OBD-${Date.now().toString(36).toUpperCase()}`;
    let totalCogs = 0;
    const deliveredItems = [];

    for (const item of order.items) {
      const movement = this.inventoryEngine.executeStockMovement({
        movementType: InventoryMovementType.GI_SALES_DELIVERY,
        sku: item.sku,
        quantity: item.quantity,
        referenceDocument: `${orderNumber}:${deliveryDocId}`,
      });

      const material = this.inventoryEngine.getMaterial(item.sku)!;
      const cogsAmount = item.quantity * movement.previousMovingAvgPrice;
      totalCogs += cogsAmount;

      deliveredItems.push({
        sku: item.sku,
        quantity: item.quantity,
        inventoryMovementDocId: movement.movementDocumentId,
        cogsDebit: Math.round(cogsAmount * 100) / 100,
      });
    }

    return {
      deliveryDocumentId: deliveryDocId,
      orderNumber,
      itemsDelivered: deliveredItems,
      totalCogs: Math.round(totalCogs * 100) / 100,
      glJournalNumber: `JRN-COGS-${deliveryDocId}`,
      deliveredAt: new Date().toISOString(),
    };
  }

  /**
   * Generates Billing Invoice with India E-Invoice IRN & E-Way Bill requirement,
   * posting the AR entry to the General Ledger:
   * Dr Accounts Receivable (Customer)
   *   Cr Sales Revenue
   *   Cr Output CGST Payable
   *   Cr Output SGST Payable
   *   Cr Output IGST Payable
   */
  public generateBillingInvoice(tenantId: string, orderNumber: string): BillingInvoiceResult {
    const order = this.orders.get(orderNumber);
    if (!order) {
      throw new Error(`Sales Order '${orderNumber}' not found.`);
    }

    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
    const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

    // Build GL Journal Entry lines
    const journalLines: JournalLineInput[] = [
      {
        accountId: 'ACC-AR-001',
        accountCode: StandardGlAccount.AR_DOMESTIC,
        accountName: `Accounts Receivable - ${order.customer.name}`,
        debit: order.grandTotal,
        credit: 0,
        description: `Customer Invoice ${invoiceNumber} for Sales Order ${orderNumber}`,
      },
      {
        accountId: 'ACC-REV-001',
        accountCode: StandardGlAccount.SALES_REVENUE,
        accountName: 'Domestic Sales Revenue',
        debit: 0,
        credit: order.taxableValue,
        description: `Sales revenue for ${orderNumber}`,
      },
    ];

    if (order.cgst > 0) {
      journalLines.push({
        accountId: 'ACC-TAX-CGST-OUT',
        accountCode: StandardGlAccount.OUTPUT_CGST,
        accountName: 'Output Central GST (CGST) Payable',
        debit: 0,
        credit: order.cgst,
        description: `Output CGST 9% on ${invoiceNumber}`,
      });
    }

    if (order.sgst > 0) {
      journalLines.push({
        accountId: 'ACC-TAX-SGST-OUT',
        accountCode: StandardGlAccount.OUTPUT_SGST,
        accountName: 'Output State GST (SGST) Payable',
        debit: 0,
        credit: order.sgst,
        description: `Output SGST 9% on ${invoiceNumber}`,
      });
    }

    if (order.igst > 0) {
      journalLines.push({
        accountId: 'ACC-TAX-IGST-OUT',
        accountCode: StandardGlAccount.OUTPUT_IGST,
        accountName: 'Output Integrated GST (IGST) Payable',
        debit: 0,
        credit: order.igst,
        description: `Output IGST 18% on ${invoiceNumber}`,
      });
    }

    // Post to General Ledger
    const postResult = GeneralLedgerEngine.postJournalEntry({
      tenantId,
      entryNumber: `JRN-${invoiceNumber}`,
      postingDate: new Date().toISOString().split('T')[0],
      reference: invoiceNumber,
      narration: `Billing invoice ${invoiceNumber} for Customer ${order.customer.name}`,
      lines: journalLines,
    });

    // Mock IRN generation (64-character SHA-256 equivalent)
    const eInvoiceIrn = order.customer.gstin
      ? `IRN-${Buffer.from(`${invoiceNumber}:${order.taxableValue}:${Date.now()}`).toString('hex').slice(0, 64)}`
      : undefined;

    // E-Way Bill is statutorily mandated in India when consignment value > ₹50,000
    const eWayBillRequired = order.grandTotal > SystemDefaults.E_WAY_BILL_THRESHOLD_INR;

    return {
      invoiceNumber,
      orderNumber,
      customerGstin: order.customer.gstin,
      taxableAmount: order.taxableValue,
      cgstAmount: order.cgst,
      sgstAmount: order.sgst,
      igstAmount: order.igst,
      totalInvoiceAmount: order.grandTotal,
      eInvoiceIrn,
      eWayBillRequired,
      eWayBillThreshold: SystemDefaults.E_WAY_BILL_THRESHOLD_INR,
      glPostingSuccess: postResult.success,
      journalLines,
      generatedAt: new Date().toISOString(),
    };
  }
}
