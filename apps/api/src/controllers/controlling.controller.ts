import { Request, Response } from 'express';
import { HttpStatus } from '@sutra/core';
import { controllingEngine } from '../services/engine.registry';
import { sendError } from '../helpers/response.helper';
import { tReq } from '../helpers/i18n.helper';

export class ControllingController {
  public static getCostCenters(req: Request, res: Response) {
    res.json(controllingEngine.getAllCostCenters());
  }

  public static getProfitCenters(req: Request, res: Response) {
    res.json(controllingEngine.getAllProfitCenters());
  }

  public static getAllocationRules(req: Request, res: Response) {
    res.json(controllingEngine.getAllAllocationRules());
  }

  public static runAssessmentCycle(req: Request, res: Response) {
    const { ruleId, period, amountToAllocate, tenantId } = req.body;
    if (!ruleId || !period) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingFields', 'controlling.ruleAndPeriodRequired');
    }

    try {
      const result = controllingEngine.executeCostAllocationCycle({
        ruleId,
        period,
        amountToAllocate: amountToAllocate ? Number(amountToAllocate) : undefined,
        tenantId: tenantId || '00000000-0000-0000-0000-000000000001',
      });
      res.status(HttpStatus.CREATED).json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'controlling.costAllocationFailed');
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'CostAllocationError', message: msg });
    }
  }

  public static getVariance(req: Request, res: Response) {
    const code = String(req.params.code);
    const period = (req.query.period as string) || new Date().toISOString().slice(0, 7);
    try {
      const variance = controllingEngine.analyzeVariance(code, period);
      res.json(variance);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'controlling.varianceFailed');
      res.status(HttpStatus.NOT_FOUND).json({ error: 'VarianceAnalysisError', message: msg });
    }
  }
}
