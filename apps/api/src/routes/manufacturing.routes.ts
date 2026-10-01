import { Router } from 'express';
import { ManufacturingController } from '../controllers/manufacturing.controller';

const router = Router();

router.get('/boms', ManufacturingController.getBoms);
router.get('/work-centers', ManufacturingController.getWorkCenters);
router.get('/orders', ManufacturingController.getOrders);
router.post('/orders', ManufacturingController.createOrder);
router.post('/confirm', ManufacturingController.confirmOrder);

export default router;
