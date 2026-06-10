// ========================================
// 薪资档案类型定义
// ========================================

export interface SalaryConfig {
  id: string;
  code: string;
  name: string;
  positionIds: string[];
  positionNames: string[];
  rankLevels: string[];
  baseSalary: number;
  positionAllowanceRate?: number;
  performanceBonusLimit?: number;
  overtimeCalculationType: 'hourly' | 'fixed' | 'perTime';
  socialSecurityBase?: number;
  housingFundBase?: number;
  taxCalculationType: 'system' | 'taxBureau';
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentId: string;
  departmentName: string;
  issueMonth: string;
  baseSalary: number;
  positionAllowance: number;
  performanceBonus: number;
  overtimePay: number;
  otherAllowances: number;
  grossSalary: number;
  pensionInsurance: number;
  medicalInsurance: number;
  unemploymentInsurance: number;
  housingFund: number;
  personalIncomeTax: number;
  totalDeductions: number;
  netSalary: number;
  issueStatus: 'paid' | 'unpaid';
  employeeConfirmation?: 'confirmed' | 'unconfirmed';
}

export interface SalaryDetail {
  payroll: PayrollRecord;
  config?: SalaryConfig;
}