import express, { Request, Response } from 'express';
import cors from 'cors';
import {
  AuthPluginRegistry,
  LocalJwtAuthProvider,
  OidcAuthProvider,
  SamlAuthProvider,
  createAuthMiddleware,
  requirePermission,
  GeneralLedgerEngine,
  ValkeyQueueService,
  InventoryEngine,
  OrderToCashEngine,
  ProcureToPayEngine,
  SubledgerEngine,
  ManufacturingEngine,
  FixedAssetEngine,
  QualityEngine,
  ControllingEngine,
  HttpStatus,
} from '@sutra/core';
import {
  GSTINValidator,
  IndianTaxEngine,
  EInvoiceService,
  TDSEngine,
  GSTR1Generator,
  GSTR3BEngine,
  EWayBillGenerator,
  IndianPayrollEngine,
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

// =================================================================
// 0. Pluggable Enterprise Authentication System
// =================================================================
const authRegistry = new AuthPluginRegistry();

// 1. Built-in Local JWT Auth Provider (Default)
const jwtProvider = new LocalJwtAuthProvider({
  secretKey: process.env.JWT_SECRET || 'sutra-enterprise-super-secure-jwt-secret-replace-in-production',
  issuer: 'sutra-enterprise-os',
  tokenExpirationSeconds: 86400, // 24 hours
});
authRegistry.registerProvider(jwtProvider);
authRegistry.setDefaultProvider('local-jwt');

// 2. Enterprise OIDC Plugin (Okta / Azure AD / Keycloak)
const oidcProvider = new OidcAuthProvider({
  id: 'azure-ad-oidc',
  name: 'Microsoft Entra ID (Azure AD)',
  issuerUrl: process.env.OIDC_ISSUER_URL || 'https://login.microsoftonline.com/common/v2.0',
  clientId: process.env.OIDC_CLIENT_ID || 'sutra-enterprise-client-id',
  clientSecret: process.env.OIDC_CLIENT_SECRET || 'sutra-enterprise-secret',
  redirectUri: process.env.OIDC_REDIRECT_URI || 'http://localhost:3000/auth/callback',
});
authRegistry.registerProvider(oidcProvider);

// 3. Enterprise SAML 2.0 Plugin (ADFS / Okta SAML)
const samlProvider = new SamlAuthProvider({
  id: 'okta-saml',
  name: 'Okta Enterprise SAML 2.0',
  entryPointUrl: process.env.SAML_ENTRY_POINT || 'https://enterprise.okta.com/app/sutra/sso/saml',
  issuer: 'urn:sutra:enterprise:sp',
  cert: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...',
  callbackUrl: 'http://localhost:4000/api/v1/auth/saml/callback',
});
authRegistry.registerProvider(samlProvider);

const authMiddleware = createAuthMiddleware(authRegistry);


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

// Enterprise Engines (SAP Core Equivalents)
const inventoryEngine = new InventoryEngine();
const orderToCashEngine = new OrderToCashEngine(inventoryEngine);
const procureToPayEngine = new ProcureToPayEngine(inventoryEngine);
const subledgerEngine = new SubledgerEngine();
const manufacturingEngine = new ManufacturingEngine(inventoryEngine);
const fixedAssetEngine = new FixedAssetEngine();
const qualityEngine = new QualityEngine(inventoryEngine);
const controllingEngine = new ControllingEngine();

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
      authSystem: {
        status: 'ONLINE',
        defaultProvider: authRegistry.getDefaultProvider().name,
        plugins: authRegistry.listProviders().map((p) => ({ id: p.id, name: p.name, type: p.type })),
      },
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
// 2. Pluggable Enterprise Authentication Endpoints (JWT, OIDC, SAML)
// =================================================================

// 2.1 List All Available Auth Provider Plugins
app.get('/api/v1/auth/providers', (req: Request, res: Response) => {
  res.json({
    defaultProvider: authRegistry.getDefaultProvider().id,
    providers: authRegistry.listProviders(),
  });
});

// 2.2 User Login (Supports standard JWT credentials or dispatching to third-party provider)
app.post('/api/v1/auth/login', async (req: Request, res: Response) => {
  const { email, password, tenantId, providerId } = req.body;

  try {
    const result = await authRegistry.authenticate(
      {
        email,
        password,
        tenantId: tenantId || '00000000-0000-0000-0000-000000000001',
      },
      providerId
    );

    if (!result.success) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        error: 'AuthenticationFailed',
        message: result.errorMessage || 'Invalid credentials',
        provider: result.provider,
      });
    }

    res.json({
      message: 'Authentication successful',
      provider: result.provider,
      providerId: result.providerId,
      user: {
        id: result.user?.userId,
        tenantId: result.user?.tenantId,
        email: result.user?.email,
        fullName: result.user?.fullName,
        isSuperAdmin: result.user?.isSuperAdmin,
        roles: result.user?.roles,
        permissions: result.user ? Array.from(result.user.permissions) : [],
        attributes: result.user?.attributes,
      },
      tokens: result.tokens,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'InternalAuthError', message: msg });
  }
});

// 2.3 Get Current Authenticated User Profile (Protected by JWT Auth Middleware)
app.get('/api/v1/auth/me', authMiddleware, (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(HttpStatus.UNAUTHORIZED).json({ error: 'Unauthorized', message: 'No active session' });
  }

  res.json({
    user: {
      id: req.user.userId,
      tenantId: req.user.tenantId,
      email: req.user.email,
      fullName: req.user.fullName,
      isSuperAdmin: req.user.isSuperAdmin,
      roles: req.user.roles,
      permissions: Array.from(req.user.permissions),
      attributes: req.user.attributes,
    },
  });
});

// 2.4 Refresh JWT Access Token
app.post('/api/v1/auth/refresh', async (req: Request, res: Response) => {
  const { refreshToken, providerId } = req.body;
  if (!refreshToken) {
    return res.status(HttpStatus.BAD_REQUEST).json({ error: 'Missing refreshToken in request body' });
  }

  const provider = providerId ? authRegistry.getProvider(providerId) : authRegistry.getDefaultProvider();
  if (!provider || !provider.refreshToken) {
    return res.status(HttpStatus.BAD_REQUEST).json({ error: 'Selected provider does not support token refresh' });
  }

  try {
    const newTokens = await provider.refreshToken(refreshToken);
    res.json({ tokens: newTokens });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Token refresh failed';
    res.status(HttpStatus.UNAUTHORIZED).json({ error: 'InvalidRefreshToken', message: msg });
  }
});

// 2.5 Generate SSO Redirection URL for Third-Party Identity Providers (OIDC / SAML)
app.get('/api/v1/auth/sso/login-url', async (req: Request, res: Response) => {
  const providerId = (req.query.providerId as string) || 'azure-ad-oidc';
  const provider = authRegistry.getProvider(providerId);

  if (!provider) {
    return res.status(HttpStatus.NOT_FOUND).json({ error: `Auth provider '${providerId}' not found` });
  }

  if (!provider.getLoginUrl) {
    return res.status(HttpStatus.BAD_REQUEST).json({ error: `Provider '${providerId}' does not support SSO redirection` });
  }

  try {
    const url = await provider.getLoginUrl();
    res.json({ providerId, redirectUrl: url });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'SSOUrlGenerationFailed', message: msg });
  }
});

// 2.6 Tenant Auth Provider Override (Enterprise Multi-Tenant Policy)
app.post('/api/v1/auth/tenants/:tenantId/provider', (req: Request, res: Response) => {
  const tenantId = req.params.tenantId as string;
  const { providerId } = req.body;

  if (!providerId) {
    return res.status(HttpStatus.BAD_REQUEST).json({ error: 'providerId is required' });
  }

  try {
    authRegistry.setTenantProvider(tenantId, providerId);
    res.json({
      message: `Tenant '${tenantId}' authentication strategy updated to '${providerId}'`,
      tenantId,
      activeProvider: providerId,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(HttpStatus.BAD_REQUEST).json({ error: 'FailedToSetTenantProvider', message: msg });
  }
});


// =================================================================
// 2. India-First Compliance Endpoints (GST, E-Invoice, TDS)
// =================================================================
app.post('/api/v1/compliance/gst/validate-gstin', (req: Request, res: Response) => {
  const { gstin } = req.body;
  if (!gstin) {
    return res.status(HttpStatus.BAD_REQUEST).json({ error: 'GSTIN is required' });
  }
  const result = GSTINValidator.validate(gstin);
  res.json(result);
});

app.post('/api/v1/compliance/gst/calculate-tax', (req: Request, res: Response) => {
  const { supplierGstin, recipientGstin, placeOfSupplyStateCode, hsnSacCode, taxableAmount, customTaxRate } = req.body;
  if (!supplierGstin || !placeOfSupplyStateCode || taxableAmount === undefined) {
    return res.status(HttpStatus.BAD_REQUEST).json({ error: 'Missing mandatory tax calculation parameters' });
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
    return res.status(HttpStatus.BAD_REQUEST).json({ error: 'Missing e-invoice generation details' });
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
    return res.status(HttpStatus.BAD_REQUEST).json({ error: 'Section key and gross amount are required' });
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

app.post('/api/v1/compliance/gstr1/generate', (req: Request, res: Response) => {
  const { supplierGstin, period, invoices } = req.body;
  if (!supplierGstin || !invoices || !Array.isArray(invoices)) {
    return res.status(HttpStatus.BAD_REQUEST).json({ error: 'supplierGstin and invoices array are required' });
  }

  const payload = GSTR1Generator.generate(
    supplierGstin,
    period || '092026',
    invoices
  );
  res.json(payload);
});

app.post('/api/v1/compliance/gstr3b/summary', (req: Request, res: Response) => {
  const input = req.body;
  if (!input.gstin || !input.outwardTaxableSupplies || !input.itcAvailable) {
    return res.status(HttpStatus.BAD_REQUEST).json({ error: 'Missing mandatory GSTR-3B return parameters' });
  }

  const summary = GSTR3BEngine.computeSummary({
    gstin: input.gstin,
    returnPeriod: input.returnPeriod || '092026',
    outwardTaxableSupplies: input.outwardTaxableSupplies,
    outwardZeroRatedSupplies: input.outwardZeroRatedSupplies,
    inwardSuppliesReverseCharge: input.inwardSuppliesReverseCharge,
    itcAvailable: input.itcAvailable,
    itcReversed: input.itcReversed,
  });

  res.json(summary);
});

app.post('/api/v1/compliance/ewaybill/generate', (req: Request, res: Response) => {
  const input = req.body;
  if (!input.docNo || !input.fromGstin || !input.toGstin || !input.totalValue) {
    return res.status(HttpStatus.BAD_REQUEST).json({ error: 'Missing mandatory E-Way bill parameters' });
  }

  const payload = EWayBillGenerator.generatePayload(input);
  const validityDays = EWayBillGenerator.calculateValidityDays(input.approximateDistanceKm || 150);

  res.json({
    ewbNumber: `EWB${Date.now()}`,
    generatedAt: new Date().toISOString(),
    validUntilDays: validityDays,
    payload,
  });
});

app.post('/api/v1/compliance/payroll/calculate', (req: Request, res: Response) => {
  const { basicSalary, dearnessAllowance, hra, specialAllowance, stateCode, gender, monthNumber, optHigherPF } = req.body;
  if (basicSalary === undefined || !stateCode) {
    return res.status(HttpStatus.BAD_REQUEST).json({ error: 'basicSalary and stateCode are required' });
  }

  const breakdown = IndianPayrollEngine.calculate({
    basicSalary: Number(basicSalary),
    dearnessAllowance: Number(dearnessAllowance || 0),
    hra: Number(hra || 0),
    specialAllowance: Number(specialAllowance || 0),
    stateCode,
    gender: gender || 'M',
    monthNumber: Number(monthNumber || 1),
    optHigherPF: Boolean(optHigherPF),
  });

  res.json(breakdown);
});

// =================================================================
// 3. General Ledger & Double-Entry Posting Engine (SAP FI/CO)
// =================================================================
app.post('/api/v1/ledger/post', (req: Request, res: Response) => {
  const { tenantId, entryNumber, postingDate, reference, narration, lines } = req.body;

  if (!entryNumber || !lines || !Array.isArray(lines)) {
    return res.status(HttpStatus.BAD_REQUEST).json({ error: 'entryNumber and lines array are required' });
  }

  const result = GeneralLedgerEngine.postJournalEntry({
    tenantId: tenantId || '00000000-0000-0000-0000-000000000001',
    entryNumber,
    postingDate: postingDate || new Date().toISOString().split('T')[0],
    reference,
    narration,
    lines,
  });

  if (!result.success) {
    return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
      error: 'DoubleEntryValidationError',
      reason: result.rejectionReason,
      result,
    });
  }

  res.status(HttpStatus.CREATED).json({
    message: 'Journal entry successfully posted to General Ledger',
    result,
  });
});

// =================================================================
// 2.5 Subledger Engine & Working Capital (SAP FI-AR / FI-AP)
// =================================================================
app.get('/api/v1/ledger/aging', (req: Request, res: Response) => {
  const report = subledgerEngine.generateAgingReport();
  res.json(report);
});

// =================================================================
// 2.6 Materials Management & Inventory Engine (SAP MM)
// =================================================================
app.get('/api/v1/inventory/materials', (req: Request, res: Response) => {
  res.json(inventoryEngine.getAllMaterials());
});

app.post('/api/v1/inventory/materials', (req: Request, res: Response) => {
  const material = req.body;
  if (!material.sku || !material.name || !material.materialType) {
    return res.status(HttpStatus.BAD_REQUEST).json({ error: 'sku, name, and materialType are required' });
  }
  inventoryEngine.registerMaterial({
    ...material,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  res.status(HttpStatus.CREATED).json({ message: 'Material registered in Material Master', material });
});

app.get('/api/v1/inventory/stock', (req: Request, res: Response) => {
  res.json(inventoryEngine.getStockLocations());
});

app.post('/api/v1/inventory/movements', (req: Request, res: Response) => {
  const input = req.body;
  if (!input.movementType || !input.sku || !input.quantity) {
    return res.status(HttpStatus.BAD_REQUEST).json({ error: 'movementType, sku, and quantity are required' });
  }

  try {
    const result = inventoryEngine.executeStockMovement({
      movementType: input.movementType,
      sku: input.sku,
      quantity: Number(input.quantity),
      unitCost: input.unitCost !== undefined ? Number(input.unitCost) : undefined,
      fromPlant: input.fromPlant,
      fromStorageLocation: input.fromStorageLocation,
      toPlant: input.toPlant,
      toStorageLocation: input.toStorageLocation,
      referenceDocument: input.referenceDocument,
      costCenter: input.costCenter,
      performedBy: input.performedBy,
    });
    res.status(HttpStatus.CREATED).json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Inventory movement failed';
    res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'InventoryMovementError', message: msg });
  }
});

// =================================================================
// 2.7 Sales & Distribution / Order-to-Cash (SAP SD / O2C)
// =================================================================
app.get('/api/v1/sales/customers', (req: Request, res: Response) => {
  res.json(orderToCashEngine.getAllCustomers());
});

app.post('/api/v1/sales/orders', (req: Request, res: Response) => {
  const input = req.body;
  if (!input.orderNumber || !input.customerId || !input.items || !Array.isArray(input.items)) {
    return res.status(HttpStatus.BAD_REQUEST).json({ error: 'orderNumber, customerId, and items are required' });
  }

  try {
    const order = orderToCashEngine.createSalesOrder({
      tenantId: input.tenantId || '00000000-0000-0000-0000-000000000001',
      orderNumber: input.orderNumber,
      customerId: input.customerId,
      supplierGstin: input.supplierGstin || '27AABCS1429B1ZB',
      supplierStateCode: input.supplierStateCode || '27',
      items: input.items,
      deliveryAddress: input.deliveryAddress || 'Default Warehouse Delivery Address',
    });

    if (order.status === 'REJECTED') {
      return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'SalesOrderRejected', reason: order.rejectionReason, order });
    }

    res.status(HttpStatus.CREATED).json(order);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Order creation failed';
    res.status(HttpStatus.BAD_REQUEST).json({ error: 'SalesOrderError', message: msg });
  }
});

app.post('/api/v1/sales/deliveries', (req: Request, res: Response) => {
  const { orderNumber } = req.body;
  if (!orderNumber) {
    return res.status(HttpStatus.BAD_REQUEST).json({ error: 'orderNumber is required' });
  }

  try {
    const pgi = orderToCashEngine.postGoodsIssue(orderNumber);
    res.status(HttpStatus.CREATED).json(pgi);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Post goods issue failed';
    res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'PostGoodsIssueError', message: msg });
  }
});

app.post('/api/v1/sales/invoices', (req: Request, res: Response) => {
  const { tenantId, orderNumber } = req.body;
  if (!orderNumber) {
    return res.status(HttpStatus.BAD_REQUEST).json({ error: 'orderNumber is required' });
  }

  try {
    const invoice = orderToCashEngine.generateBillingInvoice(
      tenantId || '00000000-0000-0000-0000-000000000001',
      orderNumber
    );
    res.status(HttpStatus.CREATED).json(invoice);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Billing invoice generation failed';
    res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'BillingInvoiceError', message: msg });
  }
});

// =================================================================
// 2.8 Procure-to-Pay Engine (SAP MM / P2P)
// =================================================================
app.get('/api/v1/procurement/vendors', (req: Request, res: Response) => {
  res.json(procureToPayEngine.getAllVendors());
});

app.post('/api/v1/procurement/orders', (req: Request, res: Response) => {
  const input = req.body;
  if (!input.poNumber || !input.vendorId || !input.items || !Array.isArray(input.items)) {
    return res.status(HttpStatus.BAD_REQUEST).json({ error: 'poNumber, vendorId, and items are required' });
  }

  try {
    const po = procureToPayEngine.createPurchaseOrder({
      tenantId: input.tenantId || '00000000-0000-0000-0000-000000000001',
      poNumber: input.poNumber,
      vendorId: input.vendorId,
      supplierStateCode: input.supplierStateCode || '27',
      items: input.items,
      deliveryPlant: input.deliveryPlant || 'PLANT-1000',
    });
    res.status(HttpStatus.CREATED).json(po);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'PO creation failed';
    res.status(HttpStatus.BAD_REQUEST).json({ error: 'PurchaseOrderError', message: msg });
  }
});

app.post('/api/v1/procurement/grn', (req: Request, res: Response) => {
  const { poNumber, grnNumber } = req.body;
  if (!poNumber || !grnNumber) {
    return res.status(HttpStatus.BAD_REQUEST).json({ error: 'poNumber and grnNumber are required' });
  }

  try {
    const grn = procureToPayEngine.processGoodsReceipt(poNumber, grnNumber);
    res.status(HttpStatus.CREATED).json(grn);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Goods receipt failed';
    res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'GoodsReceiptError', message: msg });
  }
});

app.post('/api/v1/procurement/verify-invoice', (req: Request, res: Response) => {
  const input = req.body;
  if (!input.poNumber || !input.grnNumber || !input.vendorInvoiceNumber || !input.invoicedItems) {
    return res.status(HttpStatus.BAD_REQUEST).json({ error: 'poNumber, grnNumber, vendorInvoiceNumber, and invoicedItems are required' });
  }

  try {
    const verification = procureToPayEngine.verifyVendorInvoice({
      tenantId: input.tenantId || '00000000-0000-0000-0000-000000000001',
      vendorInvoiceNumber: input.vendorInvoiceNumber,
      poNumber: input.poNumber,
      grnNumber: input.grnNumber,
      invoiceDate: input.invoiceDate || new Date().toISOString().split('T')[0],
      invoicedItems: input.invoicedItems,
      applyTdsSection: input.applyTdsSection,
    });
    res.status(HttpStatus.CREATED).json(verification);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Vendor invoice verification failed';
    res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'InvoiceVerificationError', message: msg });
  }
});

// =================================================================
// 2.9 Production Planning & Manufacturing (SAP PP)
// =================================================================
app.get('/api/v1/manufacturing/boms', (req: Request, res: Response) => {
  res.json(manufacturingEngine.getAllBoms());
});

app.get('/api/v1/manufacturing/work-centers', (req: Request, res: Response) => {
  res.json(manufacturingEngine.getWorkCenters());
});

app.get('/api/v1/manufacturing/orders', (req: Request, res: Response) => {
  res.json(manufacturingEngine.getAllProductionOrders());
});

app.post('/api/v1/manufacturing/orders', (req: Request, res: Response) => {
  const input = req.body;
  if (!input.orderNumber || !input.targetSku || !input.targetQuantity) {
    return res.status(HttpStatus.BAD_REQUEST).json({ error: 'orderNumber, targetSku, and targetQuantity are required' });
  }

  try {
    const order = manufacturingEngine.planProductionOrder({
      tenantId: input.tenantId || '00000000-0000-0000-0000-000000000001',
      orderNumber: input.orderNumber,
      targetSku: input.targetSku,
      targetQuantity: Number(input.targetQuantity),
      plantId: input.plantId || 'PLANT-1000',
      startDate: input.startDate || new Date().toISOString().split('T')[0],
      targetCompletionDate: input.targetCompletionDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    });
    res.status(HttpStatus.CREATED).json(order);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Production planning failed';
    res.status(HttpStatus.BAD_REQUEST).json({ error: 'ProductionPlanningError', message: msg });
  }
});

app.post('/api/v1/manufacturing/confirm', (req: Request, res: Response) => {
  const { tenantId, orderNumber, quantityCompleted } = req.body;
  if (!orderNumber || !quantityCompleted) {
    return res.status(HttpStatus.BAD_REQUEST).json({ error: 'orderNumber and quantityCompleted are required' });
  }

  try {
    const confirmation = manufacturingEngine.confirmProductionOrder(
      tenantId || '00000000-0000-0000-0000-000000000001',
      orderNumber,
      Number(quantityCompleted)
    );
    res.status(HttpStatus.CREATED).json(confirmation);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Production confirmation failed';
    res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'ProductionConfirmationError', message: msg });
  }
});

// =================================================================
// 2.10 Fixed Asset Accounting (SAP FI-AA)
// =================================================================
app.get('/api/v1/assets', (req: Request, res: Response) => {
  res.json(fixedAssetEngine.getAllAssets());
});

app.post('/api/v1/assets', (req: Request, res: Response) => {
  const asset = req.body;
  if (!asset.assetId || !asset.name || !asset.assetClass || !asset.originalCost) {
    return res.status(HttpStatus.BAD_REQUEST).json({ error: 'assetId, name, assetClass, and originalCost are required' });
  }

  fixedAssetEngine.registerAsset({
    ...asset,
    status: asset.status || 'ACTIVE',
  });
  res.status(HttpStatus.CREATED).json({ message: 'Asset registered in Asset Master', asset });
});

app.post('/api/v1/assets/depreciation-run', (req: Request, res: Response) => {
  const { tenantId, period } = req.body;
  const targetPeriod = period || new Date().toISOString().slice(0, 7); // YYYY-MM

  try {
    const result = fixedAssetEngine.executeMonthlyDepreciationRun(
      tenantId || '00000000-0000-0000-0000-000000000001',
      targetPeriod
    );
    res.status(HttpStatus.CREATED).json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Depreciation run failed';
    res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'DepreciationRunError', message: msg });
  }
});

// =================================================================
// 2.11 Quality Management & Batch Traceability (SAP QM)
// =================================================================
app.get('/api/v1/quality/lots', (req: Request, res: Response) => {
  res.json(qualityEngine.getAllInspectionLots());
});

app.get('/api/v1/quality/lots/:lotId', (req: Request, res: Response) => {
  const lotId = String(req.params.lotId);
  const lot = qualityEngine.getInspectionLot(lotId);
  if (!lot) return res.status(HttpStatus.NOT_FOUND).json({ error: 'InspectionLotNotFound' });
  res.json(lot);
});

app.post('/api/v1/quality/lots', (req: Request, res: Response) => {
  const { origin, materialSku, batchNumber, quantity, baseUom, plantId, referenceDocument } = req.body;
  if (!materialSku || !batchNumber || !quantity) {
    return res.status(HttpStatus.BAD_REQUEST).json({ error: 'materialSku, batchNumber, and quantity are required' });
  }

  try {
    const lot = qualityEngine.createInspectionLot({
      origin: origin || '01_GOODS_RECEIPT',
      materialSku,
      batchNumber,
      quantity: Number(quantity),
      baseUom: baseUom || 'EA',
      plantId: plantId || 'PLANT-1000',
      referenceDocument: referenceDocument || `REF-${Date.now().toString(36).toUpperCase()}`,
    });
    res.status(HttpStatus.CREATED).json(lot);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create inspection lot';
    res.status(HttpStatus.BAD_REQUEST).json({ error: 'InspectionLotCreationError', message: msg });
  }
});

app.post('/api/v1/quality/lots/:lotId/results', (req: Request, res: Response) => {
  const lotId = String(req.params.lotId);
  const { results } = req.body;
  if (!results || !Array.isArray(results)) {
    return res.status(HttpStatus.BAD_REQUEST).json({ error: 'results array is required' });
  }

  try {
    const updated = qualityEngine.recordResults(lotId, results);
    res.json(updated);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to record inspection results';
    res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'ResultsRecordingError', message: msg });
  }
});

app.post('/api/v1/quality/lots/:lotId/usage-decision', (req: Request, res: Response) => {
  const lotId = String(req.params.lotId);
  const { decision, decidedBy, notes } = req.body;
  if (!decision || !decidedBy) {
    return res.status(HttpStatus.BAD_REQUEST).json({ error: 'decision and decidedBy are required' });
  }

  try {
    const udResult = qualityEngine.recordUsageDecision({
      lotId,
      decision,
      decidedBy,
      notes,
    });
    res.json(udResult);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Usage decision recording failed';
    res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'UsageDecisionError', message: msg });
  }
});

app.post('/api/v1/quality/lots/:lotId/certificate-of-analysis', (req: Request, res: Response) => {
  const lotId = String(req.params.lotId);
  const { qaManager } = req.body;
  if (!qaManager) {
    return res.status(HttpStatus.BAD_REQUEST).json({ error: 'qaManager is required' });
  }

  try {
    const coa = qualityEngine.generateCertificateOfAnalysis(lotId, qaManager);
    res.json(coa);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'CoA generation failed';
    res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'CertificateGenerationError', message: msg });
  }
});

app.get('/api/v1/quality/batches', (req: Request, res: Response) => {
  res.json(qualityEngine.getAllBatches());
});

app.get('/api/v1/quality/batches/:batchNumber/trace', (req: Request, res: Response) => {
  const batchNumber = String(req.params.batchNumber);
  try {
    const trace = qualityEngine.traceBatchGenealogy(batchNumber);
    res.json(trace);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Batch trace failed';
    res.status(HttpStatus.NOT_FOUND).json({ error: 'BatchTraceError', message: msg });
  }
});

// =================================================================
// 2.12 Controlling & Management Accounting (SAP CO)
// =================================================================
app.get('/api/v1/controlling/cost-centers', (req: Request, res: Response) => {
  res.json(controllingEngine.getAllCostCenters());
});

app.get('/api/v1/controlling/profit-centers', (req: Request, res: Response) => {
  res.json(controllingEngine.getAllProfitCenters());
});

app.get('/api/v1/controlling/allocation-rules', (req: Request, res: Response) => {
  res.json(controllingEngine.getAllAllocationRules());
});

app.post('/api/v1/controlling/assessment-cycles/run', (req: Request, res: Response) => {
  const { ruleId, period, amountToAllocate, tenantId } = req.body;
  if (!ruleId || !period) {
    return res.status(HttpStatus.BAD_REQUEST).json({ error: 'ruleId and period are required' });
  }

  try {
    const result = controllingEngine.executeCostAllocationCycle({
      ruleId,
      period,
      amountToAllocate: amountToAllocate ? Number(amountToAllocate) : undefined,
      tenantId: tenantId || '00000000-0000-0000-0000-000000000001',
    });
    res.status(HttpStatus.CREATED).json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Cost allocation cycle failed';
    res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'CostAllocationError', message: msg });
  }
});

app.get('/api/v1/controlling/cost-centers/:code/variance', (req: Request, res: Response) => {
  const code = String(req.params.code);
  const period = (req.query.period as string) || new Date().toISOString().slice(0, 7);
  try {
    const variance = controllingEngine.analyzeVariance(code, period);
    res.json(variance);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Variance analysis failed';
    res.status(HttpStatus.NOT_FOUND).json({ error: 'VarianceAnalysisError', message: msg });
  }
});
// =================================================================
app.get('/api/v1/nocode/schemas', (req: Request, res: Response) => {
  res.json(Array.from(inMemoryEntities.values()));
});

app.post('/api/v1/nocode/schemas', (req: Request, res: Response) => {
  const schema: EntitySchemaDefinition = req.body;
  if (!schema.name || !schema.slug || !schema.fields) {
    return res.status(HttpStatus.BAD_REQUEST).json({ error: 'Invalid schema definition format' });
  }

  inMemoryEntities.set(schema.slug, schema);
  if (!inMemoryRecords.has(schema.slug)) {
    inMemoryRecords.set(schema.slug, []);
  }

  res.status(HttpStatus.CREATED).json({ message: 'Dynamic entity created successfully', schema });
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
    return res.status(HttpStatus.NOT_FOUND).json({ error: `Dynamic entity '${slug}' not found` });
  }

  const recordData = req.body;
  const validation = EntityValidator.validateRecord(schema, recordData);

  if (!validation.valid) {
    return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'Record failed schema validation', issues: validation.issues });
  }

  const newRecord = {
    id: `rec-${Date.now()}`,
    ...recordData,
    createdAt: new Date().toISOString(),
  };

  const records = inMemoryRecords.get(slug) || [];
  records.push(newRecord);
  inMemoryRecords.set(slug, records);

  res.status(HttpStatus.CREATED).json({ message: 'Record saved successfully', record: newRecord });
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
    return res.status(HttpStatus.BAD_REQUEST).json({ error: 'Prompt/question is required' });
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
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'AI interpretation failed', message: err.message });
  }
});

app.post('/api/v1/ai/extract-invoice', async (req: Request, res: Response) => {
  const { documentText } = req.body;
  if (!documentText) {
    return res.status(HttpStatus.BAD_REQUEST).json({ error: 'Raw document text or OCR is required' });
  }

  try {
    const extracted = await invoiceExtractorAgent.extract(documentText);
    res.json(extracted);
  } catch (err: any) {
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'IDP Invoice extraction failed', message: err.message });
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
