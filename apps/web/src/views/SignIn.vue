<template>
  <div class="signin-container">
    <div class="signin-backdrop">
      <div class="glow-orb orb-1"></div>
      <div class="glow-orb orb-2"></div>
      <div class="glow-orb orb-3"></div>
    </div>

    <div class="signin-wrapper">
      <div class="glass-card signin-card">
        <!-- Brand Header -->
        <div class="signin-header">
          <div class="signin-logo-badge">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
          </div>
          <h2>{{ $t('auth.signInTitle') }}</h2>
          <p class="signin-subtitle">{{ $t('auth.signInSubtitle') }}</p>
          <div class="version-tag">
            <span class="pulse-dot"></span>
            <span>Enterprise Sovereign OS v0.1 • Multi-Tenant</span>
          </div>
        </div>

        <!-- Mode Toggle Tabs (Demo vs Credentials) -->
        <div class="auth-mode-tabs">
          <button
            class="tab-btn"
            :class="{ active: authMode === 'credentials' }"
            @click="authMode = 'credentials'"
          >
            <KeyRound class="icon-xs" />
            <span>Corporate Credentials</span>
          </button>
          <button
            class="tab-btn"
            :class="{ active: authMode === 'quick' }"
            @click="authMode = 'quick'"
          >
            <Zap class="icon-xs text-amber" />
            <span>{{ $t('auth.personas.quickSwitch') }}</span>
          </button>
        </div>

        <!-- Tab 1: Direct Credentials -->
        <form v-if="authMode === 'credentials'" @submit.prevent="handleLogin" class="signin-form">
          <div class="form-group">
            <label>{{ $t('auth.emailLabel') }}</label>
            <div class="input-with-icon">
              <Mail class="input-icon" />
              <input
                type="email"
                v-model="email"
                class="input-control"
                placeholder="admin@sutra.local"
                required
                autocomplete="email"
              />
            </div>
          </div>

          <div class="form-group">
            <label>{{ $t('auth.passwordLabel') }}</label>
            <div class="input-with-icon">
              <Lock class="input-icon" />
              <input
                :type="showPassword ? 'text' : 'password'"
                v-model="password"
                class="input-control"
                placeholder="••••••••••••"
                required
                autocomplete="current-password"
              />
              <button
                type="button"
                class="toggle-pwd-btn"
                @click="showPassword = !showPassword"
                tabindex="-1"
              >
                <Eye v-if="!showPassword" class="icon-xs" />
                <EyeOff v-else class="icon-xs" />
              </button>
            </div>
          </div>

          <div class="tenant-collapsible">
            <button
              type="button"
              class="tenant-toggle-btn"
              @click="showTenantField = !showTenantField"
            >
              <span>{{ showTenantField ? 'Hide Organization Tenant ID' : 'Advanced: Specify Custom Tenant ID' }}</span>
            </button>
            <div v-if="showTenantField" class="form-group tenant-input-group">
              <label>{{ $t('auth.tenantIdLabel') }}</label>
              <input
                type="text"
                v-model="tenantId"
                class="input-control"
                placeholder="00000000-0000-0000-0000-000000000001"
              />
            </div>
          </div>

          <div v-if="errorMessage" class="auth-error-alert">
            <AlertCircle class="icon-sm" />
            <span>{{ errorMessage }}</span>
          </div>

          <button type="submit" class="btn btn-primary signin-submit-btn" :disabled="isLoading">
            <span v-if="isLoading" class="spinner"></span>
            <ShieldCheck v-else class="icon-sm" />
            <span>{{ isLoading ? 'Verifying Session...' : $t('auth.signInBtn') }}</span>
          </button>

          <div class="plain-hint-card">
            <Info class="icon-xs text-cyan" />
            <span>{{ $t('auth.plainModeHint') }}</span>
          </div>
        </form>

        <!-- Tab 2: 1-Click Demo Personas -->
        <div v-else class="quick-personas-view">
          <p class="quick-instruction">
            Select a pre-seeded persona to simulate distinct enterprise roles:
          </p>

          <div class="persona-cards-grid">
            <div
              v-for="p in demoPersonas"
              :key="p.email"
              class="persona-pick-card"
              :class="{ selected: email === p.email }"
              @click="selectPersona(p)"
            >
              <div class="persona-card-header">
                <span class="persona-badge" :class="p.badgeClass">{{ p.roleTitle }}</span>
                <span class="persona-dept">{{ p.dept }}</span>
              </div>
              <strong class="persona-name">{{ p.name }}</strong>
              <code class="persona-email">{{ p.email }}</code>
              <p class="persona-desc">{{ p.desc }}</p>
            </div>
          </div>

          <div v-if="errorMessage" class="auth-error-alert" style="margin-top: 14px;">
            <AlertCircle class="icon-sm" />
            <span>{{ errorMessage }}</span>
          </div>

          <button
            class="btn btn-primary signin-submit-btn"
            style="margin-top: 14px;"
            :disabled="isLoading || !email"
            @click="handleLogin"
          >
            <span v-if="isLoading" class="spinner"></span>
            <ArrowRight v-else class="icon-sm" />
            <span>Sign In as {{ email ? email : 'Selected Persona' }}</span>
          </button>
        </div>

        <!-- Footer -->
        <div class="signin-footer">
          <div class="footer-links">
            <span>🛡️ Hardware Air-Gapped Security</span>
            <span>•</span>
            <span>🏛️ Sovereign Indian Cloud</span>
            <span>•</span>
            <span>⚡ Zero-Leakage LLM RAG</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  Zap,
  ArrowRight,
  Info,
} from 'lucide-vue-next';
import { useAuth } from '../composables/useAuth';

const emit = defineEmits<{
  (e: 'login-success'): void;
}>();

const { login } = useAuth();

const authMode = ref<'credentials' | 'quick'>('credentials');
const email = ref('admin@sutra.local');
const password = ref('admin123');
const tenantId = ref('00000000-0000-0000-0000-000000000001');
const showPassword = ref(false);
const showTenantField = ref(false);
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);

interface DemoPersona {
  name: string;
  email: string;
  password: string;
  roleTitle: string;
  dept: string;
  desc: string;
  badgeClass: string;
}

const demoPersonas: DemoPersona[] = [
  {
    name: 'Rajesh Sharma',
    email: 'admin@sutra.local',
    password: 'admin123',
    roleTitle: 'Platform Super Admin',
    dept: 'Platform Setup & Arch',
    desc: 'Unrestricted platform admin authority; handles client installation setup and module selection.',
    badgeClass: 'badge-superadmin',
  },
  {
    name: 'Vikramaditya Singhania',
    email: 'org.admin@enterprise.in',
    password: 'orgadmin123',
    roleTitle: 'Organization Admin',
    dept: 'Executive Operations',
    desc: 'Tenant enterprise admin; manages internal users, departmental provisioning, and day-to-day operations.',
    badgeClass: 'badge-orgadmin',
  },
  {
    name: 'Anita Desai',
    email: 'finance.lead@sutra.local',
    password: 'finance123',
    roleTitle: 'VP Finance / Controller',
    dept: 'Corporate Finance',
    desc: 'General ledger post, IFRS 10 group consolidation, statutory tax calculation, subledger aging.',
    badgeClass: 'badge-finance',
  },
  {
    name: 'Vikram Mehta',
    email: 'sc.director@sutra.local',
    password: 'supply123',
    roleTitle: 'Supply Chain Director',
    dept: 'Global Operations',
    desc: 'Procure-to-Pay (P2P), Order-to-Cash (O2C), inventory movements, RFQ tender award, logistics.',
    badgeClass: 'badge-scm',
  },
  {
    name: 'Sunil Kulkarni',
    email: 'auditor@sutra.local',
    password: 'audit123',
    roleTitle: 'Chief Internal Auditor',
    dept: 'Internal Audit',
    desc: 'Read-only immutable inspection across GL, subledgers, tax withholding, and security logs.',
    badgeClass: 'badge-audit',
  },
];

function selectPersona(p: DemoPersona) {
  email.value = p.email;
  password.value = p.password;
  errorMessage.value = null;
}

async function handleLogin() {
  if (!email.value || !password.value) {
    errorMessage.value = 'Please provide both email and password';
    return;
  }

  isLoading.value = true;
  errorMessage.value = null;

  try {
    const res = await login({
      email: email.value.trim(),
      password: password.value,
      tenantId: tenantId.value.trim() || undefined,
    });

    if (res.success) {
      emit('login-success');
    } else {
      errorMessage.value = res.error || 'Authentication failed. Please verify credentials.';
    }
  } catch (err: any) {
    errorMessage.value = err.message || 'Network connection failed.';
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.signin-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background-color: var(--bg-app, #080c14);
  padding: 24px;
  overflow: hidden;
}

/* Atmospheric Glow Orbs */
.signin-backdrop {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.35;
}

.orb-1 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, #3b82f6 0%, transparent 70%);
  top: -150px;
  left: -100px;
}

.orb-2 {
  width: 450px;
  height: 450px;
  background: radial-gradient(circle, #8b5cf6 0%, transparent 70%);
  bottom: -150px;
  right: -100px;
}

.orb-3 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, #06b6d4 0%, transparent 70%);
  top: 40%;
  right: 25%;
}

.signin-wrapper {
  width: 100%;
  max-width: 540px;
  position: relative;
  z-index: 10;
}

.signin-card {
  padding: 36px 32px;
  border-radius: var(--radius-lg, 18px);
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(59, 130, 246, 0.15);
}

.signin-header {
  text-align: center;
  margin-bottom: 24px;
}

.signin-logo-badge {
  width: 60px;
  height: 60px;
  margin: 0 auto 16px;
  background: var(--brand-gradient, linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%));
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 0 25px rgba(59, 130, 246, 0.4);
}

.signin-header h2 {
  font-size: 1.45rem;
  font-weight: 700;
  color: var(--text-main, #f8fafc);
  letter-spacing: -0.02em;
}

.signin-subtitle {
  font-size: 0.88rem;
  color: var(--text-muted, #94a3b8);
  margin-top: 4px;
}

.version-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  padding: 3px 10px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.25);
  border-radius: 9999px;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--brand-cyan, #06b6d4);
}

.pulse-dot {
  width: 6px;
  height: 6px;
  background-color: var(--status-success, #10b981);
  border-radius: 50%;
  box-shadow: 0 0 6px var(--status-success, #10b981);
}

/* Tabs */
.auth-mode-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  background: rgba(0, 0, 0, 0.3);
  padding: 4px;
  border-radius: var(--radius-sm, 8px);
  margin-bottom: 22px;
}

.tab-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--text-muted, #94a3b8);
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn.active {
  background: rgba(59, 130, 246, 0.25);
  color: #fff;
  border: 1px solid rgba(59, 130, 246, 0.4);
}

/* Form */
.input-with-icon {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 12px;
  width: 16px;
  height: 16px;
  color: var(--text-dim, #64748b);
  pointer-events: none;
}

.input-with-icon .input-control {
  padding-left: 38px;
  width: 100%;
}

.toggle-pwd-btn {
  position: absolute;
  right: 10px;
  background: transparent;
  border: none;
  color: var(--text-muted, #94a3b8);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
}

.tenant-collapsible {
  margin-bottom: 16px;
}

.tenant-toggle-btn {
  background: transparent;
  border: none;
  color: var(--brand-cyan, #06b6d4);
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}

.tenant-input-group {
  margin-top: 8px;
}

.signin-submit-btn {
  width: 100%;
  padding: 12px;
  font-size: 0.95rem;
  margin-top: 6px;
}

.auth-error-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-sm, 8px);
  padding: 10px 14px;
  color: var(--status-danger, #ef4444);
  font-size: 0.82rem;
  margin-bottom: 14px;
}

.plain-hint-card {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(6, 182, 212, 0.08);
  border: 1px solid rgba(6, 182, 212, 0.2);
  border-radius: var(--radius-sm, 8px);
  padding: 10px 14px;
  margin-top: 14px;
  font-size: 0.76rem;
  color: var(--text-muted, #94a3b8);
}

/* Quick Personas */
.quick-instruction {
  font-size: 0.8rem;
  color: var(--text-muted, #94a3b8);
  margin-bottom: 12px;
}

.persona-cards-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
  padding-right: 4px;
}

.persona-pick-card {
  padding: 10px 12px;
  border-radius: var(--radius-sm, 8px);
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  cursor: pointer;
  transition: all 0.18s ease;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.persona-pick-card:hover {
  background: rgba(30, 41, 59, 0.7);
  border-color: var(--border-active, rgba(59, 130, 246, 0.4));
}

.persona-pick-card.selected {
  background: rgba(59, 130, 246, 0.18);
  border-color: var(--border-focus, #3b82f6);
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.2);
}

.persona-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.persona-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 9999px;
}

.badge-superadmin {
  background: rgba(139, 92, 246, 0.2);
  color: #a78bfa;
  border: 1px solid rgba(139, 92, 246, 0.35);
}

.badge-orgadmin {
  background: rgba(6, 182, 212, 0.2);
  color: #22d3ee;
  border: 1px solid rgba(6, 182, 212, 0.35);
}

.badge-finance {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.35);
}

.badge-scm {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.35);
}

.badge-audit {
  background: rgba(56, 189, 248, 0.2);
  color: #7dd3fc;
  border: 1px solid rgba(56, 189, 248, 0.35);
}

.persona-dept {
  font-size: 0.7rem;
  color: var(--text-dim, #64748b);
}

.persona-name {
  font-size: 0.88rem;
  color: #fff;
}

.persona-email {
  font-size: 0.74rem;
  color: var(--brand-cyan, #06b6d4);
}

.persona-desc {
  font-size: 0.72rem;
  color: var(--text-muted, #94a3b8);
  line-height: 1.35;
}

/* Footer */
.signin-footer {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  text-align: center;
}

.footer-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.7rem;
  color: var(--text-dim, #64748b);
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
