/**
 * Sutra Treasury & Bank Statement Reconciliation (SAP TRM / FI-BL Equivalent)
 * Types and interfaces for House Banks, Company Bank Accounts,
 * Electronic Bank Statements (MT940/CAMT/CSV), Automated 2-Way Reconciliation,
 * Bank Reconciliation Statement (BRS), and Cash Liquidity Forecasting.
 */

export type BankAccountType = 
  | 'CURRENT' 
  | 'SAVINGS' 
  | 'CASH_CREDIT' 
  | 'ESCROW';

export type StatementFormat = 
  | 'MT940' 
  | 'CAMT_053' 
  | 'CSV';

export type StatementStatus = 
  | 'IMPORTED' 
  | 'PARTIALLY_RECONCILED' 
  | 'RECONCILED';

export type LineReconciliationStatus = 
  | 'UNMATCHED' 
  | 'MATCHED' 
  | 'AUTO_CLEARED' 
  | 'MANUAL_CLEARED';

export interface HouseBank {
  bankId: string;
  bankName: string;
  branchName: string;
  ifscCode: string;
  swiftCode: string;
  country: string;
}

export interface CompanyBankAccount {
  accountId: string;
  bankId: string;
  accountNumber: string;
  accountType: BankAccountType;
  currency: string;
  glAccount: string;
  glClearingAccount: string;
  currentBookBalance: number;
  reconciledBankBalance: number;
  lastReconciliationDate?: string;
}

export interface BankStatementLine {
  lineId: string;
  transactionDate: string;
  valueDate: string;
  transactionReference: string;
  direction: 'CREDIT' | 'DEBIT'; // CREDIT increases bank balance, DEBIT decreases
  amount: number;
  counterpartyName?: string;
  narrative: string;
  reconciliationStatus: LineReconciliationStatus;
  matchedGlEntryNumber?: string;
  matchScore?: number; // 0 - 100 confidence
}

export interface BankStatement {
  statementId: string;
  accountId: string;
  statementNumber: string;
  openingDate: string;
  closingDate: string;
  openingBalance: number;
  closingBalance: number;
  format: StatementFormat;
  lines: BankStatementLine[];
  status: StatementStatus;
}

export interface GLClearingItem {
  entryNumber: string;
  date: string;
  reference: string;
  direction: 'DEBIT' | 'CREDIT'; // in GL: DEBIT increases asset, CREDIT decreases
  amount: number;
  accountCode: string;
  description: string;
  isCleared: boolean;
}

export interface BankReconciliationResult {
  statementId: string;
  accountId: string;
  totalLines: number;
  matchedCount: number;
  unmatchedCount: number;
  matchedAmount: number;
  unmatchedAmount: number;
  reconciledLines: BankStatementLine[];
}

export interface BankReconciliationStatement {
  statementId: string;
  accountId: string;
  asOfDate: string;
  balanceAsPerBank: number;
  addDepositsInTransit: Array<{ reference: string; amount: number; date: string }>;
  lessUnpresentedCheques: Array<{ reference: string; amount: number; date: string }>;
  adjustedBankBalance: number;
  balanceAsPerCompanyBooks: number;
  variance: number;
  isBalanced: boolean;
}

export interface CashLiquidityBucket {
  expectedReceivables: number;
  expectedPayables: number;
  netCashFlow: number;
  projectedClosingCash: number;
}

export interface CashLiquidityForecast {
  asOfDate: string;
  currency: string;
  currentCashBalance: number;
  forecast30Days: CashLiquidityBucket;
  forecast60Days: CashLiquidityBucket;
  forecast90Days: CashLiquidityBucket;
}
