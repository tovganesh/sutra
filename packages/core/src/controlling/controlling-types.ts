/**
 * Sutra Controlling (CO) & Overhead Cost Allocation Types (SAP CO Equivalent)
 * Covers Cost Centers, Profit Centers, Assessment Cycles, and Variance Analysis.
 */

export type CostCenterCategory =
  | 'PRODUCTION'
  | 'ADMINISTRATION'
  | 'R_AND_D'
  | 'LOGISTICS'
  | 'SHARED_SERVICE';

export interface CostCenter {
  code: string;
  name: string;
  category: CostCenterCategory;
  manager: string;
  currency: string;
  profitCenterCode?: string;
  budgetAnnual: number;
  actualIncurred: number;
}

export interface ProfitCenter {
  code: string;
  name: string;
  segment: string;
  responsiblePerson: string;
}

export interface CostAllocationRule {
  ruleId: string;
  name: string;
  senderCostCenter: string;
  receiverCostCenters: Array<{
    costCenter: string;
    percentageWeight: number; // e.g. 60 (for 60%), 40 (for 40%)
  }>;
  assessmentType: 'PERCENTAGE' | 'HEADCOUNT' | 'SQUARE_METERS' | 'MACHINE_HOURS';
}

export interface AllocationJournalLine {
  accountCode: string;
  accountName: string;
  costCenter: string;
  debit: number;
  credit: number;
}

export interface CostAllocationResult {
  cycleId: string;
  ruleId: string;
  period: string; // e.g. '2026-09'
  senderCostCenter: string;
  totalAmountAllocated: number;
  allocations: Array<{
    receiverCostCenter: string;
    allocatedAmount: number;
    percentage: number;
  }>;
  journalLines: AllocationJournalLine[];
  executedAt: string;
}

export interface VarianceAnalysisResult {
  costCenter: string;
  period: string;
  plannedBudget: number;
  actualExpenses: number;
  varianceAmount: number;
  variancePercent: number;
  varianceType: 'FAVORABLE' | 'UNFAVORABLE' | 'ON_TRACK';
}
