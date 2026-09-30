import React, { useState, useMemo } from 'react';
import { PaymentTransaction, Language } from '../types/loan';
import { getT } from '../utils/translations';
import { formatCurrency } from '../utils/dateUtils';
import { exportReceiptToPDF } from '../utils/exportUtils';
import { Search, Download, FileText, ArrowRight, ShieldCheck, Printer } from 'lucide-react';

interface TransactionLedgerProps {
  transactions: PaymentTransaction[];
  lang: Language;
  onViewReceipt: (tx: PaymentTransaction) => void;
}

export const TransactionLedger: React.FC<TransactionLedgerProps> = ({
  transactions,
  lang,
  onViewReceipt,
}) => {
  const t = getT(lang);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const userList = useMemo(() => {
    return Array.from(new Set(transactions.map(t => t.personName))).sort();
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      if (selectedUser && tx.personName.toLowerCase() !== selectedUser.toLowerCase()) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = tx.personName.toLowerCase().includes(q);
        const matchesLoan = tx.loanId.includes(q);
        const matchesRef = tx.referenceId.toLowerCase().includes(q);
        if (!matchesName && !matchesLoan && !matchesRef) return false;
      }
      return true;
    });
  }, [transactions, selectedUser, search]);

  const handleExportCSV = () => {
    const headers = ['Transaction ID', 'Borrower Name', 'Loan ID', 'Payment Date', 'Amount (BDT)', 'Previous Due', 'New Due', 'New Next Date', 'Method', 'Notes'];
    const rows = filtered.map(tx => [
      tx.referenceId,
      tx.personName,
      tx.loanId,
      tx.paymentDate,
      tx.amount.toFixed(2),
      tx.previousDue.toFixed(2),
      tx.newDue.toFixed(2),
      tx.newNextDate,
      tx.method,
      `"${(tx.note || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bkash_loan_transactions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalCollectedInView = filtered.reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            {lang === 'bn' ? 'সকল লেনদেনের খতিয়ান (পেমেন্ট হিস্ট্রি)' : 'Transaction Ledger (Historical Payments)'}
          </h2>
          <p className="text-[11px] text-slate-500">
            {lang === 'bn'
              ? 'প্রতিটি কিস্তি জমা, বকেয়া পরিবর্তন ও TrxID-এর স্থায়ী খতিয়ান'
              : 'Audit trail of every installment paid, due reduction, and schedule adjustment'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 border border-slate-200 bg-white hover:bg-slate-50 rounded-md transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>{t.exportCsv}</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-3 border-b border-slate-200 bg-slate-50/30 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === 'bn' ? 'নাম, লোন আইডি বা TrxID দিয়ে খুঁজুন...' : 'Search by name, loan ID, or TrxID...'}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#E2136E]"
          />
        </div>

        {/* User filter pills */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setSelectedUser(null)}
            className={`px-2.5 py-1 text-xs rounded whitespace-nowrap transition-colors ${
              selectedUser === null
                ? 'bg-slate-900 text-white font-medium'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.allBorrowers}
          </button>
          {userList.map(u => (
            <button
              key={u}
              onClick={() => setSelectedUser(u)}
              className={`px-2.5 py-1 text-xs rounded whitespace-nowrap transition-colors ${
                selectedUser === u
                  ? 'bg-[#E2136E] text-white font-medium'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3">{t.colPerson}</th>
              <th className="py-2.5 px-3">{t.colLoanId}</th>
              <th className="py-2.5 px-3 text-right">Amount Paid</th>
              <th className="py-2.5 px-3 text-right">Previous Due</th>
              <th className="py-2.5 px-3 text-right">New Due</th>
              <th className="py-2.5 px-3">Next Schedule</th>
              <th className="py-2.5 px-3">TrxID / Method</th>
              <th className="py-2.5 px-3 text-right">Voucher</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400">
                  {lang === 'bn' ? 'কোনো লেনদেন রেকর্ড পাওয়া যায়নি' : 'No transaction records found.'}
                </td>
              </tr>
            ) : (
              filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-mono-numbers text-slate-600">
                    {tx.paymentDate}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-900">
                    {tx.personName}
                  </td>
                  <td className="py-2.5 px-3 font-mono-numbers text-slate-700">
                    {tx.loanId}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-700 font-mono-numbers">
                    {formatCurrency(tx.amount, lang)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono-numbers text-slate-500">
                    {formatCurrency(tx.previousDue, lang)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-[#E2136E] font-mono-numbers">
                    {formatCurrency(tx.newDue, lang)}
                  </td>
                  <td className="py-2.5 px-3 font-mono-numbers text-slate-800">
                    <span className="text-slate-400 mr-1">→</span>
                    <span className="font-semibold text-slate-900">{tx.newNextDate}</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono-numbers text-slate-600">
                    <span className="text-xs">{tx.referenceId}</span>
                    <span className="text-[10px] text-slate-400 block">{tx.method}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onViewReceipt(tx)}
                        className="px-2 py-1 text-[11px] font-medium text-slate-700 hover:text-slate-900 border border-slate-200 rounded hover:bg-slate-100 cursor-pointer"
                        title={lang === 'bn' ? 'রশিদ দেখুন' : 'View Receipt'}
                      >
                        {lang === 'bn' ? 'রশিদ দেখুন' : 'View Slip'}
                      </button>
                      <button
                        onClick={() => exportReceiptToPDF(tx, null, lang)}
                        className="p-1 text-slate-500 hover:text-[#E2136E] border border-slate-200 rounded hover:bg-pink-50 cursor-pointer"
                        title={lang === 'bn' ? 'রশিদ ডাউনলোড করুন (PDF)' : 'Download Receipt PDF'}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex justify-between items-center">
        <span>
          {lang === 'bn' ? 'মোট লেনদেন সংখ্যা:' : 'Total Transactions:'} <strong>{filtered.length}</strong>
        </span>
        <span>
          {lang === 'bn' ? 'সর্বমোট জমা:' : 'Total Collected in Ledger:'}{' '}
          <strong className="text-emerald-700 font-mono-numbers">{formatCurrency(totalCollectedInView, lang)}</strong>
        </span>
      </div>
    </div>
  );
};
