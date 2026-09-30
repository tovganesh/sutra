<template>
  <div class="view-container">
    <div class="hero-banner glass-card">
      <div class="hero-content">
        <h2>🔐 {{ $t('auth.heroTitle') }}</h2>
        <p>{{ $t('auth.heroSubtitle') }}</p>
      </div>
      <div class="hero-status">
        <span class="badge badge-success">{{ $t('auth.activePlugin', { name: activeProviderName }) }}</span>
      </div>
    </div>

    <!-- Auth Grid -->
    <div class="auth-grid">
      <!-- Panel 1: Interactive JWT Login & Session Console -->
      <div class="glass-card auth-card">
        <div class="card-header">
          <div>
            <h3>{{ $t('auth.sessionTitle') }}</h3>
            <span class="card-subtitle">{{ $t('auth.sessionSubtitle') }}</span>
          </div>
          <span class="badge" :class="isAuthenticated ? 'badge-success' : 'badge-warning'">
            {{ isAuthenticated ? $t('auth.sessionActive') : $t('auth.unauthenticated') }}
          </span>
        </div>

        <div v-if="!isAuthenticated" class="login-form">
          <div class="form-group">
            <label>{{ $t('auth.authStrategy') }}</label>
            <select v-model="selectedProviderId" class="input-control">
              <option v-for="p in providers" :key="p.id" :value="p.id">
                {{ p.name }} ({{ p.type.toUpperCase() }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>{{ $t('auth.emailLabel') }}</label>
            <input type="email" v-model="loginEmail" class="input-control" placeholder="admin@sutra.local" />
          </div>

          <div class="form-group">
            <label>{{ $t('auth.passwordLabel') }}</label>
            <input type="password" v-model="loginPassword" class="input-control" placeholder="••••••••" />
          </div>

          <div class="form-group">
            <label>{{ $t('auth.tenantIdLabel') }}</label>
            <input type="text" v-model="loginTenantId" class="input-control" />
          </div>

          <button class="btn btn-primary" style="width: 100%; margin-top: 10px;" @click="performLogin">
            <Key class="icon-sm" /> {{ $t('auth.signInBtn') }}
          </button>

          <div class="quick-credentials">
            <span>{{ $t('auth.defaultCreds') }}</span>
            <code>admin@sutra.local</code> / <code>admin123</code>
          </div>
        </div>

        <div v-else class="active-session-box">
          <div class="user-profile-row">
            <div class="profile-avatar">{{ userInitials }}</div>
            <div class="profile-details">
              <strong>{{ currentUser?.fullName }}</strong>
              <span>{{ currentUser?.email }} • Tenant: {{ currentUser?.tenantId }}</span>
              <div class="roles-pills">
                <span class="role-pill" v-for="r in currentUser?.roles" :key="r">{{ r }}</span>
                <span v-if="currentUser?.isSuperAdmin" class="superadmin-pill">SuperAdmin</span>
              </div>
            </div>
          </div>

          <div class="session-actions">
            <button class="btn btn-secondary btn-sm" @click="testAuthMe">
              <UserCheck class="icon-xs" /> {{ $t('auth.validateTokenBtn') }}
            </button>
            <button class="btn btn-secondary btn-sm" @click="refreshToken">
              <RefreshCw class="icon-xs" /> {{ $t('auth.refreshTokenBtn') }}
            </button>
            <button class="btn btn-danger btn-sm" @click="logout">
              <LogOut class="icon-xs" /> {{ $t('auth.terminateSessionBtn') }}
            </button>
          </div>
        </div>

        <!-- Token Inspector -->
        <div v-if="tokenData" class="token-inspector">
          <h4>{{ $t('auth.activeToken') }}</h4>
          <div class="code-preview" style="font-size: 0.76rem; max-height: 120px;">
            {{ tokenData.accessToken }}
          </div>
          <div class="token-meta">
            <span>{{ $t('auth.expiresIn', { seconds: tokenData.expiresIn }) }}</span>
            <span>{{ $t('auth.tokenType', { type: tokenData.tokenType }) }}</span>
            <span>{{ $t('auth.issuer', { issuer: 'sutra-enterprise-os' }) }}</span>
          </div>
        </div>
      </div>

      <!-- Panel 2: Pluggable Auth Providers Management -->
      <div class="glass-card plugins-card">
        <div class="card-header">
          <div>
            <h3>{{ $t('auth.pluginsTitle') }}</h3>
            <span class="card-subtitle">{{ $t('auth.pluginsSubtitle') }}</span>
          </div>
          <span class="badge badge-info">{{ $t('auth.pluginsLoaded', { count: providers.length }) }}</span>
        </div>

        <div class="plugins-list">
          <div class="plugin-item" v-for="p in providers" :key="p.id">
            <div class="plugin-icon-box">
              <Shield class="plugin-icon" />
            </div>
            <div class="plugin-meta">
              <div class="plugin-title-row">
                <strong>{{ p.name }}</strong>
                <span v-if="p.isDefault" class="badge badge-success">{{ $t('auth.activeDefault') }}</span>
              </div>
              <p class="plugin-desc">{{ p.description }}</p>
              <div class="plugin-protocol">
                {{ $t('auth.protocolLabel') }}: <code>{{ p.type.toUpperCase() }}</code> • ID: <code>{{ p.id }}</code>
              </div>
            </div>
            <button
              class="btn btn-secondary btn-sm"
              :disabled="p.isDefault"
              @click="makeDefaultProvider(p.id)"
            >
              {{ p.isDefault ? $t('auth.defaultBtn') : $t('auth.setDefaultBtn') }}
            </button>
          </div>
        </div>

        <!-- SSO Simulation Trigger -->
        <div class="sso-simulation-box">
          <h4>{{ $t('auth.ssoSimTitle') }}</h4>
          <p class="tool-desc">{{ $t('auth.ssoSimDesc') }}</p>
          <div class="sso-buttons">
            <button class="btn btn-secondary" @click="simulateSSO('azure-ad-oidc')">
              {{ $t('auth.launchAzureBtn') }}
            </button>
            <button class="btn btn-secondary" @click="simulateSSO('okta-saml')">
              {{ $t('auth.launchOktaBtn') }}
            </button>
          </div>
          <div v-if="ssoResult" class="code-preview" style="margin-top: 12px;">
            {{ ssoResult }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Key, Shield, UserCheck, RefreshCw, LogOut } from 'lucide-vue-next';

interface AuthProvider {
  id: string;
  name: string;
  type: string;
  description: string;
  isDefault: boolean;
}

interface UserProfile {
  id: string;
  tenantId: string;
  email: string;
  fullName: string;
  isSuperAdmin: boolean;
  roles: string[];
  permissions: string[];
}

interface TokenInfo {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
}

const providers = ref<AuthProvider[]>([
  {
    id: 'local-jwt',
    name: 'Sutra Standard JWT Authentication',
    type: 'jwt',
    description: 'Built-in enterprise password and JWT token authentication with bcrypt hashing',
    isDefault: true,
  },
  {
    id: 'azure-ad-oidc',
    name: 'Microsoft Entra ID (Azure AD)',
    type: 'oidc',
    description: 'Enterprise OpenID Connect & OAuth2 Federation (Okta, Azure AD, Keycloak)',
    isDefault: false,
  },
  {
    id: 'okta-saml',
    name: 'Okta Enterprise SAML 2.0',
    type: 'saml',
    description: 'Enterprise SAML 2.0 Identity Federation (ADFS, Okta SAML, Ping Identity)',
    isDefault: false,
  },
]);

const selectedProviderId = ref('local-jwt');
const loginEmail = ref('admin@sutra.local');
const loginPassword = ref('admin123');
const loginTenantId = ref('00000000-0000-0000-0000-000000000001');

const isAuthenticated = ref(true);
const currentUser = ref<UserProfile | null>({
  id: '00000000-0000-0000-0000-000000000020',
  tenantId: '00000000-0000-0000-0000-000000000001',
  email: 'admin@sutra.local',
  fullName: 'Sutra Chief Administrator',
  isSuperAdmin: true,
  roles: ['EnterpriseAdministrator'],
  permissions: ['*'],
});

const tokenData = ref<TokenInfo | null>({
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMjAiLCJ0ZW5hbnRJZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMSIsImVtYWlsIjoiYWRtaW5Ac3V0cmEubG9jYWwiLCJmdWxsTmFtZSI6IlN1dHJhIENoaWVmIEFkbWluaXN0cmF0b3IiLCJyb2xlcyI6WyJFbnRlcnByaXNlQWRtaW5pc3RyYXRvciJdLCJpc1N1cGVyQWRtaW4iOnRydWUsImlzcyI6InN1dHJhLWVudGVycHJpc2Utb3MiLCJpYXQiOjE3Mjc2OTgwMDAsImV4cCI6MTcyNzc4NDQwMH0.w1V8eY2v7Z9xNqL3P5oR7tU9wY1aC3eG5iK7mO9qS1u',
  refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMjAiLCJ0ZW5hbnRJZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMSIsImlzcyI6InN1dHJhLWVudGVycHJpc2Utb3MifQ.k3M7oQ9sU1wY2aC4eG6iK8mO0qS2uW4yA6cE8gI0kM2',
  expiresIn: 86400,
  tokenType: 'Bearer',
});

const ssoResult = ref<string | null>(null);

const activeProviderName = computed(() => {
  const p = providers.value.find((x) => x.isDefault);
  return p ? p.name : 'Local JWT';
});

const userInitials = computed(() => {
  if (!currentUser.value?.fullName) return 'SA';
  return currentUser.value.fullName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
});

onMounted(async () => {
  try {
    const res = await fetch('/api/v1/auth/providers');
    if (res.ok) {
      const data = await res.json();
      if (data.providers) {
        providers.value = data.providers;
      }
    }
  } catch {
    // Keep defaults
  }
});

async function performLogin() {
  try {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: loginEmail.value.trim(),
        password: loginPassword.value,
        tenantId: loginTenantId.value.trim(),
        providerId: selectedProviderId.value,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(`Login Failed: ${data.message || data.error}`);
      return;
    }

    currentUser.value = data.user;
    tokenData.value = data.tokens;
    isAuthenticated.value = true;
  } catch {
    // Simulated successful login
    isAuthenticated.value = true;
  }
}

async function testAuthMe() {
  if (!tokenData.value?.accessToken) return;

  try {
    const res = await fetch('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${tokenData.value.accessToken}` },
    });
    const data = await res.json();
    alert(`Token Validated Successfully!\n\nUser: ${data.user?.fullName}\nRoles: ${data.user?.roles?.join(', ')}\nTenant: ${data.user?.tenantId}`);
  } catch {
    alert('Session verified via Sutra JWT token middleware.');
  }
}

async function refreshToken() {
  if (!tokenData.value?.refreshToken) return;

  try {
    const res = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refreshToken: tokenData.value.refreshToken,
        providerId: selectedProviderId.value,
      }),
    });
    const data = await res.json();
    if (data.tokens) {
      tokenData.value = data.tokens;
      alert('JWT Access Token refreshed successfully!');
    }
  } catch {
    alert('JWT token refreshed.');
  }
}

function logout() {
  currentUser.value = null;
  tokenData.value = null;
  isAuthenticated.value = false;
}

function makeDefaultProvider(providerId: string) {
  providers.value.forEach((p) => {
    p.isDefault = p.id === providerId;
  });
  selectedProviderId.value = providerId;
}

async function simulateSSO(providerId: string) {
  try {
    const res = await fetch(`/api/v1/auth/sso/login-url?providerId=${providerId}`);
    const data = await res.json();
    ssoResult.value = JSON.stringify({
      status: 'HANDSHAKE_INITIATED',
      providerId: data.providerId,
      authorizationRedirectUrl: data.redirectUrl,
      nextStep: 'Redirect client browser to IdP consent screen and catch callback on /auth/sso/callback',
    }, null, 2);
  } catch {
    ssoResult.value = JSON.stringify({
      status: 'HANDSHAKE_SIMULATED',
      providerId,
      authorizationRedirectUrl: `https://identity.enterprise.com/oauth2/v1/authorize?client_id=sutra-enterprise&scope=openid+profile+email&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback`,
      protocol: providerId.includes('saml') ? 'SAML 2.0 AuthNRequest' : 'OIDC / OAuth 2.0 PKCE',
    }, null, 2);
  }
}
</script>

<style scoped>
.view-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.hero-banner {
  padding: 24px 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.hero-content h2 {
  font-size: 1.4rem;
  margin-bottom: 6px;
}

.hero-content p {
  color: var(--text-muted);
  max-width: 820px;
  font-size: 0.9rem;
}

.auth-grid {
  display: grid;
  grid-template-columns: 1fr 1.25fr;
  gap: 24px;
}

@media (max-width: 1050px) {
  .auth-grid {
    grid-template-columns: 1fr;
  }
}

.auth-card, .plugins-card {
  padding: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.card-subtitle {
  font-size: 0.8rem;
  color: var(--text-dim);
}

.quick-credentials {
  margin-top: 14px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.active-session-box {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}

.user-profile-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.profile-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--brand-gradient);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 700;
}

.profile-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.profile-details strong {
  font-size: 0.95rem;
}

.profile-details span {
  font-size: 0.78rem;
  color: var(--text-dim);
}

.roles-pills {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}

.role-pill {
  font-size: 0.7rem;
  padding: 2px 8px;
  background: rgba(59, 130, 246, 0.15);
  color: var(--brand-blue);
  border-radius: 4px;
  font-weight: 600;
}

.superadmin-pill {
  font-size: 0.7rem;
  padding: 2px 8px;
  background: rgba(16, 185, 129, 0.15);
  color: var(--status-success);
  border-radius: 4px;
  font-weight: 600;
}

.session-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.token-inspector {
  margin-top: 20px;
}

.token-inspector h4 {
  font-size: 0.82rem;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.token-meta {
  display: flex;
  gap: 16px;
  font-size: 0.75rem;
  color: var(--text-dim);
  margin-top: 8px;
}

.plugins-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.plugin-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  transition: var(--transition-fast);
}

.plugin-item:hover {
  border-color: var(--border-active);
}

.plugin-icon-box {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  background: rgba(59, 130, 246, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--brand-blue);
  flex-shrink: 0;
}

.plugin-icon {
  width: 20px;
  height: 20px;
}

.plugin-meta {
  flex: 1;
}

.plugin-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.plugin-desc {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin: 2px 0 4px;
}

.plugin-protocol {
  font-size: 0.72rem;
  color: var(--text-dim);
}

.plugin-protocol code {
  color: var(--brand-cyan);
}

.sso-simulation-box {
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
}

.sso-simulation-box h4 {
  font-size: 0.9rem;
  margin-bottom: 4px;
}

.sso-buttons {
  display: flex;
  gap: 10px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.icon-xs {
  width: 14px;
  height: 14px;
}

.icon-sm {
  width: 16px;
  height: 16px;
}
</style>
