import {
  IAuthProvider,
  AuthCredentials,
  AuthResult,
} from './auth-provider.interface.js';
import { UserContext } from '../security/rbac.js';

export class AuthPluginRegistry {
  private providers: Map<string, IAuthProvider> = new Map();
  private tenantProviderMap: Map<string, string> = new Map(); // tenantId -> providerId
  private defaultProviderId = 'local-jwt';

  /**
   * Registers a new authentication provider plugin.
   */
  public registerProvider(provider: IAuthProvider): this {
    this.providers.set(provider.id, provider);
    return this;
  }

  /**
   * Unregisters an authentication provider plugin.
   */
  public unregisterProvider(providerId: string): boolean {
    if (providerId === this.defaultProviderId && this.providers.size > 1) {
      throw new Error(`Cannot unregister active default auth provider: ${providerId}`);
    }
    return this.providers.delete(providerId);
  }

  /**
   * Sets the global default auth provider ID.
   */
  public setDefaultProvider(providerId: string): void {
    if (!this.providers.has(providerId)) {
      throw new Error(`Auth provider '${providerId}' is not registered`);
    }
    this.defaultProviderId = providerId;
  }

  /**
   * Assigns a specific authentication provider for a specific enterprise tenant.
   * Allows tenant A to use local JWT while tenant B uses corporate Okta / Azure AD.
   */
  public setTenantProvider(tenantId: string, providerId: string): void {
    if (!this.providers.has(providerId)) {
      throw new Error(`Auth provider '${providerId}' is not registered`);
    }
    this.tenantProviderMap.set(tenantId, providerId);
  }

  /**
   * Resolves the appropriate auth provider for a given tenant or returns default.
   */
  public getProviderForTenant(tenantId?: string): IAuthProvider {
    if (tenantId && this.tenantProviderMap.has(tenantId)) {
      const pid = this.tenantProviderMap.get(tenantId)!;
      return this.providers.get(pid)!;
    }
    return this.getDefaultProvider();
  }

  /**
   * Retrieves a specific auth provider by its ID.
   */
  public getProvider(providerId: string): IAuthProvider | undefined {
    return this.providers.get(providerId);
  }

  /**
   * Gets the active default auth provider.
   */
  public getDefaultProvider(): IAuthProvider {
    const provider = this.providers.get(this.defaultProviderId);
    if (!provider) {
      throw new Error(`Default auth provider '${this.defaultProviderId}' not found in registry`);
    }
    return provider;
  }

  /**
   * Lists all currently registered authentication providers.
   */
  public listProviders(): Array<{
    id: string;
    name: string;
    type: string;
    description: string;
    isDefault: boolean;
  }> {
    return Array.from(this.providers.values()).map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      description: p.description,
      isDefault: p.id === this.defaultProviderId,
    }));
  }

  /**
   * Authenticates using either the requested provider or the tenant's configured provider.
   */
  public async authenticate(credentials: AuthCredentials, requestedProviderId?: string): Promise<AuthResult> {
    let provider: IAuthProvider;

    if (requestedProviderId && this.providers.has(requestedProviderId)) {
      provider = this.providers.get(requestedProviderId)!;
    } else {
      provider = this.getProviderForTenant(credentials.tenantId);
    }

    return provider.authenticate(credentials);
  }

  /**
   * Validates a token across registered providers.
   */
  public async validateToken(token: string, hintProviderId?: string): Promise<UserContext> {
    if (hintProviderId && this.providers.has(hintProviderId)) {
      return this.providers.get(hintProviderId)!.validateToken(token);
    }

    // Try default provider first (Local JWT)
    try {
      return await this.getDefaultProvider().validateToken(token);
    } catch {
      // Fallback: iterate over other registered providers
      for (const [id, provider] of this.providers.entries()) {
        if (id === this.defaultProviderId) continue;
        try {
          return await provider.validateToken(token);
        } catch {
          // Continue to next provider
        }
      }
      throw new Error('[Sutra Auth Registry] Token validation failed across all registered providers');
    }
  }
}
