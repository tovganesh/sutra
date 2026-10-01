import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';

const router = Router();

router.get('/materials', InventoryController.getMaterials);
router.post('/materials', InventoryController.registerMaterial);
router.get('/stock', InventoryController.getStock);
router.post('/movements', InventoryController.executeMovement);

export default router;
