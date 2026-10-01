import { Request, Response } from 'express';
import { HttpStatus } from '@sutra/core';
import { treasuryEngine } from '../services/engine.registry';
import { sendError } from '../helpers/response.helper';
import { tReq } from '../helpers/i18n.helper';

export class TreasuryController {
  public static getHouseBanks(req: Request, res: Response) {
    res.json(treasuryEngine.listHouseBanks());
  }

  public static registerHouseBank(req: Request, res: Response) {
    const { bankId, bankName, branchName, ifscCode, country } = req.body;
    if (!bankId || !bankName || !ifscCode || !country) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingFields', 'trm.bankFieldsRequired');
    }
    const bank = treasuryEngine.registerHouseBank(req.body);
    res.status(HttpStatus.CREATED).json(bank);
  }

  public static getBankAccounts(req: Request, res: Response) {
    res.json(treasuryEngine.listBankAccounts());
  }

  public static registerBankAccount(req: Request, res: Response) {
    const { accountId, bankId, accountNumber, accountType, currency, glAccount, glClearingAccount } = req.body;
    if (!accountId || !bankId || !accountNumber || !currency || !glAccount || !glClearingAccount) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingFields', 'trm.accountFieldsRequired');
    }
    const account = treasuryEngine.registerBankAccount({
      ...req.body,
      currentBookBalance: req.body.currentBookBalance || 0,
      reconciledBankBalance: req.body.reconciledBankBalance || 0,
    });
    res.status(HttpStatus.CREATED).json(account);
  }

  public static getClearingItems(req: Request, res: Response) {
    const accountId = String(req.params.accountId);
    res.json(treasuryEngine.listGLClearingItems(accountId));
  }

  public static addClearingItem(req: Request, res: Response) {
    const accountId = String(req.params.accountId);
    const { entryNumber, reference, direction, amount, accountCode, description } = req.body;
    if (!entryNumber || !reference || !direction || !amount) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingFields', 'trm.clearingItemFieldsRequired');
    }
    const item = treasuryEngine.addGLClearingItem(accountId, {
      entryNumber,
      date: req.body.date || new Date().toISOString().split('T')[0],
      reference,
      direction,
      amount: Number(amount),
      accountCode: accountCode || '100101',
      description: description || 'Bank transaction clearing',
      isCleared: false,
    });
    res.status(HttpStatus.CREATED).json(item);
  }

  public static getStatements(req: Request, res: Response) {
    const accountId = req.query.accountId ? String(req.query.accountId) : undefined;
    res.json(treasuryEngine.listStatements(accountId));
  }

  public static importMt940(req: Request, res: Response) {
    const { accountId, rawMT940Text } = req.body;
    if (!accountId || !rawMT940Text) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingFields', 'trm.mt940FieldsRequired');
    }
    try {
      const statement = treasuryEngine.parseMT940Statement(accountId, rawMT940Text);
      res.status(HttpStatus.CREATED).json(statement);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'trm.mt940Failed');
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'MT940ImportError', message: msg });
    }
  }

  public static reconcileStatement(req: Request, res: Response) {
    const statementId = String(req.params.statementId);
    try {
      const result = treasuryEngine.executeAutoReconciliation(statementId);
      res.json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'trm.reconcileFailed');
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'ReconciliationError', message: msg });
    }
  }

  public static getBrs(req: Request, res: Response) {
    const accountId = String(req.params.accountId);
    const asOfDate = (req.query.asOfDate as string) || new Date().toISOString().split('T')[0];
    try {
      const brs = treasuryEngine.generateBRS(accountId, asOfDate);
      res.json(brs);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'trm.brsFailed');
      res.status(HttpStatus.NOT_FOUND).json({ error: 'BRSGenerationError', message: msg });
    }
  }

  public static getCashForecast(req: Request, res: Response) {
    const accountId = String(req.params.accountId);
    const openRec = req.query.openReceivables ? Number(req.query.openReceivables) : undefined;
    const openPay = req.query.openPayables ? Number(req.query.openPayables) : undefined;
    try {
      const forecast = treasuryEngine.forecastCashLiquidity(accountId, openRec, openPay);
      res.json(forecast);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'trm.forecastFailed');
      res.status(HttpStatus.NOT_FOUND).json({ error: 'CashForecastError', message: msg });
    }
  }
}
