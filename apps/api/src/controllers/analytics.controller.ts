import { Request, Response } from 'express';
import { FinancialReportGenerator, KPIEvaluator } from '@sutra/analytics';
import { sampleBalances } from '../helpers/store.helper';

export class AnalyticsController {
  public static getKpis(req: Request, res: Response) {
    const kpis = KPIEvaluator.evaluate({
      accountsReceivable: 5000000,
      annualCreditSales: 12000000,
      daysInPeriod: 365,
      currentAssets: 12000000,
      currentLiabilities: 3500000,
      inventoryValue: 3000000,
      grossProfit: 7200000,
      netProfit: 3500000,
      totalRevenue: 12000000,
    });

    res.json({
      asOf: new Date().toISOString(),
      currency: 'INR',
      kpis,
    });
  }

  public static getPnl(req: Request, res: Response) {
    const pnl = FinancialReportGenerator.generateProfitAndLoss(
      sampleBalances,
      '2026-04-01',
      '2027-03-31'
    );
    res.json(pnl);
  }

  public static getBalanceSheet(req: Request, res: Response) {
    const bs = FinancialReportGenerator.generateBalanceSheet(
      sampleBalances,
      '2026-09-28',
      3500000 // Retained earnings adjustment
    );
    res.json(bs);
  }
}
