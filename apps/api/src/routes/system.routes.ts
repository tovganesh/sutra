import { Router } from 'express';
import { SystemController } from '../controllers/system.controller';

const router = Router();

// Module Selection & Status
router.get('/modules', SystemController.getModules);
router.post('/modules', SystemController.updateModules);

// Installation & Client Setup
router.get('/setup', SystemController.getSetupState);
router.post('/setup', SystemController.configureSetup);

export default router;
