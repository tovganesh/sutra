/**
 * Sutra Subledger Engine (SAP FI-AR and FI-AP Equivalent)
 * Manages Accounts Receivable & Accounts Payable subledgers,
 * real-time aging buckets (0-30, 31-60, 61-90, 90+ days),
 * DSO (Days Sales Outstanding) and DPO (Days Payable Outstanding) metrics.
 */

import {
  SubledgerStatus,
  type SubledgerStatusType,
  SubledgerEntryType,
  SystemDefaults,
} from '../common/constants.js';

export interface SubledgerItem {
  id: string;
  type: SubledgerEntryType;
  partyId: string;
  partyName: string;
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string;     // YYYY-MM-DD
  grossAmount: number;
  paidAmount: number;
  outstandingBalance: number;
  currency: string;
  status: SubledgerStatusType;
}

export interface AgingBucketSummary {
  current0to30: number;
  days31to60: number;
  days61to90: number;
  above90: number;
  totalOutstanding: number;
  itemCount: number;
}

export interface SubledgerAgingReport {
  asOfDate: string;
  receivables: {
    summary: AgingBucketSummary;
    dsoDays: number; // Days Sales Outstanding
    topOverdueDebtors: Array<{
      partyId: string;
      partyName: string;
      outstandingBalance: number;
      oldestInvoiceDays: number;
    }>;
  };
  payables: {
    summary: AgingBucketSummary;
    dpoDays: number; // Days Payable Outstanding
    topOverdueVendors: Array<{
      partyId: string;
      partyName: string;
      outstandingBalance: number;
      oldestInvoiceDays: number;
    }>;
  };
  netWorkingCapitalExposure: number; // Receivables - Payables
}

export class SubledgerEngine {
  private items: Map<string, SubledgerItem> = new Map();

  constructor() {
    this.seedDefaultSubledgerItems();
  }

  private seedDefaultSubledgerItems(): void {
    const today = new Date();
    const daysAgo = (days: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() - days);
      return d.toISOString().split('T')[0];
    };

    const defaults: SubledgerItem[] = [
      // Receivables (AR)
      {
        id: 'AR-001',
        type: SubledgerEntryType.RECEIVABLE,
        partyId: 'CUST-MAH-001',
        partyName: 'Tata Motors Fleet Solutions Ltd',
        invoiceNumber: 'INV-2026-0089',
        invoiceDate: daysAgo(18),
        dueDate: daysAgo(-27), // Due in 27 days
        grossAmount: 4500000,
        paidAmount: 0,
        outstandingBalance: 4500000,
        currency: SystemDefaults.DEFAULT_CURRENCY,
        status: SubledgerStatus.OPEN,
      },
      {
        id: 'AR-002',
        type: SubledgerEntryType.RECEIVABLE,
        partyId: 'CUST-BLR-002',
        partyName: 'Bangalore Metro Rail Logistics Corp',
        invoiceNumber: 'INV-2026-0041',
        invoiceDate: daysAgo(75),
        dueDate: daysAgo(15), // Overdue by 15 days
        grossAmount: 12000000,
        paidAmount: 2000000,
        outstandingBalance: 10000000,
        currency: SystemDefaults.DEFAULT_CURRENCY,
        status: SubledgerStatus.PARTIALLY_PAID,
      },
      {
        id: 'AR-003',
        type: SubledgerEntryType.RECEIVABLE,
        partyId: 'CUST-PUN-003',
        partyName: 'Bharat Forge Heavy Engineering',
        invoiceNumber: 'INV-2025-1102',
        invoiceDate: daysAgo(110),
        dueDate: daysAgo(50), // Overdue by 50 days
        grossAmount: 3200000,
        paidAmount: 0,
        outstandingBalance: 3200000,
        currency: SystemDefaults.DEFAULT_CURRENCY,
        status: SubledgerStatus.OPEN,
      },

      // Payables (AP)
      {
        id: 'AP-001',
        type: SubledgerEntryType.PAYABLE,
        partyId: 'VEND-JINDAL-001',
        partyName: 'Jindal Steel & Power Ltd',
        invoiceNumber: 'V-INV-9921',
        invoiceDate: daysAgo(22),
        dueDate: daysAgo(-23),
        grossAmount: 7800000,
        paidAmount: 0,
        outstandingBalance: 7800000,
        currency: SystemDefaults.DEFAULT_CURRENCY,
        status: SubledgerStatus.OPEN,
      },
      {
        id: 'AP-002',
        type: SubledgerEntryType.PAYABLE,
        partyId: 'VEND-MICROTECH-002',
        partyName: 'MicroTech Precision Forgings MSME',
        invoiceNumber: 'V-INV-4412',
        invoiceDate: daysAgo(38),
        dueDate: daysAgo(-7), // Due soon under Sec 43B(h)
        grossAmount: 1450000,
        paidAmount: 0,
        outstandingBalance: 1450000,
        currency: SystemDefaults.DEFAULT_CURRENCY,
        status: SubledgerStatus.OPEN,
      },
      {
        id: 'AP-003',
        type: SubledgerEntryType.PAYABLE,
        partyId: 'VEND-LUBRICANTS-003',
        partyName: 'Castrol India Industrial Oils',
        invoiceNumber: 'V-INV-8120',
        invoiceDate: daysAgo(85),
        dueDate: daysAgo(25), // Overdue
        grossAmount: 850000,
        paidAmount: 0,
        outstandingBalance: 850000,
        currency: SystemDefaults.DEFAULT_CURRENCY,
        status: SubledgerStatus.OPEN,
      },
    ];

    for (const item of defaults) {
      this.items.set(item.id, item);
    }
  }

  public recordInvoice(item: SubledgerItem): void {
    this.items.set(item.id, item);
  }

  public recordPayment(id: string, paymentAmount: number): SubledgerItem {
    const item = this.items.get(id);
    if (!item) throw new Error(`Subledger item '${id}' not found.`);

    const newPaid = item.paidAmount + paymentAmount;
    const newOutstanding = Math.max(0, item.grossAmount - newPaid);

    item.paidAmount = newPaid;
    item.outstandingBalance = newOutstanding;
    item.status = newOutstanding === 0 ? SubledgerStatus.PAID : SubledgerStatus.PARTIALLY_PAID;

    this.items.set(id, item);
    return item;
  }

  public getAllItems(): SubledgerItem[] {
    return Array.from(this.items.values());
  }

  /**
   * Generates real-time Aging Report for AR and AP with 0-30, 31-60, 61-90, 90+ buckets
   */
  public generateAgingReport(): SubledgerAgingReport {
    const today = new Date();
    const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

    const calcDaysDiff = (dateStr: string) => {
      const invDate = new Date(dateStr);
      const diffTime = today.getTime() - invDate.getTime();
      return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    };

    const arSummary: AgingBucketSummary = {
      current0to30: 0,
      days31to60: 0,
      days61to90: 0,
      above90: 0,
      totalOutstanding: 0,
      itemCount: 0,
    };

    const apSummary: AgingBucketSummary = {
      current0to30: 0,
      days31to60: 0,
      days61to90: 0,
      above90: 0,
      totalOutstanding: 0,
      itemCount: 0,
    };

    const arDebtorsMap = new Map<string, { partyId: string; partyName: string; outstanding: number; oldestDays: number }>();
    const apVendorsMap = new Map<string, { partyId: string; partyName: string; outstanding: number; oldestDays: number }>();

    for (const item of this.items.values()) {
      if (item.outstandingBalance <= 0) continue;

      const ageDays = calcDaysDiff(item.invoiceDate);
      const isAr = item.type === SubledgerEntryType.RECEIVABLE;
      const targetSummary = isAr ? arSummary : apSummary;
      const targetMap = isAr ? arDebtorsMap : apVendorsMap;

      targetSummary.totalOutstanding += item.outstandingBalance;
      targetSummary.itemCount += 1;

      if (ageDays <= 30) {
        targetSummary.current0to30 += item.outstandingBalance;
      } else if (ageDays <= 60) {
        targetSummary.days31to60 += item.outstandingBalance;
      } else if (ageDays <= 90) {
        targetSummary.days61to90 += item.outstandingBalance;
      } else {
        targetSummary.above90 += item.outstandingBalance;
      }

      const existing = targetMap.get(item.partyId) || {
        partyId: item.partyId,
        partyName: item.partyName,
        outstanding: 0,
        oldestDays: 0,
      };
      existing.outstanding += item.outstandingBalance;
      existing.oldestDays = Math.max(existing.oldestDays, ageDays);
      targetMap.set(item.partyId, existing);
    }

    // DSO (Days Sales Outstanding) = (Total AR / Total Annual Credit Sales) * 365
    // Estimating benchmark annual sales = 150,000,000 INR
    const estimatedAnnualSales = 150000000;
    const dso = Math.round((arSummary.totalOutstanding / estimatedAnnualSales) * 365);

    // DPO (Days Payable Outstanding) = (Total AP / Total COGS) * 365
    const estimatedAnnualCogs = 95000000;
    const dpo = Math.round((apSummary.totalOutstanding / estimatedAnnualCogs) * 365);

    return {
      asOfDate: today.toISOString().split('T')[0],
      receivables: {
        summary: {
          current0to30: round2(arSummary.current0to30),
          days31to60: round2(arSummary.days31to60),
          days61to90: round2(arSummary.days61to90),
          above90: round2(arSummary.above90),
          totalOutstanding: round2(arSummary.totalOutstanding),
          itemCount: arSummary.itemCount,
        },
        dsoDays: dso,
        topOverdueDebtors: Array.from(arDebtorsMap.values())
          .sort((a, b) => b.outstanding - a.outstanding)
          .slice(0, 5)
          .map((d) => ({
            partyId: d.partyId,
            partyName: d.partyName,
            outstandingBalance: round2(d.outstanding),
            oldestInvoiceDays: d.oldestDays,
          })),
      },
      payables: {
        summary: {
          current0to30: round2(apSummary.current0to30),
          days31to60: round2(apSummary.days31to60),
          days61to90: round2(apSummary.days61to90),
          above90: round2(apSummary.above90),
          totalOutstanding: round2(apSummary.totalOutstanding),
          itemCount: apSummary.itemCount,
        },
        dpoDays: dpo,
        topOverdueVendors: Array.from(apVendorsMap.values())
          .sort((a, b) => b.outstanding - a.outstanding)
          .slice(0, 5)
          .map((v) => ({
            partyId: v.partyId,
            partyName: v.partyName,
            outstandingBalance: round2(v.outstanding),
            oldestInvoiceDays: v.oldestDays,
          })),
      },
      netWorkingCapitalExposure: round2(arSummary.totalOutstanding - apSummary.totalOutstanding),
    };
  }
}
