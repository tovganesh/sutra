import { Request, Response } from 'express';
import { HttpStatus } from '@sutra/core';
import { multiCurrencyEngine } from '../services/engine.registry';
import { sendError } from '../helpers/response.helper';
import { tReq } from '../helpers/i18n.helper';

export class MultiCurrencyController {
  public static getRates(req: Request, res: Response) {
    const from = req.query.from as any;
    const to = req.query.to as any;
    if (from && to) {
      try {
        const rate = multiCurrencyEngine.getExchangeRate(from, to);
        return res.json({ fromCurrency: from, toCurrency: to, rate });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : tReq(req, 'multicurrency.rateNotFound');
        return res.status(HttpStatus.NOT_FOUND).json({ error: 'ExchangeRateNotFound', message: msg });
      }
    }

    res.json({
      baseCurrency: 'INR',
      rates: [
        { from: 'USD', to: 'INR', spotRate: multiCurrencyEngine.getExchangeRate('USD', 'INR', 'SPOT'), closingRate: multiCurrencyEngine.getExchangeRate('USD', 'INR', 'CLOSING') },
        { from: 'EUR', to: 'INR', spotRate: multiCurrencyEngine.getExchangeRate('EUR', 'INR', 'SPOT') },
        { from: 'GBP', to: 'INR', spotRate: multiCurrencyEngine.getExchangeRate('GBP', 'INR', 'SPOT') },
        { from: 'AED', to: 'INR', spotRate: multiCurrencyEngine.getExchangeRate('AED', 'INR', 'SPOT') },
      ],
    });
  }

  public static setRate(req: Request, res: Response) {
    const { fromCurrency, toCurrency, rate, rateType } = req.body;
    if (!fromCurrency || !toCurrency || !rate) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingRequiredFields', 'multicurrency.rateFieldsRequired');
    }

    try {
      const exRate = multiCurrencyEngine.setExchangeRate(fromCurrency, toCurrency, Number(rate), rateType);
      res.status(HttpStatus.CREATED).json(exRate);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'multicurrency.rateInvalid');
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'ExchangeRateError', message: msg });
    }
  }

  public static convert(req: Request, res: Response) {
    const { amount, fromCurrency, toCurrency, rateType } = req.body;
    if (!amount || !fromCurrency || !toCurrency) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingRequiredFields', 'multicurrency.convertFieldsRequired');
    }

    try {
      const converted = multiCurrencyEngine.convertAmount(Number(amount), fromCurrency, toCurrency, rateType);
      res.json({
        originalAmount: Number(amount),
        fromCurrency,
        toCurrency,
        convertedAmount: converted,
        exchangeRateUsed: multiCurrencyEngine.getExchangeRate(fromCurrency, toCurrency, rateType),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'multicurrency.convertFailed');
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'ConversionError', message: msg });
    }
  }

  public static getLedgers(req: Request, res: Response) {
    const ledgers = multiCurrencyEngine.getLedgers();
    res.json({ count: ledgers.length, ledgers });
  }

  public static postParallelJournal(req: Request, res: Response) {
    const { ledgerGroup, postingDate, reference, narrative, transactionCurrency, exchangeRateUsed, lines } = req.body;
    if (!lines || !Array.isArray(lines) || lines.length < 2) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingRequiredFields', 'multicurrency.parallelJournalFieldsRequired');
    }

    try {
      const entry = multiCurrencyEngine.postParallelJournal({
        ledgerGroup: ledgerGroup || 'ALL',
        postingDate: postingDate || new Date().toISOString().split('T')[0],
        reference: reference || 'PAR-REF',
        narrative: narrative || 'Multi-currency parallel journal posting',
        transactionCurrency: transactionCurrency || 'INR',
        exchangeRateUsed: Number(exchangeRateUsed || 1),
        lines,
      });
      res.status(HttpStatus.CREATED).json(entry);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'multicurrency.parallelJournalFailed');
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'ParallelJournalError', message: msg });
    }
  }

  public static getOpenItems(req: Request, res: Response) {
    const items = multiCurrencyEngine.getOpenMonetaryItems();
    res.json({ count: items.length, items });
  }

  public static postForexRevaluation(req: Request, res: Response) {
    const { currency, closingRate, valuationDate } = req.body;
    if (!currency || !closingRate) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingRequiredFields', 'multicurrency.forexFieldsRequired');
    }

    try {
      const result = multiCurrencyEngine.executeForexRevaluation(currency, Number(closingRate), valuationDate);
      res.status(HttpStatus.CREATED).json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'multicurrency.forexFailed');
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'ForexRevaluationError', message: msg });
    }
  }

  public static calculateTax(req: Request, res: Response) {
    const { countryCode, taxableAmount, customerStateOrRegion, companyStateOrRegion, taxRegistrationNumber } = req.body;
    if (!countryCode || taxableAmount === undefined) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingRequiredFields', 'multicurrency.taxFieldsRequired');
    }

    try {
      const result = multiCurrencyEngine.calculateJurisdictionTax(countryCode, {
        taxableAmount: Number(taxableAmount),
        customerStateOrRegion,
        companyStateOrRegion,
        taxRegistrationNumber,
      });
      res.json({ countryCode: countryCode.toUpperCase(), taxableAmount: Number(taxableAmount), ...result });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'multicurrency.taxFailed');
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'JurisdictionTaxError', message: msg });
    }
  }
}
