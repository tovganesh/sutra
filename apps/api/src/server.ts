import express, { Request, Response } from 'express';
import cors from 'cors';
import {
  GSTINValidator,
  IndianTaxEngine,
  EInvoiceService,
  TDSEngine,
} from '@sutra/compliance-india';
import {
  EntitySchemaDefinition,
  EntityValidator,
  FlowEngine,
  WorkflowDefinition,
} from '@sutra/no-code';
import {
  FinancialReportGenerator,
  KPIEvaluator,
  AccountBalance,
} from '@sutra/analytics';
import {
  LLMFactory,
  TextToERPAgent,
  InvoiceExtractorAgent,
} from '@sutra/ai-agent';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// In-Memory dynamic store for demonstration & fallback
const inMemoryEntities: Map<string, EntitySchemaDefinition> = new Map();
const inMemoryRecords: Map<string, Array<Record<string, unknown>>> = new Map();
const inMemoryWorkflows: WorkflowDefinition[] = [];

// Seed an initial dynamic entity: "Enterprise Asset Tracking" (e.g. replacing SAP PM)
const sampleAssetEntity: EntitySchemaDefinition = {
  name: 'Plant & Heavy Machinery',
  slug: 'plant_machinery',
  description: 'Enterprise asset lifecycle and maintenance tracking',
  icon: 'settings',
  fields: [
    { name: 'assetTag', label: 'Asset Serial Tag', type: 'text', required: true },
    { name: 'description', label: 'Machine Description', type: 'text', required: true },
    { name: 'purchaseCost', label: 'Purchase Cost (INR)', type: 'currency', required: true, min: 1000 },
    { name: 'warrantyExpiry', label: 'Warranty Expiration Date', type: 'date', required: true },
    { name: 'operationalStatus', label: 'Operational Status', type: 'select', options: ['ACTIVE', 'MAINTENANCE', 'DECOMMISSIONED'], defaultValue: 'ACTIVE' },
    { name: 'locationSite', label: 'Manufacturing Plant Location', type: 'text', required: true },
  ],
};
inMemoryEntities.set(sampleAssetEntity.slug, sampleAssetEntity);
inMemoryRecords.set(sampleAssetEntity.slug, [
  {
    id: 'asset-001',
    assetTag: 'CNC-MUM-4401',
    description: '5-Axis High Precision CNC Milling Center',
    purchaseCost: 8500000,
    warrantyExpiry: '2028-12-31',
    operationalStatus: 'ACTIVE',
    locationSite: 'Plant 2 - Chakan, Pune, Maharashtra',
  },
  {
    id: 'asset-002',
    assetTag: 'HYD-BLR-1209',
    description: '200-Ton Hydraulic Stamping Press',
    purchaseCost: 4200000,
    warrantyExpiry: '2027-06-30',
    operationalStatus: 'MAINTENANCE',
    locationSite: 'Plant 1 - Peenya, Bengaluru, Karnataka',
  },
]);

// Seed sample chart of accounts balance for instant analytics
const sampleBalances: AccountBalance[] = [
  { accountId: '1', accountCode: '1000', accountName: 'Cash and Bank Equivalents', accountType: 'ASSET', totalDebit: 4500000, totalCredit: 500000, netBalance: 4000000 },
  { accountId: '2', accountCode: '1200', accountName: 'Trade Accounts Receivable', accountType: 'ASSET', totalDebit: 6200000, totalCredit: 1200000, netBalance: 5000000 },
  { accountId: '3', accountCode: '1300', accountName: 'Finished Goods Inventory', accountType: 'ASSET', totalDebit: 3800000, totalCredit: 800000, netBalance: 3000000 },
  { accountId: '4', accountCode: '2000', accountName: 'Trade Accounts Payable', accountType: 'LIABILITY', totalDebit: 1000000, totalCredit: 3500000, netBalance: 2500000 },
  { accountId: '5', accountCode: '2130', accountName: 'Output Tax Payable - IGST/GST', accountType: 'LIABILITY', totalDebit: 500000, totalCredit: 1500000, netBalance: 1000000 },
  { accountId: '6', accountCode: '3000', accountName: 'Equity Capital', accountType: 'EQUITY', totalDebit: 0, totalCredit: 5000000, netBalance: 5000000 },
  { accountId: '7', accountCode: '4000', accountName: 'Product & Cloud Revenue', accountType: 'REVENUE', totalDebit: 0, totalCredit: 12000000, netBalance: 12000000 },
  { accountId: '8', accountCode: '5000', accountName: 'Cost of Goods Sold (COGS)', accountType: 'EXPENSE', totalDebit: 4800000, totalCredit: 0, netBalance: 4800000 },
  { accountId: '9', accountCode: '5100', accountName: 'Salaries & Staff Benefits', accountType: 'EXPENSE', totalDebit: 3200000, totalCredit: 0, netBalance: 3200000 },
  { accountId: '10', accountCode: '5200', accountName: 'Cloud Infrastructure & Facilities', accountType: 'EXPENSE', totalDebit: 500000, totalCredit: 0, netBalance: 500000 },
];

// Initialize Gen AI Provider
const aiProvider = LLMFactory.createProvider({
  provider: process.env.AI_PROVIDER || 'local',
  endpoint: process.env.AI_LOCAL_ENDPOINT || 'http://localhost:11434',
  apiKey: process.env.OPENAI_API_KEY,
});
const textToERPAgent = new TextToERPAgent(aiProvider);
const invoiceExtractorAgent = new InvoiceExtractorAgent(aiProvider);

// =================================================================
// 1. Health & Platform Status
// =================================================================
app.get('/api/v1/health', (req: Request, res: Response) => {
  res.json({
    status: 'HEALTHY',
    system: 'Sutra - The Open Enterprise Operating System',
    version: '0.1.0-alpha',
    jurisdiction: 'IN (India First, World Configurable)',
    license: 'Apache-2.0',
    timestamp: new Date().toISOString(),
    components: {
      apiGateway: 'ONLINE',
      complianceEngine: 'READY (GST, E-Invoice, TDS)',
      noCodeStudio: 'READY',
      analyticsEngine: 'ONLINE',
      genAICore: {
        provider: aiProvider.name,
        status: 'READY',
      },
    },
  });
});

// =================================================================
// 2. India-First Compliance Endpoints (GST, E-Invoice, TDS)
// =================================================================
app.post('/api/v1/compliance/gst/validate-gstin', (req: Request, res: Response) => {
  const { gstin } = req.body;
  if (!gstin) {
    return res.status(400).json({ error: 'GSTIN is required' });
  }
  const result = GSTINValidator.validate(gstin);
  res.json(result);
});

app.post('/api/v1/compliance/gst/calculate-tax', (req: Request, res: Response) => {
  const { supplierGstin, recipientGstin, placeOfSupplyStateCode, hsnSacCode, taxableAmount, customTaxRate } = req.body;
  if (!supplierGstin || !placeOfSupplyStateCode || taxableAmount === undefined) {
    return res.status(400).json({ error: 'Missing mandatory tax calculation parameters' });
  }

  const breakdown = IndianTaxEngine.calculate({
    supplierGstin,
    recipientGstin,
    placeOfSupplyStateCode,
    hsnSacCode: hsnSacCode || '998313',
    taxableAmount: Number(taxableAmount),
    customTaxRate: customTaxRate ? Number(customTaxRate) : undefined,
  });

  res.json(breakdown);
});

app.post('/api/v1/compliance/einvoice/generate', (req: Request, res: Response) => {
  const { supplierGstin, buyerGstin, financialYear, docNo, docDate, totalValue, itemCount } = req.body;
  if (!supplierGstin || !buyerGstin || !docNo) {
    return res.status(400).json({ error: 'Missing e-invoice generation details' });
  }

  const fy = financialYear || '2026-27';
  const irn = EInvoiceService.generateIRN(supplierGstin, fy, 'INV', docNo);
  const qrBase64 = EInvoiceService.generateQRPayload(
    irn,
    supplierGstin,
    buyerGstin,
    docNo,
    docDate || new Date().toISOString().split('T')[0],
    Number(totalValue) || 100000,
    Number(itemCount) || 1
  );

  res.json({
    irn,
    ackNo: `ACK${Date.now()}`,
    ackDate: new Date().toISOString(),
    qrCodeSignedPayload: qrBase64,
    status: 'GENERATED_NIC_COMPLIANT',
  });
});

app.post('/api/v1/compliance/tds/calculate', (req: Request, res: Response) => {
  const { sectionKey, grossAmount, isCompanyOrFirm, hasValidPan, cumulativeFYAmount } = req.body;
  if (!sectionKey || grossAmount === undefined) {
    return res.status(400).json({ error: 'Section key and gross amount are required' });
  }

  const result = TDSEngine.calculate({
    sectionKey,
    grossAmount: Number(grossAmount),
    isCompanyOrFirm: Boolean(isCompanyOrFirm),
    hasValidPan: hasValidPan !== undefined ? Boolean(hasValidPan) : true,
    cumulativeFYAmount: cumulativeFYAmount ? Number(cumulativeFYAmount) : 0,
  });

  res.json(result);
});

// =================================================================
// 3. No-Code Dynamic Entity Modeler & Studio Records
// =================================================================
app.get('/api/v1/nocode/schemas', (req: Request, res: Response) => {
  res.json(Array.from(inMemoryEntities.values()));
});

app.post('/api/v1/nocode/schemas', (req: Request, res: Response) => {
  const schema: EntitySchemaDefinition = req.body;
  if (!schema.name || !schema.slug || !schema.fields) {
    return res.status(400).json({ error: 'Invalid schema definition format' });
  }

  inMemoryEntities.set(schema.slug, schema);
  if (!inMemoryRecords.has(schema.slug)) {
    inMemoryRecords.set(schema.slug, []);
  }

  res.status(201).json({ message: 'Dynamic entity created successfully', schema });
});

app.get('/api/v1/nocode/records/:slug', (req: Request, res: Response) => {
  const slug = req.params.slug as string;
  const records = inMemoryRecords.get(slug) || [];
  res.json({ entitySlug: slug, count: records.length, records });
});

app.post('/api/v1/nocode/records/:slug', async (req: Request, res: Response) => {
  const slug = req.params.slug as string;
  const schema = inMemoryEntities.get(slug);

  if (!schema) {
    return res.status(404).json({ error: `Dynamic entity '${slug}' not found` });
  }

  const recordData = req.body;
  const validation = EntityValidator.validateRecord(schema, recordData);

  if (!validation.valid) {
    return res.status(422).json({ error: 'Record failed schema validation', issues: validation.issues });
  }

  const newRecord = {
    id: `rec-${Date.now()}`,
    ...recordData,
    createdAt: new Date().toISOString(),
  };

  const records = inMemoryRecords.get(slug) || [];
  records.push(newRecord);
  inMemoryRecords.set(slug, records);

  res.status(201).json({ message: 'Record saved successfully', record: newRecord });
});

// =================================================================
// 4. Analytics & Financial Statements Engine
// =================================================================
app.get('/api/v1/analytics/kpis', (req: Request, res: Response) => {
  const kpis = KPIEvaluator.evaluate({
    accountsReceivable: 5000000,
    annualCreditSales: 12000000,
    daysInPeriod: 365,
    currentAssets: 12000000,
    currentLiabilities: 3500000,
    inventoryValue: 3000000,
    grossProfit: 7200000,
    netProfit: 3500000,
    totalRevenue: 12000000,
  });

  res.json({
    asOf: new Date().toISOString(),
    currency: 'INR',
    kpis,
  });
});

app.get('/api/v1/analytics/pnl', (req: Request, res: Response) => {
  const pnl = FinancialReportGenerator.generateProfitAndLoss(
    sampleBalances,
    '2026-04-01',
    '2027-03-31'
  );
  res.json(pnl);
});

app.get('/api/v1/analytics/balance-sheet', (req: Request, res: Response) => {
  const bs = FinancialReportGenerator.generateBalanceSheet(
    sampleBalances,
    '2026-09-28',
    3500000 // Retained earnings adjustment
  );
  res.json(bs);
});

// =================================================================
// 5. Gen AI Enterprise Copilot
// =================================================================
app.post('/api/v1/ai/query', async (req: Request, res: Response) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'Prompt/question is required' });
  }

  try {
    const structuredQuery = await textToERPAgent.translateQuery(question);

    // Provide intelligent simulated enterprise response based on intent
    const responsePayload = {
      query: question,
      interpretedIntent: structuredQuery,
      aiProvider: aiProvider.name,
      answer: `Found matching records for intent '${structuredQuery.intent}' on entity '${structuredQuery.targetEntity}'. ${structuredQuery.explanation}`,
      suggestedAction: 'View matching transactions in Sutra Ledger console.',
      timestamp: new Date().toISOString(),
    };

    res.json(responsePayload);
  } catch (err: any) {
    res.status(500).json({ error: 'AI interpretation failed', message: err.message });
  }
});

app.post('/api/v1/ai/extract-invoice', async (req: Request, res: Response) => {
  const { documentText } = req.body;
  if (!documentText) {
    return res.status(400).json({ error: 'Raw document text or OCR is required' });
  }

  try {
    const extracted = await invoiceExtractorAgent.extract(documentText);
    res.json(extracted);
  } catch (err: any) {
    res.status(500).json({ error: 'IDP Invoice extraction failed', message: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`=================================================================`);
  console.log(`🚀 Sutra - The Open Enterprise Operating System`);
  console.log(`🌐 API Gateway listening on port ${PORT}`);
  console.log(`🇮🇳 Built for India First (GST, E-Invoice, TDS), Configurable for World`);
  console.log(`🤖 AI Engine: ${aiProvider.name}`);
  console.log(`=================================================================`);
});
