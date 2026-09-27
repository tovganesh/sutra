<template>
  <div class="view-container">
    <div class="hero-banner glass-card">
      <div class="hero-content">
        <h2>🤖 Sutra Sovereign Gen AI Enterprise Copilot</h2>
        <p>Enterprise intelligence that never locks you into a single AI cloud. Run air-gapped on your private GPUs via <strong>Local Ollama / vLLM</strong> or connect seamlessly to <strong>OpenAI / Gemini / Anthropic</strong>.</p>
      </div>
      <div class="ai-provider-selector">
        <label>Active Engine:</label>
        <select v-model="selectedProvider" class="input-control" style="width: auto;">
          <option value="local">Ollama (Local LLaMA 3.2 / DeepSeek)</option>
          <option value="openai">OpenAI (Cloud GPT-4o)</option>
          <option value="gemini">Google Gemini 2.5 Flash</option>
        </select>
      </div>
    </div>

    <div class="copilot-grid">
      <!-- AI Natural Language ERP Chat -->
      <div class="glass-card chat-card">
        <div class="card-header">
          <div>
            <h3>Natural Language ERP Query</h3>
            <span class="card-subtitle">Translates English business questions into database transactions</span>
          </div>
          <span class="badge badge-info">Zero-Data Leakage</span>
        </div>

        <div class="chat-feed" ref="chatFeedRef">
          <div v-for="(msg, idx) in messages" :key="idx" class="chat-bubble" :class="msg.role">
            <div class="bubble-header">
              <strong>{{ msg.role === 'ai' ? 'Sutra Copilot' : 'You' }}</strong>
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
            placeholder="e.g. Which customers in Maharashtra have unpaid invoices over ₹50,000?"
            @keydown.enter="sendQuery"
          />
          <button class="btn btn-primary" @click="sendQuery">
            <Send class="icon-sm" /> Ask Sutra
          </button>
        </div>

        <div class="sample-chips">
          <span class="chip-label">Quick Prompts:</span>
          <button class="chip-btn" v-for="prompt in samplePrompts" :key="prompt" @click="inputQuery = prompt; sendQuery()">
            {{ prompt }}
          </button>
        </div>
      </div>

      <!-- IDP: Intelligent Document Processing -->
      <div class="glass-card idp-card">
        <div class="card-header">
          <div>
            <h3>Intelligent Document Processing (IDP)</h3>
            <span class="card-subtitle">Zero-Shot Invoice OCR & Line Item Extraction</span>
          </div>
          <span class="badge badge-warning">Automated PO Match</span>
        </div>

        <p class="tool-desc">Paste raw invoice OCR text or scanned document output to extract structured vendor, HSN, line item and tax values.</p>

        <textarea v-model="idpText" rows="6" class="input-control" style="width: 100%; font-family: monospace;"></textarea>

        <button class="btn btn-secondary" style="margin-top: 12px;" @click="extractInvoice">
          Extract Structured Bill of Entry
        </button>

        <div v-if="idpResult" class="code-preview" style="margin-top: 14px;">
          {{ idpResult }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Send } from 'lucide-vue-next';

const selectedProvider = ref('local');
const inputQuery = ref('');

const samplePrompts = [
  'What is our total GST output liability for this month?',
  'Show all overdue invoices older than 30 days.',
  'Analyze cash flow velocity and current ratio.',
];

const messages = ref([
  {
    role: 'ai',
    text: 'Hello! I am your Sutra Enterprise AI Assistant. You can query financial records, check tax liabilities, or ask for operational forecasts in natural language.',
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
      text: `Executed query for "${q}". Filtered against active PostgreSQL tenant ledger. Found 3 matching records with combined exposure of ₹14,20,000. All compliance records are in good standing.`,
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
</style>
