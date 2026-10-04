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

    test('generates IFRS 10 / Ind AS 110 Group Financial Consolidation statements', async () => {
      const res = await fetch(`${baseUrl}/api/v1/analytics/consolidation`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, 'RECONCILED');
      assert.equal(data.groupCurrency, 'INR');
      assert.equal(data.balanceSheet.isBalanced, true);
      assert.equal(data.kpis.eliminatedTradingVolume, 15000000);
      assert.equal(data.kpis.eliminatedUnrealizedProfit, 1000000);
      assert.equal(data.kpis.subsidiariesCount, 2);
      assert.ok(data.reconciliations.length > 0);
      assert.ok(data.eliminations.length > 0);
      assert.ok(data.worksheet.length >= 10);
    });

    test('executes custom on-demand consolidation run via POST /consolidation/run', async () => {
      const res = await fetch(`${baseUrl}/api/v1/analytics/consolidation/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period: 'FY2026-Q1',
          inventoryMarkupPercent: 0.25,
        }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.period, 'FY2026-Q1');
      assert.equal(data.balanceSheet.isBalanced, true);
      assert.equal(data.kpis.eliminatedUnrealizedProfit, 1250000);
    });
  });


  describe('20. Gen AI Copilot Endpoints', () => {
    test('retrieves active AI engine status and supported providers', async () => {
      const res = await fetch(`${baseUrl}/api/v1/ai/status`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.activeProvider);
      assert.ok(Array.isArray(data.availableProviders));
      assert.ok(data.availableProviders.some((p) => p.id === 'heuristic'));
      assert.ok(data.availableProviders.some((p) => p.id === 'sarvam'));
      assert.equal(data.airGapStatus.isAirGapped, true);
    });

    test('switches active LLM provider and model dynamically', async () => {
      const sarSwitch = await fetch(`${baseUrl}/api/v1/ai/provider`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'sarvam', model: 'sarvam-2b' }),
      });
      assert.equal(sarSwitch.status, 200);
      const sarData = await sarSwitch.json();
      assert.equal(sarData.activeProvider.id, 'sarvam');
      assert.equal(sarData.activeProvider.model, 'sarvam-2b');

      const res = await fetch(`${baseUrl}/api/v1/ai/provider`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'heuristic', model: 'sutra-rules-v1' }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.activeProvider.id, 'heuristic');
      assert.equal(data.activeProvider.type, 'heuristic');
    });

    test('configures provider credentials and models via POST /api/v1/ai/configure', async () => {
      // 1. Configure Amazon Bedrock
      const bedRes = await fetch(`${baseUrl}/api/v1/ai/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'bedrock',
          accessKeyId: 'AKIA_API_TEST',
          secretAccessKey: 'SECRET_API_TEST',
          region: 'us-east-1',
          model: 'anthropic.claude-3-5-sonnet-20240620-v1:0',
        }),
      });
      assert.equal(bedRes.status, 200);
      const bedData = await bedRes.json();
      assert.equal(bedData.provider.id, 'bedrock');
      assert.equal(bedData.provider.isConfigured, true);

      // 2. Configure Local Ollama testing model (Gemma 3 270M)
      const locRes = await fetch(`${baseUrl}/api/v1/ai/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'local',
          endpoint: 'http://localhost:11434',
          model: 'gemma3:270m',
        }),
      });
      assert.equal(locRes.status, 200);
      const locData = await locRes.json();
      assert.equal(locData.provider.id, 'local');
      assert.equal(locData.provider.model, 'gemma3:270m');

      // 3. Configure OpenAI API Key
      const oaiRes = await fetch(`${baseUrl}/api/v1/ai/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'openai',
          apiKey: 'sk-test-key-12345',
          model: 'gpt-4o',
        }),
      });
      assert.equal(oaiRes.status, 200);
      const oaiData = await oaiRes.json();
      assert.equal(oaiData.provider.isConfigured, true);

      // 4. Configure Sarvam AI
      const sarRes = await fetch(`${baseUrl}/api/v1/ai/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'sarvam',
          apiKey: 'sarvam-sub-key-test',
          model: 'sarvam-2b',
          endpoint: 'https://api.sarvam.ai',
        }),
      });
      assert.equal(sarRes.status, 200);
      const sarData = await sarRes.json();
      assert.equal(sarData.provider.id, 'sarvam');
      assert.equal(sarData.provider.isConfigured, true);
      assert.equal(sarData.provider.model, 'sarvam-2b');
    });

    test('interprets natural language ERP query with live RAG and recommendations', async () => {
      // 1. GST query
      const gstRes = await fetch(`${baseUrl}/api/v1/ai/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: 'What is our total GST output liability for this month?' }),
      });
      assert.equal(gstRes.status, 200);
      const gstData = await gstRes.json();
      assert.equal(gstData.interpretedIntent.targetEntity, 'compliance_gst');
      assert.ok(gstData.kpis.length >= 2);
      assert.ok(gstData.dataTable);
      assert.equal(gstData.suggestedAction, 'EXECUTE_RULE_88A');

      // 2. Overdue receivables query
      const arRes = await fetch(`${baseUrl}/api/v1/ai/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: 'Show all overdue invoices older than 30 days.' }),
      });
      assert.equal(arRes.status, 200);
      const arData = await arRes.json();
      assert.ok(['invoices', 'customers'].includes(arData.interpretedIntent.targetEntity));
      assert.ok(arData.dataTable.rows.length >= 2);
      assert.equal(arData.suggestedAction, 'TRIGGER_DUNNING');

      // 3. No-Code schemas query
      const ncRes = await fetch(`${baseUrl}/api/v1/ai/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: 'List registered custom No-Code schemas' }),
      });
      assert.equal(ncRes.status, 200);
      const ncData = await ncRes.json();
      assert.equal(ncData.interpretedIntent.targetEntity, 'custom_record');
      assert.ok(ncData.kpis.length > 0);
    });

    test('extracts structured invoice data via zero-shot IDP', async () => {
      const invoiceText = `TAX INVOICE
Vendor: Apex Industrial Supplies Ltd (GSTIN: 27AAACB2212M1Z0)
Invoice No: INV-2026-9041 Date: 2026-09-28
PO Reference: PO-88319-MECH
Item: Heavy Duty Ball Bearings (HSN: 84821011) Qty: 200 Unit Price: 1,250
Taxable Subtotal: 2,50,000
Tax: 18% IGST (45,000)
Total Amount: 2,95,000`;

      const res = await fetch(`${baseUrl}/api/v1/ai/extract-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentText: invoiceText }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.supplierGstin, '27AAACB2212M1Z0');
      assert.equal(data.invoiceNumber, 'INV-2026-9041');
      assert.equal(data.poMatchStatus, 'READY_FOR_3_WAY_MATCH');
      assert.ok(data.confidenceScore >= 0.85);
      assert.ok(data.lineItems.length > 0);
    });

    test('executes autonomous ERP actions', async () => {
      // 1. Rule 88A set-off execution
      const ruleRes = await fetch(`${baseUrl}/api/v1/ai/actions/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'EXECUTE_RULE_88A',
          payload: { month: '2026-09', netPayable: 250000 },
        }),
      });
      assert.equal(ruleRes.status, 200);
      const ruleData = await ruleRes.json();
      assert.equal(ruleData.status, 'SUCCESS');
      assert.ok(ruleData.details.voucherId);

      // 2. Dunning execution
      const dunRes = await fetch(`${baseUrl}/api/v1/ai/actions/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TRIGGER_DUNNING',
          payload: { targetCount: 3, totalDemand: 1420000 },
        }),
      });
      assert.equal(dunRes.status, 200);
      const dunData = await dunRes.json();
      assert.equal(dunData.status, 'SUCCESS');
      assert.equal(dunData.details.statutoryInterestRate, 19.5);
    });
  });

  describe('21. Strategic Sourcing & RFQ Endpoints (SAP SRM/Ariba)', () => {
    test('retrieves active RFQ tenders and quotations', async () => {
      const res = await fetch(`${baseUrl}/api/v1/sourcing/rfqs`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.count > 0);
      assert.ok(data.rfqs.some((r) => r.rfqNumber === 'RFQ-2026-081'));

      const detailRes = await fetch(`${baseUrl}/api/v1/sourcing/rfqs/RFQ-2026-081`);
      assert.equal(detailRes.status, 200);
      const detailData = await detailRes.json();
      assert.equal(detailData.rfq.rfqNumber, 'RFQ-2026-081');
      assert.ok(detailData.quotations.length >= 3);
    });

    test('evaluates competitive bids using weighted composite matrix', async () => {
      const res = await fetch(`${baseUrl}/api/v1/sourcing/rfqs/RFQ-2026-081/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weights: { commercialWeight: 0.5, technicalWeight: 0.3, leadTimeWeight: 0.2 },
        }),
      });
      assert.equal(res.status, 200);
      const matrix = await res.json();
      assert.equal(matrix.rfqNumber, 'RFQ-2026-081');
      assert.ok(matrix.evaluatedBids.length >= 3);
      assert.ok(matrix.recommendedWinningBidId);
      assert.ok(matrix.projectedCostSavings > 0);
    });

    test('awards tender and auto-generates purchase order in P2P subledger', async () => {
      const res = await fetch(`${baseUrl}/api/v1/sourcing/rfqs/RFQ-2026-081/award`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quotationId: 'QUO-V1-081',
          poPrefix: 'PO-2026',
        }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.rfq.status, 'AWARDED');
      assert.equal(data.awardedQuotation.status, 'AWARDED');
      assert.ok(data.generatedPo.poNumber.startsWith('PO-2026-'));
    });

    test('fetches supplier scorecards with OTIF, quality acceptance, and tier ratings', async () => {
      const res = await fetch(`${baseUrl}/api/v1/sourcing/scorecards`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.scorecards.length >= 3);
      assert.ok(data.scorecards.some((s) => s.tier === 'GRADE_A_PLUS'));
    });
  });

  describe('22. Credit Risk Management, Dynamic Checks & Automated Dunning (SAP FSCM-CR & F150)', () => {
    test('retrieves evaluated customer credit risk profiles and exposures', async () => {
      const res = await fetch(`${baseUrl}/api/v1/credit/customers`);
      assert.equal(res.status, 200);
      const profiles = await res.json();
      assert.ok(profiles.length >= 3);
      assert.ok(profiles.some((p) => p.customerId === 'CUST-MAH-001'));
      assert.ok(profiles.some((p) => p.creditRating));
      assert.ok(profiles.some((p) => p.exposure && typeof p.exposure.utilizationPercent === 'number'));
    });

    test('retrieves single customer risk evaluation by customer ID', async () => {
      const res = await fetch(`${baseUrl}/api/v1/credit/customers/CUST-MAH-001`);
      assert.equal(res.status, 200);
      const profile = await res.json();
      assert.equal(profile.customerId, 'CUST-MAH-001');
      assert.ok(profile.riskScore >= 0 && profile.riskScore <= 100);
    });

    test('performs dynamic credit check on order entry', async () => {
      // Test approved check
      const passRes = await fetch(`${baseUrl}/api/v1/credit/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: 'SO-API-TEST-01',
          customerId: 'CUST-MAH-001',
          orderAmount: 100000,
        }),
      });
      assert.equal(passRes.status, 200);
      const passResult = await passRes.json();
      assert.equal(passResult.orderNumber, 'SO-API-TEST-01');
      assert.equal(passResult.passed, true);

      // Test blocked check due to limit overflow
      const blockRes = await fetch(`${baseUrl}/api/v1/credit/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: 'SO-API-TEST-02',
          customerId: 'CUST-MAH-001',
          orderAmount: 90000000, // 9 Crores exceeds limit
        }),
      });
      assert.equal(blockRes.status, 200);
      const blockResult = await blockRes.json();
      assert.equal(blockResult.passed, false);
      assert.equal(blockResult.status, 'BLOCKED');
      assert.equal(blockResult.blockReason, 'EXPOSURE_EXCEEDED');
    });

    test('retrieves blocked orders queue and executes release workflow (SAP VKM3)', async () => {
      const queueRes = await fetch(`${baseUrl}/api/v1/credit/blocked-orders`);
      assert.equal(queueRes.status, 200);
      const blockedOrders = await queueRes.json();
      assert.ok(blockedOrders.length > 0);

      // Release SO-API-TEST-02
      const releaseRes = await fetch(`${baseUrl}/api/v1/credit/orders/SO-API-TEST-02/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          releasedBy: 'Lead Credit Officer (A. Sen)',
          justification: 'Irrevocable LC confirmed with SBI Commercial Branch.',
        }),
      });
      assert.equal(releaseRes.status, 200);
      const releasedOrder = await releaseRes.json();
      assert.equal(releasedOrder.orderNumber, 'SO-API-TEST-02');
      assert.equal(releasedOrder.status, 'RELEASED');
      assert.equal(releasedOrder.releaseDetails.releasedBy, 'Lead Credit Officer (A. Sen)');
    });

    test('executes automated dunning run under Section 16 MSMED Act 2006 compound interest', async () => {
      const res = await fetch(`${baseUrl}/api/v1/credit/dunning/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runDate: '2026-10-01',
          rbiRepoRatePercent: 6.5,
        }),
      });
      assert.equal(res.status, 200);
      const dunningData = await res.json();
      assert.ok(dunningData.summary);
      assert.ok(dunningData.summary.totalAccountsDunned > 0);
      assert.ok(dunningData.summary.totalDemand > 0);
      assert.ok(dunningData.notices.length > 0);

      const level3 = dunningData.notices.find((n) => n.dunningLevel === 'LEVEL_3_LEGAL');
      if (level3) {
        assert.ok(level3.legalCitation.includes('MSMED'));
        assert.equal(level3.interestRatePercent, 19.5);
      }
    });
  });

  describe('11. Identity & Access Management (IAM / SAP GRC Parity)', () => {
    test('authenticates pre-seeded enterprise persona via POST /api/v1/auth/login', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'finance.lead@sutra.local',
          password: 'finance123',
        }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.tokens);
      assert.ok(data.tokens.accessToken);
      assert.equal(data.user.email, 'finance.lead@sutra.local');
      assert.equal(data.user.fullName, 'Anita Desai (VP Finance & Controller)');
      assert.ok(data.user.roles.includes('FinanceOfficer'));
      assert.ok(data.user.permissions.includes('ledger:post'));
    });

    test('rejects login with invalid credentials', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'finance.lead@sutra.local',
          password: 'wrongpassword',
        }),
      });
      assert.equal(res.status, 401);
    });

    test('lists enterprise users and returns permissions via GET /api/v1/auth/users', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/users`);
      assert.equal(res.status, 200);
      const users = await res.json();
      assert.ok(Array.isArray(users));
      assert.ok(users.length >= 6);

      const admin = users.find((u) => u.email === 'admin@sutra.local');
      assert.ok(admin);
      assert.equal(admin.isSuperAdmin, true);
      assert.ok(admin.permissions.includes('*'));
    });

    test('provisions a new corporate user via POST /api/v1/auth/users', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'tax.officer@sutra.local',
          fullName: 'Vikram Joshi',
          department: 'Direct & Indirect Taxation',
          password: 'taxpassword123',
          roles: ['FinanceOfficer'],
        }),
      });
      assert.equal(res.status, 201);
      const created = await res.json();
      assert.equal(created.email, 'tax.officer@sutra.local');
      assert.equal(created.department, 'Direct & Indirect Taxation');
      assert.ok(created.permissions.includes('tax:calculate'));

      // Verify that newly created user can log in immediately
      const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'tax.officer@sutra.local',
          password: 'taxpassword123',
        }),
      });
      assert.equal(loginRes.status, 200);
    });

    test('deactivates and reactivates user status via PATCH /api/v1/auth/users/:id/status', async () => {
      const usersRes = await fetch(`${baseUrl}/api/v1/auth/users`);
      const users = await usersRes.json();
      const taxUser = users.find((u) => u.email === 'tax.officer@sutra.local');
      assert.ok(taxUser);

      // Deactivate
      const deactRes = await fetch(`${baseUrl}/api/v1/auth/users/${taxUser.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      });
      assert.equal(deactRes.status, 200);
      const deactUser = await deactRes.json();
      assert.equal(deactUser.isActive, false);

      // Verify login is blocked
      const blockedLogin = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'tax.officer@sutra.local',
          password: 'taxpassword123',
        }),
      });
      assert.equal(blockedLogin.status, 401);

      // Reactivate
      const reactRes = await fetch(`${baseUrl}/api/v1/auth/users/${taxUser.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      });
      assert.equal(reactRes.status, 200);
    });

    test('resets user password via POST /api/v1/auth/users/:id/reset-password', async () => {
      const usersRes = await fetch(`${baseUrl}/api/v1/auth/users`);
      const users = await usersRes.json();
      const taxUser = users.find((u) => u.email === 'tax.officer@sutra.local');
      assert.ok(taxUser);

      const resetRes = await fetch(`${baseUrl}/api/v1/auth/users/${taxUser.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: 'brandNewPassword999' }),
      });
      assert.equal(resetRes.status, 200);

      // Verify old password fails
      const oldLogin = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'tax.officer@sutra.local',
          password: 'taxpassword123',
        }),
      });
      assert.equal(oldLogin.status, 401);

      // Verify new password succeeds
      const newLogin = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'tax.officer@sutra.local',
          password: 'brandNewPassword999',
        }),
      });
      assert.equal(newLogin.status, 200);
    });

    test('lists roles and permissions, and creates custom role', async () => {
      const permsRes = await fetch(`${baseUrl}/api/v1/auth/permissions`);
      assert.equal(permsRes.status, 200);
      const perms = await permsRes.json();
      assert.ok(perms.length >= 26);

      const rolesRes = await fetch(`${baseUrl}/api/v1/auth/roles`);
      assert.equal(rolesRes.status, 200);
      const roles = await rolesRes.json();
      assert.ok(roles.length >= 6);

      // Create custom role
      const createRoleRes = await fetch(`${baseUrl}/api/v1/auth/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId: 'CustomTreasuryAnalyst',
          name: 'Treasury Analyst',
          description: 'Cash management and bank reconciliation specialist',
          permissions: ['ledger:read', 'subledger:read', 'tax:calculate'],
        }),
      });
      assert.equal(createRoleRes.status, 201);
      const customRole = await createRoleRes.json();
      assert.equal(customRole.roleId, 'CustomTreasuryAnalyst');
      assert.equal(customRole.isSystemRole, false);
      assert.equal(customRole.permissions.length, 3);
    });
  });

  describe('12. No-Code Dynamic Entity & Schema Studio', () => {
    test('retrieves pre-seeded enterprise schemas via GET /api/v1/nocode/schemas', async () => {
      const res = await fetch(`${baseUrl}/api/v1/nocode/schemas`);
      assert.equal(res.status, 200);
      const schemas = await res.json();
      assert.ok(Array.isArray(schemas));
      assert.ok(schemas.length >= 3);

      const plant = schemas.find((s) => s.slug === 'plant_machinery');
      const fleet = schemas.find((s) => s.slug === 'fleet_vehicles');
      const it = schemas.find((s) => s.slug === 'it_hardware_assets');

      assert.ok(plant);
      assert.ok(fleet);
      assert.ok(it);
      assert.equal(fleet.fields.some((f) => f.name === 'vehicleRegNumber'), true);
      assert.equal(it.fields.some((f) => f.name === 'operatingSystem'), true);
    });

    test('retrieves individual schema by slug via GET /api/v1/nocode/schemas/:slug', async () => {
      const res = await fetch(`${baseUrl}/api/v1/nocode/schemas/fleet_vehicles`);
      assert.equal(res.status, 200);
      const schema = await res.json();
      assert.equal(schema.slug, 'fleet_vehicles');
      assert.equal(schema.name, 'Fleet Logistics & Commercial Vehicles');
    });

    test('creates a custom business entity via POST /api/v1/nocode/schemas', async () => {
      const res = await fetch(`${baseUrl}/api/v1/nocode/schemas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Solar Inverter Farm',
          slug: 'solar_inverters',
          description: 'Photovoltaic solar generation telemetry and inverter capacity',
          icon: 'cpu',
          fields: [
            { name: 'inverterTag', label: 'Inverter Serial Tag', type: 'text', required: true },
            { name: 'ratedCapacityKw', label: 'Rated Capacity (kW)', type: 'number', required: true, min: 1 },
            { name: 'gridConnected', label: 'Grid Feed Active', type: 'boolean', required: true },
            { name: 'coolingType', label: 'Cooling System', type: 'select', options: ['AIR_FORCED', 'LIQUID_COOLED'], required: true },
          ],
        }),
      });
      assert.equal(res.status, 201);
      const created = await res.json();
      assert.equal(created.schema.slug, 'solar_inverters');
      assert.equal(created.schema.fields.length, 4);
    });

    test('appends a new custom field to an existing schema via POST /api/v1/nocode/schemas/:slug/fields', async () => {
      const res = await fetch(`${baseUrl}/api/v1/nocode/schemas/solar_inverters/fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'warrantyYears',
          label: 'Warranty Period (Years)',
          type: 'number',
          required: false,
          min: 1,
          max: 25,
        }),
      });
      assert.equal(res.status, 201);
      const updated = await res.json();
      assert.equal(updated.field.name, 'warrantyYears');
      assert.equal(updated.schema.fields.length, 5);
    });

    test('records CRUD lifecycle: creates, updates, and deletes record in dynamic entity', async () => {
      // 1. Create Record
      const createRes = await fetch(`${baseUrl}/api/v1/nocode/records/solar_inverters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inverterTag: 'SOL-RAJ-INV-01',
          ratedCapacityKw: 250,
          gridConnected: true,
          coolingType: 'LIQUID_COOLED',
          warrantyYears: 10,
        }),
      });
      assert.equal(createRes.status, 201);
      const created = await createRes.json();
      assert.ok(created.record.id);
      assert.equal(created.record.inverterTag, 'SOL-RAJ-INV-01');
      const recId = created.record.id;

      // 2. Read Records
      const getRes = await fetch(`${baseUrl}/api/v1/nocode/records/solar_inverters`);
      assert.equal(getRes.status, 200);
      const getList = await getRes.json();
      assert.equal(getList.count, 1);
      assert.equal(getList.records[0].id, recId);

      // 3. Update Record
      const updateRes = await fetch(`${baseUrl}/api/v1/nocode/records/solar_inverters/${recId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inverterTag: 'SOL-RAJ-INV-01-UPGRADED',
          ratedCapacityKw: 300,
          gridConnected: true,
          coolingType: 'LIQUID_COOLED',
          warrantyYears: 15,
        }),
      });
      assert.equal(updateRes.status, 200);
      const updated = await updateRes.json();
      assert.equal(updated.record.inverterTag, 'SOL-RAJ-INV-01-UPGRADED');
      assert.equal(updated.record.ratedCapacityKw, 300);

      // 4. Delete Record
      const delRes = await fetch(`${baseUrl}/api/v1/nocode/records/solar_inverters/${recId}`, {
        method: 'DELETE',
      });
      assert.equal(delRes.status, 200);

      // Verify deletion
      const checkRes = await fetch(`${baseUrl}/api/v1/nocode/records/solar_inverters`);
      const checkList = await checkRes.json();
      assert.equal(checkList.count, 0);
    });

    test('deletes dynamic entity schema and records via DELETE /api/v1/nocode/schemas/:slug', async () => {
      const delRes = await fetch(`${baseUrl}/api/v1/nocode/schemas/solar_inverters`, {
        method: 'DELETE',
      });
      assert.equal(delRes.status, 200);

      const checkRes = await fetch(`${baseUrl}/api/v1/nocode/schemas/solar_inverters`);
      assert.equal(checkRes.status, 404);
    });
  });

  describe('12. System Installation, Module Selection & Platform Admin Endpoints', () => {
    test('retrieves system modules and active states via GET /api/v1/system/modules', async () => {
      const res = await fetch(`${baseUrl}/api/v1/system/modules`);
      assert.equal(res.status, 200);
      const data = await res.json();

      assert.ok(Array.isArray(data.modules));
      assert.ok(data.modules.length >= 8);
      assert.ok(Array.isArray(data.activeModuleIds));
      assert.ok(data.activeCount >= 5);

      const dashboard = data.modules.find((m) => m.id === 'dashboard');
      assert.ok(dashboard);
      assert.equal(dashboard.isCore, true);
      assert.equal(dashboard.isEnabled, true);

      const copilot = data.modules.find((m) => m.id === 'copilot');
      assert.ok(copilot);
      assert.equal(copilot.isEnabled, true);
    });

    test('toggles optional module via POST /api/v1/system/modules', async () => {
      // Toggle vault module off
      const disableRes = await fetch(`${baseUrl}/api/v1/system/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId: 'vault', isEnabled: false }),
      });
      assert.equal(disableRes.status, 200);
      const disableData = await disableRes.json();
      assert.equal(disableData.activeModuleIds.includes('vault'), false);

      // Re-enable vault module
      const enableRes = await fetch(`${baseUrl}/api/v1/system/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId: 'vault', isEnabled: true }),
      });
      assert.equal(enableRes.status, 200);
      const enableData = await enableRes.json();
      assert.equal(enableData.activeModuleIds.includes('vault'), true);
    });

    test('rejects disabling core platform modules via POST /api/v1/system/modules', async () => {
      const res = await fetch(`${baseUrl}/api/v1/system/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId: 'dashboard', isEnabled: false }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, 'ModuleUpdateError');
    });

    test('retrieves platform setup state via GET /api/v1/system/setup', async () => {
      const res = await fetch(`${baseUrl}/api/v1/system/setup`);
      assert.equal(res.status, 200);
      const data = await res.json();

      assert.ok(data.organization);
      assert.ok(data.superAdminEmail);
      assert.ok(typeof data.userCount === 'number');
      assert.ok(typeof data.hasOrgAdmin === 'boolean');
    });

    test('configures client setup and provisions org administrator via POST /api/v1/system/setup', async () => {
      const res = await fetch(`${baseUrl}/api/v1/system/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName: 'Larsen & Toubro Heavy Engineering',
          gstin: '27AAACL0123P1ZQ',
          currency: 'INR',
          jurisdiction: 'IN',
          enabledModules: ['dashboard', 'auth', 'supplychain', 'compliance', 'copilot'],
          orgAdmin: {
            email: 'org.admin@lt-heavy.in',
            password: 'SecureOrgPassword2026!',
            fullName: 'Subhashish Roy',
            department: 'Corporate Headquarters',
          },
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.message.includes('successfully'));
      assert.equal(data.setupState.organization.name, 'Larsen & Toubro Heavy Engineering');
      assert.equal(data.setupState.organization.gstin, '27AAACL0123P1ZQ');
      assert.ok(data.orgAdmin);
      assert.equal(data.orgAdmin.email, 'org.admin@lt-heavy.in');
      assert.ok(data.orgAdmin.roles.includes('OrgAdministrator'));
    });
  });
});


