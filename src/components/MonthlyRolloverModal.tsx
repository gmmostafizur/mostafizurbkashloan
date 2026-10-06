import React, { useState } from 'react';
import { LoanRecord, Language } from '../types/loan';
import { getT } from '../utils/translations';
import { isDateOverdue, getDaysRemaining, bumpDateByOneMonth, formatCurrency, getThreeMonthNames } from '../utils/dateUtils';
import { X, CalendarClock, AlertTriangle, CheckCircle, RefreshCw, ArrowRight } from 'lucide-react';

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
  const overdueCount = activeLoans.filter(l => isDateOverdue(l.nextLoanSubmitDate) && l.currentMonthEmi > 0).length;
  const readyToRollCount = activeLoans.filter(l => l.currentMonthEmi <= 0).length;

  const currentMonths = getThreeMonthNames(activeLoans[0]?.nextLoanSubmitDate || null, lang);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in duration-150 text-slate-900 dark:text-white transition-colors">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#E2136E]/20 text-[#E2136E] flex items-center justify-center font-bold">
              <CalendarClock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {t.monthlyRollover}
              </h3>
              <p className="text-[11px] text-slate-300">
                {lang === 'bn' ? 'মাস পরিবর্তন ও ২য় মাসের কিস্তি বর্তমান মাসে রূপান্তর' : 'Month Transition & Installment Schedule Rollover'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Month transition banner */}
          <div className="p-3 bg-gradient-to-r from-pink-50 to-blue-50 dark:from-pink-950/40 dark:to-blue-950/40 border border-pink-200 dark:border-pink-900/60 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">
                {lang === 'bn' ? 'বর্তমান সক্রিয় মাস' : 'Current Billing Month'}
              </span>
              <span className="text-sm font-bold text-[#E2136E]">
                {currentMonths.month1}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <div className="text-right">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">
                {lang === 'bn' ? 'রোল-ওভারের পরবর্তী মাস' : 'Next Month After Rollover'}
              </span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {currentMonths.month2}
              </span>
            </div>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-amber-900 dark:text-amber-200 leading-relaxed">
            <p className="font-semibold mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>{lang === 'bn' ? 'মাস পরিবর্তন ও শিডিউল রুলস:' : 'Month Transition Rules:'}</span>
            </p>
            <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-300 text-[11px]">
              <li>
                {lang === 'bn'
                  ? 'যেসব লোনের চলতি মাসের কিস্তি পরিশোধিত (০ টাকা), রোল-ওভার প্রয়োগ করলে ২য় মাসের কিস্তি বর্তমান মাসে চলে আসবে এবং ৩য় মাসের কিস্তি ২য় মাসে আসবে।'
                  : 'For loans where current month EMI was paid, 2nd month EMI automatically advances to current month upon rollover.'}
              </li>
              <li>
                {lang === 'bn'
                  ? 'অপরিশোধিত কিস্তির তারিখ অতীত হয়ে গেলে তা ওভারডিউ (Overdue) হিসেবে ফ্ল্যাগ হবে।'
                  : 'Unpaid installments past their deadline are flagged as overdue.'}
              </li>
            </ul>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-800/40">
            <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-2">
              {lang === 'bn' ? 'লোন বিশ্লেষণ ও স্থিতি:' : 'Active Loans Status Summary:'}
            </span>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">{t.activeLoansCount}</span>
                <span className="text-base font-bold text-slate-900 dark:text-white font-mono-numbers">{activeLoans.length}</span>
              </div>
              <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">
                  {lang === 'bn' ? 'পরিশোধিত (শিফটের অপেক্ষায়)' : 'Paid (Ready to shift)'}
                </span>
                <span className="text-base font-bold text-emerald-600 font-mono-numbers">
                  {readyToRollCount}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">{t.overdueLoans}</span>
                <span className={`text-base font-bold font-mono-numbers ${overdueCount > 0 ? 'text-rose-600' : 'text-slate-600 dark:text-slate-400'}`}>
                  {overdueCount}
                </span>
              </div>
            </div>
          </div>

          {/* Schedule preview */}
          <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
            {activeLoans.map(l => {
              const months = getThreeMonthNames(l.nextLoanSubmitDate, lang);
              const isPaid = l.currentMonthEmi <= 0;
              return (
                <div key={l.id} className="p-2.5 flex items-center justify-between text-[11px]">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 dark:text-white">{l.personName}</span>
                      <span className="text-slate-400 font-mono-numbers text-[10px]">({l.loanId.slice(-6)})</span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {months.month1Short}: {isPaid ? 'পরিশোধিত ✓' : `৳${l.currentMonthEmi.toFixed(2)}`} · {months.month2Short}: ৳{l.secondMonthEmi.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-right">
                    {isPaid ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {months.month2Short}-এ যাবে
                      </span>
                    ) : (
                      <span className="text-[#E2136E] font-bold font-mono-numbers">
                        {formatCurrency(l.currentMonthEmi, lang)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="button"
              onClick={() => {
                onExecuteRollover();
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#E2136E] hover:bg-[#c40e5d] rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'রোল-ওভার প্রয়োগ করুন (পরবর্তী মাস)' : 'Execute Rollover (Advance Month)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

