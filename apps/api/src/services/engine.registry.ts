import {
  AuthPluginRegistry,
  LocalJwtAuthProvider,
  OidcAuthProvider,
  SamlAuthProvider,
  createAuthMiddleware,
  InventoryEngine,
  OrderToCashEngine,
  ProcureToPayEngine,
  SubledgerEngine,
  ManufacturingEngine,
  FixedAssetEngine,
  QualityEngine,
  ControllingEngine,
  MaintenanceEngine,
  TreasuryEngine,
  HcmEngine,
  ProjectSystemsEngine,
  WarehouseEngine,
  MultiCurrencyEngine,
  TransportationEngine,
} from '@sutra/core';
import { LLMFactory, TextToERPAgent, InvoiceExtractorAgent } from '@sutra/ai-agent';

// 1. Pluggable Enterprise Authentication System
export const authRegistry = new AuthPluginRegistry();

// 1.1 Built-in Local JWT Auth Provider (Default)
export const jwtProvider = new LocalJwtAuthProvider({
  secretKey: process.env.JWT_SECRET || 'sutra-enterprise-super-secure-jwt-secret-replace-in-production',
  issuer: 'sutra-enterprise-os',
  tokenExpirationSeconds: 86400, // 24 hours
});
authRegistry.registerProvider(jwtProvider);
authRegistry.setDefaultProvider('local-jwt');

// 1.2 Enterprise OIDC Plugin (Okta / Azure AD / Keycloak)
export const oidcProvider = new OidcAuthProvider({
  id: 'azure-ad-oidc',
  name: 'Microsoft Entra ID (Azure AD)',
  issuerUrl: process.env.OIDC_ISSUER_URL || 'https://login.microsoftonline.com/common/v2.0',
  clientId: process.env.OIDC_CLIENT_ID || 'sutra-enterprise-client-id',
  clientSecret: process.env.OIDC_CLIENT_SECRET || 'sutra-enterprise-secret',
  redirectUri: process.env.OIDC_REDIRECT_URI || 'http://localhost:3000/auth/callback',
});
authRegistry.registerProvider(oidcProvider);

// 1.3 Enterprise SAML 2.0 Plugin (ADFS / Okta SAML)
export const samlProvider = new SamlAuthProvider({
  id: 'okta-saml',
  name: 'Okta Enterprise SAML 2.0',
  entryPointUrl: process.env.SAML_ENTRY_POINT || 'https://enterprise.okta.com/app/sutra/sso/saml',
  issuer: 'urn:sutra:enterprise:sp',
  cert: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...',
  callbackUrl: 'http://localhost:4000/api/v1/auth/saml/callback',
});
authRegistry.registerProvider(samlProvider);

export const authMiddleware = createAuthMiddleware(authRegistry);

// 2. Gen AI Provider
export const aiProvider = LLMFactory.createProvider({
  provider: process.env.AI_PROVIDER || 'local',
  endpoint: process.env.AI_LOCAL_ENDPOINT || 'http://localhost:11434',
  apiKey: process.env.OPENAI_API_KEY,
});
export const textToERPAgent = new TextToERPAgent(aiProvider);
export const invoiceExtractorAgent = new InvoiceExtractorAgent(aiProvider);

// 3. Enterprise Engines (SAP Core Equivalents)
export const inventoryEngine = new InventoryEngine();
export const orderToCashEngine = new OrderToCashEngine(inventoryEngine);
export const procureToPayEngine = new ProcureToPayEngine(inventoryEngine);
export const subledgerEngine = new SubledgerEngine();
export const manufacturingEngine = new ManufacturingEngine(inventoryEngine);
export const fixedAssetEngine = new FixedAssetEngine();
export const qualityEngine = new QualityEngine(inventoryEngine);
export const controllingEngine = new ControllingEngine();
export const maintenanceEngine = new MaintenanceEngine(inventoryEngine);
export const treasuryEngine = new TreasuryEngine();
export const hcmEngine = new HcmEngine();
export const projectSystemsEngine = new ProjectSystemsEngine(fixedAssetEngine);
export const warehouseEngine = new WarehouseEngine();
export const multiCurrencyEngine = new MultiCurrencyEngine();
export const transportationEngine = new TransportationEngine();
