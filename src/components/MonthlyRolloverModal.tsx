import React, { useState } from 'react';
import { LoanRecord, Language } from '../types/loan';
import { getT } from '../utils/translations';
import { isDateOverdue, getDaysRemaining, bumpDateByOneMonth, formatCurrency } from '../utils/dateUtils';
import { X, CalendarClock, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

interface MonthlyRolloverModalProps {
  isOpen: boolean;
  onClose: () => void;
  loans: LoanRecord[];
  lang: Language;
  onExecuteRollover: (simulatedDateStr?: string) => void;
}

export const MonthlyRolloverModal: React.FC<MonthlyRolloverModalProps> = ({
  isOpen,
  onClose,
  loans,
  lang,
  onExecuteRollover,
}) => {
  const t = getT(lang);
  const [simDate, setSimDate] = useState('10/15/2026');

  if (!isOpen) return null;

  const activeLoans = loans.filter(l => l.status !== 'paid' && l.totalDue > 0);
  const overdueCount = activeLoans.filter(l => isDateOverdue(l.nextLoanSubmitDate)).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <CalendarClock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {t.monthlyRollover}
              </h3>
              <p className="text-[11px] text-slate-300">
                {lang === 'bn' ? 'মাসিক কিস্তি শিডিউল রোল-ওভার ও বকেয়া নিরীক্ষা' : 'Monthly installment schedule audit & overdue evaluation'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-md text-amber-900 leading-relaxed">
            <p className="font-semibold mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>{lang === 'bn' ? 'মাসিক রোল-ওভার নিয়মাবলী:' : 'Monthly Rollover Logic:'}</span>
            </p>
            <ul className="list-disc pl-4 space-y-1 text-slate-700 text-[11px]">
              <li>
                {lang === 'bn'
                  ? 'কোনো লোনের কিস্তির তারিখ অতিক্রান্ত হলে এবং জমা না পড়লে স্বয়ংক্রিয়ভাবে মেয়াদোত্তীর্ণ (Overdue) হিসেবে ফ্ল্যাগ হবে।'
                  : 'If a payment submit date passes without full EMI entry, it is automatically marked overdue.'}
              </li>
              <li>
                {lang === 'bn'
                  ? 'পরবর্তী কিস্তি সমন্বয় করতে রোল-ওভার প্রয়োগ করুন।'
                  : 'Running rollover re-synchronizes the repayment window and audits borrower dues.'}
              </li>
            </ul>
          </div>

          <div className="border border-slate-200 rounded-md p-3 bg-slate-50">
            <span className="font-semibold text-slate-700 block mb-2">
              {lang === 'bn' ? 'বর্তমান মাস লোন ও কিস্তি বিশ্লেষণ:' : 'Active Loans Status Summary:'}
            </span>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded border border-slate-200">
                <span className="text-slate-500 block text-[11px]">{t.activeLoansCount}</span>
                <span className="text-lg font-bold text-slate-900 font-mono-numbers">{activeLoans.length}</span>
              </div>
              <div className="bg-white p-2.5 rounded border border-slate-200">
                <span className="text-slate-500 block text-[11px]">{t.overdueLoans}</span>
                <span className={`text-lg font-bold font-mono-numbers ${overdueCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {overdueCount}
                </span>
              </div>
            </div>
          </div>

          {/* Schedule preview */}
          <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-md divide-y divide-slate-100">
            {activeLoans.slice(0, 6).map(l => (
              <div key={l.id} className="p-2.5 flex items-center justify-between text-[11px]">
                <div>
                  <span className="font-bold text-slate-900">{l.personName}</span>
                  <span className="text-slate-400 font-mono-numbers ml-1.5">({l.loanId.slice(-6)})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-numbers text-slate-600">{l.nextLoanSubmitDate}</span>
                  <span className="text-[#E2136E] font-bold font-mono-numbers">
                    {formatCurrency(l.currentMonthEmi, lang)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Action */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-md"
            >
              {t.cancel}
            </button>
            <button
              type="button"
              onClick={() => {
                onExecuteRollover();
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#E2136E] hover:bg-[#c40e5d] rounded-md shadow-xs transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'রোল-ওভার প্রয়োগ করুন' : 'Run Schedule Audit & Rollover'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
