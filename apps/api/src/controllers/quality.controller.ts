import { Request, Response } from 'express';
import { HttpStatus } from '@sutra/core';
import { qualityEngine } from '../services/engine.registry';
import { sendError } from '../helpers/response.helper';
import { tReq } from '../helpers/i18n.helper';

export class QualityController {
  public static getLots(req: Request, res: Response) {
    res.json(qualityEngine.getAllInspectionLots());
  }

  public static getLotById(req: Request, res: Response) {
    const lotId = String(req.params.lotId);
    const lot = qualityEngine.getInspectionLot(lotId);
    if (!lot) {
      return sendError(req, res, HttpStatus.NOT_FOUND, 'InspectionLotNotFound', 'quality.lotNotFound');
    }
    res.json(lot);
  }

  public static createLot(req: Request, res: Response) {
    const { origin, materialSku, batchNumber, quantity, baseUom, plantId, referenceDocument } = req.body;
    if (!materialSku || !batchNumber || !quantity) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingFields', 'quality.lotFieldsRequired');
    }

    try {
      const lot = qualityEngine.createInspectionLot({
        origin: origin || '01_GOODS_RECEIPT',
        materialSku,
        batchNumber,
        quantity: Number(quantity),
        baseUom: baseUom || 'EA',
        plantId: plantId || 'PLANT-1000',
        referenceDocument: referenceDocument || `REF-${Date.now().toString(36).toUpperCase()}`,
      });
      res.status(HttpStatus.CREATED).json(lot);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'quality.lotCreationFailed');
      res.status(HttpStatus.BAD_REQUEST).json({ error: 'InspectionLotCreationError', message: msg });
    }
  }

  public static recordResults(req: Request, res: Response) {
    const lotId = String(req.params.lotId);
    const { results } = req.body;
    if (!results || !Array.isArray(results)) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingFields', 'quality.resultsRequired');
    }

    try {
      const updated = qualityEngine.recordResults(lotId, results);
      res.json(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'quality.resultsFailed');
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'ResultsRecordingError', message: msg });
    }
  }

  public static recordUsageDecision(req: Request, res: Response) {
    const lotId = String(req.params.lotId);
    const { decision, decidedBy, notes } = req.body;
    if (!decision || !decidedBy) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingFields', 'quality.udFieldsRequired');
    }

    try {
      const udResult = qualityEngine.recordUsageDecision({
        lotId,
        decision,
        decidedBy,
        notes,
      });
      res.json(udResult);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'quality.udFailed');
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'UsageDecisionError', message: msg });
    }
  }

  public static generateCoA(req: Request, res: Response) {
    const lotId = String(req.params.lotId);
    const { qaManager } = req.body;
    if (!qaManager) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingField', 'quality.qaManagerRequired');
    }

    try {
      const coa = qualityEngine.generateCertificateOfAnalysis(lotId, qaManager);
      res.json(coa);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'quality.coaFailed');
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'CertificateGenerationError', message: msg });
    }
  }

  public static getBatches(req: Request, res: Response) {
    res.json(qualityEngine.getAllBatches());
  }

  public static traceBatch(req: Request, res: Response) {
    const batchNumber = String(req.params.batchNumber);
    try {
      const trace = qualityEngine.traceBatchGenealogy(batchNumber);
      res.json(trace);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'quality.batchTraceFailed');
      res.status(HttpStatus.NOT_FOUND).json({ error: 'BatchTraceError', message: msg });
    }
  }
}
