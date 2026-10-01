/**
 * Sutra Project Systems & Capital Project Costing Engine (SAP PS Equivalent)
 * Manages Work Breakdown Structure (WBS Elements), CapEx project budgets,
 * purchase order commitments, milestone completion (PoC), and Capital Work-in-Progress (CWIP)
 * asset capitalization into Fixed Asset Accounting (FI-AA).
 */

import {
  ProjectMaster,
  WbsElement,
  ProjectMilestone,
  CwipSettlementResult,
} from './project-types.js';
import { FixedAssetEngine } from '../assets/fixed-asset-engine.js';
import { ProjectStatus, WbsStatus, AssetStatus } from '../common/constants.js';

export class ProjectSystemsEngine {
  private projects: Map<string, ProjectMaster> = new Map();
  private fixedAssetEngine?: FixedAssetEngine;

  constructor(fixedAssetEngine?: FixedAssetEngine) {
    this.fixedAssetEngine = fixedAssetEngine;
    this.seedDefaultProjects();
  }

  private seedDefaultProjects(): void {
    const proj: ProjectMaster = {
      projectId: 'PRJ-EV-GIGA-01',
      name: 'Gigafactory Battery Assembly Line 2 Expansion',
      description: 'Capital construction of 5 GWh automated lithium battery pack packaging facility',
      projectType: 'CAPEX',
      status: ProjectStatus.IN_PROGRESS,
      startDate: '2026-01-10',
      endDate: '2026-12-31',
      projectManager: 'Vikram Joshi (Director of Project Engineering)',
      responsibleCostCenter: 'CC-MFG-BODY',
      totalApprovedBudget: 75000000, // 7.5 Crore INR
      totalCommittedCost: 28000000, // 2.8 Cr committed via vendor POs
      totalActualCost: 35000000,    // 3.5 Cr actual incurred
      cwipAccountId: '140800',      // CWIP Asset Account
      wbsElements: [
        {
          wbsCode: 'PRJ-EV-GIGA/01',
          name: 'Civil Works & Cleanroom HVAC Infrastructure',
          projectId: 'PRJ-EV-GIGA-01',
          costCenter: 'CC-MFG-BODY',
          budgetAllocated: 30000000,
          budgetCommitted: 8000000,
          actualCostIncurred: 20000000,
          status: WbsStatus.IN_PROGRESS,
        },
        {
          wbsCode: 'PRJ-EV-GIGA/02',
          name: 'Robotic Pick-and-Place Cells & High-Voltage Laser Welders',
          projectId: 'PRJ-EV-GIGA-01',
          costCenter: 'CC-MFG-BODY',
          budgetAllocated: 35000000,
          budgetCommitted: 15000000,
          actualCostIncurred: 12000000,
          status: WbsStatus.IN_PROGRESS,
        },
        {
          wbsCode: 'PRJ-EV-GIGA/03',
          name: 'SCADA Automation & PLC Commissioning',
          projectId: 'PRJ-EV-GIGA-01',
          costCenter: 'CC-MFG-BODY',
          budgetAllocated: 10000000,
          budgetCommitted: 5000000,
          actualCostIncurred: 3000000,
          status: WbsStatus.RELEASED,
        },
      ],
      milestones: [
        {
          milestoneId: 'M1',
          projectId: 'PRJ-EV-GIGA-01',
          name: 'Foundation & Structural Steel Completion',
          targetDate: '2026-04-30',
          completedDate: '2026-04-25',
          percentageWeight: 30,
          isAchieved: true,
        },
        {
          milestoneId: 'M2',
          projectId: 'PRJ-EV-GIGA-01',
          name: 'Robotic Welding Line Mechanical Installation',
          targetDate: '2026-08-15',
          completedDate: '2026-08-12',
          percentageWeight: 40,
          isAchieved: true,
        },
        {
          milestoneId: 'M3',
          projectId: 'PRJ-EV-GIGA-01',
          name: 'Dry Run & Trial Batch Commissioning',
          targetDate: '2026-11-30',
          percentageWeight: 30,
          isAchieved: false,
        },
      ],
    };

    this.projects.set(proj.projectId, proj);
  }

  // -------------------------------------------------------------
  // Project Master & WBS Hierarchy
  // -------------------------------------------------------------

  public createProject(proj: ProjectMaster): ProjectMaster {
    this.projects.set(proj.projectId, proj);
    return proj;
  }

  public getProject(projectId: string): ProjectMaster | undefined {
    return this.projects.get(projectId);
  }

  public listProjects(): ProjectMaster[] {
    return Array.from(this.projects.values());
  }

  public addWbsElement(wbs: WbsElement): WbsElement {
    const proj = this.projects.get(wbs.projectId);
    if (!proj) {
      throw new Error(`Project ${wbs.projectId} not found`);
    }
    proj.wbsElements.push(wbs);
    this.recalculateProjectFinancials(proj);
    return wbs;
  }

  public addMilestone(milestone: ProjectMilestone): ProjectMilestone {
    const proj = this.projects.get(milestone.projectId);
    if (!proj) {
      throw new Error(`Project ${milestone.projectId} not found`);
    }
    proj.milestones.push(milestone);
    return milestone;
  }

  public achieveMilestone(projectId: string, milestoneId: string): ProjectMilestone {
    const proj = this.projects.get(projectId);
    if (!proj) {
      throw new Error(`Project ${projectId} not found`);
    }
    const ms = proj.milestones.find((m) => m.milestoneId === milestoneId);
    if (!ms) {
      throw new Error(`Milestone ${milestoneId} not found in project ${projectId}`);
    }
    ms.isAchieved = true;
    ms.completedDate = new Date().toISOString().split('T')[0];
    return ms;
  }

  public calculateProjectPoC(projectId: string): {
    projectId: string;
    pocPercentage: number;
    achievedWeight: number;
    totalWeight: number;
  } {
    const proj = this.projects.get(projectId);
    if (!proj) {
      throw new Error(`Project ${projectId} not found`);
    }

    const totalWeight = proj.milestones.reduce((acc, m) => acc + m.percentageWeight, 0) || 100;
    const achievedWeight = proj.milestones
      .filter((m) => m.isAchieved)
      .reduce((acc, m) => acc + m.percentageWeight, 0);

    const pocPercentage = Math.round((achievedWeight / totalWeight) * 1000) / 10;

    return {
      projectId,
      pocPercentage,
      achievedWeight,
      totalWeight,
    };
  }

  // -------------------------------------------------------------
  // Budget & Cost Commitments
  // -------------------------------------------------------------

  public recordCommitment(projectId: string, wbsCode: string, commitmentAmount: number): WbsElement {
    const proj = this.projects.get(projectId);
    if (!proj) {
      throw new Error(`Project ${projectId} not found`);
    }
    const wbs = proj.wbsElements.find((w) => w.wbsCode === wbsCode);
    if (!wbs) {
      throw new Error(`WBS element ${wbsCode} not found in project ${projectId}`);
    }

    wbs.budgetCommitted += commitmentAmount;
    this.recalculateProjectFinancials(proj);
    return wbs;
  }

  public recordActualCost(
    projectId: string,
    wbsCode: string,
    actualCost: number,
    reduceCommittedAmount: number = 0
  ): WbsElement {
    const proj = this.projects.get(projectId);
    if (!proj) {
      throw new Error(`Project ${projectId} not found`);
    }
    const wbs = proj.wbsElements.find((w) => w.wbsCode === wbsCode);
    if (!wbs) {
      throw new Error(`WBS element ${wbsCode} not found in project ${projectId}`);
    }

    wbs.actualCostIncurred += actualCost;
    if (reduceCommittedAmount > 0) {
      wbs.budgetCommitted = Math.max(0, wbs.budgetCommitted - reduceCommittedAmount);
    }
    this.recalculateProjectFinancials(proj);
    return wbs;
  }

  private recalculateProjectFinancials(proj: ProjectMaster): void {
    proj.totalCommittedCost = proj.wbsElements.reduce((acc, w) => acc + w.budgetCommitted, 0);
    proj.totalActualCost = proj.wbsElements.reduce((acc, w) => acc + w.actualCostIncurred, 0);
  }

  // -------------------------------------------------------------
  // Capital Work-In-Progress (CWIP) Settlement & Fixed Asset Capitalization
  // -------------------------------------------------------------

  public settleCwipToFixedAsset(
    projectId: string,
    assetName: string,
    assetClass: 'BUILDINGS' | 'PLANT_MACHINERY' | 'IT_EQUIPMENT' = 'PLANT_MACHINERY',
    usefulLifeYears: number = 15
  ): CwipSettlementResult {
    const proj = this.projects.get(projectId);
    if (!proj) {
      throw new Error(`Project ${projectId} not found`);
    }
    if (proj.status === ProjectStatus.CLOSED) {
      throw new Error(`Project ${projectId} is already closed`);
    }

    this.recalculateProjectFinancials(proj);
    const totalSettledCost = proj.totalActualCost;

    if (totalSettledCost <= 0) {
      throw new Error(`Cannot settle project ${projectId} with zero actual cost incurred`);
    }

    const count = Date.now().toString(36).toUpperCase();
    const assetTag = `AST-CWIP-${count}`;

    // Register into Fixed Asset Accounting (FI-AA) if integrated
    if (this.fixedAssetEngine) {
      try {
        this.fixedAssetEngine.registerAsset({
          assetId: assetTag,
          name: assetName,
          assetClass,
          costCenter: proj.responsibleCostCenter,
          capitalizationDate: new Date().toISOString().split('T')[0],
          originalCost: totalSettledCost,
          salvageValue: Math.round(totalSettledCost * 0.05), // 5% Companies Act 2013 salvage
          usefulLifeYears,
          depreciationMethod: 'SLM',
          accumulatedDepreciation: 0,
          currentBookValue: totalSettledCost,
          status: AssetStatus.ACTIVE,
        });
      } catch {
        // Continue if asset already registered
      }
    }

    proj.status = ProjectStatus.COMPLETED;
    proj.capitalizedAssetTag = assetTag;

    const settlementId = `SETTLE-${projectId}-${count}`;
    const glEntryNumber = `CWIP-CAP-JRN-${count}`;

    return {
      settlementId,
      projectId,
      capitalizedAssetTag: assetTag,
      assetName,
      totalSettledCost,
      settlementDate: new Date().toISOString().split('T')[0],
      costCenter: proj.responsibleCostCenter,
      glJournal: {
        entryNumber: glEntryNumber,
        debitAccount: '140100', // Capital Asset (Plant & Machinery / Building)
        creditAccount: proj.cwipAccountId, // 140800 CWIP Asset Clearing
        amount: totalSettledCost,
      },
    };
  }
}
