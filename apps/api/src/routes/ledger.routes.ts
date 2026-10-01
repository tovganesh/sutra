import { Router } from 'express';
import { LedgerController } from '../controllers/ledger.controller';

const router = Router();

router.post('/post', LedgerController.postJournalEntry);
router.get('/aging', LedgerController.getAgingReport);

export default router;
