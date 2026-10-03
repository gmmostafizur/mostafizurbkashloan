import React from 'react';
import { LoanRecord, PaymentTransaction, Language } from '../types/loan';
import { getT } from '../utils/translations';
import { formatCurrency, isDateOverdue, getDaysRemaining } from '../utils/dateUtils';
import { AlertCircle, CheckCircle2, TrendingUp, Users, Wallet } from 'lucide-react';

interface StatsCardsProps {
  loans: LoanRecord[];
  transactions: PaymentTransaction[];
  lang: Language;
  onFilterOverdue: () => void;
  onFilterDueSoon: () => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  loans,
  transactions,
  lang,
  onFilterOverdue,
  onFilterDueSoon,
}) => {
  const t = getT(lang);

  const activeLoans = loans.filter(l => l.status !== 'paid' && l.totalDue > 0);
  const totalDue = activeLoans.reduce((sum, l) => sum + l.totalDue, 0);
  const totalPrincipal = loans.reduce((sum, l) => sum + l.totalPrincipalLoan, 0);
  const totalCollected = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  // Unique borrowers
  const uniqueBorrowers = new Set(loans.map(l => l.personName.trim().toLowerCase())).size;

  // Overdue count (past due date)
  const overdueLoans = activeLoans.filter(l => isDateOverdue(l.nextLoanSubmitDate));
  
  // Due soon (within next 14 days and not overdue)
  const dueSoonLoans = activeLoans.filter(l => {
    const days = getDaysRemaining(l.nextLoanSubmitDate);
    return days >= 0 && days <= 14;
  });

  // Monthly collection rate calculation
  const totalExpected = totalPrincipal > 0 ? totalPrincipal : 1;
  const collectionPercentage = Math.min(100, Math.round((totalCollected / (totalCollected + totalDue || 1)) * 100));

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. Total Outstanding Debt */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold mb-2">
            <span className="truncate">{t.totalOutstanding}</span>
            <div className="w-7 h-7 rounded-lg bg-pink-50 dark:bg-pink-950/40 text-[#E2136E] flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-[#E2136E] font-mono-numbers">
            {formatCurrency(totalDue, lang)}
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span className="truncate">{activeLoans.length} {t.activeLoansCount}</span>
          <span>•</span>
          <span className="truncate">{uniqueBorrowers} {t.activeBorrowers}</span>
        </div>
      </div>

      {/* 2. Total Principal Disbursed */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold mb-2">
            <span className="truncate">{t.totalPrincipal}</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-mono-numbers">
            {formatCurrency(totalPrincipal, lang)}
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span className="truncate">{loans.length} {lang === 'bn' ? 'মোট লোন' : 'Accounts'}</span>
          <span>•</span>
          <span className="text-blue-600 dark:text-blue-400 font-semibold truncate">bKash Nano</span>
        </div>
      </div>

      {/* 3. Monthly Collections */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold mb-2">
            <span className="truncate">{t.collectionThisMonth}</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 font-mono-numbers">
            {formatCurrency(totalCollected, lang)}
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${collectionPercentage}%` }}
            />
          </div>
          <span className="font-mono-numbers font-bold text-emerald-600 dark:text-emerald-400 shrink-0">{collectionPercentage}%</span>
        </div>
      </div>

      {/* 4. Overdue / Due Soon Alerts */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold mb-2">
            <span className="truncate">{t.overdueLoans}</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              overdueLoans.length > 0 ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-500'
            }`}>
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <button
              onClick={onFilterOverdue}
              className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-rose-600 font-mono-numbers hover:opacity-80 active:scale-95 transition-all cursor-pointer"
              title="Click to view overdue"
            >
              {overdueLoans.length}
            </button>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <button
              onClick={onFilterDueSoon}
              className="text-base sm:text-lg font-bold text-amber-500 font-mono-numbers hover:opacity-80 active:scale-95 transition-all cursor-pointer truncate"
              title="Click to view due soon"
            >
              {dueSoonLoans.length} {lang === 'bn' ? 'আসন্ন' : 'due soon'}
            </button>
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] sm:text-xs">
          <span className={`font-semibold truncate block ${overdueLoans.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
            {overdueLoans.length > 0
              ? (lang === 'bn' ? 'জরুরি দৃষ্টি আকর্ষণ প্রয়োজন!' : 'Immediate attention needed!')
              : (lang === 'bn' ? 'সব কিস্তি সময়মতো চলছে' : 'All schedules on track')}
          </span>
        </div>
      </div>
    </div>
  );
};
