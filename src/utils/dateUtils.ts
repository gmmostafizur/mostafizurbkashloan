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

export function getDaysRemaining(dateStr: string, referenceDate: Date = new Date(2026, 8, 30)): number {
  const target = parseMMDDYYYY(dateStr);
  if (!target) return 0;

  // Clear time for clean comparison
  const ref = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const due = new Date(target.getFullYear(), target.getMonth(), target.getDate());

  const diffTime = due.getTime() - ref.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isDateOverdue(dateStr: string, referenceDate: Date = new Date(2026, 8, 30)): boolean {
  return getDaysRemaining(dateStr, referenceDate) < 0;
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
