import { Router } from 'express';
import { NoCodeController } from '../controllers/nocode.controller';

const router = Router();

router.get('/schemas', NoCodeController.getSchemas);
router.post('/schemas', NoCodeController.createSchema);
router.get('/records/:slug', NoCodeController.getRecords);
router.post('/records/:slug', NoCodeController.createRecord);

export default router;
