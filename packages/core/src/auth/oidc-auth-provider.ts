import {
  IAuthProvider,
  AuthProviderType,
  AuthCredentials,
  AuthResult,
  TokenPair,
} from './auth-provider.interface.js';
import { UserContext } from '../security/rbac.js';

export interface OidcProviderConfig {
  id?: string;
  name?: string;
  issuerUrl: string;       // e.g. https://login.microsoftonline.com/{tenant-id}/v2.0 or https://dev-xxx.okta.com
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes?: string[];       // ['openid', 'profile', 'email']
  defaultTenantId?: string;
  roleClaimName?: string;  // e.g. 'roles' or 'groups'
}

export class OidcAuthProvider implements IAuthProvider {
  public id: string;
  public name: string;
  public type: AuthProviderType = 'oidc';
  public description = 'Enterprise OpenID Connect & OAuth2 Federation (Okta, Azure AD / Entra ID, Keycloak)';

  private config: OidcProviderConfig;

  constructor(config: OidcProviderConfig) {
    this.id = config.id || 'enterprise-oidc';
    this.name = config.name || 'Enterprise SSO (OIDC)';
    this.config = {
      scopes: ['openid', 'profile', 'email'],
      defaultTenantId: '00000000-0000-0000-0000-000000000001',
      roleClaimName: 'roles',
      ...config,
    };
  }

  /**
   * Generates the identity provider's authorization URL.
   */
  public async getLoginUrl(state = 'sutra_oidc_state', redirectUri?: string): Promise<string> {
    const targetRedirect = redirectUri || this.config.redirectUri;
    const scopes = encodeURIComponent(this.config.scopes?.join(' ') || 'openid profile email');
    const authEndpoint = `${this.config.issuerUrl.replace(/\/+$/, '')}/oauth2/v1/authorize`;

    return `${authEndpoint}?client_id=${encodeURIComponent(this.config.clientId)}&response_type=code&scope=${scopes}&redirect_uri=${encodeURIComponent(targetRedirect)}&state=${encodeURIComponent(state)}`;
  }

  /**
   * Authenticates by exchanging an authorization code or validating an ID token.
   */
  public async authenticate(credentials: AuthCredentials): Promise<AuthResult> {
    if (credentials.authorizationCode) {
      return this.exchangeCodeForTokens(credentials.authorizationCode, credentials.redirectUri);
    }

    if (credentials.idToken) {
      const user = await this.validateToken(credentials.idToken);
      return {
        success: true,
        provider: this.type,
        providerId: this.id,
        user,
        tokens: {
          accessToken: credentials.idToken,
          expiresIn: 3600,
          tokenType: 'Bearer',
        },
      };
    }

    return {
      success: false,
      provider: this.type,
      providerId: this.id,
      errorMessage: 'Missing authorizationCode or idToken for OIDC authentication',
    };
  }

  /**
   * Validates an OIDC token and translates identity claims into Sutra UserContext.
   */
  public async validateToken(token: string): Promise<UserContext> {
    try {
      // In production, verify JWT against IdP JWKS endpoint.
      // Parse token payload:
      const parts = token.split('.');
      if (parts.length < 2) {
        throw new Error('Malformed JWT token structure');
      }

      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      const email = payload.email || payload.preferred_username || payload.upn || `${payload.sub}@sso.enterprise`;
      const fullName = payload.name || payload.given_name || 'Enterprise SSO User';
      const rawRoles = payload[this.config.roleClaimName || 'roles'] || payload.groups || [];
      const roles = Array.isArray(rawRoles) ? rawRoles : [String(rawRoles)];

      return {
        userId: payload.sub || `oidc-${Date.now()}`,
        tenantId: payload.tenantId || this.config.defaultTenantId || '00000000-0000-0000-0000-000000000001',
        email,
        fullName,
        isSuperAdmin: roles.includes('EnterpriseAdministrator') || roles.includes('GlobalAdmin'),
        roles: roles.length > 0 ? roles : ['EnterpriseUser'],
        permissions: new Set(['ledger:read', 'finance:invoice:read']),
        attributes: {
          idpIssuer: this.config.issuerUrl,
          authMethod: 'OIDC',
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`[Sutra OIDC Auth] Failed to validate token: ${msg}`);
    }
  }

  /**
   * Exchanges authorization code for tokens with the identity provider.
   */
  private async exchangeCodeForTokens(code: string, redirectUri?: string): Promise<AuthResult> {
    try {
      const tokenEndpoint = `${this.config.issuerUrl.replace(/\/+$/, '')}/oauth2/v1/token`;
      const res = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri || this.config.redirectUri,
        }).toString(),
      });

      if (!res.ok) {
        const errorText = await res.text();
        return {
          success: false,
          provider: this.type,
          providerId: this.id,
          errorMessage: `OIDC token exchange failed: ${errorText}`,
        };
      }

      const data = (await res.json()) as {
        access_token: string;
        id_token?: string;
        refresh_token?: string;
        expires_in: number;
      };

      const user = await this.validateToken(data.id_token || data.access_token);

      return {
        success: true,
        provider: this.type,
        providerId: this.id,
        user,
        tokens: {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresIn: data.expires_in || 3600,
          tokenType: 'Bearer',
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        provider: this.type,
        providerId: this.id,
        errorMessage: `OIDC code exchange error: ${msg}`,
      };
    }
  }

  public async handleCallback(params: Record<string, string>): Promise<AuthResult> {
    if (!params.code) {
      return {
        success: false,
        provider: this.type,
        providerId: this.id,
        errorMessage: params.error_description || params.error || 'Authorization code missing in callback',
      };
    }
    return this.exchangeCodeForTokens(params.code);
  }
}
