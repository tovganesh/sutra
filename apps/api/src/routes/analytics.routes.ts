import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';

const router = Router();

router.get('/kpis', AnalyticsController.getKpis);
router.get('/pnl', AnalyticsController.getPnl);
router.get('/balance-sheet', AnalyticsController.getBalanceSheet);
router.get('/cash-flow', AnalyticsController.getCashFlow);
router.get('/profitability/segments', AnalyticsController.getProfitabilitySegments);
router.get('/dupont', AnalyticsController.getDuPont);

export default router;

