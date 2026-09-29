<template>
  <div class="app-layout" :class="{ 'sidebar-collapsed': isCollapsed }">
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
          <span class="brand-title">SUTRA</span>
          <span class="brand-badge">ENTERPRISE OS</span>
        </div>
      </div>

      <nav class="nav-container">
        <div class="nav-label">Core Suite</div>
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

        <div class="nav-label" style="margin-top: 18px;">Storage & Vault</div>
        <button
          class="nav-btn"
          :class="{ active: currentTab === 'vault' }"
          @click="currentTab = 'vault'"
        >
          <FolderArchive class="nav-icon" />
          <span class="nav-text">MinIO Document Vault</span>
        </button>
      </nav>

      <!-- Sidebar Bottom Tenant Info -->
      <div class="sidebar-bottom">
        <div class="tenant-card">
          <div class="tenant-avatar">BT</div>
          <div class="tenant-details">
            <strong class="tenant-title">Bharat Tech Ltd</strong>
            <span class="tenant-sub">GSTIN: 27AAACB2212M1Z0</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Viewport -->
    <div class="main-viewport">
      <!-- Top Header -->
      <header class="top-header">
        <div class="header-left">
          <button class="icon-btn" @click="isCollapsed = !isCollapsed" title="Toggle Navigation">
            <Menu class="header-icon" />
          </button>
          <div class="page-title-box">
            <h1>{{ currentViewTitle }}</h1>
            <span class="page-sub">Enterprise Operating Cockpit • Multi-Tenant Isolation</span>
          </div>
        </div>

        <div class="header-right">
          <div class="system-status">
            <span class="pulse-indicator"></span>
            <span class="status-name">Engine v0.1 Online</span>
          </div>

          <div class="jurisdiction-pill">
            <span>🇮🇳 India First</span>
          </div>

          <button class="theme-btn" @click="toggleTheme" title="Toggle Light/Dark Theme">
            <component :is="isDark ? Sun : Moon" class="header-icon" />
          </button>

          <div class="user-avatar" @click="currentTab = 'auth'" style="cursor: pointer;" title="Chief Enterprise Architect (SuperAdmin) - Manage JWT & Auth Strategy">
            GA
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
import { ref, computed } from 'vue';
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
} from 'lucide-vue-next';

// Views
import ExecutiveDashboard from './views/ExecutiveDashboard.vue';
import EnterpriseAuth from './views/EnterpriseAuth.vue';
import ComplianceIndia from './views/ComplianceIndia.vue';
import SupplyChainERP from './views/SupplyChainERP.vue';
import NoCodeStudio from './views/NoCodeStudio.vue';
import FinancialAnalytics from './views/FinancialAnalytics.vue';
import GenAICopilot from './views/GenAICopilot.vue';
import DocumentVault from './views/DocumentVault.vue';

const currentTab = ref('dashboard');
const isCollapsed = ref(false);
const isDark = ref(true);

const navItems = [
  { id: 'dashboard', label: 'Executive Cockpit', icon: LayoutDashboard },
  { id: 'auth', label: 'Auth & Identity', icon: Lock, badge: 'JWT/SSO' },
  { id: 'supplychain', label: 'Supply Chain & ERP', icon: Truck, badge: 'MM/SD' },
  { id: 'compliance', label: 'India Compliance', icon: ShieldCheck, badge: 'GST' },
  { id: 'nocode', label: 'No-Code Studio', icon: Boxes },
  { id: 'analytics', label: 'Financial OLAP', icon: LineChart },
  { id: 'copilot', label: 'Gen AI Copilot', icon: Bot, badge: 'AI' },
];

const currentViewTitle = computed(() => {
  const map: Record<string, string> = {
    dashboard: 'Executive Cockpit',
    auth: 'Pluggable Enterprise Auth & JWT Console',
    supplychain: 'Supply Chain & Enterprise Operations (MM • SD • P2P)',
    compliance: 'India Statutory & GST Compliance',
    nocode: 'No-Code Entity & Workflow Studio',
    analytics: 'Financial Statements (P&L & Balance Sheet)',
    copilot: 'Gen AI Enterprise Copilot',
    vault: 'MinIO S3 Document Vault',
  };
  return map[currentTab.value] || 'Executive Cockpit';
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
  };
  return compMap[currentTab.value] || ExecutiveDashboard;
});

function toggleTheme() {
  isDark.value = !isDark.value;
  document.body.classList.toggle('light-theme', !isDark.value);
  document.body.classList.toggle('dark-theme', isDark.value);
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
</style>
