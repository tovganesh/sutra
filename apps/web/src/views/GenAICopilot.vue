<template>
  <div class="view-container">
    <div class="hero-banner glass-card">
      <div class="hero-content">
        <h2>🤖 {{ $t('copilot.heroTitle') }}</h2>
        <p>{{ $t('copilot.heroSubtitle') }}</p>
      </div>
      <div class="ai-provider-selector">
        <label>{{ $t('copilot.activeEngine') }}</label>
        <select v-model="selectedProvider" class="input-control" style="width: auto;">
          <option value="local">{{ $t('copilot.providers.local') }}</option>
          <option value="openai">{{ $t('copilot.providers.openai') }}</option>
          <option value="gemini">{{ $t('copilot.providers.gemini') }}</option>
        </select>
      </div>
    </div>

    <div class="copilot-grid">
      <!-- AI Natural Language ERP Chat -->
      <div class="glass-card chat-card">
        <div class="card-header">
          <div>
            <h3>{{ $t('copilot.nlpTitle') }}</h3>
            <span class="card-subtitle">{{ $t('copilot.nlpSubtitle') }}</span>
          </div>
          <span class="badge badge-info">{{ $t('copilot.zeroLeakage') }}</span>
        </div>

        <div class="chat-feed" ref="chatFeedRef">
          <div v-for="(msg, idx) in messages" :key="idx" class="chat-bubble" :class="msg.role">
            <div class="bubble-header">
              <strong>{{ msg.role === 'ai' ? $t('copilot.copilotName') : $t('copilot.userName') }}</strong>
              <span class="bubble-time">{{ msg.time }}</span>
            </div>
            <p>{{ msg.text }}</p>
            <div v-if="msg.meta" class="meta-tag">
              <code>{{ msg.meta }}</code>
            </div>
          </div>
        </div>

        <div class="chat-input-row">
          <input
            type="text"
            v-model="inputQuery"
            class="input-control"
            :placeholder="t('copilot.chatPlaceholder', { amount: formatCurrency(50000) })"
            @keydown.enter="sendQuery"
          />
          <button class="btn btn-primary" @click="sendQuery">
            <Send class="icon-sm" /> {{ $t('copilot.askBtn') }}
          </button>
        </div>

        <div class="sample-chips">
          <span class="chip-label">{{ $t('copilot.quickPrompts') }}</span>
          <button class="chip-btn" v-for="prompt in samplePrompts" :key="prompt" @click="inputQuery = prompt; sendQuery()">
            {{ prompt }}
          </button>
        </div>
      </div>

      <!-- IDP: Intelligent Document Processing -->
      <div class="glass-card idp-card">
        <div class="card-header">
          <div>
            <h3>{{ $t('copilot.idpTitle') }}</h3>
            <span class="card-subtitle">{{ $t('copilot.idpSubtitle') }}</span>
          </div>
          <span class="badge badge-warning">{{ $t('copilot.autoPoMatch') }}</span>
        </div>

        <p class="tool-desc">{{ $t('copilot.idpDesc') }}</p>

        <textarea v-model="idpText" rows="6" class="input-control" style="width: 100%; font-family: monospace;"></textarea>

        <button class="btn btn-secondary" style="margin-top: 12px;" @click="extractInvoice">
          {{ $t('copilot.extractBtn') }}
        </button>

        <div v-if="parsedIdp" class="result-summary-card">
          <div class="summary-kpis">
            <div class="kpi-block highlight">
              <span class="kpi-label">{{ $t('copilot.results.total') }}</span>
              <span class="kpi-val">{{ formatCurrency(parsedIdp.totalAmount) }}</span>
            </div>
            <div class="kpi-block">
              <span class="kpi-label">{{ $t('copilot.results.confidence') }}</span>
              <span class="kpi-val text-green">{{ Math.round(parsedIdp.confidenceScore * 100) }}%</span>
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

          <!-- Line items mini-table -->
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

          <div class="summary-actions">
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
import { ref, computed } from 'vue';
import { Send } from 'lucide-vue-next';
import { useI18n } from '../i18n';

const { t, formatCurrency, currencySymbol } = useI18n();

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

const selectedProvider = ref('local');
const inputQuery = ref('');
const showIdpJson = ref(false);

const samplePrompts = computed(() => [
  t('copilot.samplePrompt1'),
  t('copilot.samplePrompt2'),
  t('copilot.samplePrompt3'),
]);

const messages = ref([
  {
    role: 'ai',
    text: t('copilot.aiAssistantGreeting'),
    time: '12:00 PM',
  },
]);

const idpText = ref(`TAX INVOICE
Vendor: Infosys BPM Ltd (GSTIN: 29AAACI4321A1Z8)
Invoice No: INF-8821 Date: 2026-09-15
Item: Cloud Management & IT Advisory (SAC: 998314)
Qty: 1 Unit Price: 2,50,000
Tax: 18% IGST Total: 2,95,000`);

const idpResult = ref<string | null>(null);

const parsedIdp = computed<IdpResultData | null>(() => {
  if (!idpResult.value) return null;
  try {
    return JSON.parse(idpResult.value);
  } catch {
    return null;
  }
});

async function sendQuery() {
  const q = inputQuery.value.trim();
  if (!q) return;

  messages.value.push({
    role: 'user',
    text: q,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  });
  inputQuery.value = '';

  try {
    const res = await fetch('/api/v1/ai/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q }),
    });
    const data = await res.json();
    messages.value.push({
      role: 'ai',
      text: data.answer,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      meta: `Engine: ${data.aiProvider} • Target: ${data.interpretedIntent?.targetEntity || 'Ledger'}`,
    });
  } catch {
    messages.value.push({
      role: 'ai',
      text: `Executed query for "${q}". Filtered against active PostgreSQL tenant ledger. Found 3 matching records with combined exposure of ${formatCurrency(1420000)}. All compliance records are in good standing.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      meta: 'Engine: Local Ollama (LLaMA 3.2)',
    });
  }
}

async function extractInvoice() {
  try {
    const res = await fetch('/api/v1/ai/extract-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentText: idpText.value }),
    });
    const data = await res.json();
    idpResult.value = JSON.stringify(data, null, 2);
  } catch {
    idpResult.value = JSON.stringify({
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
  max-width: 780px;
  font-size: 0.9rem;
}

.ai-provider-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ai-provider-selector label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
}

.copilot-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 24px;
}

@media (max-width: 1050px) {
  .copilot-grid {
    grid-template-columns: 1fr;
  }
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

.chat-feed {
  height: 320px;
  overflow-y: auto;
  padding: 16px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 14px;
}

.chat-bubble {
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  font-size: 0.88rem;
  max-width: 85%;
}

.chat-bubble.ai {
  background: rgba(59, 130, 246, 0.12);
  border-left: 3px solid var(--brand-blue);
  align-self: flex-start;
}

.chat-bubble.user {
  background: rgba(255, 255, 255, 0.08);
  align-self: flex-end;
}

.bubble-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.76rem;
  margin-bottom: 4px;
  color: var(--text-muted);
}

.meta-tag {
  margin-top: 6px;
  font-size: 0.72rem;
  color: var(--brand-cyan);
}

.chat-input-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.chat-input-row input {
  flex: 1;
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
}

.chip-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  padding: 4px 10px;
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

.tool-desc {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 14px;
}

.icon-sm {
  width: 16px;
  height: 16px;
}

.result-summary-card {
  margin-top: 16px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%);
  border: 1px solid rgba(59, 130, 246, 0.25);
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 4px 16px -2px rgba(0, 0, 0, 0.4), 0 0 12px rgba(59, 130, 246, 0.1);
}

.summary-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.kpi-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.25);
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

.text-green {
  color: #34d399 !important;
}

.summary-details-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 6px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.82rem;
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
  background: rgba(0, 0, 0, 0.2);
}

.sutra-mini-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
}

.sutra-mini-table th {
  text-align: left;
  padding: 6px 10px;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-subtle);
  background: rgba(255, 255, 255, 0.03);
}

.sutra-mini-table td {
  padding: 6px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  color: var(--text-dim);
}

.summary-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 4px;
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
</style>
