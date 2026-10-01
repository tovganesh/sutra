import { Router } from 'express';
import { ControllingController } from '../controllers/controlling.controller';

const router = Router();

router.get('/cost-centers', ControllingController.getCostCenters);
router.get('/profit-centers', ControllingController.getProfitCenters);
router.get('/allocation-rules', ControllingController.getAllocationRules);
router.post('/assessment-cycles/run', ControllingController.runAssessmentCycle);
router.get('/cost-centers/:code/variance', ControllingController.getVariance);

export default router;
