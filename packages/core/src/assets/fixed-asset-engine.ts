/**
 * Sutra Fixed Asset Accounting Engine (SAP FI-AA Equivalent)
 * Manages Asset Master records, Indian Companies Act 2013 Schedule II useful life,
 * SLM and WDV depreciation calculation, and automated monthly GL depreciation runs.
 */

import { GeneralLedgerEngine, JournalLineInput } from '../ledger/ledger-engine.js';
import { AssetStatus, type AssetStatusType } from '../common/constants.js';

export type AssetClass =
  | 'BUILDINGS'
  | 'PLANT_MACHINERY'
  | 'IT_EQUIPMENT'
  | 'VEHICLES'
  | 'FURNITURE_FIXTURES';

export type DepreciationMethod = 'SLM' | 'WDV';

export interface FixedAssetMaster {
  assetId: string;
  name: string;
  assetClass: AssetClass;
  costCenter: string;
  capitalizationDate: string; // YYYY-MM-DD
  originalCost: number;
  salvageValue: number; // Statutorily capped at 5% of original cost under Companies Act 2013
  usefulLifeYears: number; // Per Companies Act 2013 Schedule II (e.g. IT Equipment = 3 yrs, Plant = 15 yrs)
  depreciationMethod: DepreciationMethod;
  accumulatedDepreciation: number;
  currentBookValue: number;
  status: AssetStatusType;
}

export interface DepreciationRunResult {
  runId: string;
  period: string; // YYYY-MM
  assetsProcessed: number;
  totalDepreciationAmount: number;
  assetBreakdowns: Array<{
    assetId: string;
    name: string;
    monthlyDepreciation: number;
    newBookValue: number;
  }>;
  glJournalNumber: string;
  postedAt: string;
}

export class FixedAssetEngine {
  private assets: Map<string, FixedAssetMaster> = new Map();

  constructor() {
    this.seedDefaultAssets();
  }

  private seedDefaultAssets(): void {
    const defaults: FixedAssetMaster[] = [
      {
        assetId: 'AST-PUNE-ROBOT-01',
        name: 'ABB 6-Axis Industrial Welding Robot',
        assetClass: 'PLANT_MACHINERY',
        costCenter: 'CC-MFG-BODY',
        capitalizationDate: '2025-04-01',
        originalCost: 6500000, // ₹65 Lakhs
        salvageValue: 325000,  // 5% salvage
        usefulLifeYears: 15,    // 15 years per Schedule II
        depreciationMethod: 'SLM',
        accumulatedDepreciation: 617500, // ~1.5 years
        currentBookValue: 5882500,
        status: AssetStatus.ACTIVE,
      },
      {
        assetId: 'AST-SRV-HANA-02',
        name: 'Enterprise NVMe High-Performance Database Cluster',
        assetClass: 'IT_EQUIPMENT',
        costCenter: 'CC-IT-INFRA',
        capitalizationDate: '2025-10-01',
        originalCost: 2800000,
        salvageValue: 140000,
        usefulLifeYears: 3,     // 3 years for servers
        depreciationMethod: 'SLM',
        accumulatedDepreciation: 886666,
        currentBookValue: 1913334,
        status: AssetStatus.ACTIVE,
      },
      {
        assetId: 'AST-FLEET-LOG-03',
        name: 'Heavy Transport Logistics Trailer 40T',
        assetClass: 'VEHICLES',
        costCenter: 'CC-LOGISTICS',
        capitalizationDate: '2024-04-01',
        originalCost: 4200000,
        salvageValue: 210000,
        usefulLifeYears: 8,     // 8 years for heavy commercial vehicles
        depreciationMethod: 'WDV',
        accumulatedDepreciation: 1250000,
        currentBookValue: 2950000,
        status: AssetStatus.ACTIVE,
      },
    ];

    for (const a of defaults) {
      this.assets.set(a.assetId, a);
    }
  }

  public registerAsset(asset: FixedAssetMaster): void {
    this.assets.set(asset.assetId, asset);
  }

  public getAsset(assetId: string): FixedAssetMaster | undefined {
    return this.assets.get(assetId);
  }

  public getAllAssets(): FixedAssetMaster[] {
    return Array.from(this.assets.values());
  }

  /**
   * Calculates monthly depreciation for a single asset:
   * SLM: (Original Cost - Salvage Value) / (Useful Life Years * 12)
   * WDV: (Current Book Value * Annual WDV Rate) / 12
   */
  public calculateMonthlyDepreciation(asset: FixedAssetMaster): number {
    if (asset.status !== AssetStatus.ACTIVE || asset.currentBookValue <= asset.salvageValue) {
      return 0;
    }

    const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

    if (asset.depreciationMethod === 'SLM') {
      const depreciableAmount = asset.originalCost - asset.salvageValue;
      const totalMonths = asset.usefulLifeYears * 12;
      const monthly = depreciableAmount / totalMonths;
      return round2(Math.min(monthly, asset.currentBookValue - asset.salvageValue));
    } else {
      // WDV Rate formula: 1 - (Salvage / Cost)^(1 / Life)
      const rate = 1 - Math.pow(asset.salvageValue / asset.originalCost, 1 / asset.usefulLifeYears);
      const monthly = (asset.currentBookValue * rate) / 12;
      return round2(Math.min(monthly, asset.currentBookValue - asset.salvageValue));
    }
  }

  /**
   * Executes a monthly depreciation run across all active fixed assets:
   * Updates asset book values and posts balanced journal entries to the General Ledger:
   * Dr Depreciation Expense (530100)
   *   Cr Accumulated Depreciation (140900)
   */
  public executeMonthlyDepreciationRun(tenantId: string, period: string): DepreciationRunResult {
    const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
    let totalDepreciation = 0;
    const breakdowns: DepreciationRunResult['assetBreakdowns'] = [];
    const journalLines: JournalLineInput[] = [];

    for (const asset of this.assets.values()) {
      if (asset.status !== AssetStatus.ACTIVE) continue;

      const monthlyDep = this.calculateMonthlyDepreciation(asset);
      if (monthlyDep <= 0) continue;

      asset.accumulatedDepreciation = round2(asset.accumulatedDepreciation + monthlyDep);
      asset.currentBookValue = round2(asset.currentBookValue - monthlyDep);
      this.assets.set(asset.assetId, asset);

      totalDepreciation += monthlyDep;
      breakdowns.push({
        assetId: asset.assetId,
        name: asset.name,
        monthlyDepreciation: monthlyDep,
        newBookValue: asset.currentBookValue,
      });

      // Debit Depreciation Expense for Cost Center
      journalLines.push({
        accountId: 'ACC-DEP-EXP',
        accountCode: '530100',
        accountName: `Depreciation Expense - ${asset.assetClass}`,
        debit: monthlyDep,
        credit: 0,
        costCenter: asset.costCenter,
        description: `Depreciation for ${asset.assetId} (${period})`,
      });
    }

    totalDepreciation = round2(totalDepreciation);

    // Credit Accumulated Depreciation
    journalLines.push({
      accountId: 'ACC-ACCUM-DEP',
      accountCode: '140900',
      accountName: 'Accumulated Depreciation Contra Asset',
      debit: 0,
      credit: totalDepreciation,
      description: `Monthly Accumulated Depreciation Run for ${period}`,
    });

    const runNumber = `DEP-RUN-${period.replace('-', '')}`;

    GeneralLedgerEngine.postJournalEntry({
      tenantId,
      entryNumber: `JRN-${runNumber}`,
      postingDate: `${period}-28`,
      reference: runNumber,
      narration: `Monthly asset depreciation run for period ${period}`,
      lines: journalLines,
    });

    return {
      runId: runNumber,
      period,
      assetsProcessed: breakdowns.length,
      totalDepreciationAmount: totalDepreciation,
      assetBreakdowns: breakdowns,
      glJournalNumber: `JRN-${runNumber}`,
      postedAt: new Date().toISOString(),
    };
  }
}
