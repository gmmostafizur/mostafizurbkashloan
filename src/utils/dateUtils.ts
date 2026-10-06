// Utility functions for dates in Month/Day/Year (MM/DD/YYYY) format and Bengali translations

export function parseMMDDYYYY(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.trim().split(/[\/\-\.]/);
  if (parts.length !== 3) return null;
  
  // Format is Month/Day/Year (MM/DD/YYYY)
  const month = parseInt(parts[0], 10) - 1; // 0-indexed month
  const day = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  if (isNaN(month) || isNaN(day) || isNaN(year)) return null;
  return new Date(year, month, day);
}

// Backward-compatibility alias
export const parseDDMMYYYY = parseMMDDYYYY;

export function formatMMDDYYYY(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

// Backward-compatibility alias
export const formatDDMMYYYY = formatMMDDYYYY;

export function bumpDateByOneMonth(dateStr: string): string {
  const parsed = parseMMDDYYYY(dateStr);
  if (!parsed) {
    const now = new Date();
    now.setMonth(now.getMonth() + 1);
    return formatMMDDYYYY(now);
  }

  const originalDay = parsed.getDate();
  const originalMonth = parsed.getMonth();
  const originalYear = parsed.getFullYear();

  // Target next month
  let targetMonth = originalMonth + 1;
  let targetYear = originalYear;
  if (targetMonth > 11) {
    targetMonth = 0;
    targetYear += 1;
  }

  // Handle month length (e.g. 31st to 30th/28th)
  const daysInNextMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const newDay = Math.min(originalDay, daysInNextMonth);

  const nextDate = new Date(targetYear, targetMonth, newDay);
  return formatMMDDYYYY(nextDate);
}

export function getDaysRemaining(dateStr: string, referenceDate: Date = new Date()): number {
  const target = parseMMDDYYYY(dateStr);
  if (!target) return 0;

  // Clear time for clean comparison
  const ref = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const due = new Date(target.getFullYear(), target.getMonth(), target.getDate());

  const diffTime = due.getTime() - ref.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isDateOverdue(dateStr: string, referenceDate: Date = new Date()): boolean {
  return getDaysRemaining(dateStr, referenceDate) < 0;
}

export interface LoanMonthStatusInfo {
  isCurrentMonth: boolean;
  isNextMonth: boolean;
  isOverdue: boolean;
  daysRemaining: number;
  badgeLabelBn: string;
  badgeLabelEn: string;
  monthNameBn: string;
  monthNameEn: string;
}

export function getLoanMonthStatusInfo(dateStr: string, referenceDate: Date = new Date()): LoanMonthStatusInfo {
  const target = parseMMDDYYYY(dateStr);
  const banglaMonthNames = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];
  const englishMonthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (!target) {
    return {
      isCurrentMonth: true,
      isNextMonth: false,
      isOverdue: false,
      daysRemaining: 0,
      badgeLabelBn: 'এই মাসের কিস্তি',
      badgeLabelEn: 'This Month EMI',
      monthNameBn: 'বর্তমান মাস',
      monthNameEn: 'Current Month',
    };
  }

  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth();

  const targetYear = target.getFullYear();
  const targetMonth = target.getMonth();

  const daysRemaining = getDaysRemaining(dateStr, referenceDate);
  const isOverdue = daysRemaining < 0;

  const monthDiff = (targetYear - currentYear) * 12 + (targetMonth - currentMonth);

  const targetMonthNameBn = banglaMonthNames[targetMonth] || '';
  const targetMonthNameEn = englishMonthNames[targetMonth] || '';

  if (monthDiff <= 0) {
    // Loan is in current month or past month
    return {
      isCurrentMonth: true,
      isNextMonth: false,
      isOverdue,
      daysRemaining,
      badgeLabelBn: isOverdue ? 'মেয়াদোত্তীর্ণ কিস্তি' : daysRemaining === 0 ? 'আজকে প্রদেয় কিস্তি' : `এই মাসের কিস্তি (${targetMonthNameBn})`,
      badgeLabelEn: isOverdue ? 'Overdue' : daysRemaining === 0 ? 'Due Today' : `This Month (${targetMonthNameEn})`,
      monthNameBn: `এই মাস (${targetMonthNameBn})`,
      monthNameEn: `This Month (${targetMonthNameEn})`,
    };
  } else if (monthDiff === 1) {
    // Loan is in next month
    return {
      isCurrentMonth: false,
      isNextMonth: true,
      isOverdue: false,
      daysRemaining,
      badgeLabelBn: `আগামী মাসের কিস্তি (${targetMonthNameBn})`,
      badgeLabelEn: `Next Month (${targetMonthNameEn})`,
      monthNameBn: `আগামী মাস (${targetMonthNameBn})`,
      monthNameEn: `Next Month (${targetMonthNameEn})`,
    };
  } else {
    // 2 or more months later
    return {
      isCurrentMonth: false,
      isNextMonth: false,
      isOverdue: false,
      daysRemaining,
      badgeLabelBn: `পরবর্তী কিস্তি (${targetMonthNameBn})`,
      badgeLabelEn: `Future Installment (${targetMonthNameEn})`,
      monthNameBn: targetMonthNameBn,
      monthNameEn: targetMonthNameEn,
    };
  }
}

export function toBanglaNumber(val: number | string): string {
  const banglaDigits: { [key: string]: string } = {
    '0': '০',
    '1': '১',
    '2': '২',
    '3': '৩',
    '4': '৪',
    '5': '৫',
    '6': '৬',
    '7': '৭',
    '8': '৮',
    '9': '৯',
    '.': '.',
    ',': ',',
  };

  const str = String(val);
  return str.split('').map(char => banglaDigits[char] || char).join('');
}

export function formatCurrency(amount: number, lang: 'en' | 'bn' = 'en'): string {
  const rounded = Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (lang === 'bn') {
    return `৳${toBanglaNumber(rounded)}`;
  }
  return `৳${rounded}`;
}

export function getCurrentDateMMDDYYYY(): string {
  const now = new Date();
  return formatMMDDYYYY(now);
}

export const getCurrentDateDDMMYYYY = getCurrentDateMMDDYYYY;

export const BANGLA_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

export const ENGLISH_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export interface ThreeMonthNames {
  month1: string; // e.g. "অক্টোবর ২০২৬" or "October 2026"
  month2: string; // e.g. "নভেম্বর ২০২৬" or "November 2026"
  month3: string; // e.g. "ডিসেম্বর ২০২৬" or "December 2026"
  month1Short: string; // e.g. "অক্টোবর" or "October"
  month2Short: string; // e.g. "নভেম্বর" or "November"
  month3Short: string; // e.g. "ডিসেম্বর" or "December"
  month1Label: string; // e.g. "বর্তমান মাসের কিস্তি (অক্টোবর ২০২৬)"
  month2Label: string; // e.g. "২য় মাসের কিস্তি (নভেম্বর ২০২৬)"
  month3Label: string; // e.g. "৩য় মাসের কিস্তি (ডিসেম্বর ২০২৬)"
}

export function getThreeMonthNames(referenceDateOrStr?: Date | string | null, lang: 'en' | 'bn' = 'bn'): ThreeMonthNames {
  let refDate = new Date();
  if (typeof referenceDateOrStr === 'string' && referenceDateOrStr.trim()) {
    const parsed = parseMMDDYYYY(referenceDateOrStr);
    if (parsed) refDate = parsed;
  } else if (referenceDateOrStr instanceof Date) {
    refDate = referenceDateOrStr;
  }

  const m1 = refDate.getMonth();
  const y1 = refDate.getFullYear();

  const d2 = new Date(y1, m1 + 1, 1);
  const m2 = d2.getMonth();
  const y2 = d2.getFullYear();

  const d3 = new Date(y1, m1 + 2, 1);
  const m3 = d3.getMonth();
  const y3 = d3.getFullYear();

  if (lang === 'bn') {
    const month1 = `${BANGLA_MONTHS[m1]} ${toBanglaNumber(y1)}`;
    const month2 = `${BANGLA_MONTHS[m2]} ${toBanglaNumber(y2)}`;
    const month3 = `${BANGLA_MONTHS[m3]} ${toBanglaNumber(y3)}`;
    return {
      month1,
      month2,
      month3,
      month1Short: BANGLA_MONTHS[m1],
      month2Short: BANGLA_MONTHS[m2],
      month3Short: BANGLA_MONTHS[m3],
      month1Label: `বর্তমান মাসের কিস্তি (${month1})`,
      month2Label: `২য় মাসের কিস্তি (${month2})`,
      month3Label: `৩য় মাসের কিস্তি (${month3})`,
    };
  } else {
    const month1 = `${ENGLISH_MONTHS[m1]} ${y1}`;
    const month2 = `${ENGLISH_MONTHS[m2]} ${y2}`;
    const month3 = `${ENGLISH_MONTHS[m3]} ${y3}`;
    return {
      month1,
      month2,
      month3,
      month1Short: ENGLISH_MONTHS[m1],
      month2Short: ENGLISH_MONTHS[m2],
      month3Short: ENGLISH_MONTHS[m3],
      month1Label: `Current Month EMI (${month1})`,
      month2Label: `2nd Month EMI (${month2})`,
      month3Label: `3rd Month EMI (${month3})`,
    };
  }
}

// Get the specific installment month name for payment tracking
export function getPaymentMonthName(loanNextDate?: string, installmentType: 'current' | 'second' | 'third' | 'settlement' = 'current', lang: 'en' | 'bn' = 'bn'): string {
  const schedule = getThreeMonthNames(loanNextDate, lang);
  if (installmentType === 'settlement') {
    return lang === 'bn'
      ? `পূর্ণ পরিশোধ (${schedule.month1Short}, ${schedule.month2Short}, ${schedule.month3Short})`
      : `Full Settlement (${schedule.month1Short}, ${schedule.month2Short}, ${schedule.month3Short})`;
  }
  if (installmentType === 'second') return schedule.month2;
  if (installmentType === 'third') return schedule.month3;
  return schedule.month1;
}

// Check if a loan's current month installment is already paid
export function isCurrentMonthPaid(currentMonthEmi: number, totalDue: number): boolean {
  return currentMonthEmi <= 0 && totalDue > 0;
}

// Execute monthly rollover: when calendar month changes or on explicit rollover,
// for loans where current month was paid, the 2nd month EMI moves to current month,
// 3rd month moves to 2nd month, and next submit date moves forward by 1 month.
export function executeLoansMonthlyRollover(loans: any[]): { updatedLoans: any[]; rolledOverCount: number; overdueCount: number } {
  let rolledOverCount = 0;
  let overdueCount = 0;

  const updatedLoans = loans.map((loan) => {
    if (loan.status === 'paid' || loan.totalDue <= 0) {
      return loan;
    }

    // If current month EMI was paid (0), month change shifts 2nd month to current month!
    if (loan.currentMonthEmi <= 0 && loan.totalDue > 0) {
      rolledOverCount++;
      const nextDate = bumpDateByOneMonth(loan.nextLoanSubmitDate);
      return {
        ...loan,
        nextLoanSubmitDate: nextDate,
        currentMonthEmi: loan.secondMonthEmi || 0,
        secondMonthEmi: loan.thirdMonthEmi || 0,
        thirdMonthEmi: 0,
        status: 'active' as const,
      };
    }

    // If current month was NOT paid and date is overdue
    if (isDateOverdue(loan.nextLoanSubmitDate)) {
      overdueCount++;
      return {
        ...loan,
        status: 'overdue' as const,
      };
    }

    return loan;
  });

  return { updatedLoans, rolledOverCount, overdueCount };
}
