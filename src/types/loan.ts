export interface LoanRecord {
  id: string;
  personName: string;
  borrowerPhone?: string;
  borrowerUserId?: string;
  loanId: string;
  thirdMonthEmi: number;
  secondMonthEmi: number;
  currentMonthEmi: number;
  totalDue: number;
  originalTotalDue?: number;
  totalPrincipalLoan: number;
  nextLoanSubmitDate: string; // MM/DD/YYYY (Month/Day/Year)
  status: 'active' | 'overdue' | 'paid';
  lastPaymentDate?: string;
  createdAt: string;
  notes?: string;
}

export interface PaymentTransaction {
  id: string;
  loanId: string;
  personName: string;
  borrowerPhone?: string;
  amount: number;
  paymentDate: string; // DD/MM/YYYY
  timestamp: string; // ISO
  previousDue: number;
  newDue: number;
  previousNextDate: string;
  newNextDate: string;
  targetMonth?: string;
  method: 'bKash' | 'Cash' | 'Bank';
  referenceId: string;
  note?: string;
}

export type Language = 'en' | 'bn';

export interface BorrowerSummary {
  personName: string;
  totalLoans: number;
  activeLoans: number;
  totalPrincipal: number;
  totalDue: number;
  loans: LoanRecord[];
  earliestSubmitDate: string;
  overdueCount: number;
}
