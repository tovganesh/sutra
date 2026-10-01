import { Request, Response } from 'express';
import { HttpStatus } from '@sutra/core';
import { aiProvider, textToERPAgent, invoiceExtractorAgent } from '../services/engine.registry';
import { sendError } from '../helpers/response.helper';
import { tReq } from '../helpers/i18n.helper';

export class AiController {
  public static async query(req: Request, res: Response) {
    const { question } = req.body;
    if (!question) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingPrompt', 'ai.promptRequired');
    }

    try {
      const structuredQuery = await textToERPAgent.translateQuery(question);

      const responsePayload = {
        query: question,
        interpretedIntent: structuredQuery,
        aiProvider: aiProvider.name,
        answer: tReq(req, 'ai.answerTemplate', {
          intent: structuredQuery.intent,
          targetEntity: structuredQuery.targetEntity,
          explanation: structuredQuery.explanation,
        }),
        suggestedAction: tReq(req, 'ai.suggestedAction'),
        timestamp: new Date().toISOString(),
      };

      res.json(responsePayload);
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : tReq(req, 'ai.aiFailed');
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: tReq(req, 'ai.aiFailed'),
        message: msg,
      });
    }
  }

  public static async extractInvoice(req: Request, res: Response) {
    const { documentText } = req.body;
    if (!documentText) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingDocumentText', 'ai.rawTextRequired');
    }

    try {
      const extracted = await invoiceExtractorAgent.extract(documentText);
      res.json(extracted);
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : tReq(req, 'ai.idpFailed');
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: tReq(req, 'ai.idpFailed'),
        message: msg,
      });
    }
  }
}
