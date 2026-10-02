import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../apps/api/dist/app.js';

describe('Sutra Backend Architecture & API Suite', () => {
  let server;
  let baseUrl;

  before(async () => {
    const app = createApp();
    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe('1. Health & Platform Status with Localization', () => {
    test('returns default English (India) health status and components', async () => {
      const res = await fetch(`${baseUrl}/api/v1/health`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, 'HEALTHY');
      assert.equal(data.system, 'Sutra - The Open Enterprise Operating System');
      assert.equal(data.jurisdiction, 'IN (India First, World Configurable)');
      assert.ok(data.components.apiGateway);
      assert.ok(data.components.complianceEngine);
    });

    test('returns localized Hindi (भारत) health payload when Accept-Language: hi-IN is sent', async () => {
      const res = await fetch(`${baseUrl}/api/v1/health`, {
        headers: { 'Accept-Language': 'hi-IN' },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.system, 'सूत्र - खुला उद्यम ऑपरेटिंग सिस्टम');
      assert.equal(data.jurisdiction, 'भारत प्रथम (जीएसटी, ई-चालान, टीडीएस समर्थित)');
    });

    test('returns localized English (US) payload when Accept-Language: en-US is sent', async () => {
      const res = await fetch(`${baseUrl}/api/v1/health`, {
        headers: { 'Accept-Language': 'en-US' },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.jurisdiction, 'Global (Configurable Enterprise Accounting)');
    });

    test('returns 404 for unknown endpoints with localized message', async () => {
      const res = await fetch(`${baseUrl}/api/v1/unknown-endpoint`, {
        headers: { 'Accept-Language': 'hi-IN' },
      });
      assert.equal(res.status, 404);
      const data = await res.json();
      assert.equal(data.error, 'NotFound');
      assert.equal(data.message, 'संसाधन नहीं मिला।');
    });
  });

  describe('2. Enterprise Authentication Endpoints', () => {
    test('lists available auth providers', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/providers`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.defaultProvider);
      assert.ok(Array.isArray(data.providers));
      assert.ok(data.providers.length >= 3);
    });

    test('rejects missing credentials with localized error message', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': 'hi-IN',
        },
        body: JSON.stringify({ email: 'unknown@example.com', password: 'wrong' }),
      });
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.error, 'AuthenticationFailed');
      assert.equal(data.message, 'अमान्य क्रेडेंशियल प्रदान किए गए।');
    });

    test('allows tenant auth provider override', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/tenants/t-100/provider`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: 'azure-ad-oidc' }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.tenantId, 't-100');
      assert.equal(data.activeProvider, 'azure-ad-oidc');
    });
  });

  describe('3. India Compliance & Statutory Tax Endpoints', () => {
    test('validates valid GSTIN checksum', async () => {
      const res = await fetch(`${baseUrl}/api/v1/compliance/gst/validate-gstin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gstin: '27AABCS1429B1ZU' }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.isValid, true);
      assert.equal(data.stateCode, '27');
    });

    test('rejects missing GSTIN with localized error', async () => {
      const res = await fetch(`${baseUrl}/api/v1/compliance/gst/validate-gstin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': 'hi-IN',
        },
        body: JSON.stringify({}),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.message, 'जीएसटीआईएन (GSTIN) आवश्यक है।');
    });

    test('calculates intra-state GST tax (CGST + SGST)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/compliance/gst/calculate-tax`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierGstin: '27AABCS1429B1ZU',
          placeOfSupplyStateCode: '27',
          taxableAmount: 50000,
          customTaxRate: 18,
        }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.isInterState, false);
      assert.equal(data.cgstRate, 9);
      assert.equal(data.sgstRate, 9);
      assert.equal(data.totalTax, 9000);
    });

    test('generates compliant E-Invoice payload and IRN', async () => {
      const res = await fetch(`${baseUrl}/api/v1/compliance/einvoice/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierGstin: '27AABCS1429B1ZU',
          buyerGstin: '29AABCT1332C1ZV',
          docNo: 'INV-2026-009',
          totalValue: 118000,
        }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, 'GENERATED_NIC_COMPLIANT');
      assert.equal(data.irn.length, 64);
    });

    test('calculates Section 194Q TDS for goods purchases', async () => {
      const res = await fetch(`${baseUrl}/api/v1/compliance/tds/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionKey: '194Q',
          grossAmount: 1000000,
          cumulativeFYAmount: 5500000,
          hasValidPan: true,
          isCompanyOrFirm: true,
        }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.applicable, true);
      assert.equal(data.appliedRate, 0.1);
      assert.equal(data.tdsAmount, 1000);
    });

    test('calculates Customs Import Duty with BCD, SWS, and IGST', async () => {
      const res = await fetch(`${baseUrl}/api/v1/compliance/customs/import-duty`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cifValueInr: 100000,
          hsnCode: '84713010',
          basicCustomsDutyPercent: 7.5,
          swsPercent: 10,
          igstPercent: 18,
        }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.bcdAmount, 7500);
      assert.equal(data.swsAmount, 750);
      assert.equal(data.igstAmount, 19485);
    });

    test('verifies Rule 96A Letter of Undertaking (LUT)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/compliance/export/lut-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lutArn: 'AD270326001234F',
          financialYear: '2026-27',
          exporterGstin: '27AABCS1429B1ZU',
        }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.isValid, true);
      assert.equal(data.status, 'ACTIVE_VALID_LUT');
    });

    test('supports global jurisdiction tax endpoint', async () => {
      const res = await fetch(`${baseUrl}/api/v1/compliance/calculate-jurisdiction-tax`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryCode: 'US',
          taxableAmount: 1000,
          customerStateOrRegion: 'CA',
        }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.countryCode, 'US');
      assert.ok(data.taxAmount > 0);
    });
  });

  describe('4. General Ledger & Subledger Endpoints', () => {
    test('posts balanced journal entry to General Ledger', async () => {
      const res = await fetch(`${baseUrl}/api/v1/ledger/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryNumber: 'JRN-API-001',
          reference: 'API-TEST-REF',
          lines: [
            {
              accountId: '1',
              accountCode: '1000',
              accountName: 'Cash',
              debit: 25000,
              credit: 0,
              description: 'Customer payment',
            },
            {
              accountId: '2',
              accountCode: '1200',
              accountName: 'Accounts Receivable',
              debit: 0,
              credit: 25000,
              description: 'Clear AR',
            },
          ],
        }),
      });
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.result.isBalanced, true);
      assert.equal(data.result.status, 'POSTED');
    });

    test('generates subledger aging analysis', async () => {
      const res = await fetch(`${baseUrl}/api/v1/ledger/aging`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.receivables);
      assert.ok(data.payables);
    });
  });

  describe('5. Inventory & Materials Management Endpoints', () => {
    test('registers material and retrieves material master list', async () => {
      const postRes = await fetch(`${baseUrl}/api/v1/inventory/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: 'MAT-STEEL-400',
          name: 'Galvanized Sheet Steel',
          materialType: 'RAW',
          baseUom: 'KG',
          unitCost: 120,
        }),
      });
      assert.equal(postRes.status, 201);

      const getRes = await fetch(`${baseUrl}/api/v1/inventory/materials`);
      assert.equal(getRes.status, 200);
      const materials = await getRes.json();
      assert.ok(Array.isArray(materials));
      assert.ok(materials.some((m) => m.sku === 'MAT-STEEL-400'));
    });
  });

  describe('6. Sales & Order-to-Cash Endpoints', () => {
    test('fetches customer master list', async () => {
      const res = await fetch(`${baseUrl}/api/v1/sales/customers`);
      assert.equal(res.status, 200);
      const customers = await res.json();
      assert.ok(Array.isArray(customers));
      assert.ok(customers.length > 0);
    });
  });

  describe('7. Procurement & Procure-to-Pay Endpoints', () => {
    test('fetches vendor master list', async () => {
      const res = await fetch(`${baseUrl}/api/v1/procurement/vendors`);
      assert.equal(res.status, 200);
      const vendors = await res.json();
      assert.ok(Array.isArray(vendors));
      assert.ok(vendors.length > 0);
    });
  });

  describe('8. Manufacturing & PP Endpoints', () => {
    test('fetches BOMs and work centers', async () => {
      const bomsRes = await fetch(`${baseUrl}/api/v1/manufacturing/boms`);
      assert.equal(bomsRes.status, 200);
      const boms = await bomsRes.json();
      assert.ok(Array.isArray(boms));

      const wcRes = await fetch(`${baseUrl}/api/v1/manufacturing/work-centers`);
      assert.equal(wcRes.status, 200);
      const wcs = await wcRes.json();
      assert.ok(Array.isArray(wcs));
    });
  });

  describe('9. Fixed Asset Accounting (SAP FI-AA) Endpoints', () => {
    test('fetches asset register and executes depreciation run', async () => {
      const res = await fetch(`${baseUrl}/api/v1/assets`);
      assert.equal(res.status, 200);
      const assets = await res.json();
      assert.ok(Array.isArray(assets));

      const depRes = await fetch(`${baseUrl}/api/v1/assets/depreciation-run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: '2026-09' }),
      });
      assert.equal(depRes.status, 201);
      const depData = await depRes.json();
      assert.equal(depData.period, '2026-09');
      assert.ok(depData.runId);
    });
  });

  describe('10. Quality Management & Inspection Endpoints', () => {
    test('creates inspection lot and fetches lots list', async () => {
      const postRes = await fetch(`${baseUrl}/api/v1/quality/lots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialSku: 'MAT-STEEL-400',
          batchNumber: 'LOT-9988',
          quantity: 50,
        }),
      });
      assert.equal(postRes.status, 201);
      const lot = await postRes.json();
      assert.ok(lot.lotId);

      const getRes = await fetch(`${baseUrl}/api/v1/quality/lots/${lot.lotId}`);
      assert.equal(getRes.status, 200);
      const fetchedLot = await getRes.json();
      assert.equal(fetchedLot.materialSku, 'MAT-STEEL-400');
    });
  });

  describe('11. Plant Maintenance & Equipment Endpoints', () => {
    test('fetches functional locations, equipment, and work orders', async () => {
      const locRes = await fetch(`${baseUrl}/api/v1/pm/functional-locations`);
      assert.equal(locRes.status, 200);

      const eqRes = await fetch(`${baseUrl}/api/v1/pm/equipment`);
      assert.equal(eqRes.status, 200);

      const woRes = await fetch(`${baseUrl}/api/v1/pm/work-orders`);
      assert.equal(woRes.status, 200);
    });
  });

  describe('12. Treasury & TRM Endpoints', () => {
    test('fetches house banks and bank accounts', async () => {
      const bankRes = await fetch(`${baseUrl}/api/v1/trm/house-banks`);
      assert.equal(bankRes.status, 200);

      const accRes = await fetch(`${baseUrl}/api/v1/trm/bank-accounts`);
      assert.equal(accRes.status, 200);
    });
  });

  describe('13. HCM & HR Endpoints', () => {
    test('fetches employee master list and executes payroll run', async () => {
      const empRes = await fetch(`${baseUrl}/api/v1/hcm/employees`);
      assert.equal(empRes.status, 200);
      const emps = await empRes.json();
      assert.ok(Array.isArray(emps));

      const payRes = await fetch(`${baseUrl}/api/v1/hcm/payroll/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: '2026-09' }),
      });
      assert.equal(payRes.status, 201);
      const payData = await payRes.json();
      assert.equal(payData.month, '2026-09');
    });
  });

  describe('14. Project Systems Endpoints', () => {
    test('creates and retrieves enterprise project', async () => {
      const postRes = await fetch(`${baseUrl}/api/v1/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'PRJ-MUM-501',
          name: 'Solar Panel Setup',
          projectType: 'CAPITAL',
          totalApprovedBudget: 7500000,
          responsibleCostCenter: 'CC-OPS-01',
        }),
      });
      assert.equal(postRes.status, 201);

      const getRes = await fetch(`${baseUrl}/api/v1/projects/PRJ-MUM-501`);
      assert.equal(getRes.status, 200);
      const proj = await getRes.json();
      assert.equal(proj.name, 'Solar Panel Setup');
    });
  });

  describe('15. Extended Warehouse Management (EWM) Endpoints', () => {
    test('fetches bins and executes putaway', async () => {
      const binRes = await fetch(`${baseUrl}/api/v1/warehouse/bins`);
      assert.equal(binRes.status, 200);
      const binData = await binRes.json();
      assert.ok(binData.bins.length > 0);

      const targetBin = binData.bins[0];
      const putRes = await fetch(`${baseUrl}/api/v1/warehouse/putaway`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          warehouseId: targetBin.warehouseId,
          designatedBinId: targetBin.binId,
          sku: 'MAT-RAW-001',
          batchNumber: 'LOT-PUT-01',
          quantity: 10,
          requiredBinType: targetBin.binType,
        }),
      });
      assert.equal(putRes.status, 201);
    });
  });

  describe('16. Multi-Currency Endpoints', () => {
    test('fetches live FX rates and executes conversion', async () => {
      const ratesRes = await fetch(`${baseUrl}/api/v1/multicurrency/rates`);
      assert.equal(ratesRes.status, 200);
      const ratesData = await ratesRes.json();
      assert.equal(ratesData.baseCurrency, 'INR');

      const convRes = await fetch(`${baseUrl}/api/v1/multicurrency/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 100,
          fromCurrency: 'USD',
          toCurrency: 'INR',
        }),
      });
      assert.equal(convRes.status, 200);
      const convData = await convRes.json();
      assert.ok(convData.convertedAmount > 0);
    });

    test('supports /multicurrency/tax/calculate alias', async () => {
      const res = await fetch(`${baseUrl}/api/v1/multicurrency/tax/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryCode: 'EU',
          taxableAmount: 1000,
        }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.countryCode, 'EU');
    });
  });

  describe('17. Transportation Management Endpoints', () => {
    test('fetches carriers and calculates freight cost', async () => {
      const carRes = await fetch(`${baseUrl}/api/v1/transportation/carriers`);
      assert.equal(carRes.status, 200);
      const carriers = await carRes.json();
      assert.ok(carriers.length > 0);

      const calcRes = await fetch(`${baseUrl}/api/v1/transportation/freight/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carrierId: carriers[0].carrierId,
          distanceKm: 500,
          chargeableWeightKg: 2000,
        }),
      });
      assert.equal(calcRes.status, 200);
      const cost = await calcRes.json();
      assert.ok(cost.totalFreightCost > 0);
    });
  });

  describe('18. No-Code Dynamic Entity & Schema Studio Endpoints', () => {
    test('retrieves seeded schemas and dynamic records', async () => {
      const schemaRes = await fetch(`${baseUrl}/api/v1/nocode/schemas`);
      assert.equal(schemaRes.status, 200);
      const schemas = await schemaRes.json();
      assert.ok(schemas.some((s) => s.slug === 'plant_machinery'));

      const recRes = await fetch(`${baseUrl}/api/v1/nocode/records/plant_machinery`);
      assert.equal(recRes.status, 200);
      const recData = await recRes.json();
      assert.equal(recData.entitySlug, 'plant_machinery');
      assert.ok(recData.count >= 2);
    });
  });

  describe('19. Analytics & Financial Statements Endpoints', () => {
    test('generates KPIs, P&L, and Balance Sheet', async () => {
      const kpiRes = await fetch(`${baseUrl}/api/v1/analytics/kpis`);
      assert.equal(kpiRes.status, 200);
      const kpis = await kpiRes.json();
      assert.equal(kpis.currency, 'INR');

      const pnlRes = await fetch(`${baseUrl}/api/v1/analytics/pnl`);
      assert.equal(pnlRes.status, 200);

      const bsRes = await fetch(`${baseUrl}/api/v1/analytics/balance-sheet`);
      assert.equal(bsRes.status, 200);
    });

    test('generates IAS 7 Cash Flow Statement with audit reconciliation', async () => {
      const res = await fetch(`${baseUrl}/api/v1/analytics/cash-flow`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.currency, 'INR');
      assert.ok(data.statement);
      assert.equal(data.statement.summary.isReconciled, true);
      assert.ok(data.statement.operatingActivities.netOperatingCashFlow > 0);
      assert.ok(data.statement.summary.freeCashFlowToFirm > 0);
    });

    test('evaluates CO-PA margin and segment profitability with dimension filtering', async () => {
      const res = await fetch(`${baseUrl}/api/v1/analytics/profitability/segments`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.segments.length > 0);
      assert.ok(data.summary.totalOperatingProfit > 0);
      assert.ok(data.summary.topPerformingSegment);

      const filteredRes = await fetch(`${baseUrl}/api/v1/analytics/profitability/segments?category=PRODUCT_LINE`);
      assert.equal(filteredRes.status, 200);
      const filteredData = await filteredRes.json();
      assert.ok(filteredData.segments.every((s) => s.category === 'PRODUCT_LINE'));
    });

    test('computes DuPont ROE and ROA decomposition metrics', async () => {
      const res = await fetch(`${baseUrl}/api/v1/analytics/dupont`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.currency, 'INR');
      assert.ok(data.analysis.threeStep.returnOnEquityPercent > 0);
      assert.ok(data.analysis.threeStep.returnOnAssetsPercent > 0);
      assert.equal(data.analysis.healthAssessment.leverageRisk, 'LOW');
    });
  });


  describe('20. Gen AI Copilot Endpoints', () => {
    test('interprets natural language ERP query', async () => {
      const res = await fetch(`${baseUrl}/api/v1/ai/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: 'Show me total revenue for this quarter' }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.interpretedIntent);
      assert.ok(data.answer);
    });
  });
});
