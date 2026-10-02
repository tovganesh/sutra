import { Router } from 'express';
import { SourcingController } from '../controllers/sourcing.controller';

const router = Router();

router.get('/rfqs', SourcingController.getAllRfqs);
router.post('/rfqs', SourcingController.createRfq);
router.get('/rfqs/:rfqNumber', SourcingController.getRfqDetails);
router.post('/rfqs/:rfqNumber/bids', SourcingController.submitBid);
router.post('/rfqs/:rfqNumber/evaluate', SourcingController.evaluateBids);
router.post('/rfqs/:rfqNumber/award', SourcingController.awardRfq);
router.get('/scorecards', SourcingController.getVendorScorecards);

export default router;
