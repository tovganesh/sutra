import { Request, Response } from 'express';
import { HttpStatus, GeneralLedgerEngine, SystemDefaults } from '@sutra/core';
import { subledgerEngine } from '../services/engine.registry';
import { sendError } from '../helpers/response.helper';
import { tReq } from '../helpers/i18n.helper';

export class LedgerController {
  public static postJournalEntry(req: Request, res: Response) {
    const { tenantId, entryNumber, postingDate, reference, narration, lines } = req.body;

    if (!entryNumber || !lines || !Array.isArray(lines)) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingFields', 'ledger.entryAndLinesRequired');
    }

    const result = GeneralLedgerEngine.postJournalEntry({
      tenantId: tenantId || SystemDefaults.DEFAULT_TENANT_ID,
      entryNumber,
      postingDate: postingDate || new Date().toISOString().split('T')[0],
      reference,
      narration,
      lines,
    });

    if (!result.success) {
      return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
        error: 'DoubleEntryValidationError',
        reason: result.rejectionReason,
        result,
      });
    }

    res.status(HttpStatus.CREATED).json({
      message: tReq(req, 'ledger.journalPostedSuccess'),
      result,
    });
  }

  public static getAgingReport(req: Request, res: Response) {
    const report = subledgerEngine.generateAgingReport();
    res.json(report);
  }
}
