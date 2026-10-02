import { Request, Response } from 'express';
import {
  StrategicSourcingEngine,
  RfqDocument,
  VendorQuotation,
  HttpStatus,
  SystemDefaults,
  VendorBidStatus,
} from '@sutra/core';
import { procureToPayEngine } from '../services/engine.registry';
import { sendError } from '../helpers/response.helper';
import { tReq } from '../helpers/i18n.helper';
import {
  inMemoryRfqs,
  inMemoryQuotations,
  sampleVendorScorecards,
} from '../helpers/store.helper';

export class SourcingController {
  public static getAllRfqs(req: Request, res: Response) {
    const rfqs = Array.from(inMemoryRfqs.values());
    res.json({
      count: rfqs.length,
      rfqs,
    });
  }

  public static getRfqDetails(req: Request, res: Response) {
    const rfqNumber = req.params.rfqNumber as string;
    const rfq = inMemoryRfqs.get(rfqNumber);
    if (!rfq) {
      return sendError(req, res, HttpStatus.NOT_FOUND, 'NotFound', 'sourcing.rfqNotFound');
    }

    const quotations = inMemoryQuotations.get(rfqNumber) || [];
    res.json({
      rfq,
      quotations,
    });
  }

  public static createRfq(req: Request, res: Response) {
    const input = req.body;
    if (!input.rfqNumber || !input.title || !input.items || !Array.isArray(input.items) || input.items.length === 0) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingFields', 'sourcing.rfqFieldsRequired');
    }

    try {
      const rfq = StrategicSourcingEngine.createRfq({
        tenantId: input.tenantId || SystemDefaults.DEFAULT_TENANT_ID,
        rfqNumber: input.rfqNumber,
        title: input.title,
        category: input.category || 'DIRECT_MATERIALS',
        bidClosingDate: input.bidClosingDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        deliveryPlant: input.deliveryPlant || SystemDefaults.DEFAULT_PLANT_ID,
        currency: input.currency || SystemDefaults.DEFAULT_CURRENCY,
        items: input.items,
        invitedVendorIds: input.invitedVendorIds || [],
        createdBy: input.createdBy || 'SOURCING_DIRECTOR',
      });

      inMemoryRfqs.set(rfq.rfqNumber, rfq);
      inMemoryQuotations.set(rfq.rfqNumber, []);

      res.status(HttpStatus.CREATED).json(rfq);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'sourcing.rfqCreationFailed');
      res.status(HttpStatus.BAD_REQUEST).json({ error: 'RfqCreationError', message: msg });
    }
  }

  public static submitBid(req: Request, res: Response) {
    const rfqNumber = req.params.rfqNumber as string;
    const rfq = inMemoryRfqs.get(rfqNumber);
    if (!rfq) {
      return sendError(req, res, HttpStatus.NOT_FOUND, 'NotFound', 'sourcing.rfqNotFound');
    }

    const input = req.body;
    if (!input.quotationId || !input.vendorId || !input.items || !Array.isArray(input.items)) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingFields', 'sourcing.quotationFieldsRequired');
    }

    try {
      const quotation = StrategicSourcingEngine.submitVendorBid(rfq, {
        quotationId: input.quotationId,
        rfqNumber,
        vendorId: input.vendorId,
        vendorName: input.vendorName || input.vendorId,
        paymentTermsDays: input.paymentTermsDays || 30,
        warrantyMonths: input.warrantyMonths || 12,
        technicalComplianceScore: input.technicalComplianceScore ?? 85,
        items: input.items,
        notes: input.notes,
      });

      const existing = inMemoryQuotations.get(rfqNumber) || [];
      const updated = existing.filter((q) => q.quotationId !== quotation.quotationId);
      updated.push(quotation);
      inMemoryQuotations.set(rfqNumber, updated);

      res.status(HttpStatus.CREATED).json(quotation);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'sourcing.bidSubmissionFailed');
      res.status(HttpStatus.BAD_REQUEST).json({ error: 'BidSubmissionError', message: msg });
    }
  }

  public static evaluateBids(req: Request, res: Response) {
    const rfqNumber = req.params.rfqNumber as string;
    const rfq = inMemoryRfqs.get(rfqNumber);
    if (!rfq) {
      return sendError(req, res, HttpStatus.NOT_FOUND, 'NotFound', 'sourcing.rfqNotFound');
    }

    const quotations = inMemoryQuotations.get(rfqNumber) || [];
    if (quotations.length === 0) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'NoBids', 'sourcing.noBidsToEvaluate');
    }

    try {
      const weights = req.body.weights;
      const matrix = StrategicSourcingEngine.evaluateBids(rfq, quotations, weights);
      res.json(matrix);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'sourcing.evaluationFailed');
      res.status(HttpStatus.BAD_REQUEST).json({ error: 'EvaluationError', message: msg });
    }
  }

  public static awardRfq(req: Request, res: Response) {
    const rfqNumber = req.params.rfqNumber as string;
    const { quotationId, poPrefix } = req.body;
    const rfq = inMemoryRfqs.get(rfqNumber);
    if (!rfq) {
      return sendError(req, res, HttpStatus.NOT_FOUND, 'NotFound', 'sourcing.rfqNotFound');
    }

    const quotations = inMemoryQuotations.get(rfqNumber) || [];
    if (quotations.length === 0) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'NoBids', 'sourcing.noBidsToEvaluate');
    }

    try {
      const result = StrategicSourcingEngine.awardRfq(rfq, quotations, quotationId, poPrefix);

      // Save updated state
      inMemoryRfqs.set(rfqNumber, result.rfq);
      const updatedQuotations = quotations.map((q) =>
        q.quotationId === quotationId ? result.awardedQuotation : { ...q, status: VendorBidStatus.REJECTED }
      );
      inMemoryQuotations.set(rfqNumber, updatedQuotations);

      // Automatically register PO in P2P engine
      try {
        procureToPayEngine.createPurchaseOrder(result.generatedPo);
      } catch {
        // PO might already exist or mock testing
      }

      res.status(HttpStatus.OK).json({
        message: 'RFQ successfully awarded and Purchase Order automatically generated',
        ...result,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'sourcing.awardFailed');
      res.status(HttpStatus.BAD_REQUEST).json({ error: 'AwardError', message: msg });
    }
  }


  public static getVendorScorecards(req: Request, res: Response) {
    res.json({
      evaluationPeriod: 'FY 2026-27 (YTD)',
      scorecards: sampleVendorScorecards,
    });
  }
}
