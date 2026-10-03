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

// User Directory & Provisioning
router.get('/users', AuthController.listUsers);
router.get('/users/:id', AuthController.getUser);
router.post('/users', AuthController.createUser);
router.put('/users/:id', AuthController.updateUser);
router.patch('/users/:id/status', AuthController.setUserStatus);
router.post('/users/:id/reset-password', AuthController.resetPassword);

// Roles & Permissions
router.get('/roles', AuthController.listRoles);
router.post('/roles', AuthController.createRole);
router.put('/roles/:roleId/permissions', AuthController.updateRolePermissions);
router.delete('/roles/:roleId', AuthController.deleteRole);
router.get('/permissions', AuthController.listPermissions);

export default router;
