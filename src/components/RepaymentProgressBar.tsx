import React from 'react';
import { LoanRecord, Language } from '../types/loan';
import { toBanglaNumber, formatCurrency } from '../utils/dateUtils';

interface RepaymentProgressBarProps {
  loan: LoanRecord;
  lang: Language;
  compact?: boolean;
}

export function calculateLoanRepaymentProgress(loan: LoanRecord): {
  percent: number;
  paidAmount: number;
  totalPayable: number;
} {
  if (loan.status === 'paid' || loan.totalDue <= 0) {
    const totalPayable = loan.originalTotalDue || Math.max(loan.totalPrincipalLoan * 1.03, loan.totalPrincipalLoan);
    return {
      percent: 100,
      paidAmount: totalPayable,
      totalPayable,
    };
  }

  const totalPayable = loan.originalTotalDue && loan.originalTotalDue >= loan.totalDue
    ? loan.originalTotalDue
    : Math.max(loan.totalDue, Number((loan.totalPrincipalLoan * 1.03).toFixed(2)));

  const remaining = Math.max(0, loan.totalDue);
  const paid = Math.max(0, totalPayable - remaining);
  const percent = Math.min(100, Math.max(0, Math.round((paid / (totalPayable || 1)) * 100)));

  return {
    percent,
    paidAmount: Number(paid.toFixed(2)),
    totalPayable: Number(totalPayable.toFixed(2)),
  };
}

export const RepaymentProgressBar: React.FC<RepaymentProgressBarProps> = ({
  loan,
  lang,
  compact = false,
}) => {
  const { percent, paidAmount, totalPayable } = calculateLoanRepaymentProgress(loan);

  const percentDisplay = lang === 'bn' ? `${toBanglaNumber(percent)}%` : `${percent}%`;
  const isSettled = percent >= 100 || loan.status === 'paid';

  return (
    <div className="w-28 sm:w-32 flex flex-col gap-1">
      {/* Percentage and label */}
      <div className="flex items-center justify-between text-[11px] leading-none">
        <span
          className={`font-mono-numbers font-bold ${
            isSettled
              ? 'text-emerald-700'
              : percent > 50
              ? 'text-slate-800'
              : 'text-slate-700'
          }`}
        >
          {percentDisplay}
        </span>
        <span className="text-[10px] text-slate-400">
          {isSettled
            ? (lang === 'bn' ? 'পরিশোধিত' : 'Settled')
            : (lang === 'bn' ? 'জমা হয়েছে' : 'paid')}
        </span>
      </div>

      {/* Track and Fill bar */}
      <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden shadow-inner">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isSettled
              ? 'bg-emerald-500'
              : percent >= 60
              ? 'bg-emerald-500'
              : percent > 0
              ? 'bg-[#E2136E]'
              : 'bg-slate-300'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Subtle paid fraction on desktop */}
      {!compact && (
        <div className="text-[10px] text-slate-400 font-mono-numbers leading-tight hidden lg:block">
          {formatCurrency(paidAmount, lang)} / {formatCurrency(totalPayable, lang)}
        </div>
      )}
    </div>
  );
};
