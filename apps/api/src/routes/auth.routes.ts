import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../services/engine.registry';

const router = Router();

router.get('/providers', AuthController.listProviders);
router.post('/login', AuthController.login);
router.get('/me', authMiddleware, AuthController.getMe);
router.post('/refresh', AuthController.refreshToken);
router.get('/sso/login-url', AuthController.getSsoLoginUrl);
router.post('/tenants/:tenantId/provider', AuthController.setTenantProvider);

export default router;
