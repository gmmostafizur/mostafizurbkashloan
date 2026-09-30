import React, { useMemo } from 'react';
import { LoanRecord, PaymentTransaction, Language, BorrowerSummary } from '../types/loan';
import { getT } from '../utils/translations';
import { formatCurrency, isDateOverdue, getDaysRemaining } from '../utils/dateUtils';
import { Printer, Download, Users, TrendingUp, AlertTriangle } from 'lucide-react';

interface MonthlyReportProps {
  loans: LoanRecord[];
  transactions: PaymentTransaction[];
  lang: Language;
  onSelectBorrower: (name: string) => void;
}

export const MonthlyReport: React.FC<MonthlyReportProps> = ({
  loans,
  transactions,
  lang,
  onSelectBorrower,
}) => {
  const t = getT(lang);

  // Group by borrower
  const borrowerSummaries: BorrowerSummary[] = useMemo(() => {
    const map = new Map<string, LoanRecord[]>();
    loans.forEach(l => {
      const arr = map.get(l.personName) || [];
      arr.push(l);
      map.set(l.personName, arr);
    });

    const list: BorrowerSummary[] = [];
    map.forEach((bLoans, name) => {
      const active = bLoans.filter(l => l.status !== 'paid' && l.totalDue > 0);
      const totalPrincipal = bLoans.reduce((sum, l) => sum + l.totalPrincipalLoan, 0);
      const totalDue = bLoans.reduce((sum, l) => sum + l.totalDue, 0);
      const overdue = active.filter(l => isDateOverdue(l.nextLoanSubmitDate)).length;

      const sortedDates = [...active].sort((a, b) => getDaysRemaining(a.nextLoanSubmitDate) - getDaysRemaining(b.nextLoanSubmitDate));
      const earliest = sortedDates.length > 0 ? sortedDates[0].nextLoanSubmitDate : 'Settled';

      list.push({
        personName: name,
        totalLoans: bLoans.length,
        activeLoans: active.length,
        totalPrincipal,
        totalDue,
        loans: bLoans,
        earliestSubmitDate: earliest,
        overdueCount: overdue,
      });
    });

    return list.sort((a, b) => b.totalDue - a.totalDue);
  }, [loans]);

  const grandTotalPrincipal = loans.reduce((sum, l) => sum + l.totalPrincipalLoan, 0);
  const grandTotalDue = loans.reduce((sum, l) => sum + (l.status !== 'paid' ? l.totalDue : 0), 0);
  const grandTotalCollected = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const totalOverdueAccounts = loans.filter(l => l.status !== 'paid' && isDateOverdue(l.nextLoanSubmitDate)).length;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Borrower Name', 'Total Loans', 'Active Loans', 'Total Principal (BDT)', 'Total Due Remaining (BDT)', 'Earliest Due Date', 'Overdue Count'];
    const rows = borrowerSummaries.map(b => [
      b.personName,
      b.totalLoans,
      b.activeLoans,
      b.totalPrincipal.toFixed(2),
      b.totalDue.toFixed(2),
      b.earliestSubmitDate,
      b.overdueCount,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bkash_loan_monthly_summary_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
      {/* Header with Print & Export */}
      <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#E2136E]">
            {lang === 'bn' ? 'অফিসিয়াল মাসিক বিবরণী' : 'Official Portfolio Audit'}
          </span>
          <h2 className="text-lg font-bold tracking-tight text-white">
            {lang === 'bn' ? 'মাসিক ঋণ সমন্বয় ও আদায় রিপোর্ট' : 'Monthly Loan Summary & Collection Report'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {lang === 'bn'
              ? 'মোস্তাফিজুর বিকাশ লোন ম্যানেজমেন্ট সফটওয়্যার - পোর্টফোলিও স্ট্যাটাস'
              : 'Mostafizur bKash Loan Management - Active Accounts & Repayment Ledger'}
          </p>
        </div>

        <div className="no-print flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 rounded-md transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.exportCsv}</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#E2136E] hover:bg-[#c40e5d] rounded-md transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t.printReport}</span>
          </button>
        </div>
      </div>

      {/* High Level KPI summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-200 border-b border-slate-200 bg-slate-50/60 text-xs">
        <div className="p-4">
          <span className="text-slate-500 block mb-1">{t.totalOutstanding}</span>
          <span className="text-xl font-bold text-[#E2136E] font-mono-numbers">
            {formatCurrency(grandTotalDue, lang)}
          </span>
        </div>
        <div className="p-4">
          <span className="text-slate-500 block mb-1">{t.totalPrincipal}</span>
          <span className="text-xl font-bold text-slate-900 font-mono-numbers">
            {formatCurrency(grandTotalPrincipal, lang)}
          </span>
        </div>
        <div className="p-4">
          <span className="text-slate-500 block mb-1">{t.collectionThisMonth}</span>
          <span className="text-xl font-bold text-emerald-700 font-mono-numbers">
            {formatCurrency(grandTotalCollected, lang)}
          </span>
        </div>
        <div className="p-4">
          <span className="text-slate-500 block mb-1">{t.overdueLoans}</span>
          <span className={`text-xl font-bold font-mono-numbers ${totalOverdueAccounts > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {totalOverdueAccounts} accounts
          </span>
        </div>
      </div>

      {/* Summary Table Per Borrower */}
      <div className="p-4 sm:p-5">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
          {lang === 'bn' ? 'ঋণগ্রহীতা ভিত্তিক সংক্ষিপ্ত বিবরণী' : 'Borrower-Wise Summary Breakdown'}
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">{t.colPerson}</th>
                <th className="py-2.5 px-3 text-center">{lang === 'bn' ? 'মোট লোন' : 'Total Loans'}</th>
                <th className="py-2.5 px-3 text-center">{lang === 'bn' ? 'সক্রিয়' : 'Active'}</th>
                <th className="py-2.5 px-3 text-right">{t.colPrincipal}</th>
                <th className="py-2.5 px-3 text-right">{t.colTotalDue}</th>
                <th className="py-2.5 px-3">{t.borrowerEarliestDate}</th>
                <th className="py-2.5 px-3">{lang === 'bn' ? 'স্ট্যাটাস' : 'Schedule Health'}</th>
                <th className="py-2.5 px-3 text-right no-print">{t.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {borrowerSummaries.map((b, idx) => {
                const hasOverdue = b.overdueCount > 0;
                return (
                  <tr key={b.personName} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-mono-numbers text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{b.personName}</td>
                    <td className="py-3 px-3 text-center font-mono-numbers text-slate-700">{b.totalLoans}</td>
                    <td className="py-3 px-3 text-center font-mono-numbers font-semibold text-slate-900">{b.activeLoans}</td>
                    <td className="py-3 px-3 text-right font-mono-numbers text-slate-700">
                      {formatCurrency(b.totalPrincipal, lang)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers font-bold text-[#E2136E]">
                      {formatCurrency(b.totalDue, lang)}
                    </td>
                    <td className="py-3 px-3 font-mono-numbers text-slate-800">
                      {b.earliestSubmitDate}
                    </td>
                    <td className="py-3 px-3">
                      {b.activeLoans === 0 ? (
                        <span className="text-emerald-700 font-medium">All Settled</span>
                      ) : hasOverdue ? (
                        <span className="text-rose-600 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {b.overdueCount} Overdue
                        </span>
                      ) : (
                        <span className="text-slate-600">On Schedule</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right no-print">
                      <button
                        onClick={() => onSelectBorrower(b.personName)}
                        className="px-2.5 py-1 text-xs text-[#E2136E] hover:underline font-semibold"
                      >
                        {lang === 'bn' ? 'বিস্তারিত দেখুন' : 'View Breakdown'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Grand Total Row */}
            <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
              <tr>
                <td colSpan={2} className="py-3 px-3 text-slate-900">
                  {lang === 'bn' ? 'সর্বমোট যোগফল' : 'Grand Total'}
                </td>
                <td className="py-3 px-3 text-center font-mono-numbers">{loans.length}</td>
                <td className="py-3 px-3 text-center font-mono-numbers">
                  {loans.filter(l => l.status !== 'paid' && l.totalDue > 0).length}
                </td>
                <td className="py-3 px-3 text-right font-mono-numbers">
                  {formatCurrency(grandTotalPrincipal, lang)}
                </td>
                <td className="py-3 px-3 text-right font-mono-numbers text-[#E2136E]">
                  {formatCurrency(grandTotalDue, lang)}
                </td>
                <td colSpan={3} className="py-3 px-3 text-slate-500 text-[11px]">
                  {lang === 'bn' ? 'মোস্তাফিজুর বিকাশ লোন ম্যানেজমেন্ট রিপোর্ট' : 'Report generated for management review'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
