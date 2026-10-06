import React, { useState, useEffect } from 'react';
import { LoanRecord, PaymentTransaction, Language } from '../types/loan';
import { getT } from '../utils/translations';
import { bumpDateByOneMonth, formatCurrency, getCurrentDateDDMMYYYY, getThreeMonthNames } from '../utils/dateUtils';
import { X, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  loans: LoanRecord[];
  initialLoan?: LoanRecord | null;
  initialAmount?: number;
  initialNote?: string;
  lang: Language;
  onConfirmPayment: (
    loanId: string,
    amount: number,
    paymentDate: string,
    method: 'bKash' | 'Cash' | 'Bank',
    referenceId: string,
    note: string
  ) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  loans,
  initialLoan,
  initialAmount,
  initialNote,
  lang,
  onConfirmPayment,
}) => {
  const t = getT(lang);

  const [selectedLoanId, setSelectedLoanId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(getCurrentDateDDMMYYYY());
  const [method, setMethod] = useState<'bKash' | 'Cash' | 'Bank'>('bKash');
  const [referenceId, setReferenceId] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Active loans list for dropdown
  const activeLoans = loans.filter(l => l.status !== 'paid' && l.totalDue > 0);

  useEffect(() => {
    if (isOpen) {
      const targetLoan = initialLoan || activeLoans[0];
      if (targetLoan) {
        setSelectedLoanId(targetLoan.loanId);
        // Pre-fill amount
        if (initialAmount !== undefined && initialAmount > 0) {
          setAmount(initialAmount.toString());
        } else {
          setAmount(targetLoan.currentMonthEmi > 0 ? targetLoan.currentMonthEmi.toString() : targetLoan.totalDue.toString());
        }
      }
      setPaymentDate(getCurrentDateDDMMYYYY());
      // Generate a mock bKash TrxID
      const randomTrx = 'TRX' + Math.random().toString(36).substring(2, 9).toUpperCase();
      setReferenceId(randomTrx);
      setNote(initialNote || 'Monthly installment payment');
      setError(null);
    }
  }, [isOpen, initialLoan, initialAmount, initialNote]);

  if (!isOpen) return null;

  const currentLoan = loans.find(l => l.loanId === selectedLoanId);
  const numAmount = parseFloat(amount) || 0;

  // Calculate new due and bumped date
  const currentDue = currentLoan ? currentLoan.totalDue : 0;
  const newDue = Math.max(0, currentDue - numAmount);
  const currentSubmitDate = currentLoan ? currentLoan.nextLoanSubmitDate : '';
  const bumpedDate = currentSubmitDate ? bumpDateByOneMonth(currentSubmitDate) : '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLoan) {
      setError(t.errorInvalidLoan);
      return;
    }
    if (numAmount <= 0) {
      setError(t.errorInvalidAmount);
      return;
    }

    onConfirmPayment(
      currentLoan.loanId,
      numAmount,
      paymentDate,
      method,
      referenceId || `BKASH-${Date.now().toString().slice(-6)}`,
      note
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#E2136E] flex items-center justify-center text-white font-bold text-sm">
              ৳
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-white">
                {t.payModalTitle}
              </h3>
              <p className="text-[11px] text-slate-300">
                {lang === 'bn' ? 'স্বয়ংক্রিয় বকেয়া হ্রাস ও পরবর্তী তারিখ নির্ধারণ' : 'Automatic due recalculation & schedule rollover'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {/* Select Loan */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {t.selectLoan}
            </label>
            <select
              value={selectedLoanId}
              onChange={(e) => {
                setSelectedLoanId(e.target.value);
                const l = loans.find(x => x.loanId === e.target.value);
                if (l) {
                  setAmount(l.currentMonthEmi > 0 ? l.currentMonthEmi.toString() : l.totalDue.toString());
                }
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#E2136E]"
            >
              {activeLoans.map((l) => (
                <option key={l.id} value={l.loanId}>
                  {l.personName} - ID: {l.loanId} (Due: ৳{l.totalDue.toFixed(2)} | EMI: ৳{l.currentMonthEmi.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {/* Amount and Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {t.paymentAmount}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 font-bold">
                  ৳
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-md font-mono-numbers text-slate-900 font-bold text-sm focus:outline-none focus:ring-1 focus:ring-[#E2136E]"
                  placeholder="0.00"
                />
              </div>
              {currentLoan && (() => {
                const loanMonths = getThreeMonthNames(currentLoan.nextLoanSubmitDate, lang);
                return (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {currentLoan.currentMonthEmi > 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setAmount(currentLoan.currentMonthEmi.toString());
                          setNote(`${currentLoan.personName} - ${loanMonths.month1} কিস্তি জমা`);
                        }}
                        className="px-2 py-0.5 text-[10px] font-bold text-[#E2136E] bg-pink-50 border border-pink-200 rounded-md hover:bg-pink-100 transition-colors cursor-pointer"
                        title={lang === 'bn' ? `${loanMonths.month1}-এর কিস্তি নির্বাচন করুন` : `Select ${loanMonths.month1} EMI`}
                      >
                        {loanMonths.month1Short} (৳{currentLoan.currentMonthEmi.toFixed(2)})
                      </button>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md">
                        ✓ {loanMonths.month1Short} পরিশোধিত
                      </span>
                    )}

                    {currentLoan.secondMonthEmi > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setAmount(currentLoan.secondMonthEmi.toString());
                          setNote(`${currentLoan.personName} - ${loanMonths.month2} কিস্তি জমা`);
                        }}
                        className="px-2 py-0.5 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors cursor-pointer"
                        title={lang === 'bn' ? `${loanMonths.month2}-এর কিস্তি নির্বাচন করুন` : `Select ${loanMonths.month2} EMI`}
                      >
                        {loanMonths.month2Short} (৳{currentLoan.secondMonthEmi.toFixed(2)})
                      </button>
                    )}

                    {currentLoan.thirdMonthEmi > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setAmount(currentLoan.thirdMonthEmi.toString());
                          setNote(`${currentLoan.personName} - ${loanMonths.month3} কিস্তি জমা`);
                        }}
                        className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors cursor-pointer"
                        title={lang === 'bn' ? `${loanMonths.month3}-এর কিস্তি নির্বাচন করুন` : `Select ${loanMonths.month3} EMI`}
                      >
                        {loanMonths.month3Short} (৳{currentLoan.thirdMonthEmi.toFixed(2)})
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setAmount(currentLoan.totalDue.toString());
                        setNote(`${currentLoan.personName} - সকল কিস্তি পূর্ণ পরিশোধ`);
                      }}
                      className="px-2 py-0.5 text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-300 rounded-md hover:bg-slate-200 transition-colors cursor-pointer"
                      title={lang === 'bn' ? 'সম্পূর্ণ বকেয়া পরিশোধ' : 'Full loan settlement'}
                    >
                      {lang === 'bn' ? 'পূর্ণ পরিশোধ' : 'Full'} (৳{currentLoan.totalDue.toFixed(2)})
                    </button>
                  </div>
                );
              })()}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {t.paymentDate}
              </label>
              <input
                type="text"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                placeholder="MM/DD/YYYY"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md font-mono-numbers text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#E2136E]"
              />
            </div>
          </div>

          {/* Payment Method & Reference ID */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {t.paymentMethod}
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#E2136E]"
              >
                <option value="bKash">bKash (বিকাশ)</option>
                <option value="Cash">Cash (নগদ)</option>
                <option value="Bank">Bank Transfer</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {t.referenceId}
              </label>
              <input
                type="text"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="e.g. 9K8J210"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md font-mono-numbers text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#E2136E]"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {t.paymentNote}
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Musha paid 1236.58 TK for October"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#E2136E]"
            />
          </div>

          {/* Live Recalculation Preview Box */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {t.previewRecalc}
            </span>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2 bg-white rounded border border-slate-200">
                <span className="text-slate-400 block text-[10px]">{t.beforePayment}</span>
                <span className="font-bold text-slate-700 font-mono-numbers text-sm">
                  {formatCurrency(currentDue, lang)}
                </span>
                <div className="text-[10px] text-slate-400 mt-1">
                  Due Date: <span className="font-mono-numbers text-slate-600">{currentSubmitDate}</span>
                </div>
              </div>

              <div className="p-2 bg-emerald-50/70 rounded border border-emerald-200">
                <span className="text-emerald-700 block text-[10px] font-semibold">{t.afterPayment}</span>
                <span className="font-bold text-emerald-800 font-mono-numbers text-sm">
                  {formatCurrency(newDue, lang)}
                </span>
                <div className="text-[10px] text-emerald-700 mt-1 font-medium">
                  {lang === 'bn' ? 'নতুন তারিখ: ' : 'New Date: '}
                  <span className="font-mono-numbers font-bold">{bumpedDate}</span>
                </div>
              </div>
            </div>

            {newDue <= 0 && numAmount > 0 && (
              <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1.5 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {lang === 'bn'
                    ? 'এই পরিশোধের মাধ্যমে লোনটি সম্পূর্ণ খালাস (Paid Off) হবে।'
                    : 'This payment will mark the entire loan fully settled.'}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-md hover:bg-slate-50"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#E2136E] hover:bg-[#c40e5d] rounded-md shadow-sm transition-colors"
            >
              {t.confirmPaymentBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
