import React, { useState } from 'react';
import { PaymentTransaction, Language, LoanRecord } from '../types/loan';
import { getT } from '../utils/translations';
import { formatCurrency } from '../utils/dateUtils';
import { exportReceiptToPDF } from '../utils/exportUtils';
import { X, Printer, Copy, Check, ShieldCheck, Download, CheckCircle2 } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: PaymentTransaction | null;
  loan?: LoanRecord | null;
  lang: Language;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
  loan,
  lang,
}) => {
  const t = getT(lang);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const personName = transaction?.personName || loan?.personName || 'Borrower';
  const loanId = transaction?.loanId || loan?.loanId || '';
  const amountPaid = transaction?.amount || 0;
  const remainingDue = transaction?.newDue !== undefined ? transaction.newDue : loan?.totalDue || 0;
  const nextSubmitDate = transaction?.newNextDate || loan?.nextLoanSubmitDate || '';
  const paymentDate = transaction?.paymentDate || loan?.lastPaymentDate || 'Today';
  const trxId = transaction?.referenceId || `BKASH-${Date.now().toString().slice(-8)}`;

  const smsText = `bKash Loan Repayment Confirmed!
Borrower: ${personName}
Loan ID: ${loanId}
Amount Paid: ৳${amountPaid.toFixed(2)}
Payment Date: ${paymentDate}
Remaining Due: ৳${remainingDue.toFixed(2)}
Next Submit Date: ${nextSubmitDate}
TrxID: ${trxId}
Thank you! - Mostafizur bKash Loan Management`;

  const handleCopySms = () => {
    navigator.clipboard.writeText(smsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    const txData: PaymentTransaction = transaction || {
      id: `TXN-${Date.now()}`,
      loanId: loanId,
      personName: personName,
      amount: amountPaid,
      paymentDate: paymentDate,
      timestamp: new Date().toISOString(),
      previousDue: (loan?.totalPrincipalLoan || 0),
      newDue: remainingDue,
      previousNextDate: loan?.nextLoanSubmitDate || paymentDate,
      newNextDate: nextSubmitDate,
      method: 'bKash',
      referenceId: trxId,
      note: `Payment receipt voucher`,
    };

    exportReceiptToPDF(txData, loan, lang);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in duration-150">
        {/* Modal Top Bar */}
        <div className="no-print px-4 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">{t.receiptTitle}</span>
            <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{lang === 'bn' ? 'পরিশোধিত' : 'Settled'}</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Receipt Paper */}
        <div id="printable-receipt" className="p-6 bg-white text-slate-900 space-y-4 font-sans text-xs">
          {/* Header */}
          <div className="text-center border-b border-dashed border-slate-300 pb-4">
            <div className="w-10 h-10 rounded-full bg-[#E2136E] text-white font-bold text-xl flex items-center justify-center mx-auto mb-2 shadow-xs">
              ৳
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {lang === 'bn' ? 'মোস্তাফিজুর বিকাশ লোন ম্যানেজমেন্ট' : 'Mostafizur bKash Loan Management'}
            </h2>
            <p className="text-[11px] text-slate-500">{t.receiptTagline}</p>
            <div className="mt-2 inline-block px-2.5 py-0.5 bg-slate-100 rounded text-[11px] font-mono-numbers text-slate-600">
              TrxID: {trxId}
            </div>
          </div>

          {/* Details Table */}
          <div className="space-y-2.5 py-2">
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-500">{t.colPerson}</span>
              <span className="font-bold text-slate-900 text-sm">{personName}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-500">{t.colLoanId}</span>
              <span className="font-mono-numbers text-slate-800 font-medium">{loanId}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-500">{lang === 'bn' ? 'জমা তারিখ' : 'Payment Date'}</span>
              <span className="font-mono-numbers text-slate-800">{paymentDate}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-500">{lang === 'bn' ? 'পরিশোধের পরিমাণ' : 'Amount Paid'}</span>
              <span className="font-bold text-emerald-700 font-mono-numbers text-base">
                {formatCurrency(amountPaid, lang)}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-500">{lang === 'bn' ? 'অবশিষ্ট মোট বকেয়া' : 'Remaining Total Due'}</span>
              <span className="font-bold text-[#E2136E] font-mono-numbers text-base">
                {formatCurrency(remainingDue, lang)}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">{t.colNextDate}</span>
              <span className="font-bold text-slate-900 font-mono-numbers text-sm">
                {nextSubmitDate}
              </span>
            </div>
          </div>

          {/* Verification stamp */}
          <div className="pt-3 border-t border-dashed border-slate-300 text-center">
            <div className="flex items-center justify-center gap-1.5 text-emerald-700 text-xs font-semibold mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>{lang === 'bn' ? 'সিস্টেম কর্তৃক যাচাইকৃত ও সংরক্ষিত' : 'Verified System Ledger Entry'}</span>
            </div>
            <p className="text-[10px] text-slate-400">
              {lang === 'bn'
                ? 'সময়মতো কিস্তি পরিশোধ করে ক্রেডিট স্কোর ভালো রাখুন।'
                : 'Maintain good credit score by paying bKash EMIs on or before the due date.'}
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="no-print p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={handleCopySms}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 border border-slate-300 rounded-md hover:bg-white transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? (lang === 'bn' ? 'কপি হয়েছে!' : 'Copied!') : t.receiptCopySms}</span>
          </button>

          <div className="flex items-center gap-2">
            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#E2136E] hover:bg-[#c40e5d] rounded-md transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'রশিদ ডাউনলোড (PDF)' : 'Download Receipt (PDF)'}</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-md transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t.receiptPrint}</span>
            </button>

            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-md hover:bg-slate-100 cursor-pointer"
            >
              {t.receiptClose}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
