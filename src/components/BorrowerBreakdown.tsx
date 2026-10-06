import React, { useState, useEffect } from 'react';
import { LoanRecord, Language } from '../types/loan';
import { getT } from '../utils/translations';
import { formatCurrency, isDateOverdue, getDaysRemaining, getThreeMonthNames } from '../utils/dateUtils';
import { RepaymentProgressBar } from './RepaymentProgressBar';
import {
  Calendar,
  CheckCircle,
  AlertCircle,
  BellRing,
  MessageSquareShare,
  Phone,
  Copy,
  Check,
  X,
  ExternalLink,
  Send,
  AlertTriangle,
} from 'lucide-react';

interface BorrowerBreakdownProps {
  personName: string;
  loans: LoanRecord[];
  lang: Language;
  onPayLoan: (loan: LoanRecord) => void;
  onViewReceipt: (loan: LoanRecord) => void;
  onClearFilter: () => void;
  isReadOnly?: boolean;
}

const STORAGE_KEY_PHONES = 'mostafizur_bkash_borrower_phones_v1';

export const BorrowerBreakdown: React.FC<BorrowerBreakdownProps> = ({
  personName,
  loans,
  lang,
  onPayLoan,
  onViewReceipt,
  onClearFilter,
  isReadOnly = false,
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

  // 3-month schedule for this borrower's loan table headers
  const globalMonths = getThreeMonthNames(earliestDate !== 'N/A' ? earliestDate : null, lang);

  // Payment Reminder Modal State
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [selectedLoanForReminder, setSelectedLoanForReminder] = useState<LoanRecord | null>(null);
  const [borrowerPhone, setBorrowerPhone] = useState('');
  const [copied, setCopied] = useState(false);
  const [customNote, setCustomNote] = useState('');

  // Load saved phone for this borrower from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PHONES);
      if (saved) {
        const phoneMap = JSON.parse(saved);
        if (phoneMap[personName.trim().toLowerCase()]) {
          setBorrowerPhone(phoneMap[personName.trim().toLowerCase()]);
        } else {
          setBorrowerPhone('');
        }
      }
    } catch (e) {}
  }, [personName]);

  const handlePhoneChange = (newPhone: string) => {
    setBorrowerPhone(newPhone);
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PHONES);
      const phoneMap = saved ? JSON.parse(saved) : {};
      phoneMap[personName.trim().toLowerCase()] = newPhone;
      localStorage.setItem(STORAGE_KEY_PHONES, JSON.stringify(phoneMap));
    } catch (e) {}
  };

  const openReminderModal = (loan: LoanRecord | null = null) => {
    setSelectedLoanForReminder(loan);
    setCopied(false);
    setIsReminderOpen(true);
  };

  if (borrowerLoans.length === 0) {
    return null;
  }

  // Format clean phone number for international links
  const getCleanPhone = (p: string) => {
    const raw = p.replace(/[^0-9]/g, '');
    if (!raw) return '';
    if (raw.startsWith('880')) return raw;
    if (raw.startsWith('0')) return '88' + raw;
    if (raw.length === 10 && raw.startsWith('1')) return '880' + raw;
    return raw;
  };

  const cleanPhone = getCleanPhone(borrowerPhone);

  // Target due amount and deadline
  const targetDue = selectedLoanForReminder ? selectedLoanForReminder.totalDue : totalDue;
  const targetDate = selectedLoanForReminder ? selectedLoanForReminder.nextLoanSubmitDate : earliestDate;
  const targetOverdue = isDateOverdue(targetDate);
  const targetDays = getDaysRemaining(targetDate);

  // Pre-formatted message template
  const generateReminderMessage = () => {
    if (lang === 'bn') {
      const loanInfo = selectedLoanForReminder
        ? `• লোন আইডি: ${selectedLoanForReminder.loanId} (বর্তমান কিস্তি: ${formatCurrency(selectedLoanForReminder.currentMonthEmi, 'bn')})`
        : `• মোট সক্রিয় লোন অ্যাকাউন্ট: ${activeLoans.length} টি`;

      const statusNotice = targetOverdue
        ? `⚠️ সতর্কবার্তা: কিস্তির নির্ধারিত সময় পার হয়ে গেছে!`
        : targetDays <= 3
        ? `⏰ কিস্তির সময় শেষ হতে আর মাত্র ${targetDays} দিন বাকি!`
        : `📅 নির্ধারিত সময়ের মধ্যে পরিশোধ করার অনুরোধ রইল।`;

      return `আসসালামু আলাইকুম, শ্রদ্ধেয় ${personName},

বিকাশ লোন সংক্রান্ত জরুরি কিস্তির রিমাইন্ডার:
${loanInfo}
• মোট বকেয়া কিস্তি: ${formatCurrency(targetDue, 'bn')}
• জমার শেষ তারিখ: ${targetDate}

${statusNotice}
${customNote ? `নোট: ${customNote}\n` : ''}
অনুগ্রহ করে বিকাশ অথবা নগদ মাধ্যমে নির্ধারিত তারিখের মধ্যে কিস্তি পরিশোধ করার জন্য অনুরোধ করা হলো।

ধন্যবাদ,
মোস্তাফিজুর বিকাশ লোন ম্যানেজমেন্ট`;
    } else {
      const loanInfo = selectedLoanForReminder
        ? `• Loan ID: ${selectedLoanForReminder.loanId} (Current EMI: ${formatCurrency(selectedLoanForReminder.currentMonthEmi, 'en')})`
        : `• Active Loan Accounts: ${activeLoans.length}`;

      const statusNotice = targetOverdue
        ? `⚠️ Notice: Payment is already OVERDUE!`
        : targetDays <= 3
        ? `⏰ Urgent: Only ${targetDays} days remaining until deadline!`
        : `📅 Please ensure payment on or before the due date.`;

      return `Hello ${personName},

Important payment reminder regarding your bKash nano loan:
${loanInfo}
• Total Due Amount: ${formatCurrency(targetDue, 'en')}
• Payment Deadline: ${targetDate}

${statusNotice}
${customNote ? `Note: ${customNote}\n` : ''}
Kindly settle your installment before the deadline via bKash or cash.

Thank you,
Mostafizur bKash Loan Management`;
    }
  };

  const reminderMessage = generateReminderMessage();

  // Links
  const whatsappUrl = `https://api.whatsapp.com/send?${cleanPhone ? `phone=${encodeURIComponent(cleanPhone)}&` : ''}text=${encodeURIComponent(reminderMessage)}`;
  const smsUrl = `sms:${cleanPhone || ''}?&body=${encodeURIComponent(reminderMessage)}`;

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(reminderMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs mb-6 transition-colors">
      {/* Header Profile Banner */}
      <div className="bg-slate-900 dark:bg-slate-950 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#c40e5d] to-[#E2136E] flex items-center justify-center text-white text-xl font-black shadow-md shadow-pink-600/30 shrink-0">
            {personName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">{personName}</h2>
              <span className="text-xs bg-slate-800 dark:bg-slate-800/80 text-pink-300 font-semibold px-2 py-0.5 rounded-full border border-slate-700">
                {activeLoans.length} {lang === 'bn' ? 'সক্রিয় লোন' : 'active loans'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === 'bn'
                ? 'বিকাশ মাইক্রো-লোন পোর্টফোলিও বিবরণী'
                : 'bKash Nano Micro-Loan Portfolio Overview'}
            </p>
          </div>
        </div>

        {/* Action buttons: Send Reminder & Show All */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Send Payment Reminder Button */}
          <button
            type="button"
            onClick={() => openReminderModal(null)}
            className="group relative flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl transition-all duration-200 active:scale-95 shadow-sm shadow-emerald-700/30 cursor-pointer"
            title={lang === 'bn' ? 'এসএমএস বা হোয়াটসঅ্যাপে কিস্তির নোটিশ পাঠান' : 'Send SMS / WhatsApp reminder'}
          >
            <BellRing className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
            <span>{lang === 'bn' ? 'তাকিদা / রিমাইন্ডার পাঠান' : 'Send Reminder'}</span>
          </button>

          <button
            type="button"
            onClick={onClearFilter}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            {lang === 'bn' ? 'সকল ঋণগ্রহীতা দেখুন' : 'Show All Borrowers'}
          </button>
        </div>
      </div>

      {/* Aggregate Metric Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-100 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
        <div className="p-3.5 sm:p-4">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
            {t.borrowerTotalLoans}
          </span>
          <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-mono-numbers mt-0.5 block">
            {activeLoans.length} / {borrowerLoans.length}
          </span>
        </div>
        <div className="p-3.5 sm:p-4">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
            {t.borrowerTotalPrincipal}
          </span>
          <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-mono-numbers mt-0.5 block">
            {formatCurrency(totalPrincipal, lang)}
          </span>
        </div>
        <div className="p-3.5 sm:p-4">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
            {t.borrowerTotalDue}
          </span>
          <span className="text-lg sm:text-xl font-bold text-[#E2136E] font-mono-numbers mt-0.5 block">
            {formatCurrency(totalDue, lang)}
          </span>
        </div>
        <div className="p-3.5 sm:p-4">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
            {t.borrowerEarliestDate}
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-sm font-semibold text-slate-900 dark:text-white font-mono-numbers">
              {earliestDate}
            </span>
            {overdueCount > 0 && (
              <span className="text-[11px] text-rose-600 font-bold ml-1">
                ({overdueCount} {lang === 'bn' ? 'মেয়াদোত্তীর্ণ' : 'overdue'})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* List of all Loan IDs with EMI breakdowns */}
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {lang === 'bn' ? 'বর্তমান মাস লোন ও কিস্তির বিস্তারিত বিভাজন' : 'Active Loan Accounts & EMI Breakdown'}
          </h3>
          <span className="text-[11px] text-slate-400">
            {lang === 'bn' ? 'প্রতিটি লোনের পাশে রিমাইন্ডার বাটন রয়েছে' : 'Click reminder icon on any row to send specific notice'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">{t.colLoanId}</th>
                <th className="py-2.5 px-3 text-right">{t.colPrincipal}</th>
                <th className="py-2.5 px-3 text-right">
                  <div>{t.colCurrentEmi}</div>
                  <div className="text-[10px] font-bold text-pink-600 dark:text-pink-400">
                    ({globalMonths.month1})
                  </div>
                </th>
                <th className="py-2.5 px-3 text-right">
                  <div>{t.colSecondEmi}</div>
                  <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                    ({globalMonths.month2})
                  </div>
                </th>
                <th className="py-2.5 px-3 text-right">
                  <div>{t.colThirdEmi}</div>
                  <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    ({globalMonths.month3})
                  </div>
                </th>
                <th className="py-2.5 px-3 text-right">{t.colTotalDue}</th>
                <th className="py-2.5 px-3">{t.colPaidProgress}</th>
                <th className="py-2.5 px-3">{t.colNextDate}</th>
                <th className="py-2.5 px-3">{t.colStatus}</th>
                <th className="py-2.5 px-3 text-right">{t.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {borrowerLoans.map((loan) => {
                const isSettled = loan.totalDue <= 0 || loan.status === 'paid';
                const isCurrentPaid = loan.currentMonthEmi <= 0 && !isSettled;
                const isOverdue = !isCurrentPaid && isDateOverdue(loan.nextLoanSubmitDate);
                const daysRemaining = getDaysRemaining(loan.nextLoanSubmitDate);
                const loanMonths = getThreeMonthNames(loan.nextLoanSubmitDate, lang);

                return (
                  <tr key={loan.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono-numbers text-slate-900 dark:text-white font-medium">
                      {loan.loanId}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers text-slate-700 dark:text-slate-300">
                      {formatCurrency(loan.totalPrincipalLoan, lang)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers text-slate-900 dark:text-white font-bold">
                      {loan.currentMonthEmi > 0 ? (
                        <div>
                          <div>{formatCurrency(loan.currentMonthEmi, lang)}</div>
                          <div className="text-[10px] font-semibold text-pink-600 dark:text-pink-400">
                            ({loanMonths.month1Short})
                          </div>
                        </div>
                      ) : loan.totalDue > 0 ? (
                        <div className="flex flex-col items-end">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded-md">
                            <CheckCircle className="w-2.5 h-2.5 text-emerald-600" />
                            <span>{lang === 'bn' ? 'পরিশোধিত (৳০)' : 'Paid (৳0)'}</span>
                          </span>
                          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                            {loanMonths.month1Short} {lang === 'bn' ? 'জমা সম্পন্ন' : 'cleared'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-emerald-600 font-medium">{formatCurrency(0, lang)}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers text-slate-600 dark:text-slate-400">
                      {loan.secondMonthEmi > 0 ? (
                        <div>
                          <div className="font-bold text-blue-700 dark:text-blue-300">{formatCurrency(loan.secondMonthEmi, lang)}</div>
                          <div className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                            ({loanMonths.month2Short})
                          </div>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers text-slate-600 dark:text-slate-400">
                      {loan.thirdMonthEmi > 0 ? (
                        <div>
                          <div className="font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(loan.thirdMonthEmi, lang)}</div>
                          <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            ({loanMonths.month3Short})
                          </div>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers text-[#E2136E] font-bold">
                      {formatCurrency(loan.totalDue, lang)}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <RepaymentProgressBar loan={loan} lang={lang} />
                    </td>
                    <td className="py-3 px-3 font-mono-numbers">
                      <div className={isOverdue && !isSettled ? 'text-rose-600 font-bold' : 'text-slate-800 dark:text-slate-200'}>
                        {loan.nextLoanSubmitDate}
                      </div>
                      {!isSettled && (
                        <div className="text-[10px] text-slate-400">
                          {isCurrentPaid ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              {lang === 'bn' ? `পরবর্তী কিস্তি: ${loanMonths.month2Short}` : `Next EMI: ${loanMonths.month2Short}`}
                            </span>
                          ) : isOverdue ? (
                            <span className="text-rose-600 font-medium">
                              {Math.abs(daysRemaining)}d overdue
                            </span>
                          ) : daysRemaining === 0 ? (
                            <span className="text-amber-600 font-medium">Due today</span>
                          ) : (
                            <span>in {daysRemaining} days</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {isSettled ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          {t.statusPaid}
                        </span>
                      ) : isCurrentPaid ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{lang === 'bn' ? `${loanMonths.month1Short} পরিশোধিত ✓` : `${loanMonths.month1Short} Paid ✓`}</span>
                        </span>
                      ) : isOverdue ? (
                        <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {t.statusOverdue}
                        </span>
                      ) : daysRemaining <= 14 ? (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">
                          {t.statusDueSoon}
                        </span>
                      ) : (
                        <span className="text-slate-600 dark:text-slate-400 font-medium">
                          {t.statusActive}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick Reminder Icon for this loan */}
                        {!isSettled && (
                          <button
                            type="button"
                            onClick={() => openReminderModal(loan)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                            title={lang === 'bn' ? 'এই লোনের জন্য এসএমএস/হোয়াটসঅ্যাপ রিমাইন্ডার' : 'Send reminder for this specific loan'}
                          >
                            <MessageSquareShare className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {!isSettled ? (
                          <>
                            {!isReadOnly && (
                              <button
                                onClick={() => onPayLoan(loan)}
                                className="px-2.5 py-1 text-xs font-bold text-white bg-[#E2136E] hover:bg-[#c40e5d] rounded-lg transition-all active:scale-95 shadow-2xs cursor-pointer"
                              >
                                {lang === 'bn' ? 'কিস্তি জমা' : 'Pay EMI'}
                              </button>
                            )}
                            {loan.lastPaymentDate && (
                              <button
                                onClick={() => onViewReceipt(loan)}
                                className="px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title={lang === 'bn' ? 'জমার রশিদ দেখুন ও ডাউনলোড করুন' : 'View & Download Receipt'}
                              >
                                {lang === 'bn' ? 'রশিদ' : 'Receipt'}
                              </button>
                            )}
                            {isReadOnly && !loan.lastPaymentDate && (
                              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
                                {lang === 'bn' ? 'বকেয়া' : 'Due'}
                              </span>
                            )}
                          </>
                        ) : (
                          <button
                            onClick={() => onViewReceipt(loan)}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
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

      {/* ========================================================
          PAYMENT REMINDER MODAL (SMS INTENT & WHATSAPP)
          ======================================================== */}
      {isReminderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden transition-all scale-100 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold tracking-tight">
                    {lang === 'bn' ? 'কিস্তি পরিশোধের তাকিদা (Payment Reminder)' : 'Send Payment Reminder'}
                  </h3>
                  <p className="text-xs text-emerald-100">
                    {lang === 'bn'
                      ? `${personName}-কে সরাসরি হোয়াটসঅ্যাপ বা এসএমএস পাঠান`
                      : `Send direct WhatsApp or SMS notice to ${personName}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReminderOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Due Summary Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                    {selectedLoanForReminder
                      ? (lang === 'bn' ? `লোন আইডি: ${selectedLoanForReminder.loanId} বকেয়া` : `Loan ${selectedLoanForReminder.loanId} Due`)
                      : (lang === 'bn' ? 'মোট বকেয়া কিস্তি' : 'Total Outstanding Due')}
                  </span>
                  <span className="text-xl font-black text-[#E2136E] font-mono-numbers">
                    {formatCurrency(targetDue, lang)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                    {lang === 'bn' ? 'জমার শেষ তারিখ' : 'Payment Deadline'}
                  </span>
                  <div className="flex items-center justify-end gap-1 font-mono-numbers text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{targetDate}</span>
                  </div>
                  {targetOverdue && (
                    <span className="text-[10px] font-bold text-rose-600 block">
                      ⚠️ {lang === 'bn' ? 'মেয়াদ শেষ হয়েছে' : 'Overdue!'}
                    </span>
                  )}
                </div>
              </div>

              {/* Borrower Mobile Number Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {lang === 'bn' ? 'গ্রাহকের মোবাইল নম্বর (WhatsApp / SMS):' : 'Borrower Mobile Number:'}
                </label>
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs font-mono-numbers font-semibold">
                    <span>🇧🇩 +88</span>
                  </div>
                  <input
                    type="tel"
                    value={borrowerPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full pl-18 pr-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-mono-numbers"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {lang === 'bn'
                    ? 'নম্বরটি সেভ হয়ে থাকবে, পরবর্তী সময়ে স্বয়ংক্রিয়ভাবে ফিল আপ হবে।'
                    : 'Saved automatically for this borrower for quick one-tap sending.'}
                </p>
              </div>

              {/* Optional Custom Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {lang === 'bn' ? 'অতিরিক্ত কোনো বার্তা (ঐচ্ছিক):' : 'Additional Note (Optional):'}
                </label>
                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder={lang === 'bn' ? 'উদা: বিকাল ৫টার মধ্যে পাঠাবেন' : 'e.g., Please send by 5 PM'}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Message Live Preview Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {lang === 'bn' ? 'প্রস্তুতকৃত রিমাইন্ডার মেসেজ:' : 'Prepared Reminder Message:'}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? (lang === 'bn' ? 'কপি হয়েছে!' : 'Copied!') : (lang === 'bn' ? 'কপি করুন' : 'Copy')}</span>
                  </button>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed max-h-40 overflow-y-auto">
                  {reminderMessage}
                </div>
              </div>
            </div>

            {/* Modal Actions Footer: WhatsApp & SMS intent */}
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-2.5">
              {/* WhatsApp Button */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold rounded-xl shadow-sm transition-all duration-150 active:scale-95 text-xs text-center"
              >
                <span className="text-base leading-none">💬</span>
                <span>{lang === 'bn' ? 'WhatsApp-এ পাঠান' : 'Send via WhatsApp'}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>

              {/* Native SMS App Intent */}
              <a
                href={smsUrl}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-sm transition-all duration-150 active:scale-95 text-xs text-center"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'SMS অ্যাপে পাঠান' : 'Send via SMS'}</span>
              </a>

              {/* Copy Message */}
              <button
                type="button"
                onClick={handleCopyMessage}
                className="w-full sm:w-auto px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition-all active:scale-95 text-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? (lang === 'bn' ? 'কপি সম্পন্ন' : 'Copied') : (lang === 'bn' ? 'কপি' : 'Copy')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
