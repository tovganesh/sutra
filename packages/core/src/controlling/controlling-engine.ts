/**
 * Sutra Controlling (CO) & Management Accounting Engine (SAP CO Equivalent)
 * Manages Cost Centers, Profit Centers, Internal Secondary Cost Allocations,
 * and Budget Variance Analysis.
 */

import { GeneralLedgerEngine, JournalLineInput } from '../ledger/ledger-engine.js';
import {
  CostAllocationResult,
  CostAllocationRule,
  CostCenter,
  ProfitCenter,
  VarianceAnalysisResult,
} from './controlling-types.js';

export class ControllingEngine {
  private costCenters: Map<string, CostCenter> = new Map();
  private profitCenters: Map<string, ProfitCenter> = new Map();
  private allocationRules: Map<string, CostAllocationRule> = new Map();

  constructor(private ledgerEngine?: GeneralLedgerEngine) {
    this.seedDefaultControllingData();
  }

  private seedDefaultControllingData(): void {
    // 1. Profit Centers
    this.profitCenters.set('PC-EV-COMMERCIAL', {
      code: 'PC-EV-COMMERCIAL',
      name: 'Commercial Electric Vehicles Division',
      segment: 'AUTOMOTIVE_CLEANTECH',
      responsiblePerson: 'VP of Commercial Vehicles',
    });
    this.profitCenters.set('PC-EV-AFTERMARKET', {
      code: 'PC-EV-AFTERMARKET',
      name: 'EV Spares & Fleet Aftermarket Services',
      segment: 'AFTERMARKET_SUPPORT',
      responsiblePerson: 'Director of Customer Service',
    });

    // 2. Cost Centers
    this.costCenters.set('CC-MFG-BODY', {
      code: 'CC-MFG-BODY',
      name: 'Chassis Stamping & Body Shop',
      category: 'PRODUCTION',
      manager: 'Plant Production Head',
      currency: 'INR',
      profitCenterCode: 'PC-EV-COMMERCIAL',
      budgetAnnual: 48000000,
      actualIncurred: 36500000,
    });

    this.costCenters.set('CC-MFG-ASSY', {
      code: 'CC-MFG-ASSY',
      name: 'Powertrain & Final Robotic Assembly',
      category: 'PRODUCTION',
      manager: 'Final Assembly Line Manager',
      currency: 'INR',
      profitCenterCode: 'PC-EV-COMMERCIAL',
      budgetAnnual: 72000000,
      actualIncurred: 54200000,
    });

    this.costCenters.set('CC-SHARED-IT', {
      code: 'CC-SHARED-IT',
      name: 'Enterprise IT, Cloud & Robotics Telemetry',
      category: 'SHARED_SERVICE',
      manager: 'Chief Information Officer',
      currency: 'INR',
      profitCenterCode: 'PC-EV-COMMERCIAL',
      budgetAnnual: 18000000,
      actualIncurred: 12000000,
    });

    this.costCenters.set('CC-LOGISTICS', {
      code: 'CC-LOGISTICS',
      name: 'Central Warehouse & Finished Vehicle Logistics',
      category: 'LOGISTICS',
      manager: 'Head of Supply Chain Logistics',
      currency: 'INR',
      profitCenterCode: 'PC-EV-COMMERCIAL',
      budgetAnnual: 24000000,
      actualIncurred: 19800000,
    });

    // 3. Default Allocation Rule: Allocate IT Shared Services to Body Shop (40%), Assembly (45%), and Logistics (15%)
    this.allocationRules.set('ALLOC-RULE-IT-01', {
      ruleId: 'ALLOC-RULE-IT-01',
      name: 'IT Cloud & Telematics Overhead Distribution',
      senderCostCenter: 'CC-SHARED-IT',
      receiverCostCenters: [
        { costCenter: 'CC-MFG-BODY', percentageWeight: 40 },
        { costCenter: 'CC-MFG-ASSY', percentageWeight: 45 },
        { costCenter: 'CC-LOGISTICS', percentageWeight: 15 },
      ],
      assessmentType: 'PERCENTAGE',
    });
  }

  public registerCostCenter(cc: CostCenter): CostCenter {
    this.costCenters.set(cc.code, cc);
    return cc;
  }

  public registerProfitCenter(pc: ProfitCenter): ProfitCenter {
    this.profitCenters.set(pc.code, pc);
    return pc;
  }

  public registerAllocationRule(rule: CostAllocationRule): CostAllocationRule {
    this.allocationRules.set(rule.ruleId, rule);
    return rule;
  }

  /**
   * Post direct expense to a cost center
   */
  public postDirectExpense(costCenterCode: string, amount: number): CostCenter {
    const cc = this.costCenters.get(costCenterCode);
    if (!cc) {
      throw new Error(`Cost Center '${costCenterCode}' does not exist.`);
    }
    cc.actualIncurred += amount;
    return cc;
  }

  /**
   * Execute an Overhead Cost Assessment / Allocation Cycle (SAP CO Assessment Cycle)
   */
  public executeCostAllocationCycle(params: {
    ruleId: string;
    period: string; // e.g. '2026-09'
    amountToAllocate?: number; // if omitted, allocates current sender actual costs
    tenantId?: string;
  }): CostAllocationResult {
    const rule = this.allocationRules.get(params.ruleId);
    if (!rule) {
      throw new Error(`Allocation rule '${params.ruleId}' not found.`);
    }

    const sender = this.costCenters.get(rule.senderCostCenter);
    if (!sender) {
      throw new Error(`Sender cost center '${rule.senderCostCenter}' not found.`);
    }

    const totalToAllocate = params.amountToAllocate ?? sender.actualIncurred;
    if (totalToAllocate <= 0) {
      throw new Error(`No costs available to allocate from sender '${sender.code}'.`);
    }

    // Validate weights sum to 100%
    const totalWeight = rule.receiverCostCenters.reduce((sum, r) => sum + r.percentageWeight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new Error(`Receiver weights must sum to 100%. Current sum: ${totalWeight}%`);
    }

    const allocations: Array<{ receiverCostCenter: string; allocatedAmount: number; percentage: number }> = [];
    const journalLines: Array<{ accountCode: string; accountName: string; costCenter: string; debit: number; credit: number }> = [];

    // Credit sender cost center (Secondary Cost Element: 610000 Assessment Outflow)
    journalLines.push({
      accountCode: '610000',
      accountName: 'Secondary Cost Assessment (Overhead Allocation Outflow)',
      costCenter: sender.code,
      debit: 0,
      credit: totalToAllocate,
    });

    for (const receiverSpec of rule.receiverCostCenters) {
      const receiver = this.costCenters.get(receiverSpec.costCenter);
      if (!receiver) {
        throw new Error(`Receiver cost center '${receiverSpec.costCenter}' not found.`);
      }

      const allocatedAmount = Math.round((totalToAllocate * (receiverSpec.percentageWeight / 100)) * 100) / 100;
      receiver.actualIncurred += allocatedAmount;

      allocations.push({
        receiverCostCenter: receiver.code,
        allocatedAmount,
        percentage: receiverSpec.percentageWeight,
      });

      // Debit receiver cost center (Secondary Cost Element: 610000 Assessment Inflow)
      journalLines.push({
        accountCode: '610000',
        accountName: `Secondary Cost Assessment (${sender.code} -> ${receiver.code})`,
        costCenter: receiver.code,
        debit: allocatedAmount,
        credit: 0,
      });
    }

    // Sender costs reduced by allocated amount
    sender.actualIncurred = Math.max(0, sender.actualIncurred - totalToAllocate);

    const cycleId = `CYCLE-${Date.now().toString(36).toUpperCase()}`;

    // Post to General Ledger if ledger engine is available
    if (this.ledgerEngine && params.tenantId) {
      const ledgerLines: JournalLineInput[] = journalLines.map((jl) => ({
        accountId: `ACC-${jl.accountCode}`,
        accountCode: jl.accountCode,
        accountName: jl.accountName,
        debit: jl.debit,
        credit: jl.credit,
        description: `${jl.accountName} [${jl.costCenter}]`,
        costCenter: jl.costCenter,
      }));

      GeneralLedgerEngine.postJournalEntry({
        tenantId: params.tenantId,
        entryNumber: `JE-CO-${cycleId}`,
        postingDate: new Date().toISOString().split('T')[0],
        narration: `Secondary Cost Assessment Cycle ${cycleId} (Rule: ${rule.ruleId}) for Period ${params.period}`,
        reference: cycleId,
        lines: ledgerLines,
      });
    }

    return {
      cycleId,
      ruleId: rule.ruleId,
      period: params.period,
      senderCostCenter: sender.code,
      totalAmountAllocated: totalToAllocate,
      allocations,
      journalLines,
      executedAt: new Date().toISOString(),
    };
  }

  /**
   * Perform Variance Analysis (Budget vs Actual) for a cost center
   */
  public analyzeVariance(costCenterCode: string, period: string): VarianceAnalysisResult {
    const cc = this.costCenters.get(costCenterCode);
    if (!cc) {
      throw new Error(`Cost Center '${costCenterCode}' not found.`);
    }

    // Monthly planned budget (annual budget / 12)
    const monthlyBudget = Math.round(cc.budgetAnnual / 12);
    const varianceAmount = monthlyBudget - cc.actualIncurred;
    const variancePercent = Math.round((varianceAmount / monthlyBudget) * 10000) / 100;

    let varianceType: 'FAVORABLE' | 'UNFAVORABLE' | 'ON_TRACK' = 'ON_TRACK';
    if (varianceAmount > 0) {
      varianceType = 'FAVORABLE'; // Spent less than budget
    } else if (varianceAmount < 0) {
      varianceType = 'UNFAVORABLE'; // Exceeded budget
    }

    return {
      costCenter: cc.code,
      period,
      plannedBudget: monthlyBudget,
      actualExpenses: cc.actualIncurred,
      varianceAmount,
      variancePercent,
      varianceType,
    };
  }

  public getAllCostCenters(): CostCenter[] {
    return Array.from(this.costCenters.values());
  }

  public getCostCenter(code: string): CostCenter | undefined {
    return this.costCenters.get(code);
  }

  public getAllProfitCenters(): ProfitCenter[] {
    return Array.from(this.profitCenters.values());
  }

  public getAllAllocationRules(): CostAllocationRule[] {
    return Array.from(this.allocationRules.values());
  }
}
