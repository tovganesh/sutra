import { Request, Response } from 'express';
import { HttpStatus } from '@sutra/core';
import { authRegistry } from '../services/engine.registry';
import { tReq } from '../helpers/i18n.helper';
import { sendError } from '../helpers/response.helper';

export class AuthController {
  public static listProviders(req: Request, res: Response) {
    res.json({
      defaultProvider: authRegistry.getDefaultProvider().id,
      providers: authRegistry.listProviders(),
    });
  }

  public static async login(req: Request, res: Response) {
    const { email, password, tenantId, providerId } = req.body;

    try {
      const result = await authRegistry.authenticate(
        {
          email,
          password,
          tenantId: tenantId || '00000000-0000-0000-0000-000000000001',
        },
        providerId
      );

      if (!result.success) {
        const isGenericInvalid = !result.errorMessage || result.errorMessage.startsWith('Invalid credentials');
        const message = isGenericInvalid ? tReq(req, 'auth.invalidCredentials') : result.errorMessage;
        return res.status(HttpStatus.UNAUTHORIZED).json({
          error: 'AuthenticationFailed',
          message,
          provider: result.provider,
        });
      }

      res.json({
        message: tReq(req, 'auth.authSuccessful'),
        provider: result.provider,
        providerId: result.providerId,
        user: {
          id: result.user?.userId,
          tenantId: result.user?.tenantId,
          email: result.user?.email,
          fullName: result.user?.fullName,
          isSuperAdmin: result.user?.isSuperAdmin,
          roles: result.user?.roles,
          permissions: result.user ? Array.from(result.user.permissions) : [],
          attributes: result.user?.attributes,
        },
        tokens: result.tokens,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'InternalAuthError', message: msg });
    }
  }

  public static getMe(req: Request, res: Response) {
    if (!req.user) {
      return sendError(req, res, HttpStatus.UNAUTHORIZED, 'Unauthorized', 'auth.noActiveSession');
    }

    res.json({
      user: {
        id: req.user.userId,
        tenantId: req.user.tenantId,
        email: req.user.email,
        fullName: req.user.fullName,
        isSuperAdmin: req.user.isSuperAdmin,
        roles: req.user.roles,
        permissions: Array.from(req.user.permissions),
        attributes: req.user.attributes,
      },
    });
  }

  public static async refreshToken(req: Request, res: Response) {
    const { refreshToken, providerId } = req.body;
    if (!refreshToken) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingRefreshToken', 'auth.missingRefreshToken');
    }

    const provider = providerId ? authRegistry.getProvider(providerId) : authRegistry.getDefaultProvider();
    if (!provider || !provider.refreshToken) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'UnsupportedOperation', 'auth.providerNotSupportRefresh');
    }

    try {
      const newTokens = await provider.refreshToken(refreshToken);
      res.json({ tokens: newTokens });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'auth.tokenRefreshFailed');
      res.status(HttpStatus.UNAUTHORIZED).json({ error: 'InvalidRefreshToken', message: msg });
    }
  }

  public static async getSsoLoginUrl(req: Request, res: Response) {
    const providerId = (req.query.providerId as string) || 'azure-ad-oidc';
    const provider = authRegistry.getProvider(providerId);

    if (!provider) {
      return res.status(HttpStatus.NOT_FOUND).json({
        error: tReq(req, 'auth.providerNotFound', { providerId }),
      });
    }

    if (!provider.getLoginUrl) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        error: tReq(req, 'auth.providerNoSso', { providerId }),
      });
    }

    try {
      const url = await provider.getLoginUrl();
      res.json({ providerId, redirectUrl: url });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'SSOUrlGenerationFailed', message: msg });
    }
  }

  public static setTenantProvider(req: Request, res: Response) {
    const tenantId = req.params.tenantId as string;
    const { providerId } = req.body;

    if (!providerId) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingField', 'auth.providerIdRequired');
    }

    try {
      authRegistry.setTenantProvider(tenantId, providerId);
      res.json({
        message: tReq(req, 'auth.tenantStrategyUpdated', { tenantId, providerId }),
        tenantId,
        activeProvider: providerId,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(HttpStatus.BAD_REQUEST).json({ error: 'FailedToSetTenantProvider', message: msg });
    }
  }
}
