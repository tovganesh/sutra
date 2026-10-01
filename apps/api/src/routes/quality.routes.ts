import { Router } from 'express';
import { QualityController } from '../controllers/quality.controller';

const router = Router();

router.get('/lots', QualityController.getLots);
router.get('/lots/:lotId', QualityController.getLotById);
router.post('/lots', QualityController.createLot);
router.post('/lots/:lotId/results', QualityController.recordResults);
router.post('/lots/:lotId/usage-decision', QualityController.recordUsageDecision);
router.post('/lots/:lotId/certificate-of-analysis', QualityController.generateCoA);
router.get('/batches', QualityController.getBatches);
router.get('/batches/:batchNumber/trace', QualityController.traceBatch);

export default router;
