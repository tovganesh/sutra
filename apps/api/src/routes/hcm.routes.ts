import { Router } from 'express';
import { HcmController } from '../controllers/hcm.controller';

const router = Router();

router.get('/employees', HcmController.getEmployees);
router.post('/employees', HcmController.registerEmployee);
router.get('/employees/:id', HcmController.getEmployeeById);
router.post('/attendance', HcmController.recordAttendance);
router.get('/employees/:id/salary-preview', HcmController.getSalaryPreview);
router.post('/payroll/run', HcmController.runPayroll);
router.get('/payroll/runs/:month', HcmController.getPayrollRun);

export default router;
