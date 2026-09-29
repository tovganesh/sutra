/**
 * Sutra Multi-Currency & Parallel Ledger Accounting (SAP FI-GL Parallel Accounting Equivalent)
 * Types and interfaces for real-time exchange rates, foreign exchange (Forex) revaluation,
 * parallel accounting ledgers (0L Leading vs 2L IFRS/US GAAP), and global tax jurisdiction plugins.
 */

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'SGD' | 'JPY';

export type ExchangeRateType = 'SPOT' | 'CLOSING' | 'MONTHLY_AVERAGE';

export interface ExchangeRate {
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  rateDate: string;
  rateType: ExchangeRateType;
  rate: number;
}

export type LedgerType = 'LEADING' | 'NON_LEADING' | 'EXTENSION';

export interface AccountingLedger {
  ledgerCode: string; // e.g. '0L' (Local GAAP / Ind AS), '2L' (IFRS / US GAAP)
  name: string;
  ledgerType: LedgerType;
  baseCurrency: CurrencyCode;
  description: string;
  isActive: boolean;
}

export interface ParallelJournalEntryLine {
  accountCode: string;
  accountName: string;
  amountLocal: number;     // in company operating currency (e.g. INR)
  amountGroup: number;     // in group currency (e.g. USD)
  currency: CurrencyCode;
  debit: number;
  credit: number;
  costCenter?: string;
}

export interface ParallelJournalEntry {
  documentNumber: string;
  ledgerGroup: 'ALL' | string; // 'ALL' or specific ledger code like '0L' or '2L'
  postingDate: string;
  reference: string;
  narrative: string;
  transactionCurrency: CurrencyCode;
  exchangeRateUsed: number;
  lines: ParallelJournalEntryLine[];
}

export interface OpenMonetaryItem {
  itemId: string;
  documentNumber: string;
  itemType: 'RECEIVABLE' | 'PAYABLE';
  counterpartyName: string;
  foreignCurrency: CurrencyCode;
  foreignAmount: number;
  originalBookingRate: number;
  bookedLocalAmount: number;
}

export interface ForexRevaluationResult {
  revaluationId: string;
  valuationDate: string;
  closingRate: number;
  currency: CurrencyCode;
  itemsEvaluated: number;
  totalUnrealizedGain: number;
  totalUnrealizedLoss: number;
  netForexImpact: number;
  glVoucherLines: Array<{
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
  }>;
}

export interface GlobalTaxJurisdictionPlugin {
  countryCode: string;
  countryName: string;
  calculateTax(params: {
    taxableAmount: number;
    customerStateOrRegion?: string;
    companyStateOrRegion?: string;
    taxRegistrationNumber?: string;
  }): {
    taxRatePercent: number;
    taxAmount: number;
    taxBreakdown: Record<string, number>;
    isReverseChargeApplicable: boolean;
  };
}
