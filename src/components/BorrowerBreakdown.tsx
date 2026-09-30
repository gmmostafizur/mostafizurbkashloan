import React from 'react';
import { LoanRecord, Language } from '../types/loan';
import { getT } from '../utils/translations';
import { formatCurrency, isDateOverdue, getDaysRemaining } from '../utils/dateUtils';
import { RepaymentProgressBar } from './RepaymentProgressBar';
import { CreditCard, Calendar, User, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface BorrowerBreakdownProps {
  personName: string;
  loans: LoanRecord[];
  lang: Language;
  onPayLoan: (loan: LoanRecord) => void;
  onViewReceipt: (loan: LoanRecord) => void;
  onClearFilter: () => void;
}

export const BorrowerBreakdown: React.FC<BorrowerBreakdownProps> = ({
  personName,
  loans,
  lang,
  onPayLoan,
  onViewReceipt,
  onClearFilter,
}) => {
  const t = getT(lang);

  // Filter loans for this person
  const borrowerLoans = loans.filter(
    l => l.personName.trim().toLowerCase() === personName.trim().toLowerCase()
  );

  const activeLoans = borrowerLoans.filter(l => l.status !== 'paid' && l.totalDue > 0);
  const totalPrincipal = borrowerLoans.reduce((sum, l) => sum + l.totalPrincipalLoan, 0);
  const totalDue = borrowerLoans.reduce((sum, l) => sum + l.totalDue, 0);
  const overdueCount = activeLoans.filter(l => isDateOverdue(l.nextLoanSubmitDate)).length;

  // Find nearest upcoming submit date
  const sortedByDate = [...activeLoans].sort((a, b) => {
    return getDaysRemaining(a.nextLoanSubmitDate) - getDaysRemaining(b.nextLoanSubmitDate);
  });
  const earliestDate = sortedByDate.length > 0 ? sortedByDate[0].nextLoanSubmitDate : 'N/A';

  if (borrowerLoans.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs mb-6">
      {/* Header Profile Banner */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#E2136E] flex items-center justify-center text-white text-lg font-bold">
            {personName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-white">{personName}</h2>
              <span className="text-xs text-slate-300 font-normal">
                ({activeLoans.length} {lang === 'bn' ? 'সক্রিয় লোন' : 'active loans'})
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {lang === 'bn'
                ? 'বিকাশ মাইক্রো-লোন পোর্টফোলিও বিবরণী'
                : 'bKash Nano Micro-Loan Portfolio Overview'}
            </p>
          </div>
        </div>

        {/* Action button to clear or view all */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClearFilter}
            className="px-3 py-1.5 text-xs text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 rounded transition-colors"
          >
            {lang === 'bn' ? 'সকল ঋণগ্রহীতা দেখুন' : 'Show All Borrowers'}
          </button>
        </div>
      </div>

      {/* Aggregate Metric Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-100 border-b border-slate-200 bg-slate-50/50">
        <div className="p-3.5 sm:p-4">
          <span className="text-xs text-slate-500 font-medium block">
            {t.borrowerTotalLoans}
          </span>
          <span className="text-xl font-bold text-slate-900 font-mono-numbers">
            {activeLoans.length} / {borrowerLoans.length}
          </span>
        </div>
        <div className="p-3.5 sm:p-4">
          <span className="text-xs text-slate-500 font-medium block">
            {t.borrowerTotalPrincipal}
          </span>
          <span className="text-xl font-bold text-slate-900 font-mono-numbers">
            {formatCurrency(totalPrincipal, lang)}
          </span>
        </div>
        <div className="p-3.5 sm:p-4">
          <span className="text-xs text-slate-500 font-medium block">
            {t.borrowerTotalDue}
          </span>
          <span className="text-xl font-bold text-[#E2136E] font-mono-numbers">
            {formatCurrency(totalDue, lang)}
          </span>
        </div>
        <div className="p-3.5 sm:p-4">
          <span className="text-xs text-slate-500 font-medium block">
            {t.borrowerEarliestDate}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-sm font-semibold text-slate-900 font-mono-numbers">
              {earliestDate}
            </span>
            {overdueCount > 0 && (
              <span className="text-[11px] text-rose-600 font-semibold ml-1">
                ({overdueCount} overdue)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* List of all Loan IDs with EMI breakdowns */}
      <div className="p-4 sm:p-5">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          {lang === 'bn' ? 'বর্তমান মাস লোন ও কিস্তির বিস্তারিত বিভাজন' : 'Active Loan Accounts & EMI Breakdown'}
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-medium border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">{t.colLoanId}</th>
                <th className="py-2.5 px-3 text-right">{t.colPrincipal}</th>
                <th className="py-2.5 px-3 text-right">{t.colCurrentEmi}</th>
                <th className="py-2.5 px-3 text-right">{t.colSecondEmi}</th>
                <th className="py-2.5 px-3 text-right">{t.colThirdEmi}</th>
                <th className="py-2.5 px-3 text-right">{t.colTotalDue}</th>
                <th className="py-2.5 px-3">{t.colPaidProgress}</th>
                <th className="py-2.5 px-3">{t.colNextDate}</th>
                <th className="py-2.5 px-3">{t.colStatus}</th>
                <th className="py-2.5 px-3 text-right">{t.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {borrowerLoans.map((loan) => {
                const isOverdue = isDateOverdue(loan.nextLoanSubmitDate);
                const daysRemaining = getDaysRemaining(loan.nextLoanSubmitDate);
                const isSettled = loan.totalDue <= 0 || loan.status === 'paid';

                return (
                  <tr key={loan.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono-numbers text-slate-900 font-medium">
                      {loan.loanId}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers text-slate-700">
                      {formatCurrency(loan.totalPrincipalLoan, lang)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers text-slate-900 font-semibold">
                      {formatCurrency(loan.currentMonthEmi, lang)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers text-slate-600">
                      {loan.secondMonthEmi > 0 ? formatCurrency(loan.secondMonthEmi, lang) : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers text-slate-600">
                      {loan.thirdMonthEmi > 0 ? formatCurrency(loan.thirdMonthEmi, lang) : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers text-[#E2136E] font-bold">
                      {formatCurrency(loan.totalDue, lang)}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <RepaymentProgressBar loan={loan} lang={lang} />
                    </td>
                    <td className="py-3 px-3 font-mono-numbers">
                      <span className={isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-800'}>
                        {loan.nextLoanSubmitDate}
                      </span>
                      {!isSettled && (
                        <div className="text-[10px] text-slate-400">
                          {isOverdue
                            ? `${Math.abs(daysRemaining)}d overdue`
                            : daysRemaining === 0
                            ? 'Due today'
                            : `in ${daysRemaining} days`}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {isSettled ? (
                        <span className="text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          {t.statusPaid}
                        </span>
                      ) : isOverdue ? (
                        <span className="text-rose-700 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {t.statusOverdue}
                        </span>
                      ) : daysRemaining <= 14 ? (
                        <span className="text-amber-700 font-medium">
                          {t.statusDueSoon}
                        </span>
                      ) : (
                        <span className="text-slate-600">
                          {t.statusActive}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isSettled ? (
                          <>
                            <button
                              onClick={() => onPayLoan(loan)}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-[#E2136E] hover:bg-[#c40e5d] rounded transition-colors shadow-2xs cursor-pointer"
                            >
                              {lang === 'bn' ? 'কিস্তি জমা' : 'Pay EMI'}
                            </button>
                            {loan.lastPaymentDate && (
                              <button
                                onClick={() => onViewReceipt(loan)}
                                className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                                title={lang === 'bn' ? 'জমার রশিদ দেখুন ও ডাউনলোড করুন' : 'View & Download Receipt'}
                              >
                                {lang === 'bn' ? 'রশিদ' : 'Receipt'}
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            onClick={() => onViewReceipt(loan)}
                            className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors cursor-pointer"
                          >
                            {lang === 'bn' ? 'রশিদ দেখুন' : 'View Receipt'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
