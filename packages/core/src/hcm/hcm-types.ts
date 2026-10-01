/**
 * Sutra Human Capital Management & Core HR (SAP SuccessFactors / HCM Equivalent)
 * Types and interfaces for employee master data, CTC salary structures,
 * attendance & leave management, statutory payroll processing (EPF/ESI/PT/TDS 192),
 * digital payslips, and automated General Ledger payroll posting.
 */

import { type EmployeeStatusType } from '../common/constants.js';

export type EmploymentType = 
  | 'FULL_TIME' 
  | 'PART_TIME' 
  | 'CONTRACT' 
  | 'INTERN';

export interface SalaryStructure {
  basicMonthly: number;
  hraMonthly: number;
  specialAllowanceMonthly: number;
  grossMonthly: number;
  annualCtc: number;
}

export interface EmployeeMaster {
  employeeId: string;
  fullName: string;
  email: string;
  department: string;
  designation: string;
  costCenter: string;
  employmentType: EmploymentType;
  status: EmployeeStatusType;
  dateOfJoining: string;
  panNumber: string;
  aadhaarToken: string; // Tokenized/masked for privacy
  uanNumber?: string;   // Universal Account Number (EPF)
  esicNumber?: string;  // ESI IP Number
  bankAccountNumber: string;
  bankIfsc: string;
  salaryStructure: SalaryStructure;
}

export interface AttendanceRecord {
  employeeId: string;
  month: string; // YYYY-MM
  totalWorkingDays: number;
  presentDays: number;
  paidLeaveDays: number;
  lossOfPayDays: number; // Unpaid leave (LOP)
}

export interface StatutoryDeductions {
  epfEmployee: number; // 12% on Basic (capped at ₹15,000 base = ₹1,800/mo)
  epfEmployer: number; // 12% employer matching (3.67% EPF + 8.33% EPS)
  esiEmployee: number; // 0.75% of Gross (if gross <= ₹21,000)
  esiEmployer: number; // 3.25% of Gross (if gross <= ₹21,000)
  professionalTax: number; // State slab (typically ₹200/mo)
  incomeTaxTds192: number; // Section 192 Salary TDS
  totalEmployeeDeductions: number;
  totalEmployerContributions: number;
}

export interface Payslip {
  payslipId: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  costCenter: string;
  month: string;
  paymentDate: string;
  earnedBasic: number;
  earnedHra: number;
  earnedSpecialAllowance: number;
  earnedGrossSalary: number;
  deductions: StatutoryDeductions;
  netPayableSalary: number;
  bankAccountMasked: string;
  bankIfsc: string;
}

export interface PayrollRunResult {
  runId: string;
  month: string;
  processedCount: number;
  totalGrossSalaries: number;
  totalEmployeeDeductions: number;
  totalEmployerContributions: number;
  totalNetSalariesDisbursed: number;
  payslips: Payslip[];
  glPosting: {
    entryNumber: string;
    isBalanced: boolean;
    journalLines: Array<{
      accountCode: string;
      accountName: string;
      debit: number;
      credit: number;
      costCenter?: string;
    }>;
  };
}
