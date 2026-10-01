import { Request, Response } from 'express';
import { HttpStatus } from '@sutra/core';
import {
  GSTINValidator,
  IndianTaxEngine,
  EInvoiceService,
  TDSEngine,
  GSTR1Generator,
  GSTR3BEngine,
  EWayBillGenerator,
  IndianPayrollEngine,
  CustomsEngine,
} from '@sutra/compliance-india';
import { multiCurrencyEngine } from '../services/engine.registry';
import { sendError } from '../helpers/response.helper';

export class ComplianceController {
  public static validateGstin(req: Request, res: Response) {
    const { gstin } = req.body;
    if (!gstin) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingField', 'compliance.gstinRequired');
    }
    const result = GSTINValidator.validate(gstin);
    res.json(result);
  }

  public static calculateTax(req: Request, res: Response) {
    const { supplierGstin, recipientGstin, placeOfSupplyStateCode, hsnSacCode, taxableAmount, customTaxRate } = req.body;
    if (!supplierGstin || !placeOfSupplyStateCode || taxableAmount === undefined) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingParameters', 'compliance.missingTaxParams');
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
  }

  public static generateEInvoice(req: Request, res: Response) {
    const { supplierGstin, buyerGstin, financialYear, docNo, docDate, totalValue, itemCount } = req.body;
    if (!supplierGstin || !buyerGstin || !docNo) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingDetails', 'compliance.missingEinvoiceDetails');
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
  }

  public static calculateTds(req: Request, res: Response) {
    const { sectionKey, grossAmount, isCompanyOrFirm, hasValidPan, cumulativeFYAmount } = req.body;
    if (!sectionKey || grossAmount === undefined) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingFields', 'compliance.sectionKeyAndGrossRequired');
    }

    const result = TDSEngine.calculate({
      sectionKey,
      grossAmount: Number(grossAmount),
      isCompanyOrFirm: Boolean(isCompanyOrFirm),
      hasValidPan: hasValidPan !== undefined ? Boolean(hasValidPan) : true,
      cumulativeFYAmount: cumulativeFYAmount ? Number(cumulativeFYAmount) : 0,
    });

    res.json(result);
  }

  public static generateGstr1(req: Request, res: Response) {
    const { supplierGstin, period, invoices } = req.body;
    if (!supplierGstin || !invoices || !Array.isArray(invoices)) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingFields', 'compliance.gstinAndInvoicesRequired');
    }

    const payload = GSTR1Generator.generate(
      supplierGstin,
      period || '092026',
      invoices
    );
    res.json(payload);
  }

  public static getGstr3bSummary(req: Request, res: Response) {
    const input = req.body;
    if (!input.gstin || !input.outwardTaxableSupplies || !input.itcAvailable) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingParameters', 'compliance.missingGstr3bParams');
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
  }

  public static generateEWayBill(req: Request, res: Response) {
    const input = req.body;
    if (!input.docNo || !input.fromGstin || !input.toGstin || !input.totalValue) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingParameters', 'compliance.missingEwayParams');
    }

    const payload = EWayBillGenerator.generatePayload(input);
    const validityDays = EWayBillGenerator.calculateValidityDays(input.approximateDistanceKm || 150);

    res.json({
      ewbNumber: `EWB${Date.now()}`,
      generatedAt: new Date().toISOString(),
      validUntilDays: validityDays,
      payload,
    });
  }

  public static calculatePayroll(req: Request, res: Response) {
    const { basicSalary, dearnessAllowance, hra, specialAllowance, stateCode, gender, monthNumber, optHigherPF } = req.body;
    if (basicSalary === undefined || !stateCode) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingFields', 'compliance.basicSalaryAndStateRequired');
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
  }

  public static calculateCustomsDuty(req: Request, res: Response) {
    const {
      cifValueInr,
      hsnCode,
      basicCustomsDutyPercent,
      swsPercent,
      igstPercent,
      compensationCessPercent,
      antiDumpingDuty,
    } = req.body;

    if (cifValueInr === undefined || !hsnCode) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingMandatoryFields', 'compliance.customsFieldsRequired');
    }

    const result = CustomsEngine.calculateImportDuty({
      cifValueInr: Number(cifValueInr),
      hsnCode: String(hsnCode),
      basicCustomsDutyPercent: basicCustomsDutyPercent !== undefined ? Number(basicCustomsDutyPercent) : undefined,
      swsPercent: swsPercent !== undefined ? Number(swsPercent) : undefined,
      igstPercent: igstPercent !== undefined ? Number(igstPercent) : undefined,
      compensationCessPercent: compensationCessPercent !== undefined ? Number(compensationCessPercent) : undefined,
      antiDumpingDuty: antiDumpingDuty !== undefined ? Number(antiDumpingDuty) : undefined,
    });

    res.json(result);
  }

  public static verifyLut(req: Request, res: Response) {
    const { lutArn, financialYear, exporterGstin } = req.body;

    if (!lutArn || !financialYear || !exporterGstin) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingMandatoryFields', 'compliance.lutFieldsRequired');
    }

    const result = CustomsEngine.verifyLut({
      lutArn: String(lutArn),
      financialYear: String(financialYear),
      exporterGstin: String(exporterGstin),
    });

    res.json(result);
  }

  public static calculateJurisdictionTax(req: Request, res: Response) {
    const { countryCode, taxableAmount, customerStateOrRegion, companyStateOrRegion, taxRegistrationNumber } = req.body;
    if (!countryCode || taxableAmount === undefined) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingRequiredFields', 'multicurrency.taxFieldsRequired');
    }

    try {
      const result = multiCurrencyEngine.calculateJurisdictionTax(countryCode, {
        taxableAmount: Number(taxableAmount),
        customerStateOrRegion,
        companyStateOrRegion,
        taxRegistrationNumber,
      });
      res.json({ countryCode: countryCode.toUpperCase(), taxableAmount: Number(taxableAmount), ...result });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tax calculation failed';
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'JurisdictionTaxError', message: msg });
    }
  }
}
