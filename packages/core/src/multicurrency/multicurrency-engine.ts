/**
 * Sutra Multi-Currency & Parallel Accounting Engine (SAP FI-GL Parallel Accounting Equivalent)
 * Supports multi-currency valuation, IAS 21 / AS 11 foreign exchange revaluation,
 * parallel accounting ledgers (0L Leading vs 2L Non-Leading), and global tax jurisdiction plugins.
 */

import {
  CurrencyCode,
  ExchangeRate,
  ExchangeRateType,
  AccountingLedger,
  ParallelJournalEntry,
  OpenMonetaryItem,
  ForexRevaluationResult,
  GlobalTaxJurisdictionPlugin,
} from './multicurrency-types.js';
import {
  ParallelLedgerType,
  ExchangeRateCategory,
  SubledgerEntryType,
  SystemDefaults,
} from '../common/constants.js';

export class MultiCurrencyEngine {
  private rates: Map<string, ExchangeRate> = new Map();
  private ledgers: Map<string, AccountingLedger> = new Map();
  private openItems: Map<string, OpenMonetaryItem> = new Map();
  private journalEntries: ParallelJournalEntry[] = [];
  private taxPlugins: Map<string, GlobalTaxJurisdictionPlugin> = new Map();

  constructor() {
    this.seedDefaults();
  }

  // =================================================================
  // Exchange Rates Management
  // =================================================================

  public setExchangeRate(
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode,
    rate: number,
    rateType: ExchangeRateType = 'SPOT',
    rateDate: string = new Date().toISOString().split('T')[0]
  ): ExchangeRate {
    if (rate <= 0) throw new Error('Exchange rate must be positive.');
    const key = `${fromCurrency}_${toCurrency}_${rateType}`;
    const exchangeRate: ExchangeRate = {
      fromCurrency,
      toCurrency,
      rateDate,
      rateType,
      rate,
    };
    this.rates.set(key, exchangeRate);
    return exchangeRate;
  }

  public getExchangeRate(
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode,
    rateType: ExchangeRateType = 'SPOT'
  ): number {
    if (fromCurrency === toCurrency) return 1.0;
    const directKey = `${fromCurrency}_${toCurrency}_${rateType}`;
    const direct = this.rates.get(directKey);
    if (direct) return direct.rate;

    const inverseKey = `${toCurrency}_${fromCurrency}_${rateType}`;
    const inverse = this.rates.get(inverseKey);
    if (inverse) return Math.round((1.0 / inverse.rate) * 10000) / 10000;

    throw new Error(`Exchange rate not found for ${fromCurrency} -> ${toCurrency} (${rateType}).`);
  }

  public convertAmount(
    amount: number,
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode,
    rateType: ExchangeRateType = 'SPOT'
  ): number {
    const rate = this.getExchangeRate(fromCurrency, toCurrency, rateType);
    return Math.round(amount * rate * 100) / 100;
  }

  // =================================================================
  // Parallel Accounting Ledgers (SAP 0L vs 2L)
  // =================================================================

  public registerLedger(ledger: AccountingLedger): AccountingLedger {
    if (this.ledgers.has(ledger.ledgerCode)) {
      throw new Error(`Ledger ${ledger.ledgerCode} is already registered.`);
    }
    this.ledgers.set(ledger.ledgerCode, ledger);
    return ledger;
  }

  public getLedgers(): AccountingLedger[] {
    return Array.from(this.ledgers.values());
  }

  public postParallelJournal(
    entryData: Omit<ParallelJournalEntry, 'documentNumber'>
  ): ParallelJournalEntry {
    const totalDebit = entryData.lines.reduce((acc, l) => acc + l.debit, 0);
    const totalCredit = entryData.lines.reduce((acc, l) => acc + l.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(
        `Parallel journal entry is unbalanced. Total Debit: ${totalDebit}, Total Credit: ${totalCredit}.`
      );
    }

    const docNum = `DOC-PAR-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const fullEntry: ParallelJournalEntry = {
      documentNumber: docNum,
      ...entryData,
    };

    this.journalEntries.push(fullEntry);
    return fullEntry;
  }

  public getParallelJournals(ledgerGroup?: string): ParallelJournalEntry[] {
    if (ledgerGroup && ledgerGroup !== 'ALL') {
      return this.journalEntries.filter(
        (j) => j.ledgerGroup === 'ALL' || j.ledgerGroup === ledgerGroup
      );
    }
    return this.journalEntries;
  }

  // =================================================================
  // Foreign Exchange Revaluation (IAS 21 / AS 11)
  // =================================================================

  public addOpenMonetaryItem(item: OpenMonetaryItem): OpenMonetaryItem {
    this.openItems.set(item.itemId, item);
    return item;
  }

  public getOpenMonetaryItems(): OpenMonetaryItem[] {
    return Array.from(this.openItems.values());
  }

  public executeForexRevaluation(
    currency: CurrencyCode,
    closingRate: number,
    valuationDate: string = new Date().toISOString().split('T')[0]
  ): ForexRevaluationResult {
    let totalUnrealizedGain = 0;
    let totalUnrealizedLoss = 0;
    let count = 0;

    const matchingItems = Array.from(this.openItems.values()).filter(
      (i) => i.foreignCurrency === currency
    );

    for (const item of matchingItems) {
      count++;
      const currentValuationLocal = Math.round(item.foreignAmount * closingRate);
      const difference = currentValuationLocal - item.bookedLocalAmount;

      if (item.itemType === 'RECEIVABLE') {
        if (difference > 0) {
          totalUnrealizedGain += difference;
        } else {
          totalUnrealizedLoss += Math.abs(difference);
        }
      } else {
        // PAYABLE: If currency appreciates, we owe more local currency = loss
        if (difference > 0) {
          totalUnrealizedLoss += difference;
        } else {
          totalUnrealizedGain += Math.abs(difference);
        }
      }
    }

    const netForexImpact = totalUnrealizedGain - totalUnrealizedLoss;
    const glVoucherLines: Array<{ accountCode: string; accountName: string; debit: number; credit: number }> = [];

    if (totalUnrealizedGain > 0) {
      glVoucherLines.push({
        accountCode: '110200',
        accountName: `Foreign Currency Monetary Asset Revaluation (${currency})`,
        debit: totalUnrealizedGain,
        credit: 0,
      });
      glVoucherLines.push({
        accountCode: '420100',
        accountName: 'Unrealized Foreign Exchange (Forex) Gain',
        debit: 0,
        credit: totalUnrealizedGain,
      });
    }

    if (totalUnrealizedLoss > 0) {
      glVoucherLines.push({
        accountCode: '540200',
        accountName: 'Unrealized Foreign Exchange (Forex) Loss',
        debit: totalUnrealizedLoss,
        credit: 0,
      });
      glVoucherLines.push({
        accountCode: '210200',
        accountName: `Foreign Currency Monetary Liability Revaluation (${currency})`,
        debit: 0,
        credit: totalUnrealizedLoss,
      });
    }

    const revaluationId = `FX-REV-${valuationDate.replace(/-/g, '')}-${currency}`;

    return {
      revaluationId,
      valuationDate,
      closingRate,
      currency,
      itemsEvaluated: count,
      totalUnrealizedGain,
      totalUnrealizedLoss,
      netForexImpact,
      glVoucherLines,
    };
  }

  // =================================================================
  // Global Tax Jurisdiction Plugin System
  // =================================================================

  public registerTaxPlugin(plugin: GlobalTaxJurisdictionPlugin) {
    this.taxPlugins.set(plugin.countryCode.toUpperCase(), plugin);
  }

  public calculateJurisdictionTax(
    countryCode: string,
    params: {
      taxableAmount: number;
      customerStateOrRegion?: string;
      companyStateOrRegion?: string;
      taxRegistrationNumber?: string;
    }
  ) {
    const plugin = this.taxPlugins.get(countryCode.toUpperCase());
    if (!plugin) {
      throw new Error(`No tax plugin registered for country code: ${countryCode}`);
    }
    return plugin.calculateTax(params);
  }

  // =================================================================
  // Defaults & Seeding
  // =================================================================

  private seedDefaults() {
    // Standard exchange rates (Base currency: INR)
    this.setExchangeRate('USD', SystemDefaults.DEFAULT_CURRENCY, 83.50, ExchangeRateCategory.SPOT);
    this.setExchangeRate('USD', SystemDefaults.DEFAULT_CURRENCY, 84.00, ExchangeRateCategory.CLOSING);
    this.setExchangeRate('EUR', SystemDefaults.DEFAULT_CURRENCY, 91.20, ExchangeRateCategory.SPOT);
    this.setExchangeRate('GBP', SystemDefaults.DEFAULT_CURRENCY, 108.50, ExchangeRateCategory.SPOT);
    this.setExchangeRate('AED', SystemDefaults.DEFAULT_CURRENCY, 22.75, ExchangeRateCategory.SPOT);

    // Standard Ledgers (SAP FI-GL Parallel Ledgers)
    this.registerLedger({
      ledgerCode: '0L',
      name: 'Leading Ledger (Local GAAP & Indian AS)',
      ledgerType: ParallelLedgerType.LEADING,
      baseCurrency: SystemDefaults.DEFAULT_CURRENCY,
      description: 'Primary statutory ledger adhering to MCA Companies Act & Ind AS.',
      isActive: true,
    });

    this.registerLedger({
      ledgerCode: '2L',
      name: 'Non-Leading Ledger (IFRS & US GAAP)',
      ledgerType: ParallelLedgerType.NON_LEADING,
      baseCurrency: 'USD',
      description: 'Parallel global consolidation ledger for international parent reporting.',
      isActive: true,
    });

    // Seed open monetary items
    this.addOpenMonetaryItem({
      itemId: 'ITEM-EXP-USD-01',
      documentNumber: 'EXP-INV-2026-0081',
      itemType: SubledgerEntryType.RECEIVABLE,
      counterpartyName: 'Tesla Energy Logistics Inc (USA)',
      foreignCurrency: 'USD',
      foreignAmount: 100000,
      originalBookingRate: 82.50,
      bookedLocalAmount: 8250000,
    });

    this.addOpenMonetaryItem({
      itemId: 'ITEM-IMP-USD-02',
      documentNumber: 'IMP-PO-2026-0422',
      itemType: SubledgerEntryType.PAYABLE,
      counterpartyName: 'Nvidia AI Robotics Hardware Corp (USA)',
      foreignCurrency: 'USD',
      foreignAmount: 40000,
      originalBookingRate: 83.00,
      bookedLocalAmount: 3320000,
    });

    // Seed Global Tax Plugins
    this.registerTaxPlugin({
      countryCode: 'IN',
      countryName: 'India (GST Council)',
      calculateTax: (p) => {
        const isInterState = p.customerStateOrRegion !== p.companyStateOrRegion;
        const rate = 18;
        const amount = Math.round(p.taxableAmount * (rate / 100));
        const breakdown: Record<string, number> = isInterState
          ? { IGST: amount }
          : { CGST: Math.round(amount / 2), SGST: Math.round(amount / 2) };
        return {
          taxRatePercent: rate,
          taxAmount: amount,
          taxBreakdown: breakdown,
          isReverseChargeApplicable: false,
        };
      },
    });

    this.registerTaxPlugin({
      countryCode: 'US',
      countryName: 'United States (State & Local Nexus)',
      calculateTax: (p) => {
        const rate = 8.25; // Combined California rate
        const amount = Math.round(p.taxableAmount * (rate / 100) * 100) / 100;
        const breakdown: Record<string, number> = {
          'State Sales Tax (6.00%)': Math.round(p.taxableAmount * 0.06 * 100) / 100,
          'County District Tax (1.25%)': Math.round(p.taxableAmount * 0.0125 * 100) / 100,
          'City Tax (1.00%)': Math.round(p.taxableAmount * 0.01 * 100) / 100,
        };
        return {
          taxRatePercent: rate,
          taxAmount: amount,
          taxBreakdown: breakdown,
          isReverseChargeApplicable: false,
        };
      },
    });

    this.registerTaxPlugin({
      countryCode: 'EU',
      countryName: 'European Union (VIES Cross-Border VAT)',
      calculateTax: (p) => {
        const hasViesVat = Boolean(p.taxRegistrationNumber && p.taxRegistrationNumber.length > 8);
        if (hasViesVat) {
          // B2B Intra-community supply reverse charge
          const breakdown: Record<string, number> = { 'Reverse Charge (Art 194)': 0 };
          return {
            taxRatePercent: 0,
            taxAmount: 0,
            taxBreakdown: breakdown,
            isReverseChargeApplicable: true,
          };
        }
        const rate = 20; // Standard EU VAT
        const amount = Math.round(p.taxableAmount * (rate / 100) * 100) / 100;
        const breakdown: Record<string, number> = { 'Standard VAT': amount };
        return {
          taxRatePercent: rate,
          taxAmount: amount,
          taxBreakdown: breakdown,
          isReverseChargeApplicable: false,
        };
      },
    });

    this.registerTaxPlugin({
      countryCode: 'AE',
      countryName: 'United Arab Emirates (FTA VAT)',
      calculateTax: (p) => {
        const rate = 5;
        const amount = Math.round(p.taxableAmount * (rate / 100) * 100) / 100;
        return {
          taxRatePercent: rate,
          taxAmount: amount,
          taxBreakdown: { 'UAE Federal VAT 5%': amount },
          isReverseChargeApplicable: false,
        };
      },
    });
  }
}
