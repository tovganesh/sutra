import { Router } from 'express';
import { TransportationController } from '../controllers/transportation.controller';

const router = Router();

router.get('/carriers', TransportationController.getCarriers);
router.get('/vehicles', TransportationController.getVehicles);
router.get('/orders', TransportationController.getOrders);
router.get('/orders/:orderNumber', TransportationController.getOrderById);
router.post('/freight/calculate', TransportationController.calculateFreight);
router.post('/orders/create', TransportationController.createOrder);
router.post('/orders/dispatch', TransportationController.dispatchOrder);
router.post('/orders/milestone', TransportationController.addMilestone);
router.post('/orders/confirm-delivery', TransportationController.confirmDelivery);

export default router;
