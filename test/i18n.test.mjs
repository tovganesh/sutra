import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } from '../apps/web/src/i18n/currencies.ts';
import { messages, SUPPORTED_LOCALES, DEFAULT_LOCALE } from '../apps/web/src/locales/index.ts';

describe('Sutra Frontend i18n & Multi-Currency Engine Suite', () => {
  describe('Locale Dictionaries & Symmetry', () => {
    test('defines required supported locales: en-IN, en-US, hi-IN', () => {
      assert.ok(SUPPORTED_LOCALES['en-IN']);
      assert.ok(SUPPORTED_LOCALES['en-US']);
      assert.ok(SUPPORTED_LOCALES['hi-IN']);
      assert.equal(DEFAULT_LOCALE, 'en-IN');
    });

    test('verifies all 11 core module sections exist in en-IN, en-US, and hi-IN', () => {
      const requiredSections = [
        'common',
        'nav',
        'header',
        'dashboard',
        'financial',
        'compliance',
        'supplyChain',
        'nocode',
        'copilot',
        'vault',
        'auth',
      ];

      for (const locale of ['en-IN', 'en-US', 'hi-IN']) {
        const msg = messages[locale];
        assert.ok(msg, `Locale messages for ${locale} must exist`);
        for (const sec of requiredSections) {
          assert.ok(msg[sec], `Section "${sec}" must exist in ${locale}`);
          assert.equal(typeof msg[sec], 'object', `Section "${sec}" must be an object`);
        }
      }
    });

    test('deeply validates key symmetry between en-IN and hi-IN', () => {
      function validateKeys(sourceObj, targetObj, path = '') {
        for (const [key, value] of Object.entries(sourceObj)) {
          const currentPath = path ? `${path}.${key}` : key;
          assert.ok(
            key in targetObj,
            `Missing translation key in target: ${currentPath}`
          );
          if (typeof value === 'object' && value !== null) {
            assert.equal(
              typeof targetObj[key],
              'object',
              `Type mismatch for ${currentPath}`
            );
            validateKeys(value, targetObj[key], currentPath);
          } else {
            assert.equal(
              typeof targetObj[key],
              'string',
              `Target key ${currentPath} must be a string`
            );
            assert.ok(
              targetObj[key].length > 0,
              `Target key ${currentPath} must not be empty`
            );
          }
        }
      }

      validateKeys(messages['en-IN'], messages['hi-IN'], 'root');
      validateKeys(messages['en-IN'], messages['en-US'], 'root');
    });

    test('verifies all 15 ERP cockpit submodules are localized in SupplyChain', () => {
      const requiredTabs = [
        'inventory',
        'o2c',
        'p2p',
        'subledger',
        'mfg',
        'assets',
        'quality',
        'controlling',
        'maintenance',
        'treasury',
        'hcm',
        'projects',
        'warehouse',
        'multicurrency',
        'transportation',
      ];

      for (const locale of ['en-IN', 'en-US', 'hi-IN']) {
        const tabs = messages[locale].supplyChain.tabs;
        for (const tab of requiredTabs) {
          assert.ok(tabs[tab], `SupplyChain tab "${tab}" must exist in ${locale}`);
        }
      }
    });

    test('verifies SupplyChain ERP panels, columns, labels, and buttons are fully populated', () => {
      for (const locale of ['en-IN', 'en-US', 'hi-IN']) {
        const sc = messages[locale].supplyChain;
        assert.ok(Object.keys(sc.panels).length >= 35, `Panels in ${locale} must be >= 35`);
        assert.ok(Object.keys(sc.panelSubs).length >= 30, `PanelSubs in ${locale} must be >= 30`);
        assert.ok(Object.keys(sc.cols).length >= 80, `Cols in ${locale} must be >= 80`);
        assert.ok(Object.keys(sc.labels).length >= 8, `Labels in ${locale} must be >= 8`);
        assert.ok(Object.keys(sc.buttons).length >= 30, `Buttons in ${locale} must be >= 30`);
        assert.ok(Object.keys(sc.badges).length >= 5, `Badges in ${locale} must be >= 5`);
      }
    });

    test('verifies compliance module dropdown states, TDS, jurisdictions, and results dictionaries', () => {
      for (const locale of ['en-IN', 'en-US', 'hi-IN']) {
        const comp = messages[locale].compliance;
        assert.ok(comp.states && Object.keys(comp.states).length === 6, `States in ${locale} must have 6 keys`);
        assert.ok(comp.tdsSections && Object.keys(comp.tdsSections).length === 4, `TDS sections in ${locale} must have 4 keys`);
        assert.ok(comp.jurisdictions && Object.keys(comp.jurisdictions).length === 4, `Jurisdictions in ${locale} must have 4 keys`);
        assert.ok(comp.results && Object.keys(comp.results).length >= 50, `Results in ${locale} must have >= 50 keys`);
      }
    });

    test('verifies copilot providers/results, nocode status options, and header userAvatarTitle dictionaries', () => {
      for (const locale of ['en-IN', 'en-US', 'hi-IN']) {
        const copilot = messages[locale].copilot;
        assert.ok(copilot.providers && Object.keys(copilot.providers).length === 3, `Copilot providers in ${locale} must have 3 keys`);
        assert.ok(copilot.results && Object.keys(copilot.results).length >= 12, `Copilot results in ${locale} must have >= 12 keys`);

        const nocode = messages[locale].nocode;
        assert.ok(nocode.statusOptions && Object.keys(nocode.statusOptions).length === 3, `NoCode statusOptions in ${locale} must have 3 keys`);
        assert.ok(nocode.validationAlert && nocode.validationAlert.length > 0);
        assert.ok(nocode.enterFieldPrompt && nocode.enterFieldPrompt.length > 0);

        const header = messages[locale].header;
        assert.ok(header.userAvatarTitle && header.userAvatarTitle.length > 0);
      }
    });

    test('verifies supplyChain messages/transportation, vault, and auth dictionaries', () => {
      for (const locale of ['en-IN', 'en-US', 'hi-IN']) {
        const sc = messages[locale].supplyChain;
        assert.ok(sc.messages && Object.keys(sc.messages).length === 4, `SC messages in ${locale} must have 4 keys`);
        assert.ok(sc.transportation && Object.keys(sc.transportation).length === 17, `SC transportation in ${locale} must have 17 keys`);

        const vault = messages[locale].vault;
        assert.ok(vault.buckets && Object.keys(vault.buckets).length === 2, `Vault buckets in ${locale} must have 2 keys`);
        assert.ok(vault.entities && Object.keys(vault.entities).length === 4, `Vault entities in ${locale} must have 4 keys`);
        assert.ok(vault.timestamps && Object.keys(vault.timestamps).length === 2, `Vault timestamps in ${locale} must have 2 keys`);
        assert.ok(vault.modal && Object.keys(vault.modal).length === 7, `Vault modal in ${locale} must have 7 keys`);
        assert.ok(vault.kpis && Object.keys(vault.kpis).length === 8, `Vault kpis in ${locale} must have 8 keys`);

        const auth = messages[locale].auth;
        assert.ok(auth.providers && Object.keys(auth.providers).length === 3, `Auth providers in ${locale} must have 3 keys`);
        assert.ok(auth.alerts && Object.keys(auth.alerts).length === 4, `Auth alerts in ${locale} must have 4 keys`);
        assert.ok(auth.ssoResults && Object.keys(auth.ssoResults).length === 9, `Auth ssoResults in ${locale} must have 9 keys`);
      }
    });

    test('verifies dashboard parity rows, financial kpis/simulator, and nocode fields dictionaries', () => {
      for (const locale of ['en-IN', 'en-US', 'hi-IN']) {
        const dashboard = messages[locale].dashboard;
        assert.ok(dashboard.parity.rows && Object.keys(dashboard.parity.rows).length === 15, `Parity rows in ${locale} must have 15 items`);
        for (const [key, val] of Object.entries(dashboard.parity.rows)) {
          assert.ok(val.sap && val.sap.length > 0, `SAP text for ${key} in ${locale} must not be empty`);
          assert.ok(val.sutra && val.sutra.length > 0, `Sutra text for ${key} in ${locale} must not be empty`);
        }

        const fin = messages[locale].financial;
        assert.ok(fin.kpis && Object.keys(fin.kpis).length === 11, `Financial kpis in ${locale} must have 11 keys`);
        assert.ok(fin.simulator && Object.keys(fin.simulator).length === 18, `Financial simulator in ${locale} must have 18 keys`);

        const nocode = messages[locale].nocode;
        assert.ok(nocode.fields && Object.keys(nocode.fields).length === 5, `NoCode fields in ${locale} must have 5 keys`);
        assert.ok(nocode.records && Object.keys(nocode.records).length === 6, `NoCode records in ${locale} must have 6 keys`);

        const copilot = messages[locale].copilot;
        assert.ok(copilot.fallbackExecutionAnswer && copilot.fallbackExecutionAnswer.length > 0);
        assert.ok(copilot.fallbackEngineMeta && copilot.fallbackEngineMeta.length > 0);
      }
    });
  });

  describe('Multi-Currency Configuration & Live FX Engine', () => {
    test('configures all 6 enterprise currencies with proper symbols and exchange rates', () => {
      const expectedCurrencies = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];
      for (const code of expectedCurrencies) {
        const config = SUPPORTED_CURRENCIES[code];
        assert.ok(config, `Currency config for ${code} must exist`);
        assert.equal(config.code, code);
        assert.ok(config.symbol, `Currency ${code} must have a symbol`);
        assert.ok(config.rateAgainstINR > 0, `Currency ${code} rate must be > 0`);
        assert.ok(config.locale, `Currency ${code} must have a locale`);
      }
      assert.equal(DEFAULT_CURRENCY, 'INR');
    });

    test('validates INR base rate is exactly 1.0', () => {
      assert.equal(SUPPORTED_CURRENCIES.INR.rateAgainstINR, 1.0);
      assert.equal(SUPPORTED_CURRENCIES.INR.symbol, '₹');
      assert.equal(SUPPORTED_CURRENCIES.INR.decimalPlaces, 0);
    });

    test('verifies FX conversion calculations against INR for foreign currencies', () => {
      const inrAmount = 12000000; // 1.2 Crore INR

      // USD conversion at rate 0.0116
      const usdConverted = inrAmount * SUPPORTED_CURRENCIES.USD.rateAgainstINR;
      assert.equal(usdConverted, 139200);

      // EUR conversion at rate 0.0108
      const eurConverted = inrAmount * SUPPORTED_CURRENCIES.EUR.rateAgainstINR;
      assert.equal(eurConverted, 129600);

      // GBP conversion at rate 0.0092
      const gbpConverted = inrAmount * SUPPORTED_CURRENCIES.GBP.rateAgainstINR;
      assert.equal(gbpConverted, 110400);

      // AED conversion at rate 0.0426
      const aedConverted = inrAmount * SUPPORTED_CURRENCIES.AED.rateAgainstINR;
      assert.equal(aedConverted, 511200);

      // SGD conversion at rate 0.0154
      const sgdConverted = inrAmount * SUPPORTED_CURRENCIES.SGD.rateAgainstINR;
      assert.equal(sgdConverted, 184800);
    });

    test('verifies dynamic string parameter interpolation', () => {
      const template = messages['en-IN'].financial.currencyBadge;
      const interpolated = template.replace('{code}', 'USD').replace('{symbol}', '$');
      assert.equal(interpolated, 'Currency: USD ($)');

      const hiTemplate = messages['hi-IN'].financial.currencyBadge;
      const hiInterpolated = hiTemplate.replace('{code}', 'USD').replace('{symbol}', '$');
      assert.equal(hiInterpolated, 'मुद्रा: USD ($)');
    });
  });
});
