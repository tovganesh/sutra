import { Router } from 'express';
import { AiController } from '../controllers/ai.controller';

const router = Router();

router.get('/status', AiController.getStatus);
router.post('/provider', AiController.setProvider);
router.post('/query', AiController.query);
router.post('/extract-invoice', AiController.extractInvoice);
router.post('/actions/execute', AiController.executeAction);

export default router;
