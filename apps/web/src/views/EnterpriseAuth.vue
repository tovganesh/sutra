<template>
  <div class="view-container">
    <!-- Hero Banner -->
    <div class="hero-banner glass-card">
      <div class="hero-content">
        <h2>🔐 {{ $t('auth.heroTitle') }}</h2>
        <p>{{ $t('auth.heroSubtitle') }}</p>
      </div>
      <div class="hero-status">
        <span class="badge" :class="isAuthenticated ? 'badge-success' : 'badge-warning'">
          {{ isAuthenticated ? `${$t('auth.sessionActive')}: ${currentUser?.fullName}` : $t('auth.unauthenticated') }}
        </span>
      </div>
    </div>

    <!-- Navigation Sub-Tabs -->
    <div class="iam-subtabs">
      <button
        class="iam-tab-btn"
        :class="{ active: activeIamTab === 'session' }"
        @click="activeIamTab = 'session'"
      >
        <Key class="tab-icon-sm" />
        <span>{{ $t('auth.tabs.session') }}</span>
      </button>

      <button
        class="iam-tab-btn"
        :class="{ active: activeIamTab === 'users' }"
        @click="activeIamTab = 'users'; fetchUsers()"
      >
        <Users class="tab-icon-sm" />
        <span>{{ $t('auth.tabs.users') }}</span>
        <span class="counter-badge" v-if="usersList.length">{{ usersList.length }}</span>
      </button>

      <button
        class="iam-tab-btn"
        :class="{ active: activeIamTab === 'roles' }"
        @click="activeIamTab = 'roles'; fetchRoles()"
      >
        <Shield class="tab-icon-sm" />
        <span>{{ $t('auth.tabs.roles') }}</span>
        <span class="counter-badge" v-if="rolesList.length">{{ rolesList.length }}</span>
      </button>

      <button
        class="iam-tab-btn"
        :class="{ active: activeIamTab === 'sso' }"
        @click="activeIamTab = 'sso'"
      >
        <Globe class="tab-icon-sm" />
        <span>{{ $t('auth.tabs.sso') }}</span>
      </button>
    </div>

    <!-- ================================================================= -->
    <!-- TAB 1: Session & Interactive Login Console -->
    <!-- ================================================================= -->
    <div v-if="activeIamTab === 'session'" class="auth-grid">
      <!-- Session / Login Panel -->
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
                {{ p.nameKey ? $t(p.nameKey) : p.name }} ({{ p.type.toUpperCase() }})
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

          <button class="btn btn-primary" style="width: 100%; margin-top: 10px;" @click="performLogin" :disabled="isLoggingIn">
            <Key class="icon-sm" /> {{ isLoggingIn ? 'Authenticating...' : $t('auth.signInBtn') }}
          </button>

          <!-- Quick Demo Persona Switcher -->
          <div class="quick-personas-box">
            <span class="personas-label">⚡ {{ $t('auth.personas.quickSwitch') }}</span>
            <div class="personas-grid">
              <button
                v-for="p in demoPersonas"
                :key="p.email"
                class="persona-btn"
                @click="quickLoginAs(p.email, p.password)"
              >
                <strong>{{ p.label }}</strong>
                <small>{{ p.email }}</small>
              </button>
            </div>
          </div>
        </div>

        <div v-else class="active-session-box">
          <div class="user-profile-row">
            <div class="profile-avatar">{{ userInitials }}</div>
            <div class="profile-details">
              <strong>{{ currentUser?.fullName }}</strong>
              <span>{{ currentUser?.email }} • Department: {{ currentUser?.department || 'General' }}</span>
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

          <!-- Granted Permissions Chips -->
          <div class="permissions-preview-box">
            <h4>Granted Permissions ({{ currentUser?.permissions?.length || 0 }})</h4>
            <div class="perm-chips">
              <span v-for="p in currentUser?.permissions" :key="p" class="perm-chip">
                {{ p }}
              </span>
            </div>
          </div>
        </div>

        <!-- Token Inspector -->
        <div v-if="tokenData" class="token-inspector">
          <h4>{{ $t('auth.activeToken') }}</h4>
          <div class="code-preview" style="font-size: 0.76rem; max-height: 100px;">
            {{ tokenData.accessToken }}
          </div>
          <div class="token-meta">
            <span>{{ $t('auth.expiresIn', { seconds: tokenData.expiresIn }) }}</span>
            <span>{{ $t('auth.tokenType', { type: tokenData.tokenType }) }}</span>
            <span>{{ $t('auth.issuer', { issuer: 'sutra-enterprise-os' }) }}</span>
          </div>
        </div>
      </div>

      <!-- Quick Session Security Stats -->
      <div class="glass-card iam-stats-card">
        <div class="card-header">
          <div>
            <h3>Security & Session Auditing</h3>
            <span class="card-subtitle">Zero Trust Identity Assurance</span>
          </div>
          <span class="badge badge-success">RBAC Enforced</span>
        </div>

        <div class="security-items-list">
          <div class="security-item">
            <ShieldCheck class="item-icon text-green" />
            <div>
              <strong>Multi-Tenant Isolation</strong>
              <p>Tokens signed with scoped tenant claim: <code>{{ currentUser?.tenantId || '00000000-0000-0000-0000-000000000001' }}</code></p>
            </div>
          </div>
          <div class="security-item">
            <Lock class="item-icon text-brand" />
            <div>
              <strong>Bcrypt Password Hashing</strong>
              <p>Cryptographic salt rounds of 10 applied on all user credentials</p>
            </div>
          </div>
          <div class="security-item">
            <Layers class="item-icon text-cyan" />
            <div>
              <strong>Stateless Bearer JWT</strong>
              <p>HMAC-SHA256 signature verification with standard 24-hour expiration</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- TAB 2: Enterprise User Directory & Provisioning -->
    <!-- ================================================================= -->
    <div v-if="activeIamTab === 'users'" class="glass-card iam-section-card">
      <div class="card-header">
        <div>
          <h3>{{ $t('auth.users.title') }}</h3>
          <span class="card-subtitle">{{ $t('auth.users.subtitle') }}</span>
        </div>
        <button class="btn btn-primary" @click="showProvisionModal = true">
          <UserPlus class="icon-sm" /> {{ $t('auth.users.provisionUserBtn') }}
        </button>
      </div>

      <div class="table-responsive" style="margin-top: 16px;">
        <table class="sutra-table">
          <thead>
            <tr>
              <th>{{ $t('auth.users.colUser') }}</th>
              <th>{{ $t('auth.users.colDepartment') }}</th>
              <th>{{ $t('auth.users.colRoles') }}</th>
              <th>{{ $t('auth.users.colStatus') }}</th>
              <th>{{ $t('auth.users.colLastLogin') }}</th>
              <th>{{ $t('auth.users.colActions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in usersList" :key="u.id">
              <td>
                <div class="user-row-meta">
                  <div class="user-mini-avatar">{{ getUserInitials(u.fullName) }}</div>
                  <div>
                    <strong>{{ u.fullName }}</strong>
                    <div class="text-dim font-mono" style="font-size: 0.74rem;">{{ u.email }}</div>
                  </div>
                </div>
              </td>
              <td>{{ u.department || '—' }}</td>
              <td>
                <div class="roles-pills">
                  <span class="role-pill" v-for="r in u.roles" :key="r">{{ r }}</span>
                  <span v-if="u.isSuperAdmin" class="superadmin-pill">Admin</span>
                </div>
              </td>
              <td>
                <span class="badge" :class="u.isActive ? 'badge-success' : 'badge-danger'">
                  {{ u.isActive ? $t('auth.users.active') : $t('auth.users.inactive') }}
                </span>
              </td>
              <td class="font-mono text-dim" style="font-size: 0.78rem;">
                {{ u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never' }}
              </td>
              <td>
                <div class="actions-cell">
                  <button
                    class="btn btn-secondary btn-xs"
                    :disabled="u.isSuperAdmin"
                    @click="toggleUserStatus(u)"
                  >
                    {{ u.isActive ? $t('auth.users.deactivate') : $t('auth.users.activate') }}
                  </button>
                  <button class="btn btn-secondary btn-xs" @click="openPasswordResetModal(u)">
                    {{ $t('auth.users.resetPassword') }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- TAB 3: Roles & Permissions Matrix -->
    <!-- ================================================================= -->
    <div v-if="activeIamTab === 'roles'" class="roles-matrix-layout">
      <!-- Roles List -->
      <div class="glass-card roles-sidebar-card">
        <div class="card-header">
          <div>
            <h3>{{ $t('auth.roles.title') }}</h3>
            <span class="card-subtitle">{{ $t('auth.roles.subtitle') }}</span>
          </div>
          <button class="btn btn-primary btn-sm" @click="showCreateRoleModal = true">
            <Plus class="icon-xs" /> {{ $t('auth.roles.createRoleBtn') }}
          </button>
        </div>

        <div class="roles-nav-list">
          <div
            v-for="r in rolesList"
            :key="r.roleId"
            class="role-nav-item"
            :class="{ active: selectedRole?.roleId === r.roleId }"
            @click="selectedRole = r"
          >
            <div class="role-nav-header">
              <strong>{{ r.name }}</strong>
              <span class="badge" :class="r.isSystemRole ? 'badge-info' : 'badge-success'">
                {{ r.isSystemRole ? $t('auth.roles.systemBadge') : $t('auth.roles.customBadge') }}
              </span>
            </div>
            <p class="role-nav-desc">{{ r.description }}</p>
            <span class="role-perm-count">
              {{ $t('auth.roles.permissionsGranted', { count: r.permissions.includes('*') ? 'All (*)' : r.permissions.length }) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Permission Matrix Inspector -->
      <div v-if="selectedRole" class="glass-card permissions-matrix-card">
        <div class="card-header">
          <div>
            <h3>{{ selectedRole.name }}</h3>
            <span class="card-subtitle">Role Code: <code>{{ selectedRole.roleId }}</code></span>
          </div>
          <button
            v-if="!selectedRole.isSystemRole"
            class="btn btn-primary btn-sm"
            @click="saveRolePermissions"
          >
            Save Permissions
          </button>
        </div>

        <div class="permissions-by-module">
          <div v-for="(perms, moduleName) in permissionsByModule" :key="moduleName" class="perm-module-block">
            <h4 class="module-title">{{ moduleName }}</h4>
            <div class="perm-grid">
              <label
                v-for="p in perms"
                :key="p.code"
                class="perm-checkbox-card"
                :class="{ checked: isPermissionAssigned(p.code) }"
              >
                <input
                  type="checkbox"
                  :checked="isPermissionAssigned(p.code)"
                  :disabled="selectedRole.isSystemRole"
                  @change="togglePermission(p.code)"
                />
                <div class="perm-info">
                  <code>{{ p.code }}</code>
                  <span>{{ p.description }}</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- TAB 4: SSO & Identity Plugins -->
    <!-- ================================================================= -->
    <div v-if="activeIamTab === 'sso'" class="auth-grid">
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
                <strong>{{ p.nameKey ? $t(p.nameKey) : p.name }}</strong>
                <span v-if="p.isDefault" class="badge badge-success">{{ $t('auth.activeDefault') }}</span>
              </div>
              <p class="plugin-desc">{{ p.descKey ? $t(p.descKey) : p.description }}</p>
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

          <div v-if="ssoData" class="result-summary-card" style="margin-top: 16px;">
            <div class="result-card-header">
              <div class="result-title-row">
                <span class="result-title">⚡ {{ $t('auth.ssoResults.summaryTitle') }}</span>
                <span class="badge badge-success">{{ ssoData.status }}</span>
              </div>
              <button class="json-toggle-btn" @click="showRawSsoJson = !showRawSsoJson">
                {{ showRawSsoJson ? $t('auth.ssoResults.hideJson') : $t('auth.ssoResults.rawJson') }}
              </button>
            </div>

            <div class="result-metrics-grid">
              <div class="result-metric">
                <span class="metric-label">{{ $t('auth.ssoResults.targetIdp') }}</span>
                <span class="metric-val text-brand">{{ ssoData.providerName }}</span>
              </div>
              <div class="result-metric">
                <span class="metric-label">{{ $t('auth.ssoResults.protocol') }}</span>
                <span class="metric-val">{{ ssoData.protocol }}</span>
              </div>
              <div class="result-metric">
                <span class="metric-label">Client ID / Scope</span>
                <span class="metric-val font-mono" style="font-size: 0.78rem;">{{ ssoData.clientId }}</span>
              </div>
              <div class="result-metric">
                <span class="metric-label">{{ $t('auth.ssoResults.handshakeStatus') }}</span>
                <span class="metric-val text-accent">{{ ssoData.status }}</span>
              </div>
            </div>

            <div class="sso-redirect-box">
              <span class="redirect-label">{{ $t('auth.ssoResults.authRedirect') }}:</span>
              <code class="redirect-url">{{ ssoData.redirectUrl }}</code>
            </div>

            <div v-if="showRawSsoJson" class="code-preview" style="margin-top: 10px;">
              {{ ssoData.rawJson }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- MODAL: Provision New User -->
    <!-- ================================================================= -->
    <div v-if="showProvisionModal" class="modal-backdrop" @click.self="showProvisionModal = false">
      <div class="glass-card modal-content">
        <div class="card-header">
          <h3>{{ $t('auth.users.modalTitle') }}</h3>
          <button class="btn-close" @click="showProvisionModal = false">✕</button>
        </div>

        <div class="form-group">
          <label>{{ $t('auth.users.nameLabel') }} *</label>
          <input type="text" v-model="newUser.fullName" class="input-control" placeholder="e.g. Ramesh Chandra" />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>{{ $t('auth.emailLabel') }} *</label>
            <input type="email" v-model="newUser.email" class="input-control" placeholder="e.g. ramesh.c@sutra.local" />
          </div>
          <div class="form-group">
            <label>{{ $t('auth.users.tempPasswordLabel') }} *</label>
            <input type="password" v-model="newUser.password" class="input-control" placeholder="Minimum 6 characters" />
          </div>
        </div>

        <div class="form-group">
          <label>{{ $t('auth.users.departmentLabel') }}</label>
          <input type="text" v-model="newUser.department" class="input-control" placeholder="e.g. Treasury Operations" />
        </div>

        <div class="form-group">
          <label>{{ $t('auth.users.rolesLabel') }} *</label>
          <div class="roles-checkbox-grid">
            <label v-for="r in rolesList" :key="r.roleId" class="role-chk-label">
              <input type="checkbox" :value="r.roleId" v-model="newUser.roles" />
              <span>{{ r.name }}</span>
            </label>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showProvisionModal = false">{{ $t('common.cancel') }}</button>
          <button class="btn btn-primary" @click="provisionUser">{{ $t('auth.users.saveUserBtn') }}</button>
        </div>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- MODAL: Reset Password -->
    <!-- ================================================================= -->
    <div v-if="showResetModal" class="modal-backdrop" @click.self="showResetModal = false">
      <div class="glass-card modal-content" style="max-width: 440px;">
        <div class="card-header">
          <h3>Reset Password</h3>
          <button class="btn-close" @click="showResetModal = false">✕</button>
        </div>

        <p class="tool-desc">
          Resetting password for <strong>{{ resetTargetUser?.fullName }}</strong> (<code>{{ resetTargetUser?.email }}</code>).
        </p>

        <div class="form-group">
          <label>New Secure Password *</label>
          <input type="password" v-model="resetPasswordValue" class="input-control" placeholder="Minimum 6 characters" />
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showResetModal = false">{{ $t('common.cancel') }}</button>
          <button class="btn btn-primary" @click="confirmResetPassword">Confirm Reset</button>
        </div>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- MODAL: Create Custom Role -->
    <!-- ================================================================= -->
    <div v-if="showCreateRoleModal" class="modal-backdrop" @click.self="showCreateRoleModal = false">
      <div class="glass-card modal-content" style="max-width: 640px;">
        <div class="card-header">
          <h3>{{ $t('auth.roles.modalTitle') }}</h3>
          <button class="btn-close" @click="showCreateRoleModal = false">✕</button>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>{{ $t('auth.roles.roleIdLabel') }} *</label>
            <input type="text" v-model="newRole.roleId" class="input-control" placeholder="e.g. PlantEngineer" />
          </div>
          <div class="form-group">
            <label>{{ $t('auth.roles.roleNameLabel') }} *</label>
            <input type="text" v-model="newRole.name" class="input-control" placeholder="e.g. Senior Plant Maintenance Engineer" />
          </div>
        </div>

        <div class="form-group">
          <label>{{ $t('auth.roles.roleDescLabel') }} *</label>
          <input type="text" v-model="newRole.description" class="input-control" placeholder="e.g. Authority over preventive maintenance and equipment work orders" />
        </div>

        <div class="form-group">
          <label>Select Initial Permissions</label>
          <div class="perm-picker-box">
            <label v-for="p in allPermissions" :key="p.code" class="perm-chk-label">
              <input type="checkbox" :value="p.code" v-model="newRole.permissions" />
              <span><code>{{ p.code }}</code> — {{ p.description }}</span>
            </label>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showCreateRoleModal = false">{{ $t('common.cancel') }}</button>
          <button class="btn btn-primary" @click="createCustomRole">{{ $t('auth.roles.saveRoleBtn') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  Key,
  Shield,
  ShieldCheck,
  UserCheck,
  RefreshCw,
  LogOut,
  Users,
  UserPlus,
  Plus,
  Globe,
  Lock,
  Layers,
} from 'lucide-vue-next';
import { useI18n } from '../i18n';
import { useAuth, UserProfile } from '../composables/useAuth';

const { t } = useI18n();
const {
  currentUser,
  tokenData,
  isAuthenticated,
  userInitials,
  login,
  logout,
  checkAuth,
} = useAuth();

const activeIamTab = ref<'session' | 'users' | 'roles' | 'sso'>('session');

// Session State
const selectedProviderId = ref('local-jwt');
const loginEmail = ref('admin@sutra.local');
const loginPassword = ref('admin123');
const isLoggingIn = ref(false);

// Demo Personas
const demoPersonas = computed(() => [
  { label: t('auth.personas.admin'), email: 'admin@sutra.local', password: 'admin123' },
  { label: t('auth.personas.finance'), email: 'finance.lead@sutra.local', password: 'finance123' },
  { label: t('auth.personas.scm'), email: 'sc.director@sutra.local', password: 'supply123' },
  { label: t('auth.personas.auditor'), email: 'auditor@sutra.local', password: 'audit123' },
  { label: t('auth.personas.sales'), email: 'sales.rep@sutra.local', password: 'sales123' },
  { label: t('auth.personas.hr'), email: 'hr.lead@sutra.local', password: 'hr123' },
]);

// User Directory State
const usersList = ref<UserProfile[]>([]);
const showProvisionModal = ref(false);
const showResetModal = ref(false);
const resetTargetUser = ref<UserProfile | null>(null);
const resetPasswordValue = ref('');

const newUser = ref({
  fullName: '',
  email: '',
  password: '',
  department: '',
  roles: ['SalesExecutive'],
});

// Roles State
interface RoleData {
  roleId: string;
  name: string;
  description: string;
  isSystemRole: boolean;
  permissions: string[];
}

interface PermissionData {
  code: string;
  module: string;
  description: string;
}

const rolesList = ref<RoleData[]>([]);
const allPermissions = ref<PermissionData[]>([]);
const selectedRole = ref<RoleData | null>(null);
const showCreateRoleModal = ref(false);

const newRole = ref({
  roleId: '',
  name: '',
  description: '',
  permissions: [] as string[],
});

// Providers & SSO State
interface AuthProvider {
  id: string;
  name: string;
  nameKey?: string;
  type: string;
  description: string;
  descKey?: string;
  isDefault: boolean;
}

const providers = ref<AuthProvider[]>([
  {
    id: 'local-jwt',
    name: 'Sutra Standard JWT Authentication',
    nameKey: 'auth.providers.localJwt.name',
    type: 'jwt',
    description: 'Built-in enterprise password and JWT token authentication with bcrypt hashing',
    descKey: 'auth.providers.localJwt.desc',
    isDefault: true,
  },
  {
    id: 'azure-ad-oidc',
    name: 'Microsoft Entra ID (Azure AD)',
    nameKey: 'auth.providers.azureAd.name',
    type: 'oidc',
    description: 'Enterprise OpenID Connect & OAuth2 Federation (Okta, Azure AD, Keycloak)',
    descKey: 'auth.providers.azureAd.desc',
    isDefault: false,
  },
  {
    id: 'okta-saml',
    name: 'Okta Enterprise SAML 2.0',
    nameKey: 'auth.providers.oktaSaml.name',
    type: 'saml',
    description: 'Enterprise SAML 2.0 Identity Federation (ADFS, Okta SAML, Ping Identity)',
    descKey: 'auth.providers.oktaSaml.desc',
    isDefault: false,
  },
]);

const ssoData = ref<any>(null);
const showRawSsoJson = ref(false);

const activeProviderName = computed(() => {
  const p = providers.value.find((prov) => prov.id === selectedProviderId.value);
  return p ? (p.nameKey ? t(p.nameKey) : p.name) : 'Sutra Standard JWT';
});

const permissionsByModule = computed(() => {
  const map: Record<string, PermissionData[]> = {};
  for (const p of allPermissions.value) {
    if (!map[p.module]) map[p.module] = [];
    map[p.module].push(p);
  }
  return map;
});

onMounted(async () => {
  await fetchProviders();
  await fetchUsers();
  await fetchRoles();
  await fetchPermissions();
});

function getUserInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

async function performLogin() {
  isLoggingIn.value = true;
  const res = await login({
    email: loginEmail.value,
    password: loginPassword.value,
    providerId: selectedProviderId.value,
  });
  isLoggingIn.value = false;

  if (!res.success) {
    alert(t('auth.alerts.loginFailed', { error: res.error || 'Authentication error' }));
  }
}

async function quickLoginAs(email: string, pass: string) {
  loginEmail.value = email;
  loginPassword.value = pass;
  await performLogin();
}

async function testAuthMe() {
  const ok = await checkAuth();
  if (ok && currentUser.value) {
    alert(t('auth.alerts.tokenValidated', {
      name: currentUser.value.fullName,
      roles: currentUser.value.roles.join(', '),
      tenant: currentUser.value.tenantId,
    }));
  }
}

async function refreshToken() {
  if (!tokenData.value?.refreshToken) return;
  try {
    const res = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: tokenData.value.refreshToken }),
    });
    const data = await res.json();
    if (res.ok && data.tokens) {
      tokenData.value = data.tokens;
      alert(t('auth.alerts.tokenRefreshed'));
    }
  } catch (err: any) {
    alert(`Refresh failed: ${err.message}`);
  }
}

async function fetchProviders() {
  try {
    const res = await fetch('/api/v1/auth/providers');
    if (res.ok) {
      const data = await res.json();
      if (data.providers) providers.value = data.providers;
    }
  } catch {
    // Keep fallback defaults
  }
}

async function fetchUsers() {
  try {
    const res = await fetch('/api/v1/auth/users');
    if (res.ok) {
      usersList.value = await res.json();
    }
  } catch {
    // Fallback
  }
}

async function fetchRoles() {
  try {
    const res = await fetch('/api/v1/auth/roles');
    if (res.ok) {
      rolesList.value = await res.json();
      if (!selectedRole.value && rolesList.value.length) {
        selectedRole.value = rolesList.value[0];
      }
    }
  } catch {
    // Fallback
  }
}

async function fetchPermissions() {
  try {
    const res = await fetch('/api/v1/auth/permissions');
    if (res.ok) {
      allPermissions.value = await res.json();
    }
  } catch {
    // Fallback
  }
}

async function provisionUser() {
  if (!newUser.value.fullName || !newUser.value.email || !newUser.value.password) {
    alert('Please fill in Full Name, Email, and Password.');
    return;
  }

  try {
    const res = await fetch('/api/v1/auth/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser.value),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(`User creation failed: ${data.message || data.error}`);
      return;
    }

    showProvisionModal.value = false;
    newUser.value = {
      fullName: '',
      email: '',
      password: '',
      department: '',
      roles: ['SalesExecutive'],
    };
    await fetchUsers();
  } catch (err: any) {
    alert(`Error: ${err.message}`);
  }
}

async function toggleUserStatus(user: UserProfile) {
  try {
    const res = await fetch(`/api/v1/auth/users/${user.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !user.isActive }),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(`Failed to update status: ${data.message || data.error}`);
      return;
    }

    await fetchUsers();
  } catch (err: any) {
    alert(`Error: ${err.message}`);
  }
}

function openPasswordResetModal(user: UserProfile) {
  resetTargetUser.value = user;
  resetPasswordValue.value = '';
  showResetModal.value = true;
}

async function confirmResetPassword() {
  if (!resetTargetUser.value || !resetPasswordValue.value) return;

  try {
    const res = await fetch(`/api/v1/auth/users/${resetTargetUser.value.id}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword: resetPasswordValue.value }),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(`Password reset failed: ${data.message || data.error}`);
      return;
    }

    alert(`Password reset successfully for ${resetTargetUser.value.fullName}.`);
    showResetModal.value = false;
  } catch (err: any) {
    alert(`Error: ${err.message}`);
  }
}

function isPermissionAssigned(code: string): boolean {
  if (!selectedRole.value) return false;
  if (selectedRole.value.permissions.includes('*')) return true;
  return selectedRole.value.permissions.includes(code);
}

function togglePermission(code: string) {
  if (!selectedRole.value || selectedRole.value.isSystemRole) return;
  const idx = selectedRole.value.permissions.indexOf(code);
  if (idx > -1) {
    selectedRole.value.permissions.splice(idx, 1);
  } else {
    selectedRole.value.permissions.push(code);
  }
}

async function saveRolePermissions() {
  if (!selectedRole.value || selectedRole.value.isSystemRole) return;
  try {
    const res = await fetch(`/api/v1/auth/roles/${selectedRole.value.roleId}/permissions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissions: selectedRole.value.permissions }),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(`Failed to save permissions: ${data.message || data.error}`);
      return;
    }

    alert(`Permissions saved for role '${selectedRole.value.name}'.`);
    await fetchRoles();
  } catch (err: any) {
    alert(`Error: ${err.message}`);
  }
}

async function createCustomRole() {
  if (!newRole.value.roleId || !newRole.value.name) {
    alert('Please enter Role ID and Display Name.');
    return;
  }

  try {
    const res = await fetch('/api/v1/auth/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRole.value),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(`Failed to create role: ${data.message || data.error}`);
      return;
    }

    showCreateRoleModal.value = false;
    newRole.value = { roleId: '', name: '', description: '', permissions: [] };
    await fetchRoles();
  } catch (err: any) {
    alert(`Error: ${err.message}`);
  }
}

async function makeDefaultProvider(id: string) {
  try {
    const res = await fetch('/api/v1/auth/tenants/00000000-0000-0000-0000-000000000001/provider', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId: id }),
    });
    if (res.ok) {
      selectedProviderId.value = id;
      providers.value.forEach((p) => {
        p.isDefault = p.id === id;
      });
    }
  } catch {
    selectedProviderId.value = id;
  }
}

async function simulateSSO(providerId: string) {
  try {
    const res = await fetch(`/api/v1/auth/sso/login-url?providerId=${providerId}`);
    const data = await res.json();

    const isAzure = providerId === 'azure-ad-oidc';
    ssoData.value = {
      status: 'HANDSHAKE_READY',
      providerId,
      providerName: isAzure ? 'Microsoft Entra ID (Azure AD)' : 'Okta Enterprise SAML 2.0',
      protocol: isAzure ? 'OpenID Connect (OIDC) / OAuth 2.0' : 'SAML 2.0 Web Browser SSO',
      redirectUrl: data.redirectUrl || `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=sutra-enterprise&response_type=code`,
      nextStep: isAzure
        ? 'Redirect browser to Azure tenant login page for corporate MFA and claims token exchange.'
        : 'POST SAML AuthnRequest XML assertion to Okta SAML Identity Provider endpoint.',
      scope: isAzure ? 'openid profile email offline_access' : 'urn:sutra:enterprise:sp',
      clientId: isAzure ? 'sutra-enterprise-client-id' : 'urn:sutra:enterprise:sp',
      rawJson: JSON.stringify(data, null, 2),
    };
  } catch {
    // Simulated fallback
  }
}
</script>

<style scoped>
.view-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
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
  color: var(--text-dim);
  font-size: 0.88rem;
}

/* Sub-nav Tabs */
.iam-subtabs {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 8px;
  flex-wrap: wrap;
}

.iam-tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--text-dim);
  font-size: 0.86rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.iam-tab-btn:hover {
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-main);
}

.iam-tab-btn.active {
  background: rgba(59, 130, 246, 0.12);
  border-color: rgba(59, 130, 246, 0.3);
  color: var(--brand-blue);
  font-weight: 600;
}

.tab-icon-sm {
  width: 16px;
  height: 16px;
}

.counter-badge {
  font-size: 0.72rem;
  padding: 1px 6px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-main);
}

/* Grid Layouts */
.auth-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 20px;
}

@media (max-width: 992px) {
  .auth-grid {
    grid-template-columns: 1fr;
  }
}

.glass-card {
  background: var(--bg-card);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.card-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.card-subtitle {
  font-size: 0.8rem;
  color: var(--text-dim);
}

/* Forms */
.form-group {
  margin-bottom: 14px;
}

.form-group label {
  display: block;
  font-size: 0.82rem;
  font-weight: 500;
  margin-bottom: 6px;
  color: var(--text-dim);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.input-control {
  width: 100%;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-input);
  color: var(--text-main);
  font-size: 0.88rem;
}

.input-control:focus {
  outline: none;
  border-color: var(--brand-blue);
}

/* Quick Personas */
.quick-personas-box {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.personas-label {
  display: block;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-dim);
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.personas-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

@media (max-width: 600px) {
  .personas-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.persona-btn {
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: rgba(255, 255, 255, 0.02);
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.persona-btn:hover {
  background: rgba(59, 130, 246, 0.08);
  border-color: rgba(59, 130, 246, 0.4);
}

.persona-btn strong {
  font-size: 0.78rem;
  color: var(--brand-blue);
}

.persona-btn small {
  font-size: 0.68rem;
  color: var(--text-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Active Session */
.active-session-box {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.user-profile-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.profile-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #06b6d4);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
}

.profile-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.profile-details strong {
  font-size: 1rem;
}

.profile-details span {
  font-size: 0.8rem;
  color: var(--text-dim);
}

.roles-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.role-pill {
  font-size: 0.72rem;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(59, 130, 246, 0.15);
  color: var(--brand-blue);
  font-weight: 500;
}

.superadmin-pill {
  font-size: 0.72rem;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  font-weight: 600;
}

.session-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.permissions-preview-box {
  padding-top: 14px;
  border-top: 1px solid var(--border-color);
}

.permissions-preview-box h4 {
  font-size: 0.82rem;
  color: var(--text-dim);
  margin-bottom: 8px;
}

.perm-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 120px;
  overflow-y: auto;
}

.perm-chip {
  font-family: monospace;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  color: #a5b4fc;
}

/* Token Inspector */
.token-inspector {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.token-inspector h4 {
  font-size: 0.82rem;
  color: var(--text-dim);
  margin-bottom: 8px;
}

.code-preview {
  padding: 10px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-color);
  font-family: monospace;
  word-break: break-all;
  overflow-y: auto;
  color: #10b981;
}

.token-meta {
  display: flex;
  gap: 16px;
  margin-top: 8px;
  font-size: 0.76rem;
  color: var(--text-dim);
}

/* Security list */
.security-items-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.security-item {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
}

.item-icon {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  margin-top: 2px;
}

.security-item strong {
  display: block;
  font-size: 0.86rem;
  margin-bottom: 4px;
}

.security-item p {
  font-size: 0.78rem;
  color: var(--text-dim);
}

/* User Directory Table */
.user-row-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-mini-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.2);
  color: var(--brand-blue);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.78rem;
}

.actions-cell {
  display: flex;
  gap: 6px;
}

/* Roles Matrix Layout */
.roles-matrix-layout {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 20px;
}

@media (max-width: 900px) {
  .roles-matrix-layout {
    grid-template-columns: 1fr;
  }
}

.roles-nav-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.role-nav-item {
  padding: 14px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: rgba(255, 255, 255, 0.02);
  cursor: pointer;
  transition: all 0.2s ease;
}

.role-nav-item:hover {
  background: rgba(59, 130, 246, 0.04);
}

.role-nav-item.active {
  border-color: rgba(59, 130, 246, 0.5);
  background: rgba(59, 130, 246, 0.08);
}

.role-nav-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.role-nav-header strong {
  font-size: 0.88rem;
}

.role-nav-desc {
  font-size: 0.76rem;
  color: var(--text-dim);
  margin-bottom: 8px;
  line-height: 1.3;
}

.role-perm-count {
  font-size: 0.72rem;
  color: #3b82f6;
  font-weight: 500;
}

/* Permissions Matrix */
.permissions-by-module {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.perm-module-block {
  border-top: 1px solid var(--border-color);
  padding-top: 14px;
}

.perm-module-block:first-child {
  border-top: none;
  padding-top: 0;
}

.module-title {
  font-size: 0.86rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 10px;
}

.perm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 8px;
}

.perm-checkbox-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: rgba(255, 255, 255, 0.02);
  cursor: pointer;
  transition: all 0.2s ease;
}

.perm-checkbox-card.checked {
  border-color: rgba(59, 130, 246, 0.4);
  background: rgba(59, 130, 246, 0.06);
}

.perm-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.perm-info code {
  font-size: 0.74rem;
  color: #60a5fa;
}

.perm-info span {
  font-size: 0.74rem;
  color: var(--text-dim);
}

/* Plugins List */
.plugins-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plugin-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  gap: 14px;
}

.plugin-icon-box {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(59, 130, 246, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.plugin-icon {
  width: 20px;
  height: 20px;
  color: var(--brand-blue);
}

.plugin-meta {
  flex: 1;
}

.plugin-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.plugin-desc {
  font-size: 0.78rem;
  color: var(--text-dim);
  margin-bottom: 4px;
}

.plugin-protocol {
  font-size: 0.72rem;
  color: var(--text-dim);
}

.sso-simulation-box {
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid var(--border-color);
}

.sso-buttons {
  display: flex;
  gap: 10px;
  margin-top: 10px;
  flex-wrap: wrap;
}

/* Modals */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  width: 100%;
  max-width: 520px;
  background: #111827;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 24px;
}

.btn-close {
  background: transparent;
  border: none;
  color: var(--text-dim);
  font-size: 1.1rem;
  cursor: pointer;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.roles-checkbox-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  max-height: 140px;
  overflow-y: auto;
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
}

.role-chk-label, .perm-chk-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  cursor: pointer;
}

.perm-picker-box {
  max-height: 180px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.84rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-primary {
  background: var(--brand-blue);
  color: #fff;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-main);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.12);
}

.btn-danger {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.4);
}

.btn-danger:hover {
  background: rgba(239, 68, 68, 0.3);
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.78rem;
}

.btn-xs {
  padding: 4px 8px;
  font-size: 0.72rem;
}

.icon-sm {
  width: 16px;
  height: 16px;
}

.icon-xs {
  width: 14px;
  height: 14px;
}

.text-brand { color: var(--brand-blue); }
.text-green { color: #10b981; }
.text-cyan { color: #06b6d4; }
.text-dim { color: var(--text-dim); }
.font-mono { font-family: monospace; }
</style>
