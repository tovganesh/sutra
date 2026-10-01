/**
 * Sutra Human Capital Management & Core HR Engine (SAP SuccessFactors / HCM Equivalent)
 * Manages employee master data, attendance & LOP tracking, statutory deductions (EPF/ESI/PT/TDS),
 * automated payslip generation, and balanced multi-line General Ledger payroll vouchers.
 */

import {
  EmployeeMaster,
  AttendanceRecord,
  Payslip,
  StatutoryDeductions,
  PayrollRunResult,
} from './hcm-types.js';
import { EmployeeStatus } from '../common/constants.js';

export class HcmEngine {
  private employees: Map<string, EmployeeMaster> = new Map();
  private attendanceRecords: Map<string, AttendanceRecord> = new Map(); // key = `${employeeId}:${month}`
  private payrollRuns: Map<string, PayrollRunResult> = new Map();

  constructor() {
    this.seedDefaultEmployees();
  }

  private seedDefaultEmployees(): void {
    const emp1: EmployeeMaster = {
      employeeId: 'EMP-IND-0101',
      fullName: 'Aarav Sharma',
      email: 'aarav.sharma@bharattech.com',
      department: 'Robotics Engineering',
      designation: 'Senior Automation Engineer',
      costCenter: 'CC-MFG-BODY',
      employmentType: 'FULL_TIME',
      status: EmployeeStatus.ACTIVE,
      dateOfJoining: '2022-04-01',
      panNumber: 'ABCPS1234D',
      aadhaarToken: 'AADH-****-9821',
      uanNumber: '100902881921',
      bankAccountNumber: '50200099881234',
      bankIfsc: 'HDFC0000123',
      salaryStructure: {
        basicMonthly: 45000,
        hraMonthly: 22500,
        specialAllowanceMonthly: 17500,
        grossMonthly: 85000,
        annualCtc: 1020000,
      },
    };

    const emp2: EmployeeMaster = {
      employeeId: 'EMP-IND-0102',
      fullName: 'Priya Sundaram',
      email: 'priya.sundaram@bharattech.com',
      department: 'Quality Assurance',
      designation: 'Quality Control Lead',
      costCenter: 'CC-MFG-ASSY',
      employmentType: 'FULL_TIME',
      status: EmployeeStatus.ACTIVE,
      dateOfJoining: '2023-01-15',
      panNumber: 'AYEPS5678K',
      aadhaarToken: 'AADH-****-4412',
      uanNumber: '100904112398',
      bankAccountNumber: '39410044558812',
      bankIfsc: 'SBIN0004133',
      salaryStructure: {
        basicMonthly: 35000,
        hraMonthly: 17500,
        specialAllowanceMonthly: 12500,
        grossMonthly: 65000,
        annualCtc: 780000,
      },
    };

    const emp3: EmployeeMaster = {
      employeeId: 'EMP-IND-0103',
      fullName: 'Sunil Rao',
      email: 'sunil.rao@bharattech.com',
      department: 'Shop Floor Assembly',
      designation: 'Assembly Line Technician',
      costCenter: 'CC-MFG-ASSY',
      employmentType: 'FULL_TIME',
      status: EmployeeStatus.ACTIVE,
      dateOfJoining: '2024-06-01',
      panNumber: 'BKTPR9912M',
      aadhaarToken: 'AADH-****-1109',
      uanNumber: '101290334812',
      esicNumber: '3129884712',
      bankAccountNumber: '60124455667788',
      bankIfsc: 'HDFC0000123',
      salaryStructure: {
        basicMonthly: 11000,
        hraMonthly: 4500,
        specialAllowanceMonthly: 3500,
        grossMonthly: 19000, // Eligible for ESI (< ₹21,000)
        annualCtc: 228000,
      },
    };

    this.employees.set(emp1.employeeId, emp1);
    this.employees.set(emp2.employeeId, emp2);
    this.employees.set(emp3.employeeId, emp3);

    // Seed sample attendance for current month
    const currentMonth = '2026-09';
    this.attendanceRecords.set(`${emp1.employeeId}:${currentMonth}`, {
      employeeId: emp1.employeeId,
      month: currentMonth,
      totalWorkingDays: 22,
      presentDays: 21,
      paidLeaveDays: 1,
      lossOfPayDays: 0,
    });
    this.attendanceRecords.set(`${emp2.employeeId}:${currentMonth}`, {
      employeeId: emp2.employeeId,
      month: currentMonth,
      totalWorkingDays: 22,
      presentDays: 20,
      paidLeaveDays: 1,
      lossOfPayDays: 1, // 1 LOP day
    });
    this.attendanceRecords.set(`${emp3.employeeId}:${currentMonth}`, {
      employeeId: emp3.employeeId,
      month: currentMonth,
      totalWorkingDays: 22,
      presentDays: 22,
      paidLeaveDays: 0,
      lossOfPayDays: 0,
    });
  }

  // -------------------------------------------------------------
  // Employee Master Data
  // -------------------------------------------------------------

  public registerEmployee(emp: EmployeeMaster): EmployeeMaster {
    this.employees.set(emp.employeeId, emp);
    return emp;
  }

  public getEmployee(employeeId: string): EmployeeMaster | undefined {
    return this.employees.get(employeeId);
  }

  public listEmployees(department?: string): EmployeeMaster[] {
    const list = Array.from(this.employees.values());
    return department ? list.filter((e) => e.department.toLowerCase() === department.toLowerCase()) : list;
  }

  // -------------------------------------------------------------
  // Attendance & Leave Records
  // -------------------------------------------------------------

  public recordAttendance(record: AttendanceRecord): AttendanceRecord {
    const key = `${record.employeeId}:${record.month}`;
    this.attendanceRecords.set(key, record);
    return record;
  }

  public getAttendance(employeeId: string, month: string): AttendanceRecord {
    const key = `${employeeId}:${month}`;
    return (
      this.attendanceRecords.get(key) || {
        employeeId,
        month,
        totalWorkingDays: 22,
        presentDays: 22,
        paidLeaveDays: 0,
        lossOfPayDays: 0,
      }
    );
  }

  // -------------------------------------------------------------
  // Statutory Indian Payroll Calculation
  // -------------------------------------------------------------

  public calculateEmployeeSalary(employeeId: string, month: string): Payslip {
    const emp = this.employees.get(employeeId);
    if (!emp) {
      throw new Error(`Employee ${employeeId} not found`);
    }

    const attendance = this.getAttendance(employeeId, month);
    const payableDays = attendance.totalWorkingDays - attendance.lossOfPayDays;
    const factor = attendance.totalWorkingDays > 0 ? payableDays / attendance.totalWorkingDays : 1.0;

    const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

    const earnedBasic = round2(emp.salaryStructure.basicMonthly * factor);
    const earnedHra = round2(emp.salaryStructure.hraMonthly * factor);
    const earnedSpecialAllowance = round2(emp.salaryStructure.specialAllowanceMonthly * factor);
    const earnedGrossSalary = round2(earnedBasic + earnedHra + earnedSpecialAllowance);

    // 1. EPF Calculation: 12% on Basic capped at statutory limit of ₹15,000 base (= ₹1,800 max)
    const epfWageBase = Math.min(earnedBasic, 15000);
    const epfEmployee = round2(epfWageBase * 0.12);
    const epfEmployer = round2(epfWageBase * 0.12); // Matching contribution

    // 2. ESI Calculation: 0.75% employee + 3.25% employer if Gross <= ₹21,000
    let esiEmployee = 0;
    let esiEmployer = 0;
    if (earnedGrossSalary <= 21000) {
      esiEmployee = round2(earnedGrossSalary * 0.0075);
      esiEmployer = round2(earnedGrossSalary * 0.0325);
    }

    // 3. Professional Tax: ₹200 standard monthly deduction
    const professionalTax = earnedGrossSalary >= 10000 ? 200 : 0;

    // 4. TDS Section 192 (Salary Tax Withholding): 5% on monthly portion exceeding ₹50,000
    let incomeTaxTds192 = 0;
    if (earnedGrossSalary > 50000) {
      incomeTaxTds192 = round2((earnedGrossSalary - 50000) * 0.05);
    }

    const totalEmployeeDeductions = round2(
      epfEmployee + esiEmployee + professionalTax + incomeTaxTds192
    );
    const totalEmployerContributions = round2(epfEmployer + esiEmployer);
    const netPayableSalary = round2(earnedGrossSalary - totalEmployeeDeductions);

    const deductions: StatutoryDeductions = {
      epfEmployee,
      epfEmployer,
      esiEmployee,
      esiEmployer,
      professionalTax,
      incomeTaxTds192,
      totalEmployeeDeductions,
      totalEmployerContributions,
    };

    const payslipId = `PAY-${month}-${emp.employeeId}`;

    return {
      payslipId,
      employeeId: emp.employeeId,
      employeeName: emp.fullName,
      department: emp.department,
      designation: emp.designation,
      costCenter: emp.costCenter,
      month,
      paymentDate: new Date().toISOString().split('T')[0],
      earnedBasic,
      earnedHra,
      earnedSpecialAllowance,
      earnedGrossSalary,
      deductions,
      netPayableSalary,
      bankAccountMasked: `****${emp.bankAccountNumber.slice(-4)}`,
      bankIfsc: emp.bankIfsc,
    };
  }

  // -------------------------------------------------------------
  // Monthly Payroll Execution & General Ledger Integration
  // -------------------------------------------------------------

  public executeMonthlyPayrollRun(month: string): PayrollRunResult {
    const payslips: Payslip[] = [];
    let totalGrossSalaries = 0;
    let totalEmployeeDeductions = 0;
    let totalEmployerContributions = 0;
    let totalNetSalariesDisbursed = 0;
    let totalEpfStatutory = 0;
    let totalEsiStatutory = 0;
    let totalPt = 0;
    let totalTds = 0;

    const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

    for (const emp of this.employees.values()) {
      if (emp.status === EmployeeStatus.TERMINATED) continue;

      const slip = this.calculateEmployeeSalary(emp.employeeId, month);
      payslips.push(slip);

      totalGrossSalaries = round2(totalGrossSalaries + slip.earnedGrossSalary);
      totalEmployeeDeductions = round2(totalEmployeeDeductions + slip.deductions.totalEmployeeDeductions);
      totalEmployerContributions = round2(totalEmployerContributions + slip.deductions.totalEmployerContributions);
      totalNetSalariesDisbursed = round2(totalNetSalariesDisbursed + slip.netPayableSalary);

      totalEpfStatutory = round2(totalEpfStatutory + slip.deductions.epfEmployee + slip.deductions.epfEmployer);
      totalEsiStatutory = round2(totalEsiStatutory + slip.deductions.esiEmployee + slip.deductions.esiEmployer);
      totalPt = round2(totalPt + slip.deductions.professionalTax);
      totalTds = round2(totalTds + slip.deductions.incomeTaxTds192);
    }

    const totalExpenseDebit = round2(totalGrossSalaries + totalEmployerContributions);
    const totalPayableCredit = round2(
      totalNetSalariesDisbursed + totalEpfStatutory + totalEsiStatutory + totalPt + totalTds
    );

    // Multi-line balanced GL voucher
    const entryNumber = `PAY-JRN-${month}`;
    const journalLines = [
      {
        accountCode: '510000',
        accountName: 'Salaries & Staff Welfare Expense',
        debit: totalExpenseDebit,
        credit: 0,
      },
      {
        accountCode: '214100',
        accountName: 'EPF Statutory Contribution Payable (Govt)',
        debit: 0,
        credit: totalEpfStatutory,
      },
      {
        accountCode: '214200',
        accountName: 'ESIC Contribution Payable (Govt)',
        debit: 0,
        credit: totalEsiStatutory,
      },
      {
        accountCode: '214300',
        accountName: 'Professional Tax Payable (State Govt)',
        debit: 0,
        credit: totalPt,
      },
      {
        accountCode: '214400',
        accountName: 'TDS Section 192 (Salaries) Tax Payable (Govt)',
        debit: 0,
        credit: totalTds,
      },
      {
        accountCode: '214000',
        accountName: 'Net Salaries Payable to Employees (Bank Disbursement)',
        debit: 0,
        credit: totalNetSalariesDisbursed,
      },
    ];

    const isBalanced = Math.abs(totalExpenseDebit - totalPayableCredit) < 0.05;

    const result: PayrollRunResult = {
      runId: `PRUN-${month}-${Date.now().toString(36).toUpperCase()}`,
      month,
      processedCount: payslips.length,
      totalGrossSalaries,
      totalEmployeeDeductions,
      totalEmployerContributions,
      totalNetSalariesDisbursed,
      payslips,
      glPosting: {
        entryNumber,
        isBalanced,
        journalLines,
      },
    };

    this.payrollRuns.set(month, result);
    return result;
  }

  public getPayrollRun(month: string): PayrollRunResult | undefined {
    return this.payrollRuns.get(month);
  }
}
