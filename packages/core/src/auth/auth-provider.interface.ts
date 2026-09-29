import { UserContext } from '../security/rbac.js';

export type AuthProviderType = 'jwt' | 'oidc' | 'saml' | 'ldap' | 'custom';

export interface TokenPair {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number; // in seconds
  tokenType: string; // 'Bearer'
}

export interface AuthCredentials {
  // Local JWT / Password Credentials
  email?: string;
  password?: string;
  tenantId?: string;

  // OAuth / OIDC Credentials
  authorizationCode?: string;
  redirectUri?: string;
  idToken?: string;

  // SAML 2.0 Credentials
  samlResponse?: string;

  // LDAP / Directory Credentials
  username?: string;
  domain?: string;

  // Extensible custom metadata
  metadata?: Record<string, unknown>;
}

export interface AuthResult {
  success: boolean;
  provider: AuthProviderType;
  providerId: string;
  user?: UserContext;
  tokens?: TokenPair;
  errorMessage?: string;
  redirectUrl?: string;
}

export interface AuthTokenPayload {
  sub: string; // User ID
  tenantId: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
  isSuperAdmin: boolean;
  attributes?: Record<string, unknown>;
  iss?: string;
  iat?: number;
  exp?: number;
}

export interface IAuthProvider {
  id: string;
  name: string;
  type: AuthProviderType;
  description: string;

  /**
   * Authenticates incoming credentials and returns user context and session tokens.
   */
  authenticate(credentials: AuthCredentials): Promise<AuthResult>;

  /**
   * Validates a bearer token and resolves the authenticated UserContext.
   */
  validateToken(token: string): Promise<UserContext>;

  /**
   * Optional: Refresh an expired access token using a refresh token.
   */
  refreshToken?(refreshToken: string): Promise<TokenPair>;

  /**
   * Optional: Initiates third-party SSO flow (e.g. OIDC or SAML redirect URL).
   */
  getLoginUrl?(state?: string, redirectUri?: string): Promise<string>;

  /**
   * Optional: Handles SSO callback from third-party identity provider.
   */
  handleCallback?(params: Record<string, string>): Promise<AuthResult>;

  /**
   * Optional: Revoke an active token.
   */
  revokeToken?(token: string): Promise<void>;
}
