import { Router } from 'express';
import { ComplianceController } from '../controllers/compliance.controller';

const router = Router();

router.post('/gst/validate-gstin', ComplianceController.validateGstin);
router.post('/gst/calculate-tax', ComplianceController.calculateTax);
router.post('/einvoice/generate', ComplianceController.generateEInvoice);
router.post('/tds/calculate', ComplianceController.calculateTds);
router.post('/gstr1/generate', ComplianceController.generateGstr1);
router.post('/gstr3b/summary', ComplianceController.getGstr3bSummary);
router.post('/ewaybill/generate', ComplianceController.generateEWayBill);
router.post('/payroll/calculate', ComplianceController.calculatePayroll);
router.post('/customs/import-duty', ComplianceController.calculateCustomsDuty);
router.post('/export/lut-verification', ComplianceController.verifyLut);
router.post('/calculate-jurisdiction-tax', ComplianceController.calculateJurisdictionTax);

export default router;
