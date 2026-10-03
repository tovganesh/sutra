import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  LLMRegistry,
  SutraHeuristicProvider,
  OllamaProvider,
  TextToERPAgent,
  InvoiceExtractorAgent,
} from '../packages/ai-agent/dist/index.js';

describe('Sutra Gen AI Copilot & Sovereign AI Agent Engine', () => {
  describe('1. LLM Registry & Multi-Provider Architecture', () => {
    test('initializes with default provider and lists all registered providers', () => {
      const registry = new LLMRegistry();
      const active = registry.getActiveProvider();
      assert.ok(active);
      assert.equal(active.id, 'heuristic');

      const all = registry.listProviders();
      assert.ok(all.length >= 4);
      assert.ok(all.some((p) => p.id === 'heuristic'));
      assert.ok(all.some((p) => p.id === 'local'));
      assert.ok(all.some((p) => p.id === 'openai'));
      assert.ok(all.some((p) => p.id === 'gemini'));
    });

    test('switches active provider and falls back gracefully on offline providers', async () => {
      const registry = new LLMRegistry();
      registry.setActiveProvider('heuristic');
      assert.equal(registry.getActiveProvider().id, 'heuristic');

      // Test fallback mechanism with offline Ollama provider
      const offlineOllama = new OllamaProvider('http://127.0.0.1:9999', 'llama3.2');
      registry.registerProvider(offlineOllama);
      registry.setActiveProvider(offlineOllama.id);

      const response = await registry.executeWithFallback(async (provider) => {
        return provider.generateText('What is our GST liability?');
      });

      assert.ok(response);
      assert.ok(response.result.length > 0);
      assert.ok(response.usedProvider.includes('Fallback'));
    });
  });

  describe('2. Text-to-ERP Semantic Query Translation (RAG)', () => {
    test('translates tax and compliance queries to compliance_gst intent', async () => {
      const provider = new SutraHeuristicProvider();
      const agent = new TextToERPAgent(provider);

      const res = await agent.translateQuery('What is our total GST output liability for this month?');
      assert.equal(res.targetEntity, 'compliance_gst');
      assert.equal(res.intent, 'aggregate');
      assert.ok(res.explanation);
    });

    test('translates unpaid debt and invoice queries to invoices intent', async () => {
      const provider = new SutraHeuristicProvider();
      const agent = new TextToERPAgent(provider);

      const res = await agent.translateQuery('Show all overdue customer invoices older than 30 days');
      assert.equal(res.targetEntity, 'invoices');
      assert.equal(res.intent, 'select');
    });

    test('translates custom dynamic schemas to custom_record intent', async () => {
      const provider = new SutraHeuristicProvider();
      const agent = new TextToERPAgent(provider);

      const res = await agent.translateQuery('List all registered No-Code schemas and dynamic fields');
      assert.equal(res.targetEntity, 'custom_record');
      assert.equal(res.intent, 'select');
    });

    test('translates warehouse inventory queries to inventory intent', async () => {
      const provider = new SutraHeuristicProvider();
      const agent = new TextToERPAgent(provider);

      const res = await agent.translateQuery('Inspect warehouse stock levels and valuation');
      assert.equal(res.targetEntity, 'inventory');
    });
  });

  describe('3. Intelligent Document Processing (IDP) & GSTIN Checksum Engine', () => {
    test('extracts structured invoice with 15-character GSTIN, line items, and 3-way match readiness', async () => {
      const provider = new SutraHeuristicProvider();
      const extractor = new InvoiceExtractorAgent(provider);

      const rawInvoice = `TAX INVOICE
Vendor: Apex Industrial Supplies Ltd (GSTIN: 27AAACB2212M1Z0)
Invoice No: INV-2026-9041 Date: 2026-09-28
PO Reference: PO-88319-MECH
Item: Heavy Duty Ball Bearings (HSN: 84821011) Qty: 200 Unit Price: 1,250
Taxable Subtotal: 2,50,000
Tax: 18% IGST (45,000)
Total Amount: 2,95,000
Payment Terms: Net 30 Days`;

      const result = await extractor.extract(rawInvoice);
      assert.equal(result.supplierName, 'Apex Industrial Supplies Ltd');
      assert.equal(result.supplierGstin, '27AAACB2212M1Z0');
      assert.equal(result.invoiceNumber, 'INV-2026-9041');
      assert.equal(result.invoiceDate, '2026-09-28');
      assert.equal(result.subtotal, 250000);
      assert.equal(result.taxAmount, 45000);
      assert.equal(result.totalAmount, 295000);
      assert.equal(result.poMatchStatus, 'READY_FOR_3_WAY_MATCH');
      assert.ok(result.confidenceScore >= 0.85);
      assert.ok(result.lineItems.length >= 1);
      assert.equal(result.lineItems[0].hsnSac, '84821011');
      assert.equal(result.lineItems[0].quantity, 200);
    });

    test('validates IT advisory invoice with SAC code and supplier GSTIN', async () => {
      const provider = new SutraHeuristicProvider();
      const extractor = new InvoiceExtractorAgent(provider);

      const rawInvoice = `TAX INVOICE
Vendor: Infosys BPM Ltd (GSTIN: 29AAACI4321A1Z8)
Invoice No: INF-8821 Date: 2026-09-15
PO Reference: PO-2026-IT-004
Item: Cloud Management & IT Advisory (SAC: 998314) Qty: 1 Unit Price: 2,50,000
Taxable Subtotal: 2,50,000
Tax: 18% IGST (45,000)
Total Amount: 2,95,000`;

      const result = await extractor.extract(rawInvoice);
      assert.equal(result.supplierName, 'Infosys BPM Ltd');
      assert.equal(result.supplierGstin, '29AAACI4321A1Z8');
      assert.equal(result.invoiceNumber, 'INF-8821');
      assert.equal(result.lineItems[0].hsnSac, '998314');
      assert.equal(result.totalAmount, 295000);
    });
  });
});
