import { ref, computed } from 'vue';

export interface UserProfile {
  id: string;
  tenantId: string;
  email: string;
  fullName: string;
  isSuperAdmin: boolean;
  roles: string[];
  permissions: string[];
  department?: string;
  attributes?: Record<string, unknown>;
}

export interface TokenInfo {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
}

const STORAGE_KEY_TOKEN = 'sutra_auth_token';
const STORAGE_KEY_REFRESH = 'sutra_auth_refresh';
const STORAGE_KEY_USER = 'sutra_auth_user';

// Global Singleton State
const currentUser = ref<UserProfile | null>(null);
const tokenData = ref<TokenInfo | null>(null);
const isInitialized = ref(false);

// Restore saved session on module load
function initFromStorage() {
  if (isInitialized.value) return;
  try {
    const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
    const savedUser = localStorage.getItem(STORAGE_KEY_USER);
    const savedRefresh = localStorage.getItem(STORAGE_KEY_REFRESH);

    if (savedToken && savedUser) {
      currentUser.value = JSON.parse(savedUser);
      tokenData.value = {
        accessToken: savedToken,
        refreshToken: savedRefresh || undefined,
        expiresIn: 86400,
        tokenType: 'Bearer',
      };
    }
  } catch {
    // LocalStorage parse error fallback
  }
  isInitialized.value = true;
}

initFromStorage();

export function useAuth() {
  const isAuthenticated = computed(() => Boolean(currentUser.value && tokenData.value?.accessToken));

  const userInitials = computed(() => {
    if (!currentUser.value?.fullName) return 'SU';
    const parts = currentUser.value.fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return currentUser.value.fullName.slice(0, 2).toUpperCase();
  });

  const primaryRole = computed(() => {
    if (currentUser.value?.isSuperAdmin) return 'SuperAdmin';
    return currentUser.value?.roles?.[0] || 'User';
  });

  async function login(credentials: {
    email: string;
    password: string;
    tenantId?: string;
    providerId?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: credentials.email.trim(),
          password: credentials.password,
          tenantId: credentials.tenantId?.trim() || '00000000-0000-0000-0000-000000000001',
          providerId: credentials.providerId || 'local-jwt',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.message || data.error || 'Authentication failed' };
      }

      currentUser.value = data.user;
      tokenData.value = data.tokens;

      if (data.tokens?.accessToken) {
        localStorage.setItem(STORAGE_KEY_TOKEN, data.tokens.accessToken);
        if (data.tokens.refreshToken) {
          localStorage.setItem(STORAGE_KEY_REFRESH, data.tokens.refreshToken);
        }
      }
      if (data.user) {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data.user));
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during login' };
    }
  }

  function logout() {
    currentUser.value = null;
    tokenData.value = null;
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_REFRESH);
    localStorage.removeItem(STORAGE_KEY_USER);
  }

  async function checkAuth(): Promise<boolean> {
    if (!tokenData.value?.accessToken) return false;

    try {
      const res = await fetch('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${tokenData.value.accessToken}` },
      });

      if (!res.ok) {
        logout();
        return false;
      }

      const data = await res.json();
      if (data.user) {
        currentUser.value = data.user;
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data.user));
      }
      return true;
    } catch {
      return false;
    }
  }

  function hasPermission(permission: string): boolean {
    if (!currentUser.value) return false;
    if (currentUser.value.isSuperAdmin) return true;
    if (currentUser.value.permissions.includes('*')) return true;
    return currentUser.value.permissions.includes(permission);
  }

  function hasRole(role: string): boolean {
    if (!currentUser.value) return false;
    if (currentUser.value.isSuperAdmin && role === 'EnterpriseAdministrator') return true;
    return currentUser.value.roles.includes(role);
  }

  return {
    currentUser,
    tokenData,
    isAuthenticated,
    userInitials,
    primaryRole,
    login,
    logout,
    checkAuth,
    hasPermission,
    hasRole,
  };
}
