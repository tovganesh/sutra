import { Router } from 'express';
import { SalesController } from '../controllers/sales.controller';

const router = Router();

router.get('/customers', SalesController.getCustomers);
router.post('/orders', SalesController.createOrder);
router.post('/deliveries', SalesController.postDelivery);
router.post('/invoices', SalesController.generateInvoice);

export default router;
