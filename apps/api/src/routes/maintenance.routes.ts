import { Router } from 'express';
import { MaintenanceController } from '../controllers/maintenance.controller';

const router = Router();

router.get('/functional-locations', MaintenanceController.getFunctionalLocations);
router.post('/functional-locations', MaintenanceController.registerFunctionalLocation);
router.get('/equipment', MaintenanceController.getEquipment);
router.post('/equipment', MaintenanceController.registerEquipment);
router.get('/equipment/:equipmentNumber/reliability', MaintenanceController.getEquipmentReliability);
router.get('/notifications', MaintenanceController.getNotifications);
router.post('/notifications', MaintenanceController.createNotification);
router.get('/work-orders', MaintenanceController.getWorkOrders);
router.post('/work-orders', MaintenanceController.createWorkOrder);
router.post('/work-orders/:orderNumber/release', MaintenanceController.releaseWorkOrder);
router.post('/work-orders/:orderNumber/spare-parts', MaintenanceController.issueSpareParts);
router.post('/work-orders/:orderNumber/complete', MaintenanceController.completeWorkOrder);
router.post('/work-orders/:orderNumber/settle', MaintenanceController.settleWorkOrder);
router.get('/maintenance-plans', MaintenanceController.getMaintenancePlans);
router.post('/maintenance-plans/evaluate', MaintenanceController.evaluatePlans);

export default router;
