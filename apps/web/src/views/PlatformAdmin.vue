<template>
  <div class="platform-admin-view">
    <!-- Top Hero Banner -->
    <div class="glass-card hero-card">
      <div class="hero-content">
        <div class="hero-left">
          <div class="superadmin-badge">
            <ShieldAlert class="icon-xs" />
            <span>Platform Super Admin Cockpit</span>
          </div>
          <h2>{{ $t('auth.platformSetup.title') }}</h2>
          <p class="hero-subtitle">{{ $t('auth.platformSetup.subtitle') }}</p>
        </div>

        <div class="hero-metrics">
          <div class="metric-box">
            <span class="metric-label">{{ $t('auth.platformSetup.installMode') }}</span>
            <span class="metric-val mode-val" :class="setupState.installMode">
              {{ setupState.installMode === 'plain' ? $t('auth.platformSetup.modePlain') : $t('auth.platformSetup.modeDemo') }}
            </span>
          </div>
          <div class="metric-box">
            <span class="metric-label">Active Modules</span>
            <span class="metric-val text-cyan">
              {{ activeModulesCount }} of {{ modulesList.length }}
            </span>
          </div>
          <div class="metric-box">
            <span class="metric-label">Tenant Status</span>
            <span class="metric-val" :class="setupState.isConfigured ? 'text-green' : 'text-amber'">
              {{ setupState.isConfigured ? 'CONFIGURED' : 'PENDING SETUP' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Role Separation Notice -->
      <div class="handover-banner">
        <Info class="icon-sm text-cyan flex-shrink-0" />
        <p>{{ $t('auth.platformSetup.handoverNote') }}</p>
      </div>
    </div>

    <!-- Main 2-Column Grid -->
    <div class="admin-grid">
      <!-- Left Column: Module Selection & Activation -->
      <div class="glass-card section-card">
        <div class="card-header">
          <div>
            <h3>{{ $t('auth.platformSetup.moduleSelectionTitle') }}</h3>
            <span class="card-subtitle">{{ $t('auth.platformSetup.moduleSelectionSubtitle') }}</span>
          </div>
          <button class="btn btn-sm btn-primary" @click="saveModules" :disabled="isSavingModules">
            <Save class="icon-xs" />
            <span>{{ isSavingModules ? 'Saving...' : $t('auth.platformSetup.saveModulesBtn') }}</span>
          </button>
        </div>

        <div class="modules-list">
          <div
            v-for="mod in modulesList"
            :key="mod.id"
            class="module-item-card"
            :class="{ active: mod.isEnabled, 'is-core': mod.isCore }"
          >
            <div class="module-item-info">
              <div class="module-title-row">
                <strong>{{ mod.name }}</strong>
                <span v-if="mod.isCore" class="core-pill">{{ $t('auth.platformSetup.coreBadge') }}</span>
                <span v-else-if="mod.badge" class="badge badge-info">{{ mod.badge }}</span>
              </div>
              <p class="module-desc">{{ mod.description }}</p>
            </div>

            <div class="module-toggle-col">
              <label class="switch" :class="{ disabled: mod.isCore }">
                <input
                  type="checkbox"
                  :checked="mod.isEnabled"
                  :disabled="mod.isCore"
                  @change="toggleModule(mod.id, ($event.target as HTMLInputElement).checked)"
                />
                <span class="slider round"></span>
              </label>
              <span class="toggle-status" :class="mod.isEnabled ? 'text-green' : 'text-muted'">
                {{ mod.isEnabled ? 'ENABLED' : 'DISABLED' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Client Profile & Org Admin Provisioning -->
      <div class="right-column-stack">
        <!-- 1. Client Organization Setup -->
        <div class="glass-card section-card">
          <div class="card-header">
            <div>
              <h3>{{ $t('auth.platformSetup.clientProfileTitle') }}</h3>
              <span class="card-subtitle">Define client enterprise entity and base accounting parameters</span>
            </div>
          </div>

          <form @submit.prevent="saveClientProfile" class="profile-form">
            <div class="form-group">
              <label>{{ $t('auth.platformSetup.orgNameLabel') }}</label>
              <input
                type="text"
                v-model="orgProfile.name"
                class="input-control"
                placeholder="Bharat Tech Manufacturing Ltd"
                required
              />
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>{{ $t('auth.platformSetup.gstinLabel') }}</label>
                <input
                  type="text"
                  v-model="orgProfile.gstin"
                  class="input-control uppercase-input"
                  placeholder="27AAACB2212M1Z0"
                  maxlength="15"
                  required
                />
              </div>

              <div class="form-group flex-1">
                <label>{{ $t('auth.platformSetup.currencyLabel') }}</label>
                <select v-model="orgProfile.currency" class="input-control">
                  <option value="INR">INR (₹ - Indian Rupee)</option>
                  <option value="USD">USD ($ - US Dollar)</option>
                  <option value="EUR">EUR (€ - Euro)</option>
                  <option value="AED">AED (د.إ - UAE Dirham)</option>
                </select>
              </div>
            </div>

            <button type="submit" class="btn btn-secondary btn-sm" :disabled="isSavingProfile">
              <Save class="icon-xs" />
              <span>{{ isSavingProfile ? 'Saving...' : $t('auth.platformSetup.saveProfileBtn') }}</span>
            </button>
          </form>
        </div>

        <!-- 2. Organization Administrator Handover -->
        <div class="glass-card section-card">
          <div class="card-header">
            <div>
              <h3>{{ $t('auth.platformSetup.orgAdminTitle') }}</h3>
              <span class="card-subtitle">{{ $t('auth.platformSetup.orgAdminSubtitle') }}</span>
            </div>
            <span class="badge badge-warning">Org Handover</span>
          </div>

          <form @submit.prevent="provisionOrgAdmin" class="orgadmin-form">
            <div class="form-group">
              <label>{{ $t('auth.platformSetup.orgAdminName') }}</label>
              <input
                type="text"
                v-model="orgAdminForm.fullName"
                class="input-control"
                placeholder="Vikramaditya Singhania"
                required
              />
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>{{ $t('auth.platformSetup.orgAdminEmail') }}</label>
                <input
                  type="email"
                  v-model="orgAdminForm.email"
                  class="input-control"
                  placeholder="org.admin@enterprise.in"
                  required
                />
              </div>

              <div class="form-group flex-1">
                <label>{{ $t('auth.platformSetup.orgAdminPassword') }}</label>
                <input
                  type="password"
                  v-model="orgAdminForm.password"
                  class="input-control"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label>{{ $t('auth.platformSetup.orgAdminDept') }}</label>
              <input
                type="text"
                v-model="orgAdminForm.department"
                class="input-control"
                placeholder="Corporate Operations & Executive Office"
              />
            </div>

            <div v-if="adminSuccessMsg" class="alert-success-banner">
              <CheckCircle2 class="icon-sm text-green" />
              <span>{{ adminSuccessMsg }}</span>
            </div>

            <button type="submit" class="btn btn-primary btn-sm" :disabled="isProvisioningAdmin">
              <UserCheck class="icon-xs" />
              <span>{{ isProvisioningAdmin ? 'Provisioning...' : $t('auth.platformSetup.provisionOrgAdminBtn') }}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  ShieldAlert,
  Save,
  CheckCircle2,
  Info,
  UserCheck,
} from 'lucide-vue-next';

interface ModuleItem {
  id: string;
  name: string;
  category: string;
  description: string;
  isEnabled: boolean;
  isCore: boolean;
  badge?: string;
}

const modulesList = ref<ModuleItem[]>([]);
const setupState = ref({
  installMode: 'plain',
  isConfigured: false,
  installedAt: '',
});

const orgProfile = ref({
  name: 'Bharat Tech Manufacturing Ltd',
  gstin: '27AAACB2212M1Z0',
  currency: 'INR',
  jurisdiction: 'IN',
});

const orgAdminForm = ref({
  fullName: 'Vikramaditya Singhania',
  email: 'org.admin@enterprise.in',
  password: 'orgadmin123',
  department: 'Corporate Operations',
});

const isSavingModules = ref(false);
const isSavingProfile = ref(false);
const isProvisioningAdmin = ref(false);
const adminSuccessMsg = ref<string | null>(null);

const activeModulesCount = computed(() => {
  return modulesList.value.filter((m) => m.isEnabled).length;
});

async function fetchModules() {
  try {
    const res = await fetch('/api/v1/system/modules');
    if (res.ok) {
      const data = await res.json();
      modulesList.value = data.modules || [];
    }
  } catch {
    // Fallback defaults
  }
}

async function fetchSetupState() {
  try {
    const res = await fetch('/api/v1/system/setup');
    if (res.ok) {
      const data = await res.json();
      setupState.value = {
        installMode: data.installMode || 'plain',
        isConfigured: Boolean(data.isConfigured),
        installedAt: data.installedAt || '',
      };
      if (data.organization) {
        orgProfile.value = {
          name: data.organization.name || orgProfile.value.name,
          gstin: data.organization.gstin || orgProfile.value.gstin,
          currency: data.organization.currency || orgProfile.value.currency,
          jurisdiction: data.organization.jurisdiction || orgProfile.value.jurisdiction,
        };
      }
    }
  } catch {
    // Fallback
  }
}

function toggleModule(moduleId: string, isEnabled: boolean) {
  const mod = modulesList.value.find((m) => m.id === moduleId);
  if (mod && !mod.isCore) {
    mod.isEnabled = isEnabled;
  }
}

async function saveModules() {
  isSavingModules.value = true;
  try {
    const enabledIds = modulesList.value.filter((m) => m.isEnabled).map((m) => m.id);
    const res = await fetch('/api/v1/system/modules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabledModuleIds: enabledIds }),
    });
    if (res.ok) {
      const data = await res.json();
      modulesList.value = data.modules;
      // Refresh window/sidebar navigation
      window.dispatchEvent(new CustomEvent('sutra-modules-updated', { detail: enabledIds }));
    }
  } catch {
    // Error handling
  } finally {
    isSavingModules.value = false;
  }
}

async function saveClientProfile() {
  isSavingProfile.value = true;
  try {
    const res = await fetch('/api/v1/system/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationName: orgProfile.value.name,
        gstin: orgProfile.value.gstin,
        currency: orgProfile.value.currency,
        jurisdiction: orgProfile.value.jurisdiction,
      }),
    });
    if (res.ok) {
      fetchSetupState();
    }
  } catch {
    // Error
  } finally {
    isSavingProfile.value = false;
  }
}

async function provisionOrgAdmin() {
  isProvisioningAdmin.value = true;
  adminSuccessMsg.value = null;
  try {
    const res = await fetch('/api/v1/system/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orgAdmin: {
          fullName: orgAdminForm.value.fullName,
          email: orgAdminForm.value.email,
          password: orgAdminForm.value.password,
          department: orgAdminForm.value.department,
        },
      }),
    });
    if (res.ok) {
      adminSuccessMsg.value = `Organization Administrator account '${orgAdminForm.value.email}' provisioned successfully! Handover ready.`;
      fetchSetupState();
    }
  } catch (err: any) {
    adminSuccessMsg.value = `Failed: ${err.message}`;
  } finally {
    isProvisioningAdmin.value = false;
  }
}

onMounted(() => {
  fetchModules();
  fetchSetupState();
});
</script>

<style scoped>
.platform-admin-view {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

/* Hero Card */
.hero-card {
  padding: 24px 28px;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%);
  border: 1px solid rgba(139, 92, 246, 0.25);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
}

.hero-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.superadmin-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.35);
  border-radius: 9999px;
  font-size: 0.72rem;
  font-weight: 700;
  color: #c084fc;
  margin-bottom: 8px;
}

.hero-left h2 {
  font-size: 1.5rem;
  color: #fff;
  letter-spacing: -0.02em;
}

.hero-subtitle {
  font-size: 0.85rem;
  color: var(--text-muted, #94a3b8);
  margin-top: 2px;
}

.hero-metrics {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.metric-box {
  padding: 12px 18px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-sm, 8px);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  color: var(--text-dim, #64748b);
  font-weight: 600;
  letter-spacing: 0.05em;
}

.metric-val {
  font-size: 1.15rem;
  font-weight: 700;
}

.mode-val.plain {
  color: #38bdf8;
}

.mode-val.demo {
  color: #fbbf24;
}

.handover-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(6, 182, 212, 0.08);
  border: 1px solid rgba(6, 182, 212, 0.2);
  border-radius: var(--radius-sm, 8px);
  padding: 10px 14px;
  margin-top: 18px;
  font-size: 0.78rem;
  color: var(--text-muted, #94a3b8);
  line-height: 1.4;
}

/* Grid */
.admin-grid {
  display: grid;
  grid-template-columns: 1.25fr 1fr;
  gap: 22px;
}

@media (max-width: 1024px) {
  .admin-grid {
    grid-template-columns: 1fr;
  }
}

.section-card {
  padding: 22px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 18px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
}

.card-header h3 {
  font-size: 1.1rem;
  color: #fff;
}

.card-subtitle {
  font-size: 0.78rem;
  color: var(--text-muted, #94a3b8);
}

/* Modules List */
.modules-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.module-item-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--radius-sm, 8px);
  transition: all 0.18s ease;
}

.module-item-card.active {
  background: rgba(15, 23, 42, 0.6);
  border-color: rgba(59, 130, 246, 0.25);
}

.module-item-card.is-core {
  border-left: 3px solid #3b82f6;
}

.module-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.module-title-row strong {
  font-size: 0.88rem;
  color: #fff;
}

.core-pill {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 1px 6px;
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  border-radius: 4px;
}

.module-desc {
  font-size: 0.74rem;
  color: var(--text-muted, #94a3b8);
  margin-top: 4px;
  max-width: 520px;
  line-height: 1.35;
}

.module-toggle-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-left: 16px;
}

.toggle-status {
  font-size: 0.65rem;
  font-weight: 700;
}

/* Toggle Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 22px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.15);
  transition: 0.2s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.2s;
}

input:checked + .slider {
  background-color: #3b82f6;
}

input:checked + .slider:before {
  transform: translateX(18px);
}

.slider.round {
  border-radius: 22px;
}

.slider.round:before {
  border-radius: 50%;
}

.switch.disabled {
  opacity: 0.6;
  pointer-events: none;
}

/* Right Column Stack */
.right-column-stack {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.form-row {
  display: flex;
  gap: 12px;
}

.flex-1 {
  flex: 1;
}

.uppercase-input {
  text-transform: uppercase;
}

.alert-success-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: var(--radius-sm, 8px);
  font-size: 0.78rem;
  color: #34d399;
  margin-bottom: 12px;
}

.text-green {
  color: #34d399;
}

.text-cyan {
  color: #38bdf8;
}

.text-amber {
  color: #fbbf24;
}

.text-muted {
  color: #94a3b8;
}
</style>
