import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  GSTINValidator,
  IndianTaxEngine,
  GSTR3BEngine,
  EInvoiceService,
  EWayBillGenerator,
  IndianPayrollEngine,
  TDSEngine,
  CustomsEngine,
  CustomsStandardGlAccount,
  CustomsDefaults,
  LutVerificationStatus,
} from '../packages/compliance-india/dist/index.js';

describe('Sutra India Compliance Suite', () => {
  describe('GSTIN Modulo-36 Checksum Validator', () => {
    test('validates valid 15-character GSTIN with correct checksum', () => {
      // 27AABCS1429B1ZU has valid Modulo-36 checksum 'U'
      const res = GSTINValidator.validate('27AABCS1429B1ZU');
      assert.equal(res.isValid, true);
      assert.equal(res.stateCode, '27');
      assert.equal(res.pan, 'AABCS1429B');
      assert.equal(res.entityNumber, '1');
    });

    test('rejects GSTIN with invalid checksum digit', () => {
      // Corrupting the checksum from 'U' to 'X'
      const res = GSTINValidator.validate('27AABCS1429B1ZX');
      assert.equal(res.isValid, false);
      assert.match(res.errorMessage, /checksum mismatch/i);
    });

    test('rejects malformed GSTIN length or pattern', () => {
      const res = GSTINValidator.validate('INVALID_GSTIN_123');
      assert.equal(res.isValid, false);
      assert.match(res.errorMessage, /Invalid GSTIN/i);
    });
  });

  describe('Indian Tax Engine (Intra vs Inter State GST)', () => {
    test('calculates 9% CGST + 9% SGST for Intra-State supply (MH to MH)', () => {
      const breakdown = IndianTaxEngine.calculate({
        supplierGstin: '27AABCS1429B1ZU', // Maharashtra
        placeOfSupplyStateCode: '27',     // Maharashtra
        hsnSacCode: '8704',
        taxableAmount: 100000,
        customTaxRate: 18,
      });

      assert.equal(breakdown.isInterState, false);
      assert.equal(breakdown.cgstRate, 9);
      assert.equal(breakdown.sgstRate, 9);
      assert.equal(breakdown.igstRate, 0);
      assert.equal(breakdown.cgstAmount, 9000);
      assert.equal(breakdown.sgstAmount, 9000);
      assert.equal(breakdown.igstAmount, 0);
      assert.equal(breakdown.totalTax, 18000);
      assert.equal(breakdown.totalInvoiceAmount, 118000);
    });

    test('calculates 18% IGST for Inter-State supply (MH to KA)', () => {
      const breakdown = IndianTaxEngine.calculate({
        supplierGstin: '27AABCS1429B1ZU', // Maharashtra (27)
        placeOfSupplyStateCode: '29',     // Karnataka (29)
        hsnSacCode: '8704',
        taxableAmount: 200000,
        customTaxRate: 18,
      });

      assert.equal(breakdown.isInterState, true);
      assert.equal(breakdown.cgstAmount, 0);
      assert.equal(breakdown.sgstAmount, 0);
      assert.equal(breakdown.igstAmount, 36000);
      assert.equal(breakdown.totalTax, 36000);
      assert.equal(breakdown.totalInvoiceAmount, 236000);
    });
  });

  describe('GSTR-3B Statutory Rule 88A Set-off Engine', () => {
    test('enforces Rule 88A priority: IGST ITC fully exhausted before CGST/SGST', () => {
      const summary = GSTR3BEngine.computeSummary({
        gstin: '27AABCS1429B1ZU',
        returnPeriod: '092026',
        outwardTaxableSupplies: {
          taxableValue: 1000000,
          igst: 50000,
          cgst: 45000,
          sgst: 45000,
          cess: 0,
        },
        itcAvailable: {
          allOtherITC: {
            igst: 80000, // Surplus IGST ITC
            cgst: 20000,
            sgst: 20000,
          },
        },
      });

      // IGST liability (50k) is fully cleared by IGST ITC (80k), leaving 0 cash payable for IGST
      assert.equal(summary.taxPayableCash.igst, 0);
      assert.equal(summary.totalOutwardTax.igst, 50000);
      assert.ok(summary.taxPayableCash.total < 50000);
    });
  });

  describe('E-Invoice & E-Way Bill Generation', () => {
    test('generates valid 64-character SHA-256 IRN hash for E-Invoice', () => {
      const irn = EInvoiceService.generateIRN('27AABCS1429B1ZU', '2026-27', 'INV', 'INV-001');
      assert.equal(typeof irn, 'string');
      assert.equal(irn.length, 64);
    });

    test('calculates E-Way Bill validity based on 200 km/day statutory rule', () => {
      // Up to 200 km = 1 day; 350 km = 2 days
      const days150 = EWayBillGenerator.calculateValidityDays(150);
      const days350 = EWayBillGenerator.calculateValidityDays(350);
      assert.equal(days150, 1);
      assert.equal(days350, 2);
    });
  });

  describe('Indian Statutory Payroll Engine', () => {
    test('calculates EPF (12% capped at ₹15,000 base) and ESI (< ₹21,000 gross)', () => {
      const payroll = IndianPayrollEngine.calculate({
        basicSalary: 12000,
        dearnessAllowance: 2000,
        hra: 4000,
        specialAllowance: 1000,
        stateCode: '27', // Maharashtra
        gender: 'M',
        monthNumber: 1,
      });

      // PF Wage = 12000 + 2000 = 14,000
      // Employee PF (12%) = 1680
      assert.equal(payroll.employeeDeductions.epf, 1680);
      // Employer EPS (8.33% of 14,000) = 1166.2
      assert.equal(Math.round(payroll.employerContributions.eps), 1166);
      // Gross = 19,000 (< 21,000 cap), so ESI is applicable (> 0)
      assert.ok(payroll.employeeDeductions.esi > 0);
      assert.ok(payroll.netTakeHomeSalary > 0);
    });
  });

  describe('Income Tax TDS Engine', () => {
    test('applies Section 194Q (0.1% on purchase of goods) with PAN', () => {
      const tds = TDSEngine.calculate({
        sectionKey: '194Q',
        grossAmount: 1000000,
        isCompanyOrFirm: true,
        hasValidPan: true,
        cumulativeFYAmount: 5500000, // Above ₹50L threshold
      });

      assert.equal(tds.applicable, true);
      assert.equal(tds.appliedRate, 0.1);
      assert.equal(tds.tdsAmount, 1000);
    });

    test('applies Section 206AA penalty rate (20%) when PAN is missing', () => {
      const tds = TDSEngine.calculate({
        sectionKey: '194J_PROF', // Normally 10%
        grossAmount: 100000,
        isCompanyOrFirm: false,
        hasValidPan: false, // No PAN triggers Sec 206AA (20%)
      });

      assert.equal(tds.applicable, true);
      assert.equal(tds.appliedRate, 20.0);
      assert.equal(tds.tdsAmount, 20000);
    });
  });

  describe('Indian Customs & Cross-Border Trade Engine', () => {
    test('calculates BCD, SWS, and creditable IGST on imported goods (CIF valuation)', () => {
      const result = CustomsEngine.calculateImportDuty({
        cifValueInr: 1000000,
        hsnCode: '84715000',
        basicCustomsDutyPercent: 7.5,
        swsPercent: 10,
        igstPercent: 18,
      });

      assert.equal(result.assessableValue, 1000000);
      assert.equal(result.bcdAmount, 75000);
      assert.equal(result.swsAmount, 7500);
      assert.equal(result.igstAmount, 194850);
      assert.equal(result.creditableItc, 194850);
      assert.equal(result.nonCreditableDutyCost, 82500);
      assert.equal(result.totalCustomsDuty, 277350);
      assert.equal(result.totalLandedCost, 1277350);

      assert.equal(result.glVoucherLines.length, 4);
      const totalDr = result.glVoucherLines.reduce((acc, l) => acc + l.debit, 0);
      const totalCr = result.glVoucherLines.reduce((acc, l) => acc + l.credit, 0);
      assert.equal(totalDr, totalCr);

      // Verify that GL vouchers use typed named constants
      assert.equal(result.glVoucherLines[0].accountCode, CustomsStandardGlAccount.INVENTORY_RAW_MATERIALS_LANDED);
      assert.equal(result.glVoucherLines[1].accountCode, CustomsStandardGlAccount.INPUT_TAX_CREDIT_IGST_IMPORTS);
      assert.equal(result.glVoucherLines[2].accountCode, CustomsStandardGlAccount.CUSTOMS_PORT_DUTIES_PAYABLE);
      assert.equal(result.glVoucherLines[3].accountCode, CustomsStandardGlAccount.FOREIGN_TRADE_AP_SUPPLIER);
    });

    test('validates Letter of Undertaking (LUT) under Rule 96A for zero-rated exports', () => {
      const validLut = CustomsEngine.verifyLut({
        lutArn: 'AD270326001234F',
        financialYear: '2026-27',
        exporterGstin: '27AABCS1429B1ZU',
      });
      assert.equal(validLut.isValid, true);
      assert.equal(validLut.status, LutVerificationStatus.ACTIVE_VALID_LUT);

      const invalidLut = CustomsEngine.verifyLut({
        lutArn: 'INVALID_ARN_999',
        financialYear: '2026-27',
        exporterGstin: '27AABCS1429B1ZU',
      });
      assert.equal(invalidLut.isValid, false);
      assert.equal(invalidLut.status, LutVerificationStatus.INVALID_SYNTAX);
    });
  });
});

