import { Request, Response } from 'express';
import { HttpStatus, EmployeeStatus } from '@sutra/core';
import { hcmEngine } from '../services/engine.registry';
import { sendError } from '../helpers/response.helper';
import { tReq } from '../helpers/i18n.helper';

export class HcmController {
  public static getEmployees(req: Request, res: Response) {
    const department = req.query.department ? String(req.query.department) : undefined;
    res.json(hcmEngine.listEmployees(department));
  }

  public static registerEmployee(req: Request, res: Response) {
    const { employeeId, fullName, department, designation, costCenter, salaryStructure } = req.body;
    if (!employeeId || !fullName || !department || !designation || !costCenter || !salaryStructure) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingFields', 'hcm.empFieldsRequired');
    }
    const emp = hcmEngine.registerEmployee({
      ...req.body,
      employmentType: req.body.employmentType || 'FULL_TIME',
      status: req.body.status || EmployeeStatus.ACTIVE,
      dateOfJoining: req.body.dateOfJoining || new Date().toISOString().split('T')[0],
    });
    res.status(HttpStatus.CREATED).json(emp);
  }

  public static getEmployeeById(req: Request, res: Response) {
    const id = String(req.params.id);
    const emp = hcmEngine.getEmployee(id);
    if (!emp) {
      return res.status(HttpStatus.NOT_FOUND).json({
        error: tReq(req, 'hcm.empNotFound', { id }),
      });
    }
    res.json(emp);
  }

  public static recordAttendance(req: Request, res: Response) {
    const { employeeId, month, totalWorkingDays } = req.body;
    if (!employeeId || !month || totalWorkingDays === undefined) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingFields', 'hcm.attFieldsRequired');
    }
    const rec = hcmEngine.recordAttendance({
      employeeId,
      month,
      totalWorkingDays: Number(totalWorkingDays),
      presentDays: req.body.presentDays !== undefined ? Number(req.body.presentDays) : Number(totalWorkingDays),
      paidLeaveDays: req.body.paidLeaveDays !== undefined ? Number(req.body.paidLeaveDays) : 0,
      lossOfPayDays: req.body.lossOfPayDays !== undefined ? Number(req.body.lossOfPayDays) : 0,
    });
    res.status(HttpStatus.CREATED).json(rec);
  }

  public static getSalaryPreview(req: Request, res: Response) {
    const employeeId = String(req.params.id);
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
    try {
      const slip = hcmEngine.calculateEmployeeSalary(employeeId, month);
      res.json(slip);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'hcm.salaryFailed');
      res.status(HttpStatus.NOT_FOUND).json({ error: 'SalaryCalculationError', message: msg });
    }
  }

  public static runPayroll(req: Request, res: Response) {
    const month = req.body.month || new Date().toISOString().slice(0, 7);
    try {
      const result = hcmEngine.executeMonthlyPayrollRun(month);
      res.status(HttpStatus.CREATED).json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'hcm.payrollFailed');
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'PayrollRunError', message: msg });
    }
  }

  public static getPayrollRun(req: Request, res: Response) {
    const month = String(req.params.month);
    const run = hcmEngine.getPayrollRun(month);
    if (!run) {
      return res.status(HttpStatus.NOT_FOUND).json({
        error: tReq(req, 'hcm.payrollNotFound', { month }),
      });
    }
    res.json(run);
  }
}
