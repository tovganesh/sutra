import { Router } from 'express';
import { NoCodeController } from '../controllers/nocode.controller';

const router = Router();

// Dynamic Entity Schemas
router.get('/schemas', NoCodeController.getSchemas);
router.get('/schemas/:slug', NoCodeController.getSchema);
router.post('/schemas', NoCodeController.createSchema);
router.post('/schemas/:slug/fields', NoCodeController.addFieldToSchema);
router.delete('/schemas/:slug', NoCodeController.deleteSchema);

// Dynamic Entity Records
router.get('/records/:slug', NoCodeController.getRecords);
router.post('/records/:slug', NoCodeController.createRecord);
router.put('/records/:slug/:id', NoCodeController.updateRecord);
router.delete('/records/:slug/:id', NoCodeController.deleteRecord);

export default router;
