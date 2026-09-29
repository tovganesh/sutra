import { Request, Response, NextFunction } from 'express';
import { AuthPluginRegistry } from './auth-plugin-registry.js';
import { AccessControlEngine, UserContext } from '../security/rbac.js';

// Extend Express Request interface to include user and tenant context
declare global {
  namespace Express {
    interface Request {
      user?: UserContext;
      tenantId?: string;
    }
  }
}

export function createAuthMiddleware(registry: AuthPluginRegistry) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or malformed Authorization header. Expected Bearer <token>',
      });
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Bearer token is empty',
      });
    }

    try {
      const user = await registry.validateToken(token);
      req.user = user;
      req.tenantId = user.tenantId;

      // Check tenant header if present (prevent cross-tenant data access)
      const requestedTenant = req.headers['x-tenant-id'] as string;
      if (requestedTenant) {
        AccessControlEngine.enforceTenantIsolation(user, requestedTenant);
      }

      next();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid token';
      return res.status(401).json({
        error: 'Unauthorized',
        message: msg,
      });
    }
  };
}

export function requirePermission(permissionCode: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    }

    const hasAccess = AccessControlEngine.can(req.user, permissionCode, req.body);
    if (!hasAccess) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `User lacks required permission: ${permissionCode}`,
      });
    }

    next();
  };
}
