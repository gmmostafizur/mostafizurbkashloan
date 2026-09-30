import React, { useState, useEffect } from 'react';
import { LoanRecord, Language } from '../types/loan';
import { getT } from '../utils/translations';
import { getCurrentDateDDMMYYYY, bumpDateByOneMonth } from '../utils/dateUtils';
import { parseScreenshotText, ParsedScreenshotData } from '../utils/screenshotParser';
import { X, Save, Sparkles, FileText, CheckCircle2, ArrowRight } from 'lucide-react';

interface NewLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanToEdit?: LoanRecord | null;
  lang: Language;
  onSaveLoan: (loan: LoanRecord) => void;
}

export const NewLoanModal: React.FC<NewLoanModalProps> = ({
  isOpen,
  onClose,
  loanToEdit,
  lang,
  onSaveLoan,
}) => {
  const t = getT(lang);

  const [entryMode, setEntryMode] = useState<'form' | 'screenshot'>('form');
  const [screenshotText, setScreenshotText] = useState('');
  const [parseFeedback, setParseFeedback] = useState<ParsedScreenshotData | null>(null);

  const [personName, setPersonName] = useState('');
  const [loanId, setLoanId] = useState('');
  const [totalPrincipal, setTotalPrincipal] = useState('');
  const [totalDue, setTotalDue] = useState('');
  const [thirdMonthEmi, setThirdMonthEmi] = useState('');
  const [secondMonthEmi, setSecondMonthEmi] = useState('');
  const [currentMonthEmi, setCurrentMonthEmi] = useState('');
  const [nextDate, setNextDate] = useState('');
  const [notes, setNotes] = useState('');
  const [tenure, setTenure] = useState<'3' | '2' | '1'>('3');

  useEffect(() => {
    if (isOpen) {
      setEntryMode(loanToEdit ? 'form' : 'form');
      setScreenshotText('');
      setParseFeedback(null);

      if (loanToEdit) {
        setPersonName(loanToEdit.personName);
        setLoanId(loanToEdit.loanId);
        setTotalPrincipal(loanToEdit.totalPrincipalLoan.toString());
        setTotalDue(loanToEdit.totalDue.toString());
        setThirdMonthEmi(loanToEdit.thirdMonthEmi.toString());
        setSecondMonthEmi(loanToEdit.secondMonthEmi.toString());
        setCurrentMonthEmi(loanToEdit.currentMonthEmi.toString());
        setNextDate(loanToEdit.nextLoanSubmitDate);
        setNotes(loanToEdit.notes || '');
      } else {
        // Defaults for new loan
        setPersonName('');
        const randomLoanId = '1100000000' + Math.floor(10000000 + Math.random() * 90000000).toString();
        setLoanId(randomLoanId);
        setTotalPrincipal('5000');
        const due = 5000 * 1.03;
        setTotalDue(due.toFixed(2));
        const emi = (due / 3).toFixed(2);
        setCurrentMonthEmi(emi);
        setSecondMonthEmi(emi);
        setThirdMonthEmi(emi);
        setNextDate(bumpDateByOneMonth(getCurrentDateDDMMYYYY()));
        setNotes('bKash Micro Loan');
        setTenure('3');
      }
    }
  }, [isOpen, loanToEdit]);

  if (!isOpen) return null;

  // Auto-calculate EMIs when principal changes
  const handlePrincipalChange = (val: string) => {
    setTotalPrincipal(val);
    const p = parseFloat(val);
    if (!isNaN(p) && p > 0) {
      const due = Number((p * 1.03).toFixed(2));
      setTotalDue(due.toString());

      const numMonths = parseInt(tenure, 10);
      const emi = Number((due / numMonths).toFixed(2));
      if (numMonths === 3) {
        setCurrentMonthEmi(emi.toString());
        setSecondMonthEmi(emi.toString());
        setThirdMonthEmi(emi.toString());
      } else if (numMonths === 2) {
        setCurrentMonthEmi(emi.toString());
        setSecondMonthEmi(emi.toString());
        setThirdMonthEmi('0');
      } else {
        setCurrentMonthEmi(due.toString());
        setSecondMonthEmi('0');
        setThirdMonthEmi('0');
      }
    }
  };

  const handleTenureChange = (newTenure: '3' | '2' | '1') => {
    setTenure(newTenure);
    const due = parseFloat(totalDue) || (parseFloat(totalPrincipal) * 1.03) || 0;
    const numMonths = parseInt(newTenure, 10);
    const emi = Number((due / numMonths).toFixed(2));
    if (numMonths === 3) {
      setCurrentMonthEmi(emi.toString());
      setSecondMonthEmi(emi.toString());
      setThirdMonthEmi(emi.toString());
    } else if (numMonths === 2) {
      setCurrentMonthEmi(emi.toString());
      setSecondMonthEmi(emi.toString());
      setThirdMonthEmi('0');
    } else {
      setCurrentMonthEmi(due.toString());
      setSecondMonthEmi('0');
      setThirdMonthEmi('0');
    }
  };

  // Handle parsing screenshot text
  const handleParseScreenshot = (textToParse = screenshotText) => {
    if (!textToParse.trim()) return;

    const data = parseScreenshotText(textToParse);
    setParseFeedback(data);

    // Auto-fill form state
    setPersonName(data.personName);
    setLoanId(data.loanId);
    setTotalPrincipal(data.totalPrincipal.toString());
    setTotalDue(data.totalDue.toString());
    setCurrentMonthEmi(data.currentMonthEmi.toString());
    setSecondMonthEmi(data.secondMonthEmi.toString());
    setThirdMonthEmi(data.thirdMonthEmi.toString());
    setNextDate(data.nextLoanSubmitDate);
    setTenure(data.tenure);
    setNotes(data.notes);
  };

  const sampleScreenshots = [
    {
      title: 'bKash Nano Loan Details Screen',
      text: `bKash Loan Details
Borrower: Mostafizur
Loan ID: 110000000049281742
Principal Amount: ৳ 7,500.00
Outstanding Total Due: ৳ 7,725.00
Monthly EMI: ৳ 2,575.00
Next Repayment Date: 12/11/2026
Tenure: 3 Months`,
    },
    {
      title: 'bKash Disbursed SMS Format',
      text: `bKash Loan: Disbursed Tk 12,000.00 to Harun. Loan ID: 110000000048194012. 1st installment Tk 4,120.00 is due on 20/11/2026. Total payable Tk 12,360.00.`,
    },
    {
      title: 'বাংলা বিকাশ অ্যাপ স্ক্রিনশট',
      text: `বিকাশ লোন বিবরণী
ঋণগ্রহীতা: Musha
লোন আইডি: 110000000047392185
মূল লোন: ৳ ৪,৫০০.০০
মোট বকেয়া: ৳ ৪,৬৩৫.০০
পরবর্তী কিস্তির তারিখ: ১৫/১১/২০২৬
মাসিক কিস্তি: ৳ ১,৫৪৫.০০`,
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const principal = parseFloat(totalPrincipal) || 0;
    const due = parseFloat(totalDue) || 0;
    const emi1 = parseFloat(currentMonthEmi) || 0;
    const emi2 = parseFloat(secondMonthEmi) || 0;
    const emi3 = parseFloat(thirdMonthEmi) || 0;

    const loanRecord: LoanRecord = {
      id: loanToEdit ? loanToEdit.id : loanId,
      personName: personName.trim() || 'Borrower',
      loanId: loanId.trim(),
      totalPrincipalLoan: principal,
      totalDue: due,
      currentMonthEmi: emi1,
      secondMonthEmi: emi2,
      thirdMonthEmi: emi3,
      nextLoanSubmitDate: nextDate.trim(),
      status: due <= 0 ? 'paid' : 'active',
      createdAt: loanToEdit ? loanToEdit.createdAt : new Date().toISOString().split('T')[0],
      notes: notes.trim(),
    };

    onSaveLoan(loanRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#E2136E] flex items-center justify-center font-bold text-white text-sm">
              ৳
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {loanToEdit
                  ? (lang === 'bn' ? 'লোন তথ্য সংশোধন' : 'Edit Loan Record')
                  : (lang === 'bn' ? 'নতুন বিকাশ লোন এন্ট্রি' : 'Add New bKash Loan')}
              </h3>
              <p className="text-[11px] text-slate-300">
                {lang === 'bn' ? 'ম্যানুয়াল অথবা বিকাশ স্ক্রিনশট টেক্সট থেকে দ্রুত তৈরি করুন' : 'Create manually or auto-extract from bKash screenshot/SMS'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        {!loanToEdit && (
          <div className="px-5 pt-3 bg-slate-100/60 border-b border-slate-200 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEntryMode('form')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
                entryMode === 'form'
                  ? 'border-[#E2136E] text-[#E2136E]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {lang === 'bn' ? 'ম্যানুয়াল ফরম' : 'Manual Form'}
            </button>
            <button
              type="button"
              onClick={() => setEntryMode('screenshot')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                entryMode === 'screenshot'
                  ? 'border-[#E2136E] text-[#E2136E]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E2136E]" />
              <span>{lang === 'bn' ? 'স্ক্রিনশট / এসএমএস টেক্সট ইমপোর্টার' : 'Screenshot / SMS Text Importer'}</span>
            </button>
          </div>
        )}

        {/* SCREENSHOT TEXT IMPORTER VIEW */}
        {entryMode === 'screenshot' && !loanToEdit ? (
          <div className="p-5 space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {lang === 'bn'
                  ? 'বিকাশ লোন স্ক্রিনশট বা এসএমএস থেকে টেক্সট পেস্ট করুন:'
                  : 'Paste text from bKash loan screenshot (OCR / Lens / SMS):'}
              </label>
              <textarea
                rows={4}
                value={screenshotText}
                onChange={(e) => setScreenshotText(e.target.value)}
                placeholder="Paste bKash screen text here... e.g.&#10;Borrower: Mostafizur&#10;Loan ID: 110000000049281742&#10;Principal: ৳ 7,500.00&#10;Outstanding Due: ৳ 7,725.00&#10;Next Repayment Date: 12/11/2026"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-md font-mono-numbers text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#E2136E]"
              />
            </div>

            {/* Quick Sample Prompts */}
            <div>
              <span className="text-[11px] text-slate-500 block mb-1">
                {lang === 'bn' ? 'টেস্ট করতে নমুনা টেক্সট ক্লিক করুন:' : 'Click sample bKash text to test:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {sampleScreenshots.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setScreenshotText(sample.text);
                      handleParseScreenshot(sample.text);
                    }}
                    className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-slate-700 transition-colors"
                  >
                    {sample.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Parse Feedback Banner */}
            {parseFeedback && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    {lang === 'bn'
                      ? 'সফলভাবে লোন তথ্য সনাক্ত হয়েছে!'
                      : 'Successfully extracted bKash loan data!'}
                  </span>
                </div>
                <div className="text-[11px] text-emerald-700 flex flex-wrap gap-x-3 gap-y-1">
                  <span><strong>Name:</strong> {parseFeedback.personName}</span>
                  <span><strong>Loan ID:</strong> {parseFeedback.loanId}</span>
                  <span><strong>Principal:</strong> ৳{parseFeedback.totalPrincipal}</span>
                  <span><strong>Total Due:</strong> ৳{parseFeedback.totalDue}</span>
                  <span><strong>Date:</strong> {parseFeedback.nextLoanSubmitDate}</span>
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEntryMode('form')}
                className="px-3.5 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50"
              >
                {lang === 'bn' ? 'ফরম দেখুন' : 'Go to Form'}
              </button>
              <button
                type="button"
                onClick={() => {
                  handleParseScreenshot();
                  setEntryMode('form');
                }}
                disabled={!screenshotText.trim()}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#E2136E] hover:bg-[#c40e5d] disabled:opacity-50 rounded-md shadow-xs transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'অটো-এক্সট্র্যাক্ট করে ফরমে নিন' : 'Extract & Populate Form'}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : (
          /* STANDARD FORM VIEW */
          <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t.colPerson} *
                </label>
                <input
                  type="text"
                  required
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="e.g. Harun / Mostafizur"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#E2136E]"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t.colLoanId} *
                </label>
                <input
                  type="text"
                  required
                  value={loanId}
                  onChange={(e) => setLoanId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md font-mono-numbers focus:outline-none focus:ring-1 focus:ring-[#E2136E]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t.colPrincipal} (৳)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={totalPrincipal}
                  onChange={(e) => handlePrincipalChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md font-mono-numbers font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t.colTotalDue} (৳)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={totalDue}
                  onChange={(e) => setTotalDue(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md font-mono-numbers font-bold text-[#E2136E]"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tenure (Months)
                </label>
                <select
                  value={tenure}
                  onChange={(e) => handleTenureChange(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md"
                >
                  <option value="3">3 Months (৩ মাস)</option>
                  <option value="2">2 Months (২ মাস)</option>
                  <option value="1">1 Month (১ মাস)</option>
                </select>
              </div>
            </div>

            {/* EMI Breakdown Fields */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
              <span className="font-semibold text-slate-700 block mb-2 text-[11px] uppercase tracking-wide">
                {lang === 'bn' ? 'ইএমআই বিভাজন (মাসিক কিস্তি)' : 'EMI Installment Breakdown'}
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">{t.colCurrentEmi}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={currentMonthEmi}
                    onChange={(e) => setCurrentMonthEmi(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded font-mono-numbers text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">{t.colSecondEmi}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={secondMonthEmi}
                    onChange={(e) => setSecondMonthEmi(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded font-mono-numbers text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">{t.colThirdEmi}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={thirdMonthEmi}
                    onChange={(e) => setThirdMonthEmi(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded font-mono-numbers text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t.colNextDate} (MM/DD/YYYY)
                </label>
                <input
                  type="text"
                  required
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                  placeholder="10/11/2026"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md font-mono-numbers"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="bKash Loan notes"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#E2136E] hover:bg-[#c40e5d] rounded-md shadow-xs transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Loan'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
