import { Router } from 'express';
import { MultiCurrencyController } from '../controllers/multicurrency.controller';

const router = Router();

router.get('/rates', MultiCurrencyController.getRates);
router.post('/rates', MultiCurrencyController.setRate);
router.post('/convert', MultiCurrencyController.convert);
router.get('/ledgers', MultiCurrencyController.getLedgers);
router.post('/parallel-journal', MultiCurrencyController.postParallelJournal);
router.get('/open-items', MultiCurrencyController.getOpenItems);
router.post('/forex-revaluation', MultiCurrencyController.postForexRevaluation);
router.post('/tax/calculate', MultiCurrencyController.calculateTax);

export default router;
