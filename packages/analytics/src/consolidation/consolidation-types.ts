/**
 * Sutra Financial Consolidation & Intercompany Elimination Types
 * Compliant with IFRS 10 (Consolidated Financial Statements) & Ind AS 110
 */

import {
  ConsolidationStatus,
  IntercompanyEliminationType,
  ConsolidationMethod,
} from '@sutra/core';

export interface GroupEntity {
  entityId: string;
  legalName: string;
  country: string;
  functionalCurrency: string;
  ownershipPercentage: number;
  consolidationMethod: ConsolidationMethod;
  isParent: boolean;
}

export interface EntityFinancialData {
  entity: GroupEntity;
  // Income Statement
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  operatingExpenses: number;
  operatingProfit: number;
  intercompanyRevenue: number;
  intercompanyCogs: number;
  // Balance Sheet - Assets
  cashAndEquivalents: number;
  accountsReceivable: number;
  intercompanyReceivables: number;
  inventory: number;
  intercompanyInventoryHeld: number; // Purchased from group affiliate still in stock
  fixedAssets: number;
  totalAssets: number;
  // Balance Sheet - Liabilities & Equity
  accountsPayable: number;
  intercompanyPayables: number;
  otherLiabilities: number;
  totalLiabilities: number;
  shareCapital: number;
  retainedEarnings: number;
  totalEquity: number;
}

export interface IntercompanyEliminationEntry {
  eliminationId: string;
  type: IntercompanyEliminationType;
  description: string;
  fromEntityId: string;
  toEntityId: string;
  accountDebited: string;
  accountCredited: string;
  amount: number;
  governingStandard: string;
}

export interface IntercompanyReconciliation {
  entityAId: string;
  entityBId: string;
  receivableRecordedByA: number;
  payableRecordedByB: number;
  variance: number;
  isBalanced: boolean;
}

export interface ConsolidationWorksheetRow {
  accountCode: string;
  lineItem: string;
  category: 'INCOME_STATEMENT' | 'BALANCE_SHEET';
  entityValues: Record<string, number>;
  aggregatedTotal: number;
  eliminationDebit: number;
  eliminationCredit: number;
  consolidatedTotal: number;
}

export interface ConsolidatedIncomeStatement {
  totalRevenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  grossMarginPercent: number;
  operatingExpenses: number;
  operatingProfit: number;
  operatingMarginPercent: number;
  profitAttributableToParent: number;
  profitAttributableToNci: number;
}

export interface ConsolidatedBalanceSheet {
  cashAndEquivalents: number;
  accountsReceivable: number;
  inventory: number;
  fixedAssets: number;
  totalAssets: number;
  accountsPayable: number;
  otherLiabilities: number;
  totalLiabilities: number;
  equityAttributableToParent: number;
  nonControllingInterest: number;
  totalEquity: number;
  isBalanced: boolean;
  reconciliationDifference: number;
}

export interface ConsolidationKpis {
  eliminatedTradingVolume: number;
  eliminatedUnrealizedProfit: number;
  eliminatedBalanceSheetDebt: number;
  groupRevenue: number;
  groupNetWorth: number;
  subsidiariesCount: number;
}

export interface ConsolidatedFinancialStatements {
  period: string;
  groupCurrency: string;
  status: ConsolidationStatus;
  entities: GroupEntity[];
  eliminations: IntercompanyEliminationEntry[];
  reconciliations: IntercompanyReconciliation[];
  worksheet: ConsolidationWorksheetRow[];
  incomeStatement: ConsolidatedIncomeStatement;
  balanceSheet: ConsolidatedBalanceSheet;
  kpis: ConsolidationKpis;
}

export interface ConsolidationRunInput {
  period: string;
  groupCurrency?: string;
  inventoryMarkupPercent?: number; // e.g. 0.20 for 20% internal gross margin
  entities: EntityFinancialData[];
}
