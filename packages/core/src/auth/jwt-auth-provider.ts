import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import {
  IAuthProvider,
  AuthProviderType,
  AuthCredentials,
  AuthResult,
  AuthTokenPayload,
  TokenPair,
} from './auth-provider.interface.js';
import { UserContext } from '../security/rbac.js';

export interface JwtAuthProviderOptions {
  secretKey: string;
  refreshSecretKey?: string;
  tokenExpirationSeconds?: number;
  refreshTokenExpirationSeconds?: number;
  issuer?: string;
  userLookupFn?: (email: string, tenantId?: string) => Promise<{
    id: string;
    tenantId: string;
    email: string;
    passwordHash: string;
    fullName: string;
    isActive: boolean;
    isSuperAdmin: boolean;
    roles: string[];
    permissions: string[];
    attributes?: Record<string, unknown>;
  } | null>;
}

export class LocalJwtAuthProvider implements IAuthProvider {
  public id = 'local-jwt';
  public name = 'Sutra Standard JWT Authentication';
  public type: AuthProviderType = 'jwt';
  public description = 'Built-in enterprise password and JWT token authentication with bcrypt hashing';

  private secretKey: string;
  private refreshSecretKey: string;
  private tokenExpirationSeconds: number;
  private refreshTokenExpirationSeconds: number;
  private issuer: string;
  private userLookupFn?: JwtAuthProviderOptions['userLookupFn'];

  constructor(options: JwtAuthProviderOptions) {
    this.secretKey = options.secretKey;
    this.refreshSecretKey = options.refreshSecretKey || options.secretKey + '_refresh';
    this.tokenExpirationSeconds = options.tokenExpirationSeconds || 60 * 60 * 24; // 24 hours
    this.refreshTokenExpirationSeconds = options.refreshTokenExpirationSeconds || 60 * 60 * 24 * 7; // 7 days
    this.issuer = options.issuer || 'sutra-enterprise-os';
    this.userLookupFn = options.userLookupFn;
  }

  public setUserLookupFn(fn: JwtAuthProviderOptions['userLookupFn']): void {
    this.userLookupFn = fn;
  }

  /**
   * Authenticates user via email & password, verifies bcrypt hash, and issues signed JWT tokens.
   */
  public async authenticate(credentials: AuthCredentials): Promise<AuthResult> {
    if (!credentials.email || !credentials.password) {
      return {
        success: false,
        provider: this.type,
        providerId: this.id,
        errorMessage: 'Email and password are required',
      };
    }

    if (!this.userLookupFn) {
      // Fallback default admin credentials if DB is not attached
      return this.authenticateDefaultFallback(credentials);
    }

    try {
      const user = await this.userLookupFn(credentials.email, credentials.tenantId);
      if (!user) {
        return {
          success: false,
          provider: this.type,
          providerId: this.id,
          errorMessage: 'Invalid credentials or user not found',
        };
      }

      if (!user.isActive) {
        return {
          success: false,
          provider: this.type,
          providerId: this.id,
          errorMessage: 'User account is deactivated. Contact enterprise administrator.',
        };
      }

      const isMatch = await bcrypt.compare(credentials.password, user.passwordHash);
      if (!isMatch) {
        return {
          success: false,
          provider: this.type,
          providerId: this.id,
          errorMessage: 'Invalid credentials',
        };
      }

      const userContext: UserContext = {
        userId: user.id,
        tenantId: user.tenantId,
        email: user.email,
        fullName: user.fullName,
        isSuperAdmin: user.isSuperAdmin,
        roles: user.roles,
        permissions: new Set(user.permissions),
        attributes: user.attributes,
      };

      const tokens = this.generateTokenPair(userContext);

      return {
        success: true,
        provider: this.type,
        providerId: this.id,
        user: userContext,
        tokens,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        provider: this.type,
        providerId: this.id,
        errorMessage: `Authentication error: ${msg}`,
      };
    }
  }

  /**
   * Validates a signed JWT bearer token and extracts the UserContext.
   */
  public async validateToken(token: string): Promise<UserContext> {
    try {
      const decoded = jwt.verify(token, this.secretKey, {
        issuer: this.issuer,
      }) as AuthTokenPayload;

      return {
        userId: decoded.sub,
        tenantId: decoded.tenantId,
        email: decoded.email,
        fullName: decoded.fullName,
        isSuperAdmin: Boolean(decoded.isSuperAdmin),
        roles: decoded.roles || [],
        permissions: new Set(decoded.permissions || []),
        attributes: decoded.attributes,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid or expired token';
      throw new Error(`[Sutra JWT Auth] Token validation failed: ${msg}`);
    }
  }

  /**
   * Refreshes an expired access token using a valid refresh token.
   */
  public async refreshToken(refreshToken: string): Promise<TokenPair> {
    try {
      const decoded = jwt.verify(refreshToken, this.refreshSecretKey, {
        issuer: this.issuer,
      }) as AuthTokenPayload;

      const userContext: UserContext = {
        userId: decoded.sub,
        tenantId: decoded.tenantId,
        email: decoded.email,
        fullName: decoded.fullName,
        isSuperAdmin: Boolean(decoded.isSuperAdmin),
        roles: decoded.roles || [],
        permissions: new Set(decoded.permissions || []),
        attributes: decoded.attributes,
      };

      return this.generateTokenPair(userContext);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid or expired refresh token';
      throw new Error(`[Sutra JWT Auth] Refresh token verification failed: ${msg}`);
    }
  }

  /**
   * Generates a signed Access Token & Refresh Token pair.
   */
  public generateTokenPair(user: UserContext): TokenPair {
    const payload: AuthTokenPayload = {
      sub: user.userId,
      tenantId: user.tenantId,
      email: user.email,
      fullName: user.fullName,
      roles: user.roles,
      permissions: Array.from(user.permissions),
      isSuperAdmin: user.isSuperAdmin,
      attributes: user.attributes,
    };

    const accessToken = jwt.sign(payload, this.secretKey, {
      expiresIn: this.tokenExpirationSeconds,
      issuer: this.issuer,
    });

    const refreshToken = jwt.sign(payload, this.refreshSecretKey, {
      expiresIn: this.refreshTokenExpirationSeconds,
      issuer: this.issuer,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.tokenExpirationSeconds,
      tokenType: 'Bearer',
    };
  }

  /**
   * Fallback for quickstart / initial bootstrap admin user before database seeding.
   */
  private authenticateDefaultFallback(credentials: AuthCredentials): AuthResult {
    if (credentials.email === 'admin@sutra.local' && credentials.password === 'admin123') {
      const userContext: UserContext = {
        userId: '00000000-0000-0000-0000-000000000020',
        tenantId: credentials.tenantId || '00000000-0000-0000-0000-000000000001',
        email: 'admin@sutra.local',
        fullName: 'Sutra Chief Administrator',
        isSuperAdmin: true,
        roles: ['EnterpriseAdministrator'],
        permissions: new Set(['*']),
      };

      const tokens = this.generateTokenPair(userContext);

      return {
        success: true,
        provider: this.type,
        providerId: this.id,
        user: userContext,
        tokens,
      };
    }

    return {
      success: false,
      provider: this.type,
      providerId: this.id,
      errorMessage: 'Invalid credentials. Default admin is admin@sutra.local / admin123',
    };
  }
}
