import { Router } from 'express';
import { CreditController } from '../controllers/credit.controller';

const router = Router();

router.get('/customers', CreditController.getCustomers);
router.get('/customers/:id', CreditController.getCustomerById);
router.post('/check', CreditController.performCheck);
router.get('/blocked-orders', CreditController.getBlockedOrders);
router.post('/orders/:orderNumber/release', CreditController.releaseOrder);
router.post('/orders/:orderNumber/reject', CreditController.rejectOrder);
router.post('/dunning/run', CreditController.runDunning);
router.get('/dunning/notices', CreditController.getDunningNotices);

export default router;
