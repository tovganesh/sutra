import { Request, Response } from 'express';
import { HttpStatus } from '@sutra/core';
import { projectSystemsEngine } from '../services/engine.registry';
import { sendError } from '../helpers/response.helper';
import { tReq } from '../helpers/i18n.helper';

export class ProjectController {
  public static getProjects(req: Request, res: Response) {
    res.json(projectSystemsEngine.listProjects());
  }

  public static createProject(req: Request, res: Response) {
    const { projectId, name, projectType, totalApprovedBudget, responsibleCostCenter } = req.body;
    if (!projectId || !name || !projectType || !totalApprovedBudget || !responsibleCostCenter) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingFields', 'projects.projFieldsRequired');
    }
    const proj = projectSystemsEngine.createProject({
      ...req.body,
      status: req.body.status || 'APPROVED',
      startDate: req.body.startDate || new Date().toISOString().split('T')[0],
      endDate: req.body.endDate || new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
      totalApprovedBudget: Number(totalApprovedBudget),
      totalCommittedCost: 0,
      totalActualCost: 0,
      cwipAccountId: req.body.cwipAccountId || '140800',
      wbsElements: [],
      milestones: [],
    });
    res.status(HttpStatus.CREATED).json(proj);
  }

  public static getProjectById(req: Request, res: Response) {
    const id = String(req.params.id);
    const proj = projectSystemsEngine.getProject(id);
    if (!proj) {
      return res.status(HttpStatus.NOT_FOUND).json({
        error: tReq(req, 'projects.projNotFound', { id }),
      });
    }
    res.json(proj);
  }

  public static addWbs(req: Request, res: Response) {
    const projectId = String(req.params.id);
    const { wbsCode, name, costCenter, budgetAllocated } = req.body;
    if (!wbsCode || !name || !costCenter || budgetAllocated === undefined) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingFields', 'projects.wbsFieldsRequired');
    }
    try {
      const wbs = projectSystemsEngine.addWbsElement({
        wbsCode,
        name,
        projectId,
        parentWbsCode: req.body.parentWbsCode,
        costCenter,
        budgetAllocated: Number(budgetAllocated),
        budgetCommitted: 0,
        actualCostIncurred: 0,
        status: req.body.status || 'RELEASED',
      });
      res.status(HttpStatus.CREATED).json(wbs);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'projects.wbsFailed');
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'WbsCreationError', message: msg });
    }
  }

  public static addMilestone(req: Request, res: Response) {
    const projectId = String(req.params.id);
    const { milestoneId, name, targetDate, percentageWeight } = req.body;
    if (!milestoneId || !name || !targetDate || percentageWeight === undefined) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingFields', 'projects.msFieldsRequired');
    }
    try {
      const ms = projectSystemsEngine.addMilestone({
        milestoneId,
        projectId,
        name,
        targetDate,
        percentageWeight: Number(percentageWeight),
        isAchieved: false,
      });
      res.status(HttpStatus.CREATED).json(ms);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'projects.msFailed');
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'MilestoneCreationError', message: msg });
    }
  }

  public static achieveMilestone(req: Request, res: Response) {
    const projectId = String(req.params.id);
    const milestoneId = String(req.params.milestoneId);
    try {
      const ms = projectSystemsEngine.achieveMilestone(projectId, milestoneId);
      res.json(ms);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'projects.msAchieveFailed');
      res.status(HttpStatus.NOT_FOUND).json({ error: 'MilestoneAchieveError', message: msg });
    }
  }

  public static getPoc(req: Request, res: Response) {
    const projectId = String(req.params.id);
    try {
      const poc = projectSystemsEngine.calculateProjectPoC(projectId);
      res.json(poc);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'projects.pocFailed');
      res.status(HttpStatus.NOT_FOUND).json({ error: 'PocCalculationError', message: msg });
    }
  }

  public static recordCommitment(req: Request, res: Response) {
    const projectId = String(req.params.id);
    const { wbsCode, amount } = req.body;
    if (!wbsCode || amount === undefined) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingFields', 'projects.commitmentFieldsRequired');
    }
    try {
      const wbs = projectSystemsEngine.recordCommitment(projectId, wbsCode, Number(amount));
      res.json(wbs);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'projects.commitmentFailed');
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'CommitmentRecordError', message: msg });
    }
  }

  public static recordActualCost(req: Request, res: Response) {
    const projectId = String(req.params.id);
    const { wbsCode, amount, reduceCommittedAmount } = req.body;
    if (!wbsCode || amount === undefined) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingFields', 'projects.actualCostFieldsRequired');
    }
    try {
      const wbs = projectSystemsEngine.recordActualCost(
        projectId,
        wbsCode,
        Number(amount),
        reduceCommittedAmount ? Number(reduceCommittedAmount) : 0
      );
      res.json(wbs);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'projects.actualCostFailed');
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'ActualCostRecordError', message: msg });
    }
  }

  public static settleCwip(req: Request, res: Response) {
    const projectId = String(req.params.id);
    const { assetName, assetClass, usefulLifeYears } = req.body;
    if (!assetName) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingField', 'projects.cwipFieldsRequired');
    }
    try {
      const settlement = projectSystemsEngine.settleCwipToFixedAsset(
        projectId,
        assetName,
        assetClass || 'PLANT_MACHINERY',
        usefulLifeYears ? Number(usefulLifeYears) : 15
      );
      res.status(HttpStatus.CREATED).json(settlement);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'projects.cwipFailed');
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'CwipSettlementError', message: msg });
    }
  }
}
