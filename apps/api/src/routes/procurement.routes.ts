import { Router } from 'express';
import { ProcurementController } from '../controllers/procurement.controller';

const router = Router();

router.get('/vendors', ProcurementController.getVendors);
router.post('/orders', ProcurementController.createPurchaseOrder);
router.post('/grn', ProcurementController.processGoodsReceipt);
router.post('/verify-invoice', ProcurementController.verifyInvoice);

export default router;
