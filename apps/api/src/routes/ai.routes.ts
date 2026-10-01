import { Router } from 'express';
import { AiController } from '../controllers/ai.controller';

const router = Router();

router.post('/query', AiController.query);
router.post('/extract-invoice', AiController.extractInvoice);

export default router;
