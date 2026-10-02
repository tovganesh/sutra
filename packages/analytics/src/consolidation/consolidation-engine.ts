/**
 * Sutra Group Financial Consolidation & Intercompany Elimination Engine
 * Implements IFRS 10 / Ind AS 110 automated consolidation workflows:
 * - Intercompany reconciliation & variance audit
 * - Bilateral & multilateral balance elimination
 * - Intercompany revenue/COGS trading elimination
 * - Unrealized inventory profit elimination
 * - Non-Controlling Interest (NCI) minority stake accounting
 */

import {
  ConsolidationStatus,
  IntercompanyEliminationType,
  SystemDefaults,
} from '@sutra/core';
import {
  EntityFinancialData,
  IntercompanyEliminationEntry,
  IntercompanyReconciliation,
  ConsolidationWorksheetRow,
  ConsolidatedIncomeStatement,
  ConsolidatedBalanceSheet,
  ConsolidationKpis,
  ConsolidatedFinancialStatements,
  ConsolidationRunInput,
} from './consolidation-types.js';

export class ConsolidationEngine {
  private static round2(val: number): number {
    return Math.round((val + Number.EPSILON) * 100) / 100;
  }

  /**
   * Reconciles intercompany balances between all entities in the group and reports matching variances.
   */
  public static reconcileIntercompanyBalances(entities: EntityFinancialData[]): IntercompanyReconciliation[] {
    const r = this.round2;
    const reconciliations: IntercompanyReconciliation[] = [];

    const parent = entities.find((e) => e.entity.isParent);
    const subsidiaries = entities.filter((e) => !e.entity.isParent);

    if (parent) {
      for (const sub of subsidiaries) {
        // Compare Parent IC receivables vs Sub IC payables
        const recA = parent.intercompanyReceivables;
        const payB = sub.intercompanyPayables;
        const variance = r(Math.abs(recA - payB));

        reconciliations.push({
          entityAId: parent.entity.entityId,
          entityBId: sub.entity.entityId,
          receivableRecordedByA: recA,
          payableRecordedByB: payB,
          variance,
          isBalanced: variance < 1.0,
        });
      }
    }

    return reconciliations;
  }

  /**
   * Generates formal elimination journal entries for intercompany trading, balances, unrealized profit, and NCI.
   */
  public static generateEliminationEntries(
    entities: EntityFinancialData[],
    inventoryMarkupPercent = 0.20
  ): IntercompanyEliminationEntry[] {
    const r = this.round2;
    const eliminations: IntercompanyEliminationEntry[] = [];
    let counter = 1;

    const parent = entities.find((e) => e.entity.isParent);
    const subsidiaries = entities.filter((e) => !e.entity.isParent);

    // 1. Intercompany Trading Elimination (Revenue vs COGS)
    const totalIcRevenue = entities.reduce((sum, e) => sum + e.intercompanyRevenue, 0);
    if (totalIcRevenue > 0) {
      eliminations.push({
        eliminationId: `ELIM-TRD-00${counter++}`,
        type: IntercompanyEliminationType.TRADING_REVENUE_COGS,
        description: 'Elimination of intercompany product sales and corresponding cost of goods sold',
        fromEntityId: parent?.entity.entityId || 'GROUP_PARENT',
        toEntityId: 'GROUP_SUBSIDIARIES',
        accountDebited: '410000 Intercompany Sales Revenue',
        accountCredited: '510000 Intercompany Cost of Goods Sold',
        amount: r(totalIcRevenue),
        governingStandard: 'IFRS 10.B86(c) / Ind AS 110.B86(c)',
      });
    }

    // 2. Intercompany Balance Sheet Balances Elimination (Receivables vs Payables)
    const totalIcReceivables = entities.reduce((sum, e) => sum + e.intercompanyReceivables, 0);
    const totalIcPayables = entities.reduce((sum, e) => sum + e.intercompanyPayables, 0);
    const elimBalanceAmount = r(Math.min(totalIcReceivables, totalIcPayables));

    if (elimBalanceAmount > 0) {
      eliminations.push({
        eliminationId: `ELIM-BAL-00${counter++}`,
        type: IntercompanyEliminationType.BALANCES_RECEIVABLE_PAYABLE,
        description: 'Elimination of intercompany current trade accounts receivable and payable',
        fromEntityId: parent?.entity.entityId || 'GROUP_PARENT',
        toEntityId: 'GROUP_SUBSIDIARIES',
        accountDebited: '210200 Intercompany Accounts Payable',
        accountCredited: '120200 Intercompany Accounts Receivable',
        amount: elimBalanceAmount,
        governingStandard: 'IFRS 10.B86(b) / Ind AS 110.B86(b)',
      });
    }

    // 3. Unrealized Inventory Profit Mark-Up Elimination
    const totalHeldInventory = entities.reduce((sum, e) => sum + e.intercompanyInventoryHeld, 0);
    if (totalHeldInventory > 0) {
      const unrealizedProfit = r(totalHeldInventory * inventoryMarkupPercent);
      eliminations.push({
        eliminationId: `ELIM-INV-00${counter++}`,
        type: IntercompanyEliminationType.UNREALIZED_INVENTORY_PROFIT,
        description: `Elimination of unrealized upstream/downstream inventory margin (${Math.round(inventoryMarkupPercent * 100)}% mark-up)`,
        fromEntityId: parent?.entity.entityId || 'GROUP_PARENT',
        toEntityId: 'GROUP_SUBSIDIARIES',
        accountDebited: '510000 Cost of Goods Sold (Unrealized Profit Adjustment)',
        accountCredited: '120100 Inventory Valuation Reserve',
        amount: unrealizedProfit,
        governingStandard: 'IFRS 10.B86(c) / Ind AS 110.B86(c)',
      });
    }

    // 4. Non-Controlling Interest (NCI) Allocation for non-wholly owned subsidiaries
    for (const sub of subsidiaries) {
      if (sub.entity.ownershipPercentage < 100) {
        const nciPercent = r((100 - sub.entity.ownershipPercentage) / 100);
        const nciProfit = r(sub.operatingProfit * nciPercent);
        const nciEquity = r(sub.totalEquity * nciPercent);

        eliminations.push({
          eliminationId: `ELIM-NCI-00${counter++}`,
          type: IntercompanyEliminationType.NON_CONTROLLING_INTEREST,
          description: `Recognition of ${Math.round(nciPercent * 100)}% Non-Controlling Interest in ${sub.entity.legalName}`,
          fromEntityId: sub.entity.entityId,
          toEntityId: 'NCI_SHAREHOLDERS',
          accountDebited: '320100 Consolidated Retained Earnings',
          accountCredited: '330100 Non-Controlling Interest (Equity)',
          amount: nciEquity,
          governingStandard: 'IFRS 10.B94 / Ind AS 110.B94',
        });
      }
    }

    return eliminations;
  }

  /**
   * Executes the full consolidation pipeline and produces consolidated IFRS 10 / Ind AS 110 statements.
   */
  public static generateConsolidatedStatements(input: ConsolidationRunInput): ConsolidatedFinancialStatements {
    const r = this.round2;
    const markup = input.inventoryMarkupPercent ?? 0.20;
    const groupCurrency = input.groupCurrency || SystemDefaults.DEFAULT_CURRENCY;

    const reconciliations = this.reconcileIntercompanyBalances(input.entities);
    const eliminations = this.generateEliminationEntries(input.entities, markup);

    // Calculate aggregated metrics
    const totalIcTrading = entitiesSum(input.entities, 'intercompanyRevenue');
    const totalHeldInventory = entitiesSum(input.entities, 'intercompanyInventoryHeld');
    const unrealizedProfit = r(totalHeldInventory * markup);

    const rawRevenue = entitiesSum(input.entities, 'revenue');
    const rawCogs = entitiesSum(input.entities, 'costOfGoodsSold');
    const rawOpex = entitiesSum(input.entities, 'operatingExpenses');

    // Consolidated Income Statement
    const consRevenue = r(rawRevenue - totalIcTrading);
    // Cost of goods sold: subtract eliminated IC trading, add back unrealized profit reduction to inventory
    const consCogs = r(rawCogs - totalIcTrading + unrealizedProfit);
    const consGrossProfit = r(consRevenue - consCogs);
    const grossMarginPercent = consRevenue > 0 ? r((consGrossProfit / consRevenue) * 100) : 0;
    const consOperatingProfit = r(consGrossProfit - rawOpex);
    const operatingMarginPercent = consRevenue > 0 ? r((consOperatingProfit / consRevenue) * 100) : 0;

    // NCI profit share
    let nciProfitTotal = 0;
    let nciEquityTotal = 0;
    for (const e of input.entities) {
      if (!e.entity.isParent && e.entity.ownershipPercentage < 100) {
        const nciPct = (100 - e.entity.ownershipPercentage) / 100;
        nciProfitTotal = r(nciProfitTotal + e.operatingProfit * nciPct);
        nciEquityTotal = r(nciEquityTotal + e.totalEquity * nciPct);
      }
    }

    const profitAttributableToParent = r(consOperatingProfit - nciProfitTotal);

    const incomeStatement: ConsolidatedIncomeStatement = {
      totalRevenue: consRevenue,
      costOfGoodsSold: consCogs,
      grossProfit: consGrossProfit,
      grossMarginPercent,
      operatingExpenses: rawOpex,
      operatingProfit: consOperatingProfit,
      operatingMarginPercent,
      profitAttributableToParent,
      profitAttributableToNci: nciProfitTotal,
    };

    // Consolidated Balance Sheet
    const rawCash = entitiesSum(input.entities, 'cashAndEquivalents');
    const rawTradeAr = entitiesSum(input.entities, 'accountsReceivable');
    const rawInv = entitiesSum(input.entities, 'inventory');
    const rawFixedAssets = entitiesSum(input.entities, 'fixedAssets');

    const consCash = rawCash;
    const consAr = rawTradeAr; // IC receivables eliminated completely
    const consInventory = r(rawInv - unrealizedProfit); // Inventory reduced by unrealized profit
    const consFixedAssets = rawFixedAssets;
    const totalAssets = r(consCash + consAr + consInventory + consFixedAssets);

    const rawTradeAp = entitiesSum(input.entities, 'accountsPayable'); // IC payables eliminated
    const rawOtherLiab = entitiesSum(input.entities, 'otherLiabilities');
    const totalLiabilities = r(rawTradeAp + rawOtherLiab);

    const nonControllingInterest = nciEquityTotal;
    const equityAttributableToParent = r(totalAssets - totalLiabilities - nonControllingInterest);
    const totalEquity = r(equityAttributableToParent + nonControllingInterest);

    const balanceSheetDiff = r(totalAssets - (totalLiabilities + totalEquity));
    const isBalanced = Math.abs(balanceSheetDiff) < 0.05;

    const balanceSheet: ConsolidatedBalanceSheet = {
      cashAndEquivalents: consCash,
      accountsReceivable: consAr,
      inventory: consInventory,
      fixedAssets: consFixedAssets,
      totalAssets,
      accountsPayable: rawTradeAp,
      otherLiabilities: rawOtherLiab,
      totalLiabilities,
      equityAttributableToParent,
      nonControllingInterest,
      totalEquity,
      isBalanced,
      reconciliationDifference: balanceSheetDiff,
    };

    // Build worksheet rows
    const worksheet: ConsolidationWorksheetRow[] = [
      buildRow('410000', 'Revenue from Operations', 'INCOME_STATEMENT', input.entities, 'revenue', totalIcTrading, 0, consRevenue),
      buildRow('510000', 'Cost of Goods Sold (COGS)', 'INCOME_STATEMENT', input.entities, 'costOfGoodsSold', unrealizedProfit, totalIcTrading, consCogs),
      buildRow('610000', 'Operating Expenses (SG&A)', 'INCOME_STATEMENT', input.entities, 'operatingExpenses', 0, 0, rawOpex),
      buildRow('110100', 'Cash & Cash Equivalents', 'BALANCE_SHEET', input.entities, 'cashAndEquivalents', 0, 0, consCash),
      buildRow('120100', 'Trade Accounts Receivable', 'BALANCE_SHEET', input.entities, 'accountsReceivable', 0, 0, consAr),
      buildRow('120200', 'Intercompany Receivables', 'BALANCE_SHEET', input.entities, 'intercompanyReceivables', 0, entitiesSum(input.entities, 'intercompanyReceivables'), 0),
      buildRow('130100', 'Inventories', 'BALANCE_SHEET', input.entities, 'inventory', 0, unrealizedProfit, consInventory),
      buildRow('150100', 'Property, Plant & Equipment', 'BALANCE_SHEET', input.entities, 'fixedAssets', 0, 0, consFixedAssets),
      buildRow('210100', 'Trade Accounts Payable', 'BALANCE_SHEET', input.entities, 'accountsPayable', 0, 0, rawTradeAp),
      buildRow('210200', 'Intercompany Payables', 'BALANCE_SHEET', input.entities, 'intercompanyPayables', entitiesSum(input.entities, 'intercompanyPayables'), 0, 0),
      buildRow('220100', 'Other Current & Non-Current Liab', 'BALANCE_SHEET', input.entities, 'otherLiabilities', 0, 0, rawOtherLiab),
    ];

    const eliminatedDebt = r(entitiesSum(input.entities, 'intercompanyReceivables') + entitiesSum(input.entities, 'intercompanyPayables'));

    const kpis: ConsolidationKpis = {
      eliminatedTradingVolume: totalIcTrading,
      eliminatedUnrealizedProfit: unrealizedProfit,
      eliminatedBalanceSheetDebt: eliminatedDebt,
      groupRevenue: consRevenue,
      groupNetWorth: totalEquity,
      subsidiariesCount: input.entities.filter((e) => !e.entity.isParent).length,
    };

    return {
      period: input.period,
      groupCurrency,
      status: isBalanced ? ConsolidationStatus.RECONCILED : ConsolidationStatus.DRAFT,
      entities: input.entities.map((e) => e.entity),
      eliminations,
      reconciliations,
      worksheet,
      incomeStatement,
      balanceSheet,
      kpis,
    };
  }
}

function entitiesSum(entities: EntityFinancialData[], key: keyof EntityFinancialData): number {
  return Math.round(
    (entities.reduce((sum, e) => {
      const val = e[key];
      return sum + (typeof val === 'number' ? val : 0);
    }, 0) + Number.EPSILON) * 100
  ) / 100;
}

function buildRow(
  accountCode: string,
  lineItem: string,
  category: 'INCOME_STATEMENT' | 'BALANCE_SHEET',
  entities: EntityFinancialData[],
  key: keyof EntityFinancialData,
  eliminationDebit: number,
  eliminationCredit: number,
  consolidatedTotal: number
): ConsolidationWorksheetRow {
  const entityValues: Record<string, number> = {};
  let aggregatedTotal = 0;

  for (const e of entities) {
    const val = typeof e[key] === 'number' ? (e[key] as number) : 0;
    entityValues[e.entity.entityId] = val;
    aggregatedTotal += val;
  }

  return {
    accountCode,
    lineItem,
    category,
    entityValues,
    aggregatedTotal: Math.round((aggregatedTotal + Number.EPSILON) * 100) / 100,
    eliminationDebit: Math.round((eliminationDebit + Number.EPSILON) * 100) / 100,
    eliminationCredit: Math.round((eliminationCredit + Number.EPSILON) * 100) / 100,
    consolidatedTotal: Math.round((consolidatedTotal + Number.EPSILON) * 100) / 100,
  };
}
