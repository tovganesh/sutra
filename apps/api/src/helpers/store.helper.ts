import { EntitySchemaDefinition, WorkflowDefinition } from '@sutra/no-code';
import {
  AccountBalance,
  CashFlowInput,
  ProfitabilitySegmentInput,
  DuPontInput,
  EntityFinancialData,
} from '@sutra/analytics';

export const inMemoryEntities: Map<string, EntitySchemaDefinition> = new Map();
export const inMemoryRecords: Map<string, Array<Record<string, unknown>>> = new Map();
export const inMemoryWorkflows: WorkflowDefinition[] = [];

// Seed initial dynamic entity: "Enterprise Asset Tracking" (e.g. replacing SAP PM)
export const sampleAssetEntity: EntitySchemaDefinition = {
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
  {
    id: 'asset-003',
    assetTag: 'SMT-NOI-0081',
    description: 'High-Speed SMT Pick & Place Assembly Line',
    purchaseCost: 11500000,
    warrantyExpiry: '2029-03-31',
    operationalStatus: 'ACTIVE',
    locationSite: 'Plant 3 - Sector 62, Noida, Uttar Pradesh',
  },
]);

// 2. Seed: Fleet Logistics & Commercial Vehicles (SAP TM / Fleet parity)
export const sampleFleetEntity: EntitySchemaDefinition = {
  name: 'Fleet Logistics & Commercial Vehicles',
  slug: 'fleet_vehicles',
  description: 'Heavy commercial vehicle fleet, telemetry, and payload management',
  icon: 'truck',
  fields: [
    { name: 'vehicleRegNumber', label: 'Registration Plate Number', type: 'text', required: true },
    { name: 'vehicleType', label: 'Commercial Vehicle Class', type: 'select', options: ['Heavy Hauler (24T)', 'Rigid Truck (16T)', 'Medium Commercial (9T)', 'Electric Cargo Van (3.5T)'], required: true },
    { name: 'odometerKm', label: 'Current Odometer (km)', type: 'number', required: true, min: 0 },
    { name: 'fuelType', label: 'Propulsion / Fuel Type', type: 'select', options: ['DIESEL', 'CNG', 'EV_BATTERY', 'LNG'], required: true },
    { name: 'assignedDriver', label: 'Primary Assigned Driver', type: 'text', required: true },
    { name: 'activeTransit', label: 'Dispatched in Active Transit', type: 'boolean', required: true },
  ],
};

inMemoryEntities.set(sampleFleetEntity.slug, sampleFleetEntity);
inMemoryRecords.set(sampleFleetEntity.slug, [
  {
    id: 'fleet-001',
    vehicleRegNumber: 'MH-12-RN-4821',
    vehicleType: 'Heavy Hauler (24T)',
    odometerKm: 148500,
    fuelType: 'DIESEL',
    assignedDriver: 'Harpreet Singh (DL-99401)',
    activeTransit: true,
  },
  {
    id: 'fleet-002',
    vehicleRegNumber: 'KA-01-MJ-9022',
    vehicleType: 'Electric Cargo Van (3.5T)',
    odometerKm: 32100,
    fuelType: 'EV_BATTERY',
    assignedDriver: 'Manoj Kumar (DL-88312)',
    activeTransit: false,
  },
  {
    id: 'fleet-003',
    vehicleRegNumber: 'DL-04-AB-6710',
    vehicleType: 'Rigid Truck (16T)',
    odometerKm: 89400,
    fuelType: 'CNG',
    assignedDriver: 'Sanjay Rawat (DL-77219)',
    activeTransit: true,
  },
]);

// 3. Seed: Enterprise IT Infrastructure & Assets (ITIL / ITAM parity)
export const sampleITEntity: EntitySchemaDefinition = {
  name: 'Enterprise IT Infrastructure & Assets',
  slug: 'it_hardware_assets',
  description: 'Datacenter servers, cloud edge nodes, and developer workstations',
  icon: 'hard-drive',
  fields: [
    { name: 'assetCode', label: 'Hardware Asset Tag', type: 'text', required: true },
    { name: 'deviceType', label: 'Hardware Category', type: 'select', options: ['Rack Server', 'SAN Storage Array', 'Core Switch', 'Developer Laptop', 'Edge Gateway'], required: true },
    { name: 'hostname', label: 'FQDN / Hostname', type: 'text', required: true },
    { name: 'ipAddress', label: 'Static IP Address', type: 'text', required: true },
    { name: 'operatingSystem', label: 'Operating System', type: 'select', options: ['RHEL Enterprise Linux 9', 'Ubuntu Server 24.04', 'Windows Server 2022', 'macOS Sonoma'], required: true },
    { name: 'procurementCost', label: 'Procurement Cost', type: 'currency', required: true, min: 100 },
    { name: 'isProduction', label: 'Production Tier Workload', type: 'boolean', required: true },
  ],
};

inMemoryEntities.set(sampleITEntity.slug, sampleITEntity);
inMemoryRecords.set(sampleITEntity.slug, [
  {
    id: 'it-001',
    assetCode: 'SRV-BLR-01',
    deviceType: 'Rack Server',
    hostname: 'blr-dc-core01.sutra.internal',
    ipAddress: '10.200.10.15',
    operatingSystem: 'RHEL Enterprise Linux 9',
    procurementCost: 650000,
    isProduction: true,
  },
  {
    id: 'it-002',
    assetCode: 'SAN-PUN-02',
    deviceType: 'SAN Storage Array',
    hostname: 'pun-san-flash02.sutra.internal',
    ipAddress: '10.200.20.50',
    operatingSystem: 'Ubuntu Server 24.04',
    procurementCost: 1450000,
    isProduction: true,
  },
  {
    id: 'it-003',
    assetCode: 'DEV-MUM-89',
    deviceType: 'Developer Laptop',
    hostname: 'mum-eng-macbook-89.sutra.internal',
    ipAddress: '10.100.4.120',
    operatingSystem: 'macOS Sonoma',
    procurementCost: 240000,
    isProduction: false,
  },
]);

// Seed sample chart of accounts balance for instant analytics
export const sampleBalances: AccountBalance[] = [
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

export const sampleCashFlowInput: CashFlowInput = {
  periodStart: '2026-04-01',
  periodEnd: '2027-03-31',
  netIncome: 3500000,
  depreciationAmortization: 800000,
  gainLossOnDisposal: 0,
  financeCosts: 150000,
  workingCapital: {
    beginningAccountsReceivable: 4200000,
    endingAccountsReceivable: 5000000,
    beginningInventory: 2600000,
    endingInventory: 3000000,
    beginningAccountsPayable: 2100000,
    endingAccountsPayable: 2500000,
    beginningOtherCurrentLiabilities: 800000,
    endingOtherCurrentLiabilities: 1000000,
  },
  incomeTaxesPaid: 950000,
  capitalExpenditure: 1200000,
  proceedsFromSaleOfAssets: 100000,
  proceedsFromShareCapital: 0,
  proceedsFromBorrowings: 500000,
  repaymentOfBorrowings: 200000,
  dividendsPaid: 600000,
  interestPaid: 150000,
  beginningCash: 3500000,
};

export const sampleProfitabilitySegments: ProfitabilitySegmentInput[] = [
  {
    segmentId: 'SEG-PROD-01',
    segmentName: 'Enterprise ERP & Cloud Core',
    category: 'PRODUCT_LINE',
    grossRevenue: 7500000,
    discountsAndRebates: 300000,
    directMaterialCost: 1400000,
    variableProductionCost: 650000,
    freightAndLogisticsCost: 150000,
    directSalesAndMarketingCost: 850000,
    allocatedFixedOverheads: 1100000,
  },
  {
    segmentId: 'SEG-PROD-02',
    segmentName: 'Supply Chain & Logistics Cockpit',
    category: 'PRODUCT_LINE',
    grossRevenue: 3200000,
    discountsAndRebates: 100000,
    directMaterialCost: 950000,
    variableProductionCost: 400000,
    freightAndLogisticsCost: 180000,
    directSalesAndMarketingCost: 420000,
    allocatedFixedOverheads: 550000,
  },
  {
    segmentId: 'SEG-PROD-03',
    segmentName: 'Regulatory Tax & Treasury Add-on',
    category: 'PRODUCT_LINE',
    grossRevenue: 1800000,
    discountsAndRebates: 50000,
    directMaterialCost: 250000,
    variableProductionCost: 180000,
    freightAndLogisticsCost: 20000,
    directSalesAndMarketingCost: 220000,
    allocatedFixedOverheads: 300000,
  },
  {
    segmentId: 'SEG-REG-NORTH',
    segmentName: 'India - North Zone (Delhi NCR, Punjab, UP)',
    category: 'SALES_REGION',
    grossRevenue: 4200000,
    discountsAndRebates: 150000,
    directMaterialCost: 900000,
    variableProductionCost: 420000,
    freightAndLogisticsCost: 110000,
    directSalesAndMarketingCost: 450000,
    allocatedFixedOverheads: 650000,
  },
  {
    segmentId: 'SEG-REG-SOUTH',
    segmentName: 'India - South Zone (Bengaluru, Chennai, Hyderabad)',
    category: 'SALES_REGION',
    grossRevenue: 5100000,
    discountsAndRebates: 180000,
    directMaterialCost: 1050000,
    variableProductionCost: 480000,
    freightAndLogisticsCost: 130000,
    directSalesAndMarketingCost: 580000,
    allocatedFixedOverheads: 750000,
  },
  {
    segmentId: 'SEG-REG-EXPORT',
    segmentName: 'Export Markets (EMEA & North America)',
    category: 'SALES_REGION',
    grossRevenue: 3200000,
    discountsAndRebates: 120000,
    directMaterialCost: 650000,
    variableProductionCost: 330000,
    freightAndLogisticsCost: 110000,
    directSalesAndMarketingCost: 460000,
    allocatedFixedOverheads: 550000,
  },
  {
    segmentId: 'SEG-TIER-ENT',
    segmentName: 'Tier 1 Enterprise Conglomerates',
    category: 'CUSTOMER_TIER',
    grossRevenue: 6800000,
    discountsAndRebates: 220000,
    directMaterialCost: 1350000,
    variableProductionCost: 620000,
    freightAndLogisticsCost: 170000,
    directSalesAndMarketingCost: 720000,
    allocatedFixedOverheads: 980000,
  },
  {
    segmentId: 'SEG-TIER-MID',
    segmentName: 'Mid-Market Growth Enterprises',
    category: 'CUSTOMER_TIER',
    grossRevenue: 4100000,
    discountsAndRebates: 160000,
    directMaterialCost: 920000,
    variableProductionCost: 430000,
    freightAndLogisticsCost: 120000,
    directSalesAndMarketingCost: 510000,
    allocatedFixedOverheads: 670000,
  },
  {
    segmentId: 'SEG-TIER-SMB',
    segmentName: 'Emerging SMB Accounts',
    category: 'CUSTOMER_TIER',
    grossRevenue: 1600000,
    discountsAndRebates: 70000,
    directMaterialCost: 330000,
    variableProductionCost: 180000,
    freightAndLogisticsCost: 60000,
    directSalesAndMarketingCost: 260000,
    allocatedFixedOverheads: 300000,
  },
];

export const sampleDuPontInput: DuPontInput = {
  revenue: 12000000,
  cogs: 4800000,
  operatingExpenses: 3700000,
  interestExpense: 150000,
  taxes: 950000,
  netIncome: 3500000,
  totalAssets: 16500000,
  totalEquity: 8500000,
};

// =================================================================
// Strategic Sourcing & Supplier Lifecycle (SAP SRM / Ariba)
// =================================================================

import {
  RfqDocument,
  VendorQuotation,
  VendorScorecard,
  VendorRatingTier,
  RfqStatus,
  VendorBidStatus,
  SystemDefaults,
  ConsolidationMethod,
  CreditManagementEngine,
  InvoiceRecord,
  CustomerCreditProfile,
  CreditRating,
  CreditBlockReason,
  CreditCheckStatus,
} from '@sutra/core';

export const inMemoryRfqs: Map<string, RfqDocument> = new Map();
export const inMemoryQuotations: Map<string, VendorQuotation[]> = new Map();

// Seed initial RFQ: "Precision Titanium CNC Castings"
const initialRfq: RfqDocument = {
  tenantId: SystemDefaults.DEFAULT_TENANT_ID,
  rfqNumber: 'RFQ-2026-081',
  title: 'Precision Titanium Alloy CNC Castings & Fasteners',
  category: 'DIRECT_MATERIALS',
  status: RfqStatus.QUOTES_RECEIVED,
  issueDate: '2026-09-15',
  bidClosingDate: '2026-10-15',
  deliveryPlant: SystemDefaults.DEFAULT_PLANT_ID,
  currency: SystemDefaults.DEFAULT_CURRENCY,
  items: [
    {
      itemId: 'item-1',
      sku: 'RAW-TI-001',
      description: 'Aerospace Grade Titanium Round Bar 6Al-4V',
      targetQuantity: 2500,
      unitOfMeasure: 'KG',
      targetUnitPrice: 1650,
      requiredDeliveryDate: '2026-11-15',
      hsnCode: '81089010',
    },
    {
      itemId: 'item-2',
      sku: 'COMP-FAST-44',
      description: 'Titanium Grade 5 Hex Machine Bolts M8x40',
      targetQuantity: 10000,
      unitOfMeasure: 'PCS',
      targetUnitPrice: 45,
      requiredDeliveryDate: '2026-11-15',
      hsnCode: '73181500',
    },
  ],
  invitedVendorIds: ['VEND-001', 'VEND-002', 'VEND-003'],
  createdBy: 'SOURCING_DIRECTOR',
};

inMemoryRfqs.set(initialRfq.rfqNumber, initialRfq);

const initialQuotations: VendorQuotation[] = [
  {
    quotationId: 'QUO-V1-081',
    rfqNumber: 'RFQ-2026-081',
    vendorId: 'VEND-001',
    vendorName: 'Tata Advanced Materials Ltd',
    status: VendorBidStatus.SUBMITTED,
    submissionDate: '2026-09-22',
    paymentTermsDays: 45,
    warrantyMonths: 24,
    technicalComplianceScore: 96,
    items: [
      { sku: 'RAW-TI-001', offeredQuantity: 2500, quotedUnitPrice: 1600, leadTimeDays: 14, itemTotalAmount: 4000000 },
      { sku: 'COMP-FAST-44', offeredQuantity: 10000, quotedUnitPrice: 45, leadTimeDays: 14, itemTotalAmount: 450000 },
    ],
    totalQuoteAmount: 4450000,
    averageLeadTimeDays: 14,
    notes: 'AS9100D certified aerospace forging with ultrasonic test reports.',
  },
  {
    quotationId: 'QUO-V2-081',
    rfqNumber: 'RFQ-2026-081',
    vendorId: 'VEND-002',
    vendorName: 'Bharat Forge Aerospace Division',
    status: VendorBidStatus.SUBMITTED,
    submissionDate: '2026-09-24',
    paymentTermsDays: 30,
    warrantyMonths: 18,
    technicalComplianceScore: 92,
    items: [
      { sku: 'RAW-TI-001', offeredQuantity: 2500, quotedUnitPrice: 1520, leadTimeDays: 21, itemTotalAmount: 3800000 },
      { sku: 'COMP-FAST-44', offeredQuantity: 10000, quotedUnitPrice: 40, leadTimeDays: 21, itemTotalAmount: 400000 },
    ],
    totalQuoteAmount: 4200000,
    averageLeadTimeDays: 21,
    notes: 'Lowest cost producer with ISO 17025 accredited laboratory.',
  },
  {
    quotationId: 'QUO-V3-081',
    rfqNumber: 'RFQ-2026-081',
    vendorId: 'VEND-003',
    vendorName: 'Precision Fasteners & Alloys Ltd',
    status: VendorBidStatus.SUBMITTED,
    submissionDate: '2026-09-26',
    paymentTermsDays: 30,
    warrantyMonths: 12,
    technicalComplianceScore: 84,
    items: [
      { sku: 'RAW-TI-001', offeredQuantity: 2500, quotedUnitPrice: 1680, leadTimeDays: 28, itemTotalAmount: 4200000 },
      { sku: 'COMP-FAST-44', offeredQuantity: 10000, quotedUnitPrice: 45, leadTimeDays: 28, itemTotalAmount: 450000 },
    ],
    totalQuoteAmount: 4650000,
    averageLeadTimeDays: 28,
    notes: 'Standard commercial quotation without custom tooling charges.',
  },
];

inMemoryQuotations.set(initialRfq.rfqNumber, initialQuotations);

export const sampleVendorScorecards: VendorScorecard[] = [
  {
    vendorId: 'VEND-001',
    vendorName: 'Tata Advanced Materials Ltd',
    evaluationDate: '2026-10-01',
    metrics: {
      totalShipments: 48,
      otifPercentage: 97.92,
      qualityAcceptanceRate: 99.45,
      ppmDefectRate: 550,
      priceCompetitivenessScore: 94.5,
    },
    overallScore: 97.85,
    tier: VendorRatingTier.GRADE_A_PLUS,
    isPreferredSupplier: true,
    correctiveActionRequired: false,
  },
  {
    vendorId: 'VEND-002',
    vendorName: 'Bharat Forge Aerospace Division',
    evaluationDate: '2026-10-01',
    metrics: {
      totalShipments: 36,
      otifPercentage: 91.67,
      qualityAcceptanceRate: 96.8,
      ppmDefectRate: 3200,
      priceCompetitivenessScore: 100,
    },
    overallScore: 95.39,
    tier: VendorRatingTier.GRADE_A_PLUS,
    isPreferredSupplier: true,
    correctiveActionRequired: false,
  },
  {
    vendorId: 'VEND-003',
    vendorName: 'Precision Fasteners & Alloys Ltd',
    evaluationDate: '2026-10-01',
    metrics: {
      totalShipments: 24,
      otifPercentage: 79.17,
      qualityAcceptanceRate: 91.25,
      ppmDefectRate: 8750,
      priceCompetitivenessScore: 88.2,
    },
    overallScore: 85.81,
    tier: VendorRatingTier.GRADE_A,
    isPreferredSupplier: true,
    correctiveActionRequired: false,
  },
];

export const sampleConsolidationEntities: EntityFinancialData[] = [
  {
    entity: {
      entityId: 'ENTITY-HOLDING-01',
      legalName: 'Sutra Global Enterprises Ltd (Parent Holding)',
      country: 'India',
      functionalCurrency: 'INR',
      ownershipPercentage: 100,
      consolidationMethod: ConsolidationMethod.FULL_CONSOLIDATION,
      isParent: true,
    },
    revenue: 55000000,
    costOfGoodsSold: 22000000,
    grossProfit: 33000000,
    operatingExpenses: 12000000,
    operatingProfit: 21000000,
    intercompanyRevenue: 15000000,
    intercompanyCogs: 6000000,
    cashAndEquivalents: 18000000,
    accountsReceivable: 14000000,
    intercompanyReceivables: 6500000,
    inventory: 12000000,
    intercompanyInventoryHeld: 0,
    fixedAssets: 25000000,
    totalAssets: 75500000,
    accountsPayable: 9500000,
    intercompanyPayables: 0,
    otherLiabilities: 6000000,
    totalLiabilities: 15500000,
    shareCapital: 30000000,
    retainedEarnings: 30000000,
    totalEquity: 60000000,
  },
  {
    entity: {
      entityId: 'ENTITY-SUB-EU-02',
      legalName: 'Sutra Advanced Engineering GmbH (Europe)',
      country: 'Germany',
      functionalCurrency: 'EUR',
      ownershipPercentage: 100,
      consolidationMethod: ConsolidationMethod.FULL_CONSOLIDATION,
      isParent: false,
    },
    revenue: 28000000,
    costOfGoodsSold: 13000000,
    grossProfit: 15000000,
    operatingExpenses: 6500000,
    operatingProfit: 8500000,
    intercompanyRevenue: 0,
    intercompanyCogs: 9000000,
    cashAndEquivalents: 8500000,
    accountsReceivable: 7200000,
    intercompanyReceivables: 0,
    inventory: 9000000,
    intercompanyInventoryHeld: 3000000,
    fixedAssets: 12000000,
    totalAssets: 36700000,
    accountsPayable: 4200000,
    intercompanyPayables: 4000000,
    otherLiabilities: 3500000,
    totalLiabilities: 11700000,
    shareCapital: 10000000,
    retainedEarnings: 15000000,
    totalEquity: 25000000,
  },
  {
    entity: {
      entityId: 'ENTITY-SUB-US-03',
      legalName: 'Sutra Robotics Inc (Americas - 80% Majority)',
      country: 'United States',
      functionalCurrency: 'USD',
      ownershipPercentage: 80,
      consolidationMethod: ConsolidationMethod.FULL_CONSOLIDATION,
      isParent: false,
    },
    revenue: 22000000,
    costOfGoodsSold: 10000000,
    grossProfit: 12000000,
    operatingExpenses: 5200000,
    operatingProfit: 6800000,
    intercompanyRevenue: 0,
    intercompanyCogs: 6000000,
    cashAndEquivalents: 6000000,
    accountsReceivable: 5800000,
    intercompanyReceivables: 0,
    inventory: 7500000,
    intercompanyInventoryHeld: 2000000,
    fixedAssets: 9500000,
    totalAssets: 28800000,
    accountsPayable: 3500000,
    intercompanyPayables: 2500000,
    otherLiabilities: 2800000,
    totalLiabilities: 8800000,
    shareCapital: 8000000,
    retainedEarnings: 12000000,
    totalEquity: 20000000,
  },
];

// =================================================================
// Credit Risk Management & Dunning Store (SAP FSCM-CR & F150)
// =================================================================

export const sampleCreditEngine = new CreditManagementEngine();

export const sampleCreditInvoices: InvoiceRecord[] = [
  // CUST-MAH-001 (Tata Motors Fleet Solutions Ltd) - Prime AAA
  {
    invoiceNumber: 'INV-2026-MAH-010',
    customerId: 'CUST-MAH-001',
    customerName: 'Tata Motors Fleet Solutions Ltd',
    customerEmail: 'billing@tatamotorsfleet.com',
    invoiceDate: '2026-09-10',
    dueDate: '2026-10-25',
    amount: 4500000,
    paidAmount: 0,
    isPaid: false,
  },
  // CUST-BLR-002 (Bangalore Metro Rail Logistics Corp) - Grade A, 12 days overdue (Level 1 Dunning)
  {
    invoiceNumber: 'INV-2026-BLR-045',
    customerId: 'CUST-BLR-002',
    customerName: 'Bangalore Metro Rail Logistics Corp',
    customerEmail: 'accounts@bmrl-logistics.org',
    invoiceDate: '2026-08-01',
    dueDate: '2026-09-20',
    amount: 1800000,
    paidAmount: 0,
    isPaid: false,
  },
  {
    invoiceNumber: 'INV-2026-BLR-046',
    customerId: 'CUST-BLR-002',
    customerName: 'Bangalore Metro Rail Logistics Corp',
    customerEmail: 'accounts@bmrl-logistics.org',
    invoiceDate: '2026-09-15',
    dueDate: '2026-11-15',
    amount: 10200000,
    paidAmount: 0,
    isPaid: false,
  },
  // CUST-DEL-003 (Northern Infrastructure & Power Ltd) - 24 days overdue (Level 2 Dunning, Exposure Exceeded)
  {
    invoiceNumber: 'INV-2026-DEL-088',
    customerId: 'CUST-DEL-003',
    customerName: 'Northern Infrastructure & Power Ltd',
    customerEmail: 'finance@northinfra-power.in',
    invoiceDate: '2026-07-20',
    dueDate: '2026-09-08',
    amount: 2400000,
    paidAmount: 0,
    isPaid: false,
  },
  {
    invoiceNumber: 'INV-2026-DEL-089',
    customerId: 'CUST-DEL-003',
    customerName: 'Northern Infrastructure & Power Ltd',
    customerEmail: 'finance@northinfra-power.in',
    invoiceDate: '2026-08-25',
    dueDate: '2026-10-10',
    amount: 1800000,
    paidAmount: 0,
    isPaid: false,
  },
  // CUST-HYD-004 (Deccan Precision Fab & Castings Pvt Ltd) - 68 days overdue (Level 3 Dunning, MSMED Statutory Interest)
  {
    invoiceNumber: 'INV-2026-HYD-031',
    customerId: 'CUST-HYD-004',
    customerName: 'Deccan Precision Fab & Castings Pvt Ltd',
    customerEmail: 'ap@deccan-precision.com',
    invoiceDate: '2026-06-15',
    dueDate: '2026-07-26',
    amount: 3800000,
    paidAmount: 0,
    isPaid: false,
  },
];

export interface CustomerCreditSeed {
  customerId: string;
  name: string;
  creditLimit: number;
  openOrdersValue: number;
  openDeliveriesValue: number;
}

export const sampleCreditCustomers: CustomerCreditSeed[] = [
  {
    customerId: 'CUST-MAH-001',
    name: 'Tata Motors Fleet Solutions Ltd',
    creditLimit: 25000000,
    openOrdersValue: 3500000,
    openDeliveriesValue: 1500000,
  },
  {
    customerId: 'CUST-BLR-002',
    name: 'Bangalore Metro Rail Logistics Corp',
    creditLimit: 50000000,
    openOrdersValue: 15000000,
    openDeliveriesValue: 8000000,
  },
  {
    customerId: 'CUST-DEL-003',
    name: 'Northern Infrastructure & Power Ltd',
    creditLimit: 10000000,
    openOrdersValue: 4000000,
    openDeliveriesValue: 2500000,
  },
  {
    customerId: 'CUST-HYD-004',
    name: 'Deccan Precision Fab & Castings Pvt Ltd',
    creditLimit: 8000000,
    openOrdersValue: 1000000,
    openDeliveriesValue: 500000,
  },
];

// Seed initial blocked orders
sampleCreditEngine.performCreditCheck(
  'SO-BLK-0891',
  sampleCreditEngine.evaluateCustomerRisk(
    'CUST-DEL-003',
    'Northern Infrastructure & Power Ltd',
    10000000,
    4000000,
    2500000,
    sampleCreditInvoices,
    '2026-10-02'
  ),
  3200000
);

sampleCreditEngine.performCreditCheck(
  'SO-BLK-0904',
  sampleCreditEngine.evaluateCustomerRisk(
    'CUST-HYD-004',
    'Deccan Precision Fab & Castings Pvt Ltd',
    8000000,
    1000000,
    500000,
    sampleCreditInvoices,
    '2026-10-02'
  ),
  1650000
);



