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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Outstanding Debt */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 transition-all hover:border-slate-300">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1.5">
          <span>{t.totalOutstanding}</span>
          <Wallet className="w-4 h-4 text-[#E2136E]" />
        </div>
        <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono-numbers">
          {formatCurrency(totalDue, lang)}
        </div>
        <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
          <span>{activeLoans.length} {t.activeLoansCount}</span>
          <span>·</span>
          <span>{uniqueBorrowers} {t.activeBorrowers}</span>
        </div>
      </div>

      {/* 2. Total Principal Disbursed */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 transition-all hover:border-slate-300">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1.5">
          <span>{t.totalPrincipal}</span>
          <TrendingUp className="w-4 h-4 text-slate-600" />
        </div>
        <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono-numbers">
          {formatCurrency(totalPrincipal, lang)}
        </div>
        <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
          <span>{loans.length} {lang === 'bn' ? 'মোট লোন অ্যাকাউন্ট' : 'Total Accounts'}</span>
          <span>·</span>
          <span className="text-emerald-600 font-medium">bKash Nano</span>
        </div>
      </div>

      {/* 3. Monthly Collections */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 transition-all hover:border-slate-300">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1.5">
          <span>{t.collectionThisMonth}</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="text-2xl font-bold tracking-tight text-emerald-700 font-mono-numbers">
          {formatCurrency(totalCollected, lang)}
        </div>
        <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
          <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${collectionPercentage}%` }}
            />
          </div>
          <span className="font-mono-numbers text-[11px] text-slate-600">{collectionPercentage}%</span>
        </div>
      </div>

      {/* 4. Overdue / Due Soon Alerts */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 transition-all hover:border-slate-300">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1.5">
          <span>{t.overdueLoans} & {t.dueWithin7Days}</span>
          <AlertCircle className={`w-4 h-4 ${overdueLoans.length > 0 ? 'text-rose-600' : 'text-amber-500'}`} />
        </div>
        <div className="flex items-baseline gap-2">
          <button
            onClick={onFilterOverdue}
            className="text-2xl font-bold tracking-tight text-rose-600 font-mono-numbers hover:underline cursor-pointer"
            title="Click to view overdue"
          >
            {overdueLoans.length}
          </button>
          <span className="text-xs text-slate-400">/</span>
          <button
            onClick={onFilterDueSoon}
            className="text-lg font-semibold text-amber-600 font-mono-numbers hover:underline cursor-pointer"
            title="Click to view due soon"
          >
            {dueSoonLoans.length} {lang === 'bn' ? 'আসন্ন কিস্তি' : 'due soon'}
          </button>
        </div>
        <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
          <span className={overdueLoans.length > 0 ? 'text-rose-600 font-medium' : 'text-slate-500'}>
            {overdueLoans.length > 0
              ? (lang === 'bn' ? 'মেয়াদোত্তীর্ণ কিস্তি বিদ্যমান!' : 'Immediate attention needed!')
              : (lang === 'bn' ? 'সব কিস্তি সময়মতো' : 'All schedules on track')}
          </span>
        </div>
      </div>
    </div>
  );
};
