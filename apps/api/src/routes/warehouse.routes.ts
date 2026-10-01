import { Router } from 'express';
import { WarehouseController } from '../controllers/warehouse.controller';

const router = Router();

router.get('/bins', WarehouseController.getBins);
router.post('/bins', WarehouseController.registerBin);
router.post('/putaway', WarehouseController.executePutaway);
router.post('/picking', WarehouseController.executePicking);
router.post('/transfer', WarehouseController.executeTransfer);
router.post('/cycle-count', WarehouseController.recordCycleCount);

export default router;
