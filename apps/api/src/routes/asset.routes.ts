import { Router } from 'express';
import { AssetController } from '../controllers/asset.controller';

const router = Router();

router.get('/', AssetController.getAssets);
router.post('/', AssetController.registerAsset);
router.post('/depreciation-run', AssetController.executeDepreciationRun);

export default router;
