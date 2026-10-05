import React, { useState, useEffect } from 'react';
import { LoanRecord, Language } from '../types/loan';
import { getT } from '../utils/translations';
import { getCurrentDateDDMMYYYY, bumpDateByOneMonth } from '../utils/dateUtils';
import { parseScreenshotText, ParsedScreenshotData } from '../utils/screenshotParser';
import {
  X,
  Save,
  Sparkles,
  Calculator,
  User,
  Phone,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Split,
  Percent,
} from 'lucide-react';

interface NewLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanToEdit?: LoanRecord | null;
  lang: Language;
  onSaveLoan: (loan: LoanRecord) => void;
  existingBorrowers?: Array<{ name: string; phone?: string }>;
}

const PRESET_BORROWERS = [
  { name: 'Harun', phone: '01533271817' },
  { name: 'Sohel Apu', phone: '01830026574' },
  { name: 'Musha', phone: '01888141176' },
  { name: 'Mostafizur Rahman', phone: '01907239952' },
];

export const NewLoanModal: React.FC<NewLoanModalProps> = ({
  isOpen,
  onClose,
  loanToEdit,
  lang,
  onSaveLoan,
  existingBorrowers = [],
}) => {
  const t = getT(lang);

  const [entryMode, setEntryMode] = useState<'form' | 'screenshot'>('form');
  const [screenshotText, setScreenshotText] = useState('');
  const [parseFeedback, setParseFeedback] = useState<ParsedScreenshotData | null>(null);

  // Form states - Super Admin can edit every single attribute
  const [personName, setPersonName] = useState('');
  const [borrowerPhone, setBorrowerPhone] = useState('');
  const [loanId, setLoanId] = useState('');
  const [totalPrincipal, setTotalPrincipal] = useState('');
  const [totalDue, setTotalDue] = useState('');
  const [currentMonthEmi, setCurrentMonthEmi] = useState('');
  const [secondMonthEmi, setSecondMonthEmi] = useState('');
  const [thirdMonthEmi, setThirdMonthEmi] = useState('');
  const [nextDate, setNextDate] = useState('');
  const [status, setStatus] = useState<'active' | 'overdue' | 'paid'>('active');
  const [notes, setNotes] = useState('');
  const [applyInterest, setApplyInterest] = useState(false);

  // Combine preset borrowers with any dynamic existing borrowers
  const allBorrowers = React.useMemo(() => {
    const map = new Map<string, string>();
    PRESET_BORROWERS.forEach(b => map.set(b.name.toLowerCase(), b.phone));
    existingBorrowers.forEach(b => {
      if (b.name) {
        map.set(b.name.toLowerCase(), b.phone || map.get(b.name.toLowerCase()) || '');
      }
    });
    return Array.from(map.entries()).map(([k, phone]) => {
      const match = PRESET_BORROWERS.find(p => p.name.toLowerCase() === k) ||
        existingBorrowers.find(e => e.name.toLowerCase() === k);
      return {
        name: match?.name || k,
        phone: phone || '',
      };
    });
  }, [existingBorrowers]);

  // Split principal into 3 equal monthly EMIs
  const splitInto3Months = (principalAmount: number, withInterest = applyInterest) => {
    if (isNaN(principalAmount) || principalAmount <= 0) return;

    const finalTotal = withInterest ? Number((principalAmount * 1.03).toFixed(2)) : principalAmount;
    const emi1 = Number((finalTotal / 3).toFixed(2));
    const emi2 = Number((finalTotal / 3).toFixed(2));
    // Exact balance to avoid rounding discrepancy
    const emi3 = Number((finalTotal - emi1 - emi2).toFixed(2));

    setCurrentMonthEmi(emi1.toString());
    setSecondMonthEmi(emi2.toString());
    setThirdMonthEmi(emi3.toString());
    setTotalDue(finalTotal.toString());
  };

  useEffect(() => {
    if (isOpen) {
      setEntryMode('form');
      setScreenshotText('');
      setParseFeedback(null);

      if (loanToEdit) {
        // Editing existing loan
        setPersonName(loanToEdit.personName || '');
        setBorrowerPhone(loanToEdit.borrowerPhone || '');
        setLoanId(loanToEdit.loanId || '');
        setTotalPrincipal(loanToEdit.totalPrincipalLoan ? loanToEdit.totalPrincipalLoan.toString() : '0');
        setTotalDue(loanToEdit.totalDue !== undefined ? loanToEdit.totalDue.toString() : '0');
        setCurrentMonthEmi(loanToEdit.currentMonthEmi !== undefined ? loanToEdit.currentMonthEmi.toString() : '0');
        setSecondMonthEmi(loanToEdit.secondMonthEmi !== undefined ? loanToEdit.secondMonthEmi.toString() : '0');
        setThirdMonthEmi(loanToEdit.thirdMonthEmi !== undefined ? loanToEdit.thirdMonthEmi.toString() : '0');
        setNextDate(loanToEdit.nextLoanSubmitDate || '');
        setStatus(loanToEdit.status || 'active');
        setNotes(loanToEdit.notes || '');

        // If borrowerPhone not set, try auto-filling from known directory
        if (!loanToEdit.borrowerPhone && loanToEdit.personName) {
          const matched = allBorrowers.find(b => b.name.toLowerCase() === loanToEdit.personName.toLowerCase());
          if (matched?.phone) setBorrowerPhone(matched.phone);
        }
      } else {
        // Adding brand new loan: automatically divide default principal into 3 months!
        const defaultPrincipal = 6000;
        setPersonName('');
        setBorrowerPhone('');
        const randomLoanId = '1100000000' + Math.floor(10000000 + Math.random() * 90000000).toString();
        setLoanId(randomLoanId);
        setTotalPrincipal(defaultPrincipal.toString());
        splitInto3Months(defaultPrincipal, false);
        setNextDate(bumpDateByOneMonth(getCurrentDateDDMMYYYY()));
        setStatus('active');
        setNotes('বিকাশ ৩ মাসের ক্ষুদ্রঋণ');
      }
    }
  }, [isOpen, loanToEdit]);

  if (!isOpen) return null;

  // Handle principal change: automatically divide total principal across 3 months!
  const handlePrincipalChange = (val: string) => {
    setTotalPrincipal(val);
    const p = parseFloat(val);
    if (!isNaN(p) && p > 0) {
      splitInto3Months(p, applyInterest);
    }
  };

  // Toggle optional 3% interest markup
  const handleToggleInterest = () => {
    const nextState = !applyInterest;
    setApplyInterest(nextState);
    const p = parseFloat(totalPrincipal);
    if (!isNaN(p) && p > 0) {
      splitInto3Months(p, nextState);
    }
  };

  // When any EMI field changes, update total due automatically
  const handleEmi1Change = (val: string) => {
    setCurrentMonthEmi(val);
    const e1 = parseFloat(val) || 0;
    const e2 = parseFloat(secondMonthEmi) || 0;
    const e3 = parseFloat(thirdMonthEmi) || 0;
    setTotalDue((e1 + e2 + e3).toFixed(2));
  };

  const handleEmi2Change = (val: string) => {
    setSecondMonthEmi(val);
    const e1 = parseFloat(currentMonthEmi) || 0;
    const e2 = parseFloat(val) || 0;
    const e3 = parseFloat(thirdMonthEmi) || 0;
    setTotalDue((e1 + e2 + e3).toFixed(2));
  };

  const handleEmi3Change = (val: string) => {
    setThirdMonthEmi(val);
    const e1 = parseFloat(currentMonthEmi) || 0;
    const e2 = parseFloat(secondMonthEmi) || 0;
    const e3 = parseFloat(val) || 0;
    setTotalDue((e1 + e2 + e3).toFixed(2));
  };

  // Select existing borrower
  const handleSelectBorrower = (b: { name: string; phone: string }) => {
    setPersonName(b.name);
    setBorrowerPhone(b.phone);
  };

  // Parse Screenshot Text
  const handleParseScreenshot = (textToParse = screenshotText) => {
    if (!textToParse.trim()) return;

    const data = parseScreenshotText(textToParse);
    setParseFeedback(data);

    setPersonName(data.personName);
    setLoanId(data.loanId);
    setTotalPrincipal(data.totalPrincipal.toString());
    setTotalDue(data.totalDue.toString());
    setCurrentMonthEmi(data.currentMonthEmi.toString());
    setSecondMonthEmi(data.secondMonthEmi.toString());
    setThirdMonthEmi(data.thirdMonthEmi.toString());
    setNextDate(data.nextLoanSubmitDate);
    setNotes(data.notes);

    const matched = allBorrowers.find(b => b.name.toLowerCase() === data.personName.toLowerCase());
    if (matched?.phone) setBorrowerPhone(matched.phone);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const principal = parseFloat(totalPrincipal) || 0;
    const due = parseFloat(totalDue) || 0;
    const emi1 = parseFloat(currentMonthEmi) || 0;
    const emi2 = parseFloat(secondMonthEmi) || 0;
    const emi3 = parseFloat(thirdMonthEmi) || 0;

    const loanRecord: LoanRecord = {
      id: loanToEdit ? loanToEdit.id : loanId.trim(),
      personName: personName.trim() || 'Borrower',
      borrowerPhone: borrowerPhone.trim() || undefined,
      loanId: loanId.trim(),
      totalPrincipalLoan: principal,
      totalDue: due,
      originalTotalDue: loanToEdit?.originalTotalDue || due,
      currentMonthEmi: emi1,
      secondMonthEmi: emi2,
      thirdMonthEmi: emi3,
      nextLoanSubmitDate: nextDate.trim(),
      status: due <= 0 ? 'paid' : status,
      createdAt: loanToEdit ? loanToEdit.createdAt : new Date().toISOString().split('T')[0],
      notes: notes.trim(),
    };

    onSaveLoan(loanRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in duration-150 my-6 transition-colors">
        
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white flex items-center justify-between border-b border-purple-900/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#c40e5d] to-[#E2136E] flex items-center justify-center font-black text-white text-base shadow-sm shrink-0">
              ৳
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {loanToEdit
                    ? (lang === 'bn' ? 'সুপার অ্যাডমিন: লোন এডিট ও আপডেট' : 'Super Admin: Edit Loan')
                    : (lang === 'bn' ? 'সুপার অ্যাডমিন: নতুন ৩ মাসের লোন যোগ' : 'Super Admin: Add 3-Month Loan')}
                </h3>
                <span className="text-[10px] bg-pink-500/20 text-pink-300 border border-pink-500/40 px-2 py-0.5 rounded-full font-bold">
                  👑 Super Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                {lang === 'bn'
                  ? 'যেকোনো ইউজারের লোন তথ্য পরিবর্তন করুন, যা সরাসরি ইউজারের অ্যাকাউন্টে সিন্ক হবে'
                  : 'Full edit rights; changes immediately synchronize with borrower account'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs for New Loans */}
        {!loanToEdit && (
          <div className="px-5 pt-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEntryMode('form')}
              className={`pb-2 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                entryMode === 'form'
                  ? 'border-[#E2136E] text-[#E2136E]'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {lang === 'bn' ? 'ম্যানুয়াল ফরম (৩ মাস EMI)' : 'Manual Form (3-Month EMI)'}
            </button>
            <button
              type="button"
              onClick={() => setEntryMode('screenshot')}
              className={`pb-2 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                entryMode === 'screenshot'
                  ? 'border-[#E2136E] text-[#E2136E]'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E2136E]" />
              <span>{lang === 'bn' ? 'স্ক্রিনশট / এসএমএস টেক্সট ইমপোর্টার' : 'Screenshot OCR / SMS'}</span>
            </button>
          </div>
        )}

        {/* SCREENSHOT TEXT IMPORTER VIEW */}
        {entryMode === 'screenshot' && !loanToEdit ? (
          <div className="p-5 space-y-3.5 text-xs text-slate-800 dark:text-slate-200">
            <div>
              <label className="block font-semibold mb-1">
                {lang === 'bn'
                  ? 'বিকাশ লোন স্ক্রিনশট বা এসএমএস থেকে টেক্সট পেস্ট করুন:'
                  : 'Paste text from bKash loan screenshot (OCR / Lens / SMS):'}
              </label>
              <textarea
                rows={4}
                value={screenshotText}
                onChange={(e) => setScreenshotText(e.target.value)}
                placeholder="Paste bKash screen text here... e.g.&#10;Borrower: Harun&#10;Loan ID: 110000000049281742&#10;Principal: ৳ 7,500.00&#10;Outstanding Due: ৳ 7,500.00&#10;Next Repayment Date: 12/11/2026"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono-numbers text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#E2136E]"
              />
            </div>

            {/* Parse Feedback Banner */}
            {parseFeedback && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-1.5 text-emerald-800 dark:text-emerald-300">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{lang === 'bn' ? 'সফলভাবে লোন তথ্য সনাক্ত হয়েছে!' : 'Successfully extracted bKash loan data!'}</span>
                </div>
                <div className="text-[11px] flex flex-wrap gap-x-3 gap-y-1">
                  <span><strong>Name:</strong> {parseFeedback.personName}</span>
                  <span><strong>Loan ID:</strong> {parseFeedback.loanId}</span>
                  <span><strong>Principal:</strong> ৳{parseFeedback.totalPrincipal}</span>
                  <span><strong>Total Due:</strong> ৳{parseFeedback.totalDue}</span>
                  <span><strong>Date:</strong> {parseFeedback.nextLoanSubmitDate}</span>
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEntryMode('form')}
                className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                {lang === 'bn' ? 'ফরমে ফিরে যান' : 'Go to Form'}
              </button>
              <button
                type="button"
                onClick={() => {
                  handleParseScreenshot();
                  setEntryMode('form');
                }}
                disabled={!screenshotText.trim()}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#E2136E] hover:bg-[#c40e5d] disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'এক্সট্র্যাক্ট করে ৩ মাসে সেটআপ করুন' : 'Extract & Setup 3-Month EMI'}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : (
          /* STANDARD FORM VIEW */
          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-slate-800 dark:text-slate-200 max-h-[75vh] overflow-y-auto">
            
            {/* 1. Borrower Selection & Phone Association */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[11px] uppercase tracking-wide text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#E2136E]" />
                  <span>{lang === 'bn' ? '১. ঋণগ্রহীতা ও মোবাইল নম্বর (ইউজার সিন্ক)' : '1. Borrower & Phone (Auto-Sync to User)'}</span>
                </span>
                <span className="text-[10px] text-pink-600 dark:text-pink-400 font-semibold">
                  {lang === 'bn' ? 'নির্দিষ্ট অ্যাকাউন্টে ডেটা পৌঁছাবে' : 'Syncs to user account'}
                </span>
              </div>

              {/* Quick Borrower Preset Pills */}
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">
                  {lang === 'bn' ? 'গ্রাহক সিলেক্ট করুন:' : 'Quick Select Registered Borrower:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {allBorrowers.map((b) => {
                    const isSelected = personName.toLowerCase() === b.name.toLowerCase();
                    return (
                      <button
                        key={b.name}
                        type="button"
                        onClick={() => handleSelectBorrower(b)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-[#E2136E] text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <span>{b.name}</span>
                        {b.phone && (
                          <span className={`text-[10px] font-mono-numbers ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                            ({b.phone.slice(-4)})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.colPerson} *
                  </label>
                  <input
                    type="text"
                    required
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    placeholder="e.g. Harun / Sohel Apu / Musha"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E2136E] text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'bn' ? 'গ্রাহকের মোবাইল নম্বর' : 'Borrower Phone Number'} *
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🇧🇩</span>
                    <input
                      type="text"
                      value={borrowerPhone}
                      onChange={(e) => setBorrowerPhone(e.target.value)}
                      placeholder="01533271817 / 01830026574"
                      className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono-numbers focus:outline-none focus:ring-1 focus:ring-[#E2136E] text-slate-900 dark:text-white"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {lang === 'bn' ? 'এই নম্বরের অ্যাকাউন্টে লোন তথ্য সিনক্রোনাইজ হবে' : 'Loan will be directly synced to this phone account'}
                  </span>
                </div>
              </div>

              {/* Target User Account ID Real-Time Sync Indicator */}
              {borrowerPhone.trim() && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 animate-in fade-in duration-200">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>
                      {lang === 'bn' ? 'টার্গেট ইউজার আইডি:' : 'Target User ID:'}{' '}
                      <code className="font-mono bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-700 text-slate-900 dark:text-white font-bold">
                        usr_{borrowerPhone.replace(/[\s\-\+]/g, '').replace(/^88/, '')}
                      </code>
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700 self-start sm:self-auto">
                    {lang === 'bn' ? '⚡ সেভ করলে রিয়েল-টাইমে সিঙ্ক হবে' : '⚡ Real-time Sync on Save'}
                  </span>
                </div>
              )}
            </div>

            {/* 2. Loan ID & Principal Amount (With 3-Month EMI Setup) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.colLoanId} *
                </label>
                <input
                  type="text"
                  required
                  value={loanId}
                  onChange={(e) => setLoanId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono-numbers focus:outline-none focus:ring-1 focus:ring-[#E2136E] text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>{t.colPrincipal} (৳) *</span>
                  <span className="text-[10px] text-pink-600 font-bold">
                    {lang === 'bn' ? '৩ মাসে অটো ভাগ হবে' : 'Auto 3-Month Split'}
                  </span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={totalPrincipal}
                  onChange={(e) => handlePrincipalChange(e.target.value)}
                  placeholder="e.g. 6000"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono-numbers font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#E2136E]"
                />
              </div>
            </div>

            {/* 3. 3-Month EMI Calculation & Breakdown Box */}
            <div className="p-3.5 bg-gradient-to-br from-pink-50/60 to-purple-50/60 dark:from-slate-800/80 dark:to-slate-900 border border-pink-200 dark:border-slate-700 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-bold text-[11px] uppercase tracking-wide text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Split className="w-3.5 h-3.5 text-[#E2136E]" />
                  <span>{lang === 'bn' ? '৩ মাসের কিস্তি হিসাব (EMI Setup)' : '3-Month Installment Setup'}</span>
                </span>

                <div className="flex items-center gap-1.5">
                  {/* Re-calculate button */}
                  <button
                    type="button"
                    onClick={() => splitInto3Months(parseFloat(totalPrincipal) || 0, false)}
                    className="px-2.5 py-1 text-[11px] font-bold bg-white dark:bg-slate-800 border border-pink-300 dark:border-slate-700 text-pink-700 dark:text-pink-300 hover:bg-pink-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
                    title="Divide principal equally into 3 months"
                  >
                    {lang === 'bn' ? '৩ মাসে সমভাবে ভাগ' : 'Equal 3 Months'}
                  </button>

                  {/* Toggle 3% interest */}
                  <button
                    type="button"
                    onClick={handleToggleInterest}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors cursor-pointer flex items-center gap-1 ${
                      applyInterest
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                    }`}
                    title="Apply 3% interest to total principal"
                  >
                    <Percent className="w-3 h-3" />
                    <span>{applyInterest ? (lang === 'bn' ? '+৩% যুক্ত' : '+3% Applied') : (lang === 'bn' ? '+৩% ফি' : '+3% Fee')}</span>
                  </button>
                </div>
              </div>

              {/* 3 EMI Inputs - Super Admin can edit all 3 */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-pink-100 dark:border-slate-700">
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {lang === 'bn' ? '১ম মাস কিস্তি (৳)' : '1st Month EMI (৳)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={currentMonthEmi}
                    onChange={(e) => handleEmi1Change(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono-numbers text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-pink-100 dark:border-slate-700">
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {lang === 'bn' ? '২য় মাস কিস্তি (৳)' : '2nd Month EMI (৳)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={secondMonthEmi}
                    onChange={(e) => handleEmi2Change(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono-numbers text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-pink-100 dark:border-slate-700">
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {lang === 'bn' ? '৩য় মাস কিস্তি (৳)' : '3rd Month EMI (৳)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={thirdMonthEmi}
                    onChange={(e) => handleEmi3Change(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono-numbers text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Total Due display */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  {lang === 'bn' ? 'সর্বমোট বকেয়া (৩টি কিস্তির যোগফল):' : 'Total Due (Sum of 3 EMIs):'}
                </span>
                <div className="flex items-center gap-1.5 font-bold font-mono-numbers text-sm text-[#E2136E]">
                  <span>৳</span>
                  <input
                    type="number"
                    step="0.01"
                    value={totalDue}
                    onChange={(e) => setTotalDue(e.target.value)}
                    className="w-24 px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-pink-300 dark:border-pink-900 rounded font-bold text-right"
                  />
                </div>
              </div>
            </div>

            {/* 4. Next Payment Date, Status & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.colNextDate} (MM/DD/YYYY) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={nextDate}
                    onChange={(e) => setNextDate(e.target.value)}
                    placeholder="11/15/2026"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono-numbers text-slate-900 dark:text-white"
                  />
                  <div className="flex items-center gap-1 mt-1">
                    <button
                      type="button"
                      onClick={() => setNextDate(bumpDateByOneMonth(getCurrentDateDDMMYYYY()))}
                      className="text-[10px] text-pink-600 hover:underline"
                    >
                      {lang === 'bn' ? '+১ মাস পর' : '+1 Month from now'}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'লোন স্ট্যাটাস (Status)' : 'Loan Status'}
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                >
                  <option value="active">{lang === 'bn' ? 'সক্রিয় (Active - বকেয়া চলছে)' : 'Active'}</option>
                  <option value="overdue">{lang === 'bn' ? 'মেয়াদোত্তীর্ণ (Overdue)' : 'Overdue'}</option>
                  <option value="paid">{lang === 'bn' ? 'সম্পূর্ণ পরিশোধিত (Paid)' : 'Paid'}</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'মন্তব্য ও নোট (Notes)' : 'Notes / Remarks'}
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="bKash 3-Month Nano Loan"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            {/* Submit Action Buttons */}
            <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-[#E2136E] hover:from-emerald-700 hover:to-[#c40e5d] rounded-xl shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>
                  {loanToEdit
                    ? (lang === 'bn' ? '💾 পরিবর্তন সংরক্ষণ ও ইউজারের আইডিতে সিঙ্ক করুন' : '💾 Save & Real-Time Sync to User ID')
                    : (lang === 'bn' ? '💾 নতুন লোন সংরক্ষণ ও ইউজারের আইডিতে সিঙ্ক করুন' : '💾 Save & Real-Time Sync to User ID')}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
