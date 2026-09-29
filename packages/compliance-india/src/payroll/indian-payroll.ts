/**
 * Sutra India Statutory Payroll & Labor Law Engine
 * Complies with the Employees' Provident Funds Act (1952),
 * ESI Act (1948), and State Professional Tax Acts.
 */

export interface SalaryStructureInput {
  basicSalary: number;
  dearnessAllowance?: number; // DA
  hra?: number;               // House Rent Allowance
  specialAllowance?: number;
  stateCode: 'MH' | 'KA' | 'TS' | 'DL' | 'TN' | 'WB'; // State for Professional Tax
  gender?: 'M' | 'F';
  monthNumber?: number;       // 1 to 12 (for February PT adjustment)
  optHigherPF?: boolean;      // Option to contribute beyond ₹15,000 statutory wage ceiling
}

export interface StatutoryPayrollBreakdown {
  earnings: {
    basic: number;
    da: number;
    hra: number;
    specialAllowance: number;
    grossSalary: number;
  };
  employeeDeductions: {
    epf: number;             // Employee Provident Fund (12%)
    esi: number;             // Employee State Insurance (0.75%)
    professionalTax: number; // State-wise PT
    totalDeductions: number;
  };
  employerContributions: {
    epf: number;             // 3.67% EPF
    eps: number;             // 8.33% EPS (capped at ₹1,250 if not higher)
    edli: number;            // 0.5% EDLI
    adminCharges: number;    // 0.5% EPF Admin
    esi: number;             // 3.25% ESI
    totalEmployerCost: number;
  };
  netTakeHomeSalary: number;
  totalCostToCompany: number; // CTC
}

export class IndianPayrollEngine {
  public static readonly EPF_WAGE_CEILING = 15000;
  public static readonly ESI_GROSS_CEILING = 21000;
  public static readonly EPS_CEILING_AMOUNT = 1250; // 8.33% of 15,000

  /**
   * Calculates monthly statutory payroll deductions and employer contributions.
   */
  public static calculate(input: SalaryStructureInput): StatutoryPayrollBreakdown {
    const round = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

    const basic = input.basicSalary;
    const da = input.dearnessAllowance || 0;
    const hra = input.hra || 0;
    const special = input.specialAllowance || 0;
    const grossSalary = round(basic + da + hra + special);

    // 1. Employee Provident Fund (EPF)
    const pfWage = input.optHigherPF ? (basic + da) : Math.min(basic + da, this.EPF_WAGE_CEILING);
    const employeePF = round(pfWage * 0.12);

    // Employer PF Split: 8.33% EPS (max 1250) + remainder to EPF
    const employerEPS = input.optHigherPF
      ? round(pfWage * 0.0833)
      : Math.min(round(pfWage * 0.0833), this.EPS_CEILING_AMOUNT);
    const employerPF = round((pfWage * 0.12) - employerEPS);
    const edli = round(pfWage * 0.005);
    const adminCharges = round(pfWage * 0.005);

    // 2. Employee State Insurance (ESI)
    let employeeESI = 0;
    let employerESI = 0;
    if (grossSalary <= this.ESI_GROSS_CEILING) {
      employeeESI = round(grossSalary * 0.0075);
      employerESI = round(grossSalary * 0.0325);
    }

    // 3. State-wise Professional Tax (PT)
    const pt = this.calculateProfessionalTax(input.stateCode, grossSalary, input.gender || 'M', input.monthNumber || 1);

    // 4. Summaries
    const totalEmpDeductions = round(employeePF + employeeESI + pt);
    const netTakeHome = round(grossSalary - totalEmpDeductions);
    const totalEmployerCost = round(employerPF + employerEPS + edli + adminCharges + employerESI);
    const ctc = round(grossSalary + totalEmployerCost);

    return {
      earnings: {
        basic,
        da,
        hra,
        specialAllowance: special,
        grossSalary,
      },
      employeeDeductions: {
        epf: employeePF,
        esi: employeeESI,
        professionalTax: pt,
        totalDeductions: totalEmpDeductions,
      },
      employerContributions: {
        epf: employerPF,
        eps: employerEPS,
        edli,
        adminCharges,
        esi: employerESI,
        totalEmployerCost,
      },
      netTakeHomeSalary: netTakeHome,
      totalCostToCompany: ctc,
    };
  }

  /**
   * Computes statutory state-wise Professional Tax (PT).
   */
  public static calculateProfessionalTax(
    state: string,
    grossSalary: number,
    gender = 'M',
    month = 1
  ): number {
    switch (state) {
      case 'MH': // Maharashtra
        if (gender === 'F' && grossSalary <= 25000) return 0; // Female exemption
        if (grossSalary <= 7500) return 0;
        if (grossSalary <= 10000) return 175;
        // Salaries > 10,000: Rs 200/mo, except February which is Rs 300
        return month === 2 ? 300 : 200;

      case 'KA': // Karnataka
        if (grossSalary < 15000) return 0;
        return 200;

      case 'TS': // Telangana
        if (grossSalary <= 15000) return 0;
        if (grossSalary <= 20000) return 150;
        return 200;

      case 'TN': // Tamil Nadu (half-yearly basis normalized to monthly)
        if (grossSalary <= 21000) return 0;
        return 208; // ~1250 per half-year

      case 'WB': // West Bengal
        if (grossSalary <= 10000) return 0;
        if (grossSalary <= 15000) return 110;
        if (grossSalary <= 25000) return 130;
        if (grossSalary <= 40000) return 150;
        return 200;

      default:
        return 0; // States with no PT (e.g. Delhi)
    }
  }
}
