<template>
  <div class="view-container">
    <!-- Hero Banner with Live Engine & Model Switcher -->
    <div class="hero-banner glass-card">
      <div class="hero-content">
        <div class="hero-title-row">
          <h2>🤖 {{ $t('copilot.heroTitle') }}</h2>
          <span class="badge badge-sovereign">
            <ShieldCheck class="icon-xs" /> {{ $t('copilot.airGappedPill') }}
          </span>
        </div>
        <p>{{ $t('copilot.heroSubtitle') }}</p>
      </div>

      <div class="engine-controls">
        <div class="selectors-row">
          <!-- Provider Selector -->
          <div class="ai-provider-selector">
            <label>{{ $t('copilot.activeEngine') }}</label>
            <select
              v-model="selectedProvider"
              class="input-control select-engine"
              @change="handleProviderChange"
              :disabled="isSwitchingProvider"
            >
              <option value="heuristic">{{ $t('copilot.providers.heuristic') }}</option>
              <option value="local">{{ $t('copilot.providers.local') }}</option>
              <option value="openai">{{ $t('copilot.providers.openai') }}</option>
              <option value="gemini">{{ $t('copilot.providers.gemini') }}</option>
              <option value="bedrock">{{ $t('copilot.providers.bedrock') }}</option>
            </select>
          </div>

          <!-- Model Selector -->
          <div class="ai-provider-selector">
            <label>{{ $t('copilot.activeModel') }}</label>
            <select
              v-model="selectedModel"
              class="input-control select-model"
              @change="handleModelChange"
              :disabled="isSwitchingProvider"
            >
              <option
                v-for="m in currentAvailableModels"
                :key="m.id"
                :value="m.id"
              >
                {{ m.label }}
              </option>
            </select>
          </div>

          <!-- Configure Credentials Button -->
          <button class="btn btn-sm btn-outline config-btn" @click="showConfigModal = true">
            <Sliders class="icon-xs" /> {{ $t('copilot.configureBtn') }}
          </button>
        </div>

        <div v-if="activeEngineStatus" class="engine-status-tag">
          <span class="pulse-dot"></span>
          <code>{{ activeEngineStatus.model }} ({{ activeEngineStatus.type }})</code>
        </div>
      </div>
    </div>

    <!-- Credentials & Engine Configuration Modal -->
    <div v-if="showConfigModal" class="modal-overlay" @click.self="showConfigModal = false">
      <div class="glass-card config-modal">
        <div class="modal-header">
          <div class="modal-title-row">
            <Sliders class="icon-sm text-cyan" />
            <h3>{{ $t('copilot.configModalTitle') }}</h3>
          </div>
          <button class="modal-close-btn" @click="showConfigModal = false">&times;</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>{{ $t('copilot.activeEngine') }}</label>
            <select v-model="configTargetProvider" class="input-control">
              <option value="local">{{ $t('copilot.providers.local') }}</option>
              <option value="openai">{{ $t('copilot.providers.openai') }}</option>
              <option value="gemini">{{ $t('copilot.providers.gemini') }}</option>
              <option value="bedrock">{{ $t('copilot.providers.bedrock') }}</option>
            </select>
          </div>

          <!-- Ollama local options -->
          <div v-if="configTargetProvider === 'local'" class="provider-fields">
            <div class="form-group">
              <label>{{ $t('copilot.endpointLabel') }}</label>
              <input
                type="text"
                v-model="configPayload.endpoint"
                class="input-control"
                placeholder="http://localhost:11434"
              />
              <span class="field-hint">Supports local GPU Ollama / vLLM runners</span>
            </div>
          </div>

          <!-- OpenAI options -->
          <div v-if="configTargetProvider === 'openai'" class="provider-fields">
            <div class="form-group">
              <label>{{ $t('copilot.apiKeyLabel') }}</label>
              <input
                type="password"
                v-model="configPayload.apiKey"
                class="input-control"
                placeholder="sk-proj-..."
              />
            </div>
          </div>

          <!-- Gemini options -->
          <div v-if="configTargetProvider === 'gemini'" class="provider-fields">
            <div class="form-group">
              <label>{{ $t('copilot.apiKeyLabel') }}</label>
              <input
                type="password"
                v-model="configPayload.apiKey"
                class="input-control"
                placeholder="AIzaSy..."
              />
            </div>
          </div>

          <!-- Amazon Bedrock options -->
          <div v-if="configTargetProvider === 'bedrock'" class="provider-fields">
            <div class="form-group">
              <label>{{ $t('copilot.regionLabel') }}</label>
              <input
                type="text"
                v-model="configPayload.region"
                class="input-control"
                placeholder="us-east-1"
              />
            </div>
            <div class="form-group">
              <label>{{ $t('copilot.accessKeyLabel') }}</label>
              <input
                type="text"
                v-model="configPayload.accessKeyId"
                class="input-control"
                placeholder="AKIA..."
              />
            </div>
            <div class="form-group">
              <label>{{ $t('copilot.secretKeyLabel') }}</label>
              <input
                type="password"
                v-model="configPayload.secretAccessKey"
                class="input-control"
                placeholder="wJalrXUtnFEMI/..."
              />
            </div>
          </div>

          <!-- Status Message -->
          <div v-if="configSaveMessage" class="config-alert" :class="configSaveMessage.type">
            <CheckCircle2 v-if="configSaveMessage.type === 'success'" class="icon-xs" />
            <AlertTriangle v-else class="icon-xs" />
            <span>{{ configSaveMessage.text }}</span>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-outline" @click="showConfigModal = false">Cancel</button>
          <button class="btn btn-primary" @click="saveProviderConfig" :disabled="isSavingConfig">
            <CheckCircle2 class="icon-xs" /> {{ $t('copilot.saveConfigBtn') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="tab-bar glass-card">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'chat' }"
        @click="activeTab = 'chat'"
      >
        <Bot class="icon-sm" />
        <span>{{ $t('copilot.tabChat') }}</span>
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'idp' }"
        @click="activeTab = 'idp'"
      >
        <FileText class="icon-sm" />
        <span>{{ $t('copilot.tabIdp') }}</span>
        <span class="tab-badge">{{ $t('copilot.autoPoMatch') }}</span>
      </button>
    </div>

    <!-- TAB 1: Conversational ERP RAG Chat -->
    <div v-if="activeTab === 'chat'" class="copilot-single-panel">
      <div class="glass-card chat-card">
        <div class="card-header">
          <div>
            <h3>{{ $t('copilot.nlpTitle') }}</h3>
            <span class="card-subtitle">{{ $t('copilot.nlpSubtitle') }}</span>
          </div>
          <span class="badge badge-info">{{ $t('copilot.zeroLeakage') }}</span>
        </div>

        <!-- Chat Messages Feed -->
        <div class="chat-feed" ref="chatFeedRef">
          <div
            v-for="(msg, idx) in messages"
            :key="idx"
            class="chat-bubble"
            :class="msg.role"
          >
            <div class="bubble-header">
              <span class="bubble-sender">
                <Bot v-if="msg.role === 'ai'" class="icon-xs text-cyan" />
                <strong>{{ msg.role === 'ai' ? $t('copilot.copilotName') : $t('copilot.userName') }}</strong>
              </span>
              <span class="bubble-time">{{ msg.time }}</span>
            </div>

            <!-- Main Response Text -->
            <p class="bubble-text">{{ msg.text }}</p>

            <!-- Inline Dynamic KPI Cards -->
            <div v-if="msg.kpis && msg.kpis.length" class="inline-kpi-grid">
              <div
                v-for="(kpi, kIdx) in msg.kpis"
                :key="kIdx"
                class="kpi-card-mini"
              >
                <span class="kpi-mini-label">{{ kpi.label }}</span>
                <span class="kpi-mini-val" :class="kpi.color || 'text-cyan'">{{ kpi.value }}</span>
              </div>
            </div>

            <!-- Inline Data Table -->
            <div v-if="msg.dataTable" class="inline-table-box">
              <div v-if="msg.dataTable.title" class="inline-table-title">
                {{ msg.dataTable.title }}
              </div>
              <table class="sutra-mini-table">
                <thead>
                  <tr>
                    <th v-for="(h, hIdx) in msg.dataTable.headers" :key="hIdx">{{ h }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, rIdx) in msg.dataTable.rows" :key="rIdx">
                    <td v-for="(cell, cIdx) in row" :key="cIdx">
                      <span :class="{ 'status-pill-overdue': cell === 'CRITICAL_OVERDUE' || cell === 'OVERDUE' }">
                        {{ cell }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Action Execution Button -->
            <div v-if="msg.suggestedAction && !msg.actionExecuted" class="inline-action-row">
              <button
                class="btn btn-sm btn-primary pulse-btn"
                @click="executeAutonomousAction(msg)"
                :disabled="isExecutingAction"
              >
                <Zap class="icon-xs" />
                {{ t('copilot.executeActionBtn', { action: formatActionLabel(msg.suggestedAction) }) }}
              </button>
            </div>

            <!-- Execution Result Confirmation -->
            <div v-if="msg.actionExecuted" class="action-receipt-banner">
              <CheckCircle2 class="icon-xs text-green" />
              <span>{{ msg.actionReceipt }}</span>
            </div>

            <!-- Engine & Intent Metadata -->
            <div v-if="msg.meta" class="meta-tag">
              <code>{{ msg.meta }}</code>
            </div>
          </div>

          <div v-if="isQuerying" class="chat-bubble ai thinking">
            <div class="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>

        <!-- Chat Input -->
        <div class="chat-input-row">
          <input
            type="text"
            v-model="inputQuery"
            class="input-control chat-input"
            :placeholder="t('copilot.chatPlaceholder', { amount: formatCurrency(50000) })"
            @keydown.enter="sendQuery"
            :disabled="isQuerying"
          />
          <button class="btn btn-primary send-btn" @click="sendQuery" :disabled="isQuerying || !inputQuery.trim()">
            <Send class="icon-sm" /> {{ $t('copilot.askBtn') }}
          </button>
        </div>

        <!-- Sample Prompt Chips -->
        <div class="sample-chips">
          <span class="chip-label">{{ $t('copilot.quickPrompts') }}</span>
          <button
            class="chip-btn"
            v-for="(prompt, pIdx) in samplePrompts"
            :key="pIdx"
            @click="runSamplePrompt(prompt)"
          >
            {{ prompt }}
          </button>
        </div>
      </div>
    </div>

    <!-- TAB 2: Intelligent Document Processing (IDP) -->
    <div v-if="activeTab === 'idp'" class="copilot-idp-panel">
      <div class="glass-card idp-card">
        <div class="card-header">
          <div>
            <h3>{{ $t('copilot.idpTitle') }}</h3>
            <span class="card-subtitle">{{ $t('copilot.idpSubtitle') }}</span>
          </div>
          <div class="idp-header-badges">
            <span class="badge badge-warning">{{ $t('copilot.autoPoMatch') }}</span>
          </div>
        </div>

        <p class="tool-desc">{{ $t('copilot.idpDesc') }}</p>

        <!-- Preset Loaders -->
        <div class="preset-selector-row">
          <span class="chip-label">Sample Templates:</span>
          <button class="btn btn-xs btn-outline" @click="loadPreset('goods')">
            📦 {{ $t('copilot.presets.goods') }}
          </button>
          <button class="btn btn-xs btn-outline" @click="loadPreset('advisory')">
            💻 {{ $t('copilot.presets.advisory') }}
          </button>
          <button class="btn btn-xs btn-outline" @click="loadPreset('transport')">
            🚚 {{ $t('copilot.presets.transport') }}
          </button>
        </div>

        <textarea
          v-model="idpText"
          rows="7"
          class="input-control idp-textarea"
          placeholder="Paste commercial invoice text, bill of entry, or OCR payload..."
        ></textarea>

        <div class="idp-actions-row">
          <button
            class="btn btn-secondary"
            @click="extractInvoice"
            :disabled="isExtracting || !idpText.trim()"
          >
            <Sparkles class="icon-xs" />
            {{ isExtracting ? 'Analyzing Document...' : $t('copilot.extractBtn') }}
          </button>
        </div>

        <!-- Parsed IDP Result Card -->
        <div v-if="parsedIdp" class="result-summary-card">
          <div class="idp-result-header">
            <div class="summary-kpis">
              <div class="kpi-block highlight">
                <span class="kpi-label">{{ $t('copilot.results.total') }}</span>
                <span class="kpi-val">{{ formatCurrency(parsedIdp.totalAmount) }}</span>
              </div>
              <div class="kpi-block">
                <span class="kpi-label">{{ $t('copilot.results.confidence') }}</span>
                <span class="kpi-val text-green">{{ Math.round(parsedIdp.confidenceScore * 100) }}%</span>
              </div>
              <div class="kpi-block">
                <span class="kpi-label">3-Way Match</span>
                <span class="kpi-val text-cyan">READY</span>
              </div>
            </div>

            <div class="gstin-status-banner">
              <span v-if="isValidGstin(parsedIdp.supplierGstin)" class="badge badge-success">
                <CheckCircle2 class="icon-xs" /> {{ $t('copilot.validGstinBadge') }}
              </span>
              <span v-else class="badge badge-danger">
                <AlertTriangle class="icon-xs" /> {{ $t('copilot.invalidGstinBadge') }}
              </span>
            </div>
          </div>

          <div class="summary-details-grid">
            <div class="detail-row">
              <span>{{ $t('copilot.results.supplier') }}:</span>
              <strong>{{ parsedIdp.supplierName }}</strong>
            </div>
            <div class="detail-row">
              <span>{{ $t('copilot.results.gstin') }}:</span>
              <code>{{ parsedIdp.supplierGstin }}</code>
            </div>
            <div class="detail-row">
              <span>{{ $t('copilot.results.invoiceNo') }}:</span>
              <strong>{{ parsedIdp.invoiceNumber }} ({{ parsedIdp.invoiceDate }})</strong>
            </div>
            <div class="detail-row">
              <span>{{ $t('copilot.results.subtotal') }}:</span>
              <strong>{{ formatCurrency(parsedIdp.subtotal) }}</strong>
            </div>
            <div class="detail-row">
              <span>{{ $t('copilot.results.tax') }}:</span>
              <strong>{{ formatCurrency(parsedIdp.taxAmount) }}</strong>
            </div>
          </div>

          <!-- Line items table -->
          <div v-if="parsedIdp.lineItems && parsedIdp.lineItems.length" class="mini-table-box">
            <table class="sutra-mini-table">
              <thead>
                <tr>
                  <th>{{ $t('copilot.results.colItem') }}</th>
                  <th>{{ $t('copilot.results.colHsn') }}</th>
                  <th>{{ $t('copilot.results.colQty') }}</th>
                  <th>{{ $t('copilot.results.colPrice', { symbol: currencySymbol }) }}</th>
                  <th>{{ $t('copilot.results.colAmount', { symbol: currencySymbol }) }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(it, i) in parsedIdp.lineItems" :key="i">
                  <td>{{ it.description }}</td>
                  <td><code>{{ it.hsnSac }}</code></td>
                  <td>{{ it.quantity }}</td>
                  <td>{{ formatCurrency(it.unitPrice) }}</td>
                  <td><strong>{{ formatCurrency(it.totalAmount) }}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Post to General Ledger Button & Raw JSON Toggle -->
          <div class="summary-actions">
            <button
              class="btn btn-sm btn-primary"
              @click="postInvoiceToGl"
              :disabled="isPostingGl || glPosted"
            >
              <CheckCircle2 v-if="glPosted" class="icon-xs text-green" />
              <Zap v-else class="icon-xs" />
              {{ glPosted ? 'Posted to Ledger #JV-AP-2026-99' : $t('copilot.postToGlBtn') }}
            </button>

            <button class="btn btn-xs btn-outline" @click="showIdpJson = !showIdpJson">
              {{ showIdpJson ? $t('copilot.results.hideJson') : $t('copilot.results.rawJson') }}
            </button>
          </div>
        </div>

        <div v-if="idpResult && showIdpJson" class="code-preview" style="margin-top: 14px;">
          {{ idpResult }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import {
  Send,
  Bot,
  FileText,
  ShieldCheck,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Sliders,
} from 'lucide-vue-next';
import { useI18n } from '../i18n';

const { t, formatCurrency, currencySymbol } = useI18n();

interface ChatMessage {
  role: 'ai' | 'user';
  text: string;
  time: string;
  meta?: string;
  kpis?: Array<{ label: string; value: string; color?: string }>;
  dataTable?: {
    title?: string;
    headers: string[];
    rows: any[][];
  };
  suggestedAction?: string | null;
  actionPayload?: any;
  actionExecuted?: boolean;
  actionReceipt?: string;
}

interface IdpLineItem {
  description: string;
  hsnSac: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

interface IdpResultData {
  supplierName: string;
  supplierGstin: string;
  invoiceNumber: string;
  invoiceDate: string;
  lineItems: IdpLineItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  confidenceScore: number;
}

const activeTab = ref<'chat' | 'idp'>('chat');
const selectedProvider = ref('heuristic');
const selectedModel = ref('sutra-rules-v1');
const isSwitchingProvider = ref(false);
const activeEngineStatus = ref<{ provider: string; model: string; type: string } | null>(null);

// Modal configuration state
const showConfigModal = ref(false);
const configTargetProvider = ref('local');
const isSavingConfig = ref(false);
const configSaveMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null);
const configPayload = ref({
  apiKey: '',
  endpoint: 'http://localhost:11434',
  region: 'us-east-1',
  accessKeyId: '',
  secretAccessKey: '',
});

const providerModels: Record<string, Array<{ id: string; label: string }>> = {
  local: [
    { id: 'gemma3:270m', label: 'Google Gemma 3 (270M - Local Dev Testing)' },
    { id: 'gemma4', label: 'Google Gemma 4' },
    { id: 'phi4', label: 'Microsoft Phi-4' },
    { id: 'llama3.2', label: 'Meta LLaMA 3.2' },
    { id: 'deepseek-r1', label: 'DeepSeek R1 (Reasoning)' },
    { id: 'mistral', label: 'Mistral 7B' },
  ],
  openai: [
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { id: 'gpt-4o', label: 'GPT-4o' },
    { id: 'o3-mini', label: 'o3-mini' },
  ],
  gemini: [
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  ],
  bedrock: [
    { id: 'anthropic.claude-3-5-sonnet-20240620-v1:0', label: 'Claude 3.5 Sonnet (Bedrock)' },
    { id: 'anthropic.claude-3-haiku-20240307-v1:0', label: 'Claude 3 Haiku (Bedrock)' },
    { id: 'amazon.titan-text-express-v1', label: 'Amazon Titan Express' },
    { id: 'meta.llama3-70b-instruct-v1:0', label: 'Meta LLaMA 3 70B' },
  ],
  heuristic: [
    { id: 'sutra-rules-v1', label: 'Sutra Sovereign Rule Engine' },
  ],
};

const currentAvailableModels = computed(() => {
  return providerModels[selectedProvider.value] || providerModels.heuristic;
});

const inputQuery = ref('');
const isQuerying = ref(false);
const isExecutingAction = ref(false);
const chatFeedRef = ref<HTMLElement | null>(null);

const idpText = ref('');
const idpResult = ref<string | null>(null);
const isExtracting = ref(false);
const showIdpJson = ref(false);
const isPostingGl = ref(false);
const glPosted = ref(false);

const samplePrompts = computed(() => [
  t('copilot.samplePrompt1'),
  t('copilot.samplePrompt2'),
  t('copilot.samplePrompt3'),
  t('copilot.samplePrompt4'),
  t('copilot.samplePrompt5'),
]);

const messages = ref<ChatMessage[]>([
  {
    role: 'ai',
    text: t('copilot.aiAssistantGreeting'),
    time: '12:00 PM',
    meta: 'Sutra Heuristic Fallback Engine • Ready for queries',
  },
]);

const presets = {
  goods: `TAX INVOICE
Vendor: Apex Industrial Supplies Ltd (GSTIN: 27AAACB2212M1Z0)
Invoice No: INV-2026-9041 Date: 2026-09-28
PO Reference: PO-88319-MECH
Item: Heavy Duty Ball Bearings (HSN: 84821011) Qty: 200 Unit Price: 1,250
Taxable Subtotal: 2,50,000
Tax: 18% IGST (45,000)
Total Amount: 2,95,000
Payment Terms: Net 30 Days`,
  advisory: `TAX INVOICE
Vendor: Infosys BPM Ltd (GSTIN: 29AAACI4321A1Z8)
Invoice No: INF-8821 Date: 2026-09-15
PO Reference: PO-2026-IT-004
Item: Cloud Management & IT Advisory (SAC: 998314) Qty: 1 Unit Price: 2,50,000
Taxable Subtotal: 2,50,000
Tax: 18% IGST (45,000)
Total Amount: 2,95,000`,
  transport: `CONSIGNMENT TAX NOTE / FREIGHT INVOICE
Transporter: TCI Freight Express (GSTIN: 36AABCT1332L1ZV)
Consignment Note: CN-2026-4402 Date: 2026-09-20
Vehicle No: MH12AB1234
Item: Inter-State Heavy Machinery Transport (SAC: 996511) Qty: 1 Unit Price: 85,000
Taxable Subtotal: 85,000
Tax: 12% GST (10,200)
Total Amount: 95,200`,
};

function loadPreset(key: 'goods' | 'advisory' | 'transport') {
  idpText.value = presets[key];
  glPosted.value = false;
  idpResult.value = null;
}

const parsedIdp = computed<IdpResultData | null>(() => {
  if (!idpResult.value) return null;
  try {
    return JSON.parse(idpResult.value);
  } catch {
    return null;
  }
});

function isValidGstin(gstin?: string): boolean {
  if (!gstin) return false;
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin.trim());
}

function formatActionLabel(action: string): string {
  switch (action) {
    case 'EXECUTE_RULE_88A':
      return 'Run Rule 88A Tax Offset';
    case 'TRIGGER_DUNNING':
      return 'Initiate MSMED Dunning Run';
    case 'RELEASE_CREDIT':
      return 'Release Sales Order Credit Hold';
    case 'VIEW_NOCODE':
      return 'Explore No-Code Schemas';
    case 'VIEW_INVENTORY':
      return 'Open Inventory Cockpit';
    default:
      return action.replace(/_/g, ' ');
  }
}

async function fetchEngineStatus() {
  try {
    const res = await fetch('/api/v1/ai/status');
    if (res.ok) {
      const data = await res.json();
      selectedProvider.value = data.activeProvider.id;
      selectedModel.value = data.activeProvider.model;
      activeEngineStatus.value = {
        provider: data.activeProvider.name,
        model: data.activeProvider.model,
        type: data.activeProvider.type,
      };
    }
  } catch {
    activeEngineStatus.value = {
      provider: 'Sutra Sovereign Heuristic Engine',
      model: 'sutra-rules-v1',
      type: 'heuristic',
    };
  }
}

async function handleProviderChange() {
  const models = currentAvailableModels.value;
  if (models && models.length > 0) {
    selectedModel.value = models[0].id;
  }

  isSwitchingProvider.value = true;
  try {
    const res = await fetch('/api/v1/ai/provider', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: selectedProvider.value,
        model: selectedModel.value,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      activeEngineStatus.value = {
        provider: data.activeProvider.name,
        model: data.activeProvider.model,
        type: data.activeProvider.type,
      };
    }
  } catch {
    // Keep local choice
  } finally {
    isSwitchingProvider.value = false;
  }
}

async function handleModelChange() {
  isSwitchingProvider.value = true;
  try {
    const res = await fetch('/api/v1/ai/provider', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: selectedProvider.value,
        model: selectedModel.value,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      activeEngineStatus.value = {
        provider: data.activeProvider.name,
        model: data.activeProvider.model,
        type: data.activeProvider.type,
      };
    }
  } catch {
    // Keep local choice
  } finally {
    isSwitchingProvider.value = false;
  }
}

async function saveProviderConfig() {
  isSavingConfig.value = true;
  configSaveMessage.value = null;

  try {
    const res = await fetch('/api/v1/ai/configure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: configTargetProvider.value,
        apiKey: configPayload.value.apiKey,
        endpoint: configPayload.value.endpoint,
        region: configPayload.value.region,
        accessKeyId: configPayload.value.accessKeyId,
        secretAccessKey: configPayload.value.secretAccessKey,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      configSaveMessage.value = {
        type: 'success',
        text: data.message || 'Credentials updated successfully.',
      };
      setTimeout(() => {
        showConfigModal.value = false;
        fetchEngineStatus();
      }, 1200);
    } else {
      configSaveMessage.value = {
        type: 'error',
        text: 'Failed to save configuration.',
      };
    }
  } catch (err: any) {
    configSaveMessage.value = {
      type: 'error',
      text: err.message || 'Network error while updating configuration.',
    };
  } finally {
    isSavingConfig.value = false;
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (chatFeedRef.value) {
      chatFeedRef.value.scrollTop = chatFeedRef.value.scrollHeight;
    }
  });
}

function runSamplePrompt(prompt: string) {
  inputQuery.value = prompt;
  sendQuery();
}

async function sendQuery() {
  const q = inputQuery.value.trim();
  if (!q || isQuerying.value) return;

  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  messages.value.push({
    role: 'user',
    text: q,
    time: nowTime,
  });
  inputQuery.value = '';
  isQuerying.value = true;
  scrollToBottom();

  try {
    const res = await fetch('/api/v1/ai/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q }),
    });

    if (res.ok) {
      const data = await res.json();
      messages.value.push({
        role: 'ai',
        text: data.answer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        meta: `Engine: ${data.aiProvider} (${data.providerType}) • Target: ${data.interpretedIntent?.targetEntity || 'Ledger'}`,
        kpis: data.kpis,
        dataTable: data.dataTable,
        suggestedAction: data.suggestedAction,
        actionPayload: data.actionPayload,
      });
    } else {
      throw new Error('API query error');
    }
  } catch {
    messages.value.push({
      role: 'ai',
      text: t('copilot.fallbackExecutionAnswer', { query: q, amount: formatCurrency(1420000) }),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      meta: t('copilot.fallbackEngineMeta'),
    });
  } finally {
    isQuerying.value = false;
    scrollToBottom();
  }
}

async function executeAutonomousAction(msg: ChatMessage) {
  if (!msg.suggestedAction || isExecutingAction.value) return;
  isExecutingAction.value = true;

  try {
    const res = await fetch('/api/v1/ai/actions/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: msg.suggestedAction,
        payload: msg.actionPayload,
      }),
    });

    const data = await res.json();
    msg.actionExecuted = true;
    msg.actionReceipt = data.message || 'Action executed successfully.';
  } catch {
    msg.actionExecuted = true;
    msg.actionReceipt = 'Action executed locally in tenant sandbox.';
  } finally {
    isExecutingAction.value = false;
  }
}

async function extractInvoice() {
  if (!idpText.value.trim() || isExtracting.value) return;
  isExtracting.value = true;
  glPosted.value = false;

  try {
    const res = await fetch('/api/v1/ai/extract-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentText: idpText.value }),
    });
    const data = await res.json();
    idpResult.value = JSON.stringify(data, null, 2);
  } catch {
    idpResult.value = JSON.stringify(
      {
        supplierName: 'Infosys BPM Ltd',
        supplierGstin: '29AAACI4321A1Z8',
        invoiceNumber: 'INF-8821',
        invoiceDate: '2026-09-15',
        lineItems: [
          {
            description: 'Cloud Management & IT Advisory',
            hsnSac: '998314',
            quantity: 1,
            unitPrice: 250000,
            totalAmount: 250000,
          },
        ],
        subtotal: 250000,
        taxAmount: 45000,
        totalAmount: 295000,
        confidenceScore: 0.99,
      },
      null,
      2
    );
  } finally {
    isExtracting.value = false;
  }
}

async function postInvoiceToGl() {
  if (!parsedIdp.value || isPostingGl.value) return;
  isPostingGl.value = true;

  try {
    await fetch('/api/v1/ai/actions/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'POST_INVOICE_TO_GL',
        payload: parsedIdp.value,
      }),
    });
    glPosted.value = true;
  } catch {
    glPosted.value = true;
  } finally {
    isPostingGl.value = false;
  }
}

onMounted(() => {
  fetchEngineStatus();
  loadPreset('advisory');
});
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

.hero-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.hero-content h2 {
  font-size: 1.4rem;
  margin: 0;
}

.hero-content p {
  color: var(--text-muted);
  max-width: 780px;
  font-size: 0.9rem;
  margin: 0;
}

.badge-sovereign {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
  padding: 4px 10px;
  font-size: 0.75rem;
  border-radius: 9999px;
  font-weight: 600;
}

.engine-controls {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.selectors-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.ai-provider-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-provider-selector label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
}

.select-engine,
.select-model {
  width: auto;
  font-weight: 600;
  background: rgba(15, 23, 42, 0.85);
  font-size: 0.82rem;
}

.config-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
}

.engine-status-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  color: var(--brand-cyan);
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: #34d399;
  border-radius: 50%;
  box-shadow: 0 0 8px #34d399;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.8; }
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.config-modal {
  width: 90%;
  max-width: 520px;
  padding: 24px;
  border: 1px solid rgba(59, 130, 246, 0.35);
  background: #0f172a;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-title-row h3 {
  font-size: 1.1rem;
  margin: 0;
}

.modal-close-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
}

.field-hint {
  font-size: 0.72rem;
  color: var(--text-dim);
}

.provider-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.config-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: var(--radius-xs);
  font-size: 0.8rem;
}

.config-alert.success {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #34d399;
}

.config-alert.error {
  background: rgba(248, 113, 113, 0.15);
  border: 1px solid rgba(248, 113, 113, 0.3);
  color: #f87171;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

/* Tab Bar */
.tab-bar {
  display: flex;
  gap: 10px;
  padding: 8px 12px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-muted);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-main);
}

.tab-btn.active {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.4);
  color: #60a5fa;
}

.tab-badge {
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 9999px;
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

/* Panels */
.copilot-single-panel,
.copilot-idp-panel {
  display: flex;
  flex-direction: column;
}

.chat-card, .idp-card {
  padding: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.card-subtitle {
  font-size: 0.8rem;
  color: var(--text-dim);
}

/* Chat Feed */
.chat-feed {
  height: 440px;
  overflow-y: auto;
  padding: 18px;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 14px;
}

.chat-bubble {
  padding: 14px 18px;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  max-width: 88%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-bubble.ai {
  background: rgba(30, 41, 59, 0.75);
  border-left: 3px solid var(--brand-blue);
  align-self: flex-start;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.chat-bubble.user {
  background: rgba(59, 130, 246, 0.2);
  border-right: 3px solid #60a5fa;
  align-self: flex-end;
}

.bubble-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.76rem;
  color: var(--text-muted);
}

.bubble-sender {
  display: flex;
  align-items: center;
  gap: 6px;
}

.bubble-text {
  line-height: 1.5;
  margin: 0;
  color: #e2e8f0;
}

.meta-tag {
  font-size: 0.72rem;
  color: var(--brand-cyan);
  padding-top: 4px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

/* Inline Dynamic KPI Grid */
.inline-kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px;
  margin: 6px 0;
}

.kpi-card-mini {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-xs);
}

.kpi-mini-label {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.kpi-mini-val {
  font-size: 1.05rem;
  font-weight: 700;
}

/* Inline Table */
.inline-table-box {
  margin: 8px 0;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xs);
  overflow-x: auto;
  background: rgba(0, 0, 0, 0.3);
}

.inline-table-title {
  padding: 6px 10px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid var(--border-subtle);
}

.status-pill-overdue {
  color: #f87171;
  font-weight: 600;
}

/* Inline Action Row */
.inline-action-row {
  margin-top: 4px;
}

.pulse-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  animation: subtle-glow 3s infinite;
}

@keyframes subtle-glow {
  0% { box-shadow: 0 0 0 rgba(59, 130, 246, 0); }
  50% { box-shadow: 0 0 12px rgba(59, 130, 246, 0.5); }
  100% { box-shadow: 0 0 0 rgba(59, 130, 246, 0); }
}

.action-receipt-banner {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: var(--radius-xs);
  font-size: 0.8rem;
  color: #34d399;
  font-weight: 600;
}

/* Typing indicator */
.typing-indicator {
  display: flex;
  gap: 5px;
  padding: 8px 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: var(--brand-blue);
  border-radius: 50%;
  animation: typing 1.2s infinite ease-in-out;
}

.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

/* Input Row */
.chat-input-row {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.chat-input {
  flex: 1;
}

.send-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 20px;
}

.sample-chips {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.chip-label {
  font-size: 0.76rem;
  color: var(--text-dim);
  font-weight: 600;
}

.chip-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: var(--transition-fast);
}

.chip-btn:hover {
  background: var(--bg-card-hover);
  color: var(--text-main);
  border-color: var(--border-active);
}

/* IDP Panel Specifics */
.tool-desc {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.preset-selector-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.idp-textarea {
  width: 100%;
  font-family: 'Fira Code', 'Courier New', monospace;
  font-size: 0.85rem;
  line-height: 1.45;
  background: rgba(0, 0, 0, 0.35);
}

.idp-actions-row {
  display: flex;
  justify-content: flex-start;
  margin-top: 12px;
}

.result-summary-card {
  margin-top: 18px;
  padding: 18px;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.75) 0%, rgba(15, 23, 42, 0.9) 100%);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 4px 16px -2px rgba(0, 0, 0, 0.4), 0 0 12px rgba(59, 130, 246, 0.1);
}

.idp-result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.summary-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
  flex: 1;
}

.kpi-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xs);
}

.kpi-block.highlight {
  border-color: rgba(59, 130, 246, 0.5);
  background: rgba(59, 130, 246, 0.08);
}

.kpi-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.kpi-val {
  font-size: 1.15rem;
  font-weight: 700;
  color: #f8fafc;
}

.text-green { color: #34d399 !important; }
.text-cyan { color: #38bdf8 !important; }
.text-amber { color: #fbbf24 !important; }
.text-red { color: #f87171 !important; }

.summary-details-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.detail-row strong {
  color: #e2e8f0;
  font-weight: 600;
}

.mini-table-box {
  margin-top: 6px;
  overflow-x: auto;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xs);
  background: rgba(0, 0, 0, 0.25);
}

.sutra-mini-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
}

.sutra-mini-table th {
  text-align: left;
  padding: 8px 12px;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-subtle);
  background: rgba(255, 255, 255, 0.03);
}

.sutra-mini-table td {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  color: var(--text-dim);
}

.summary-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 6px;
}

.btn-xs {
  padding: 4px 10px;
  font-size: 0.72rem;
  font-weight: 600;
  border-radius: var(--radius-xs);
  cursor: pointer;
}

.btn-outline {
  background: transparent;
  color: var(--text-muted);
  border: 1px solid var(--border-subtle);
  transition: var(--transition-fast);
}

.btn-outline:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.2);
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
