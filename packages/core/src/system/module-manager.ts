/**
 * Sutra Enterprise Operating System - Platform Module & Setup Manager
 * Manages module selection, feature enablement, and client installation setup.
 */

export interface SystemModuleConfig {
  id: string;
  name: string;
  category: 'Operations' | 'Finance' | 'Compliance' | 'Platform' | 'AI' | 'Storage';
  description: string;
  isEnabled: boolean;
  isCore: boolean;
  badge?: string;
  routeKey: string;
}

export interface SystemSetupState {
  installMode: 'plain' | 'demo';
  isConfigured: boolean;
  organization: {
    name: string;
    gstin: string;
    currency: string;
    jurisdiction: string;
    adminEmail: string;
  };
  activeModules: string[];
  installedAt: string;
  configuredAt?: string;
}

export const DEFAULT_SYSTEM_MODULES: SystemModuleConfig[] = [
  {
    id: 'dashboard',
    name: 'Executive ERP Cockpit',
    category: 'Platform',
    description: 'Executive overview, KPI metrics, board summary, and financial velocity',
    isEnabled: true,
    isCore: true,
    routeKey: 'dashboard',
  },
  {
    id: 'auth',
    name: 'Identity & Access Management (IAM)',
    category: 'Platform',
    description: 'Enterprise SSO, JWT, SAML 2.0, Microsoft Entra ID, and RBAC directory',
    isEnabled: true,
    isCore: true,
    badge: 'JWT/SSO',
    routeKey: 'auth',
  },
  {
    id: 'supplychain',
    name: 'Supply Chain & Enterprise Operations',
    category: 'Operations',
    description: 'Procure-to-Pay (P2P), Order-to-Cash (O2C), Inventory (MM), RFQ Sourcing, EWM, TM, PP, QM, PM, HCM, PS',
    isEnabled: true,
    isCore: false,
    badge: 'MM/SD',
    routeKey: 'supplychain',
  },
  {
    id: 'compliance',
    name: 'India Statutory Compliance & Tax Engine',
    category: 'Compliance',
    description: 'GSTIN syntax validation, 3-way match, E-Invoice, E-Way Bill, and Section 194 TDS withholding',
    isEnabled: true,
    isCore: false,
    badge: 'GST',
    routeKey: 'compliance',
  },
  {
    id: 'nocode',
    name: 'No-Code Dynamic Entity Modeler',
    category: 'Platform',
    description: 'Custom entity builder, field validations, dynamic JSON schemas, and live record management',
    isEnabled: true,
    isCore: false,
    routeKey: 'nocode',
  },
  {
    id: 'analytics',
    name: 'Financial Analytics & Group Consolidation',
    category: 'Finance',
    description: 'Double-entry general ledger, IFRS 10 group consolidation, multi-currency parallel ledgers (FI-GL)',
    isEnabled: true,
    isCore: false,
    routeKey: 'analytics',
  },
  {
    id: 'copilot',
    name: 'Gen AI Copilot & Sovereign Indic LLM',
    category: 'AI',
    description: 'Text-to-ERP RAG, intelligent document processing, and multi-provider engine (Sarvam AI, Ollama, Bedrock)',
    isEnabled: true,
    isCore: false,
    badge: 'AI',
    routeKey: 'copilot',
  },
  {
    id: 'vault',
    name: 'Storage Vault & Document Archival',
    category: 'Storage',
    description: 'S3/MinIO compatible object store for tax invoices, e-Way bills, and signed audit trails',
    isEnabled: true,
    isCore: false,
    routeKey: 'vault',
  },
];

export class SystemModuleManager {
  private modules: Map<string, SystemModuleConfig> = new Map();
  private setupState: SystemSetupState;

  constructor(initialMode: 'plain' | 'demo' = (process.env.SUTRA_INSTALL_MODE as 'plain' | 'demo') || 'demo') {
    // Populate modules
    for (const m of DEFAULT_SYSTEM_MODULES) {
      this.modules.set(m.id, { ...m });
    }

    this.setupState = {
      installMode: initialMode,
      isConfigured: initialMode === 'demo',
      organization: {
        name: initialMode === 'demo' ? 'Bharat Tech Manufacturing Ltd' : 'Client Organization',
        gstin: initialMode === 'demo' ? '27AABCB2212M1Z0' : '27AAACB0000A1Z5',
        currency: 'INR',
        jurisdiction: 'IN',
        adminEmail: 'admin@sutra.local',
      },
      activeModules: DEFAULT_SYSTEM_MODULES.filter((m) => m.isEnabled).map((m) => m.id),
      installedAt: new Date().toISOString(),
      configuredAt: initialMode === 'demo' ? new Date().toISOString() : undefined,
    };
  }

  public getModules(): SystemModuleConfig[] {
    return Array.from(this.modules.values());
  }

  public getActiveModuleIds(): string[] {
    return Array.from(this.modules.values())
      .filter((m) => m.isEnabled)
      .map((m) => m.id);
  }

  public isModuleEnabled(id: string): boolean {
    const mod = this.modules.get(id);
    return Boolean(mod?.isEnabled);
  }

  public isModuleActive(id: string): boolean {
    return this.isModuleEnabled(id);
  }

  public setModuleEnabled(id: string, isEnabled: boolean): boolean {
    const mod = this.modules.get(id);
    if (!mod) return false;
    if (mod.isCore && !isEnabled) {
      // Core modules (dashboard, auth) cannot be disabled
      return false;
    }
    mod.isEnabled = isEnabled;
    this.setupState.activeModules = this.getActiveModuleIds();
    return true;
  }

  public setModules(enabledModuleIds: string[]): string[] {
    const enabledSet = new Set(enabledModuleIds);
    for (const [id, mod] of this.modules.entries()) {
      if (mod.isCore) {
        mod.isEnabled = true;
      } else {
        mod.isEnabled = enabledSet.has(id);
      }
    }
    this.setupState.activeModules = this.getActiveModuleIds();
    return this.setupState.activeModules;
  }

  public getSetupState(): SystemSetupState & { organizationName?: string; gstin?: string } {
    return {
      ...this.setupState,
      organizationName: this.setupState.organization.name,
      gstin: this.setupState.organization.gstin,
      activeModules: this.getActiveModuleIds(),
    };
  }

  public configureClientSetup(params: {
    organizationName?: string;
    gstin?: string;
    currency?: string;
    jurisdiction?: string;
    enabledModules?: string[];
  }): SystemSetupState {
    if (params.organizationName) {
      this.setupState.organization.name = params.organizationName.trim();
    }
    if (params.gstin) {
      this.setupState.organization.gstin = params.gstin.trim().toUpperCase();
    }
    if (params.currency) {
      this.setupState.organization.currency = params.currency.trim().toUpperCase();
    }
    if (params.jurisdiction) {
      this.setupState.organization.jurisdiction = params.jurisdiction.trim().toUpperCase();
    }
    if (params.enabledModules && Array.isArray(params.enabledModules)) {
      this.setModules(params.enabledModules);
    }
    this.setupState.isConfigured = true;
    this.setupState.configuredAt = new Date().toISOString();

    return this.getSetupState();
  }
}
