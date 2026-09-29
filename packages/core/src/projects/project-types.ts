/**
 * Sutra Project Systems & Capital Project Costing (SAP PS Equivalent)
 * Types and interfaces for Work Breakdown Structure (WBS Elements),
 * CapEx/OpEx budgeting, purchase commitments, milestone progress,
 * and Capital Work-in-Progress (CWIP) settlement into Fixed Asset Accounting.
 */

export type ProjectType = 
  | 'CAPEX' 
  | 'OPEX' 
  | 'CUSTOMER_PROJECT' 
  | 'R_AND_D';

export type ProjectStatus = 
  | 'CREATED' 
  | 'APPROVED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CLOSED';

export type WbsStatus = 
  | 'PLANNED' 
  | 'RELEASED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED';

export interface WbsElement {
  wbsCode: string; // e.g. PRJ-EV-GIGA/01/01
  name: string;
  projectId: string;
  parentWbsCode?: string;
  costCenter: string;
  budgetAllocated: number;
  budgetCommitted: number; // Reserved through Purchase Orders
  actualCostIncurred: number; // Actual spend via vendor invoices / timesheets
  status: WbsStatus;
}

export interface ProjectMilestone {
  milestoneId: string;
  projectId: string;
  name: string;
  targetDate: string;
  completedDate?: string;
  percentageWeight: number; // Weight in total project completion (0 - 100)
  isAchieved: boolean;
}

export interface ProjectMaster {
  projectId: string;
  name: string;
  description: string;
  projectType: ProjectType;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  projectManager: string;
  responsibleCostCenter: string;
  totalApprovedBudget: number;
  totalCommittedCost: number;
  totalActualCost: number;
  cwipAccountId: string; // e.g. 140800 Capital Work in Progress
  capitalizedAssetTag?: string; // Links to FixedAssetEngine upon project settlement
  wbsElements: WbsElement[];
  milestones: ProjectMilestone[];
}

export interface CwipSettlementResult {
  settlementId: string;
  projectId: string;
  capitalizedAssetTag: string;
  assetName: string;
  totalSettledCost: number;
  settlementDate: string;
  costCenter: string;
  glJournal: {
    entryNumber: string;
    debitAccount: string;  // 140100 Fixed Assets (Factory Buildings / Plant & Machinery)
    creditAccount: string; // 140800 Capital Work in Progress (CWIP) Clearing
    amount: number;
  };
}
