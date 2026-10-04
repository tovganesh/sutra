<template>
  <div v-if="!isAuthenticated">
    <SignIn @login-success="handleLoginSuccess" />
  </div>
  <div v-else class="app-layout" :class="{ 'sidebar-collapsed': isCollapsed }">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="brand-header">
        <div class="brand-logo">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
            <polyline points="2 17 12 22 22 17"></polyline>
            <polyline points="2 12 12 17 22 12"></polyline>
          </svg>
        </div>
        <div class="brand-info">
          <span class="brand-title">{{ $t('nav.brandTitle') }}</span>
          <span class="brand-badge">{{ $t('nav.brandBadge') }}</span>
        </div>
      </div>

      <nav class="nav-container">
        <div class="nav-label">{{ $t('nav.coreSuite') }}</div>
        <button
          v-for="item in navItems"
          :key="item.id"
          class="nav-btn"
          :class="{ active: currentTab === item.id }"
          @click="currentTab = item.id"
        >
          <component :is="item.icon" class="nav-icon" />
          <span class="nav-text">{{ item.label }}</span>
          <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
        </button>

        <template v-if="isVaultEnabled">
          <div class="nav-label" style="margin-top: 18px;">{{ $t('nav.storageVault') }}</div>
          <button
            class="nav-btn"
            :class="{ active: currentTab === 'vault' }"
            @click="currentTab = 'vault'"
          >
            <FolderArchive class="nav-icon" />
            <span class="nav-text">{{ $t('nav.vault') }}</span>
          </button>
        </template>
      </nav>

      <!-- Sidebar Bottom Tenant Info -->
      <div class="sidebar-bottom">
        <div class="tenant-card">
          <div class="tenant-avatar">BT</div>
          <div class="tenant-details">
            <strong class="tenant-title">{{ $t('header.tenantName') }}</strong>
            <span class="tenant-sub">{{ $t('header.tenantGstin') }}</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Viewport -->
    <div class="main-viewport">
      <!-- Top Header -->
      <header class="top-header">
        <div class="header-left">
          <button class="icon-btn" @click="isCollapsed = !isCollapsed" :title="$t('header.toggleNav')">
            <Menu class="header-icon" />
          </button>
          <div class="page-title-box">
            <h1>{{ currentViewTitle }}</h1>
            <span class="page-sub">{{ $t('header.cockpitSubtitle') }}</span>
          </div>
        </div>

        <div class="header-right">
          <!-- Language Selector -->
          <div class="selector-pill" :title="$t('header.selectLanguage')">
            <Globe class="selector-icon" />
            <select :value="currentLocale" @change="onLocaleChange" class="header-select">
              <option v-for="(loc, code) in supportedLocales" :key="code" :value="code">
                {{ loc.flag }} {{ loc.name }}
              </option>
            </select>
          </div>

          <!-- Currency Selector -->
          <div class="selector-pill" :title="$t('header.selectCurrency')">
            <Coins class="selector-icon" />
            <select :value="currentCurrency" @change="onCurrencyChange" class="header-select">
              <option v-for="(curr, code) in supportedCurrencies" :key="code" :value="code">
                {{ curr.symbol }} {{ curr.code }}
              </option>
            </select>
          </div>

          <div class="system-status">
            <span class="pulse-indicator"></span>
            <span class="status-name">{{ $t('header.engineStatus') }}</span>
          </div>

          <div class="jurisdiction-pill">
            <span>{{ $t('header.jurisdiction') }}</span>
          </div>

          <button class="theme-btn" @click="toggleTheme" :title="$t('header.toggleTheme')">
            <component :is="isDark ? Sun : Moon" class="header-icon" />
          </button>

          <div class="user-menu-wrapper">
            <div
              class="user-avatar"
              @click="showUserDropdown = !showUserDropdown"
              style="cursor: pointer;"
              :title="currentUser ? `${currentUser.fullName} (${primaryRole})` : $t('header.userAvatarTitle')"
            >
              {{ userInitials }}
            </div>

            <div v-if="showUserDropdown" class="glass-card user-dropdown-popover">
              <div class="user-dropdown-info">
                <strong>{{ currentUser?.fullName }}</strong>
                <span class="dropdown-email">{{ currentUser?.email }}</span>
                <span class="badge" :class="currentUser?.isSuperAdmin ? 'badge-danger' : 'badge-info'">
                  {{ primaryRole }}
                </span>
              </div>
              <div class="dropdown-divider"></div>
              <div class="dropdown-links">
                <button
                  v-if="currentUser?.isSuperAdmin"
                  class="dropdown-link-btn"
                  @click="currentTab = 'platformAdmin'; showUserDropdown = false"
                >
                  <ShieldAlert class="icon-xs text-purple" />
                  <span>{{ $t('header.platformAdmin') || 'Platform Administration' }}</span>
                </button>
                <button
                  class="dropdown-link-btn"
                  @click="currentTab = 'auth'; showUserDropdown = false"
                >
                  <Lock class="icon-xs" />
                  <span>Security & Sessions</span>
                </button>
                <button class="dropdown-link-btn text-danger" @click="handleLogout">
                  <LogOut class="icon-xs" />
                  <span>{{ $t('header.signOut') }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- View Container Content -->
      <main class="page-content">
        <Transition name="fade" mode="out-in">
          <component :is="currentViewComponent" />
        </Transition>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  LayoutDashboard,
  ShieldCheck,
  Boxes,
  LineChart,
  Bot,
  FolderArchive,
  Menu,
  Sun,
  Moon,
  Lock,
  Truck,
  Globe,
  Coins,
  ShieldAlert,
  LogOut,
} from 'lucide-vue-next';
import { useI18n } from './i18n';

// Views
import ExecutiveDashboard from './views/ExecutiveDashboard.vue';
import EnterpriseAuth from './views/EnterpriseAuth.vue';
import ComplianceIndia from './views/ComplianceIndia.vue';
import SupplyChainERP from './views/SupplyChainERP.vue';
import NoCodeStudio from './views/NoCodeStudio.vue';
import FinancialAnalytics from './views/FinancialAnalytics.vue';
import GenAICopilot from './views/GenAICopilot.vue';
import DocumentVault from './views/DocumentVault.vue';
import SignIn from './views/SignIn.vue';
import PlatformAdmin from './views/PlatformAdmin.vue';
import { useAuth } from './composables/useAuth';

const {
  currentLocale,
  currentCurrency,
  supportedLocales,
  supportedCurrencies,
  setLocale,
  setCurrency,
  t,
} = useI18n();

const { currentUser, userInitials, primaryRole, isAuthenticated, checkAuth, logout } = useAuth();

const currentTab = ref('dashboard');
const isCollapsed = ref(false);
const isDark = ref(true);
const showUserDropdown = ref(false);

const activeModuleIds = ref<string[]>([
  'dashboard',
  'auth',
  'supplychain',
  'compliance',
  'nocode',
  'analytics',
  'copilot',
  'vault',
]);

const isVaultEnabled = computed(() => activeModuleIds.value.includes('vault'));

async function fetchActiveModules() {
  try {
    const res = await fetch('/api/v1/system/modules');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.activeModuleIds)) {
        activeModuleIds.value = data.activeModuleIds;
      }
    }
  } catch {
    // Keep defaults
  }
}

onMounted(() => {
  checkAuth();
  fetchActiveModules();
  window.addEventListener('sutra-modules-updated', ((e: CustomEvent) => {
    if (Array.isArray(e.detail)) {
      activeModuleIds.value = e.detail;
    }
  }) as EventListener);
});

function handleLogout() {
  logout();
  showUserDropdown.value = false;
  currentTab.value = 'dashboard';
}

function handleLoginSuccess() {
  fetchActiveModules();
  if (currentUser.value?.isSuperAdmin) {
    currentTab.value = 'platformAdmin';
  } else {
    currentTab.value = 'dashboard';
  }
}

const navItems = computed(() => {
  const items = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'auth', label: t('nav.auth'), icon: Lock, badge: 'JWT/SSO' },
    { id: 'supplychain', label: t('nav.supplychain'), icon: Truck, badge: 'MM/SD' },
    { id: 'compliance', label: t('nav.compliance'), icon: ShieldCheck, badge: 'GST' },
    { id: 'nocode', label: t('nav.nocode'), icon: Boxes },
    { id: 'analytics', label: t('nav.analytics'), icon: LineChart },
    { id: 'copilot', label: t('nav.copilot'), icon: Bot, badge: 'AI' },
  ];

  if (currentUser.value?.isSuperAdmin) {
    items.push({
      id: 'platformAdmin',
      label: t('nav.platformAdmin') || 'Platform Admin',
      icon: ShieldAlert,
      badge: 'SuperAdmin',
    });
  }

  return items.filter((item) => {
    if (item.id === 'platformAdmin' || item.id === 'dashboard' || item.id === 'auth') return true;
    return activeModuleIds.value.includes(item.id);
  });
});

const currentViewTitle = computed(() => {
  return t(`nav.titles.${currentTab.value}`) || t('nav.dashboard');
});

const currentViewComponent = computed(() => {
  const compMap: Record<string, any> = {
    dashboard: ExecutiveDashboard,
    auth: EnterpriseAuth,
    supplychain: SupplyChainERP,
    compliance: ComplianceIndia,
    nocode: NoCodeStudio,
    analytics: FinancialAnalytics,
    copilot: GenAICopilot,
    vault: DocumentVault,
    platformAdmin: PlatformAdmin,
  };
  return compMap[currentTab.value] || ExecutiveDashboard;
});

function toggleTheme() {
  isDark.value = !isDark.value;
  document.body.classList.toggle('light-theme', !isDark.value);
  document.body.classList.toggle('dark-theme', isDark.value);
}

function onLocaleChange(e: Event) {
  const target = e.target as HTMLSelectElement;
  setLocale(target.value);
}

function onCurrencyChange(e: Event) {
  const target = e.target as HTMLSelectElement;
  setCurrency(target.value);
}
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}

/* Sidebar */
.sidebar {
  width: var(--sidebar-w);
  background-color: var(--bg-surface);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 100;
  transition: var(--transition-smooth);
}

.brand-header {
  height: var(--header-h);
  padding: 0 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--border-subtle);
}

.brand-logo {
  width: 40px;
  height: 40px;
  background: var(--brand-gradient);
  color: #fff;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
}

.brand-info {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  line-height: 1.1;
}

.brand-badge {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--brand-blue);
  letter-spacing: 0.08em;
}

.nav-container {
  flex: 1;
  padding: 16px 12px;
  overflow-y: auto;
}

.nav-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-dim);
  padding: 8px 12px 6px;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 14px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 0.88rem;
  font-weight: 500;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-fast);
  margin-bottom: 4px;
  text-align: left;
}

.nav-btn:hover {
  background: var(--bg-card-hover);
  color: var(--text-main);
}

.nav-btn.active {
  background: var(--brand-gradient);
  color: #ffffff;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
}

.nav-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.nav-text {
  flex: 1;
}

.nav-badge {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.2);
}

.sidebar-bottom {
  padding: 16px;
  border-top: 1px solid var(--border-subtle);
}

.tenant-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}

.tenant-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-xs);
  background: var(--brand-blue);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
}

.tenant-details {
  display: flex;
  flex-direction: column;
}

.tenant-title {
  font-size: 0.82rem;
}

.tenant-sub {
  font-size: 0.68rem;
  color: var(--text-dim);
}

/* Main Viewport */
.main-viewport {
  margin-left: var(--sidebar-w);
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: var(--transition-smooth);
}

.sidebar-collapsed .sidebar {
  width: 72px;
}

.sidebar-collapsed .brand-info,
.sidebar-collapsed .nav-text,
.sidebar-collapsed .nav-badge,
.sidebar-collapsed .nav-label,
.sidebar-collapsed .tenant-details {
  display: none;
}

.sidebar-collapsed .main-viewport {
  margin-left: 72px;
}

/* Header */
.top-header {
  height: var(--header-h);
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  position: sticky;
  top: 0;
  z-index: 90;
  backdrop-filter: var(--backdrop-blur);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.icon-btn {
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 8px;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background: var(--bg-card-hover);
  color: var(--text-main);
}

.header-icon {
  width: 18px;
  height: 18px;
}

.page-title-box h1 {
  font-size: 1.25rem;
  line-height: 1.2;
}

.page-sub {
  font-size: 0.78rem;
  color: var(--text-dim);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.system-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--status-success);
}

.pulse-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--status-success);
  box-shadow: 0 0 8px var(--status-success);
}

.jurisdiction-pill {
  padding: 6px 12px;
  border-radius: 9999px;
  font-size: 0.76rem;
  font-weight: 600;
  background: rgba(59, 130, 246, 0.12);
  color: var(--brand-blue);
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.selector-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 4px 8px;
  transition: var(--transition-fast);
}

.selector-pill:hover {
  border-color: var(--border-active);
}

.selector-icon {
  width: 14px;
  height: 14px;
  color: var(--brand-cyan);
}

.header-select {
  background: transparent;
  border: none;
  color: var(--text-main);
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  outline: none;
  font-family: inherit;
}

.header-select option {
  background: var(--bg-surface);
  color: var(--text-main);
}


.theme-btn {
  background: transparent;
  border: 1px solid var(--border-subtle);
  padding: 8px;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  cursor: pointer;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--brand-gradient);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.82rem;
  font-weight: 700;
}

/* Page Content */
.page-content {
  padding: 32px;
  flex: 1;
}

/* View Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* User Menu Popover */
.user-menu-wrapper {
  position: relative;
}

.user-dropdown-popover {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 250px;
  padding: 12px;
  border-radius: var(--radius-sm, 8px);
  background: rgba(15, 23, 42, 0.96);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.1));
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  z-index: 200;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.user-dropdown-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-dropdown-info strong {
  font-size: 0.88rem;
  color: #fff;
}

.dropdown-email {
  font-size: 0.74rem;
  color: var(--text-dim, #64748b);
}

.dropdown-divider {
  height: 1px;
  background: var(--border-subtle, rgba(255, 255, 255, 0.08));
  margin: 4px 0;
}

.dropdown-links {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dropdown-link-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: transparent;
  border: none;
  border-radius: var(--radius-xs, 4px);
  color: var(--text-main, #f8fafc);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s ease;
  width: 100%;
  text-align: left;
}

.dropdown-link-btn:hover {
  background: rgba(255, 255, 255, 0.06);
}

.dropdown-link-btn.text-danger {
  color: var(--status-danger, #ef4444);
}

.dropdown-link-btn.text-danger:hover {
  background: rgba(239, 68, 68, 0.12);
}
</style>
