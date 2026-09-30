import React, { useState, useMemo } from 'react';
import { LoanRecord, Language } from '../types/loan';
import { parseMMDDYYYY, toBanglaNumber, formatCurrency, isDateOverdue } from '../utils/dateUtils';
import { getT } from '../utils/translations';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  User,
  ArrowRight,
  CalendarDays,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface MonthlyCalendarViewProps {
  loans: LoanRecord[];
  lang: Language;
  onPayLoan: (loan: LoanRecord) => void;
  onSelectBorrower?: (borrowerName: string) => void;
}

const BANGLA_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

const BANGLA_DAYS_SHORT = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
const EN_DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const MonthlyCalendarView: React.FC<MonthlyCalendarViewProps> = ({
  loans,
  lang,
  onPayLoan,
  onSelectBorrower,
}) => {
  const t = getT(lang);

  // Default to October 2026 (where active loans are scheduled) or current simulated date
  const [currentDate, setCurrentDate] = useState(() => {
    // Check if there are loans with October 2026 or current year/month
    const firstActiveLoan = loans.find(l => l.status !== 'paid');
    if (firstActiveLoan) {
      const parsed = parseMMDDYYYY(firstActiveLoan.nextLoanSubmitDate);
      if (parsed) {
        return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
      }
    }
    return new Date(2026, 9, 1); // October 2026
  });

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const handleResetToCurrent = () => {
    setCurrentDate(new Date(2026, 9, 1));
    setSelectedDay(null);
  };

  // Compute month layout
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Group loans by day for the current view month
  const loansByDay = useMemo(() => {
    const map: { [day: number]: LoanRecord[] } = {};
    loans.forEach(loan => {
      const parsed = parseMMDDYYYY(loan.nextLoanSubmitDate);
      if (parsed && parsed.getFullYear() === year && parsed.getMonth() === month) {
        const day = parsed.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(loan);
      }
    });
    return map;
  }, [loans, year, month]);

  // Aggregate stats for this month
  const monthStats = useMemo(() => {
    let totalDuesThisMonth = 0;
    let totalLoansDueThisMonth = 0;
    let overdueCount = 0;

    Object.values(loansByDay).forEach(dayLoans => {
      dayLoans.forEach(l => {
        totalLoansDueThisMonth += 1;
        totalDuesThisMonth += l.totalDue || 0;
        if (l.status === 'overdue' || isDateOverdue(l.nextLoanSubmitDate)) {
          overdueCount += 1;
        }
      });
    });

    return { totalDuesThisMonth, totalLoansDueThisMonth, overdueCount };
  }, [loansByDay]);

  // If no day is selected yet, default to the first day with loans if any
  const effectiveSelectedDay = useMemo(() => {
    if (selectedDay !== null) return selectedDay;
    const daysWithLoans = Object.keys(loansByDay).map(Number).sort((a, b) => a - b);
    return daysWithLoans.length > 0 ? daysWithLoans[0] : null;
  }, [selectedDay, loansByDay]);

  const selectedDayLoans = effectiveSelectedDay ? loansByDay[effectiveSelectedDay] || [] : [];

  // Generate days grid
  const calendarCells = [];
  // Empty leading cells
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push(null);
  }
  // Days of month
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  // Month display label
  const monthName = lang === 'bn' ? BANGLA_MONTHS[month] : currentDate.toLocaleString('en-US', { month: 'long' });
  const yearDisplay = lang === 'bn' ? toBanglaNumber(year) : year;
  const daysHeader = lang === 'bn' ? BANGLA_DAYS_SHORT : EN_DAYS_SHORT;

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden transition-all">
      {/* Calendar Header Bar */}
      <div className="px-4 py-3.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-[#E2136E] flex items-center justify-center text-white shadow-xs">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight">
                {lang === 'bn' ? 'মাসিক কিস্তি ক্যালেন্ডার ভিউ' : 'Monthly Payment Schedule Calendar'}
              </h3>
              <span className="text-[11px] font-semibold bg-[#E2136E]/30 text-pink-200 border border-[#E2136E]/40 px-2 py-0.5 rounded-full">
                {lang === 'bn' ? 'পরবর্তী জমা তারিখ' : 'Next Submit Dates'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              {lang === 'bn'
                ? 'বর্তমান মাসের দিনভিত্তিক কিস্তির তারিখসমূহ হাইলাইট করা হয়েছে'
                : 'Highlighting day-wise loan installment deadlines for this month'}
            </p>
          </div>
        </div>

        {/* Navigation & Month Selector */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded bg-slate-700/60 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="px-3 py-1 bg-slate-800 border border-slate-700 rounded font-semibold text-slate-100 flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-[#E2136E]" />
            <span>
              {monthName} {yearDisplay}
            </span>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded bg-slate-700/60 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleResetToCurrent}
            className="hidden sm:inline-block px-2.5 py-1 text-[11px] rounded bg-pink-600/30 hover:bg-pink-600/50 text-pink-200 border border-pink-500/40 transition-colors cursor-pointer"
          >
            {lang === 'bn' ? 'বর্তমান মাস' : 'Current Month'}
          </button>

          {/* Collapse Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors ml-1 cursor-pointer"
            title={isCollapsed ? 'Expand Calendar' : 'Collapse Calendar'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      {!isCollapsed && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Quick Month Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md">
              <span className="text-[11px] text-slate-500 block">
                {lang === 'bn' ? 'এই মাসে কিস্তির সংখ্যা' : 'Installments Due'}
              </span>
              <span className="text-base font-bold text-slate-900 font-mono-numbers">
                {lang === 'bn' ? toBanglaNumber(monthStats.totalLoansDueThisMonth) : monthStats.totalLoansDueThisMonth}{' '}
                {lang === 'bn' ? 'টি' : 'loans'}
              </span>
            </div>

            <div className="p-2.5 bg-pink-50/50 border border-pink-100 rounded-md">
              <span className="text-[11px] text-slate-500 block">
                {lang === 'bn' ? 'মোট প্রদেয় কিস্তি' : 'Total Due This Month'}
              </span>
              <span className="text-base font-bold text-[#E2136E] font-mono-numbers">
                {formatCurrency(monthStats.totalDuesThisMonth, lang)}
              </span>
            </div>

            <div className="p-2.5 bg-amber-50/50 border border-amber-100 rounded-md">
              <span className="text-[11px] text-slate-500 block">
                {lang === 'bn' ? 'কিস্তি জমা দিন সংখ্যা' : 'Days with Payments'}
              </span>
              <span className="text-base font-bold text-amber-700 font-mono-numbers">
                {lang === 'bn' ? toBanglaNumber(Object.keys(loansByDay).length) : Object.keys(loansByDay).length}{' '}
                {lang === 'bn' ? 'দিন' : 'days'}
              </span>
            </div>

            <div className="p-2.5 bg-rose-50/50 border border-rose-100 rounded-md">
              <span className="text-[11px] text-slate-500 block">
                {lang === 'bn' ? 'মেয়াদোত্তীর্ণ কিস্তি' : 'Overdue Deadlines'}
              </span>
              <span className={`text-base font-bold font-mono-numbers ${monthStats.overdueCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {lang === 'bn' ? toBanglaNumber(monthStats.overdueCount) : monthStats.overdueCount}{' '}
                {lang === 'bn' ? 'টি' : 'loans'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Calendar Grid (7 Cols on desktop) */}
            <div className="lg:col-span-8 bg-slate-50/60 p-3.5 border border-slate-200 rounded-lg">
              {/* Day Name Headers */}
              <div className="grid grid-cols-7 gap-1.5 text-center mb-2">
                {daysHeader.map((dName, idx) => (
                  <div
                    key={idx}
                    className={`py-1 text-xs font-bold rounded ${
                      idx === 5 // Friday in BD
                        ? 'text-rose-600 bg-rose-50/50'
                        : 'text-slate-600 bg-slate-100/70'
                    }`}
                  >
                    {dName}
                  </div>
                ))}
              </div>

              {/* Day Cells Grid */}
              <div className="grid grid-cols-7 gap-1.5">
                {calendarCells.map((dayNum, idx) => {
                  if (dayNum === null) {
                    return (
                      <div
                        key={`empty-${idx}`}
                        className="min-h-[58px] sm:min-h-[70px] bg-slate-100/30 rounded border border-transparent"
                      />
                    );
                  }

                  const dayLoans = loansByDay[dayNum] || [];
                  const hasLoans = dayLoans.length > 0;
                  const isSelected = effectiveSelectedDay === dayNum;
                  const hasOverdue = dayLoans.some(l => l.status === 'overdue' || isDateOverdue(l.nextLoanSubmitDate));

                  return (
                    <button
                      key={`day-${dayNum}`}
                      type="button"
                      onClick={() => setSelectedDay(dayNum)}
                      className={`relative min-h-[58px] sm:min-h-[70px] p-1.5 sm:p-2 rounded text-left transition-all flex flex-col justify-between cursor-pointer border ${
                        isSelected
                          ? 'border-[#E2136E] ring-2 ring-[#E2136E]/30 bg-pink-50/60 shadow-xs'
                          : hasLoans
                          ? hasOverdue
                            ? 'border-rose-300 bg-rose-50/60 hover:bg-rose-50 hover:border-rose-400 shadow-2xs'
                            : 'border-amber-300 bg-amber-50/60 hover:bg-amber-50 hover:border-amber-400 shadow-2xs'
                          : 'border-slate-200 bg-white hover:bg-slate-100/60 text-slate-700'
                      }`}
                    >
                      {/* Top Bar inside cell: Day Number + Dot indicator */}
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`text-xs sm:text-sm font-bold font-mono-numbers ${
                            isSelected
                              ? 'text-[#E2136E]'
                              : hasLoans
                              ? hasOverdue
                                ? 'text-rose-700'
                                : 'text-amber-800'
                              : 'text-slate-700'
                          }`}
                        >
                          {lang === 'bn' ? toBanglaNumber(dayNum) : dayNum}
                        </span>

                        {hasLoans && (
                          <span className="flex h-2 w-2 relative">
                            <span
                              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                hasOverdue ? 'bg-rose-400' : 'bg-amber-400'
                              }`}
                            />
                            <span
                              className={`relative inline-flex rounded-full h-2 w-2 ${
                                hasOverdue ? 'bg-rose-500' : 'bg-amber-500'
                              }`}
                            />
                          </span>
                        )}
                      </div>

                      {/* Bottom Info inside cell */}
                      {hasLoans ? (
                        <div className="mt-1">
                          <div
                            className={`text-[10px] sm:text-[11px] font-semibold leading-tight line-clamp-1 ${
                              hasOverdue ? 'text-rose-800' : 'text-amber-900'
                            }`}
                          >
                            {dayLoans.length === 1 ? (
                              <span>{dayLoans[0].personName}</span>
                            ) : (
                              <span>
                                {lang === 'bn' ? toBanglaNumber(dayLoans.length) : dayLoans.length}
                                {lang === 'bn' ? 'টি কিস্তি' : ' due'}
                              </span>
                            )}
                          </div>
                          <div className="text-[9px] sm:text-[10px] font-mono-numbers text-slate-600 line-clamp-1 font-medium">
                            {formatCurrency(
                              dayLoans.reduce((sum, l) => sum + (l.totalDue || 0), 0),
                              lang
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-300 font-mono-numbers">
                          {/* Empty day spacer */}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Calendar Legend */}
              <div className="mt-3 pt-2.5 border-t border-slate-200 flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
                <span className="font-semibold text-slate-700">{lang === 'bn' ? 'নির্দেশিকা:' : 'Legend:'}</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-500" />
                  <span>{lang === 'bn' ? 'পরবর্তী জমা তারিখ (আগামী কিস্তি)' : 'Upcoming Submit Date'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-rose-600" />
                  <span>{lang === 'bn' ? 'মেয়াদোত্তীর্ণ কিস্তি' : 'Overdue Payment'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-[#E2136E] bg-pink-100" />
                  <span>{lang === 'bn' ? 'নির্বাচিত দিন' : 'Selected Day'}</span>
                </div>
              </div>
            </div>

            {/* Day Details Side Panel (Selected Date Schedule) */}
            <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#E2136E]" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      {effectiveSelectedDay
                        ? lang === 'bn'
                          ? `${toBanglaNumber(effectiveSelectedDay)} ${monthName}, ${yearDisplay}-এর কিস্তি`
                          : `Due on ${monthName} ${effectiveSelectedDay}, ${yearDisplay}`
                        : lang === 'bn'
                        ? 'তারিখ নির্বাচন করুন'
                        : 'Select a Date'}
                    </h4>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 font-mono-numbers">
                    {selectedDayLoans.length} {lang === 'bn' ? 'টি একাউন্ট' : 'Accounts'}
                  </span>
                </div>

                {/* Loans scheduled on this day */}
                <div className="mt-3 space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {selectedDayLoans.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      <CalendarDays className="w-8 h-8 mx-auto mb-2 text-slate-300 opacity-60" />
                      <p>
                        {lang === 'bn'
                          ? 'এই তারিখে কোনো কিস্তির নির্ধারিত জমা তারিখ নেই।'
                          : 'No loan installment deadlines scheduled on this date.'}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {lang === 'bn' ? 'অন্য কোনো হাইলাইট করা দিনে ক্লিক করুন' : 'Click any highlighted day in calendar'}
                      </p>
                    </div>
                  ) : (
                    selectedDayLoans.map(loan => {
                      const isOverdue = loan.status === 'overdue' || isDateOverdue(loan.nextLoanSubmitDate);

                      return (
                        <div
                          key={loan.id}
                          className="p-3 bg-white border border-slate-200 rounded-md shadow-2xs hover:border-slate-300 transition-all space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-[10px]">
                                {loan.personName.charAt(0)}
                              </div>
                              <div>
                                <button
                                  type="button"
                                  onClick={() => onSelectBorrower && onSelectBorrower(loan.personName)}
                                  className="text-xs font-bold text-slate-900 hover:text-[#E2136E] transition-colors cursor-pointer text-left"
                                >
                                  {loan.personName}
                                </button>
                                <span className="block text-[10px] text-slate-400 font-mono">
                                  ID: {loan.loanId.slice(-8)}
                                </span>
                              </div>
                            </div>

                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                isOverdue
                                  ? 'bg-rose-100 text-rose-700'
                                  : loan.status === 'paid'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {isOverdue
                                ? t.statusOverdue
                                : loan.status === 'paid'
                                ? t.statusPaid
                                : t.statusDueSoon}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                            <div>
                              <span className="text-[10px] text-slate-400 block">{t.colTotalDue}</span>
                              <span className="font-bold text-[#E2136E] font-mono-numbers">
                                {formatCurrency(loan.totalDue, lang)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block">{t.colCurrentEmi}</span>
                              <span className="font-medium text-slate-800 font-mono-numbers">
                                {formatCurrency(loan.currentMonthEmi, lang)}
                              </span>
                            </div>
                          </div>

                          {/* Quick Pay Action Button */}
                          <div className="pt-1.5 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400">
                              {lang === 'bn' ? 'জমা তারিখ:' : 'Due Date:'} {loan.nextLoanSubmitDate}
                            </span>
                            <button
                              type="button"
                              onClick={() => onPayLoan(loan)}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-[#E2136E] hover:bg-[#c40e5d] rounded flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                            >
                              <span>{t.recordPayment}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Footer Note */}
              <div className="mt-3 pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
                <span>{lang === 'bn' ? 'ক্যালেন্ডার সিঙ্ক: সক্রিয়' : 'Calendar schedule live synced'}</span>
                <span className="text-slate-400">bKash micro-loan</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
