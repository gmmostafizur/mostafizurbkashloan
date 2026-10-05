import React, { useState, useMemo } from 'react';
import { LoanRecord, Language } from '../types/loan';
import { getT } from '../utils/translations';
import { formatCurrency, isDateOverdue, getDaysRemaining, toBanglaNumber, getLoanMonthStatusInfo } from '../utils/dateUtils';
import { exportLoansToCSV, exportLoansToPDF } from '../utils/exportUtils';
import { RepaymentProgressBar } from './RepaymentProgressBar';
import {
  Search,
  Filter,
  Copy,
  Check,
  CreditCard,
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  ChevronDown,
  Download,
  FileSpreadsheet,
  Clock,
  Layers,
  X,
  RotateCcw,
  ArrowRight,
  Wallet,
} from 'lucide-react';

interface LoansTableProps {
  loans: LoanRecord[];
  lang: Language;
  selectedBorrower: string | null;
  setSelectedBorrower: (borrower: string | null) => void;
  onPayLoan: (loan: LoanRecord, fullSettlement?: boolean) => void;
  onViewReceipt: (loan: LoanRecord) => void;
  onEditLoan: (loan: LoanRecord) => void;
  isReadOnly?: boolean;
}

export const LoansTable: React.FC<LoansTableProps> = ({
  loans,
  lang,
  selectedBorrower,
  setSelectedBorrower,
  onPayLoan,
  onViewReceipt,
  onEditLoan,
  isReadOnly = false,
}) => {
  const t = getT(lang);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'overdue' | 'due_soon' | 'paid'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter counts
  const statusCounts = useMemo(() => {
    let active = 0;
    let overdue = 0;
    let dueSoon = 0;
    let paid = 0;

    loans.forEach(loan => {
      const isSettled = loan.totalDue <= 0 || loan.status === 'paid';
      const isOverdue = isDateOverdue(loan.nextLoanSubmitDate);
      const days = getDaysRemaining(loan.nextLoanSubmitDate);

      if (isSettled) {
        paid++;
      } else {
        active++;
        if (isOverdue) {
          overdue++;
        } else if (days >= 0 && days <= 14) {
          dueSoon++;
        }
      }
    });

    return { all: loans.length, active, overdue, dueSoon, paid };
  }, [loans]);

  // Unique borrowers for filter pills
  const borrowerNames = useMemo(() => {
    const names = Array.from(new Set(loans.map(l => l.personName)));
    return names.sort();
  }, [loans]);

  // Installment highlighting option for this month, next month, or 3rd month
  const [highlightedEmi, setHighlightedEmi] = useState<'all' | 'current' | 'second' | 'third'>('all');

  // Calculate installment breakdown for selected borrower or all borrowers
  const borrowerEmiSummary = useMemo(() => {
    const targetLoans = selectedBorrower
      ? loans.filter(l => l.personName.toLowerCase() === selectedBorrower.toLowerCase())
      : loans;

    const activeLoans = targetLoans.filter(l => l.status !== 'paid' && l.totalDue > 0);

    const currentMonthTotal = activeLoans.reduce((sum, l) => sum + (l.currentMonthEmi || 0), 0);
    const secondMonthTotal = activeLoans.reduce((sum, l) => sum + (l.secondMonthEmi || 0), 0);
    const thirdMonthTotal = activeLoans.reduce((sum, l) => sum + (l.thirdMonthEmi || 0), 0);
    const totalDue = activeLoans.reduce((sum, l) => sum + (l.totalDue || 0), 0);
    const totalPrincipal = activeLoans.reduce((sum, l) => sum + (l.totalPrincipalLoan || 0), 0);

    return {
      borrowerName: selectedBorrower,
      isSpecific: !!selectedBorrower,
      totalCount: targetLoans.length,
      activeCount: activeLoans.length,
      currentMonthTotal,
      secondMonthTotal,
      thirdMonthTotal,
      totalDue,
      totalPrincipal,
      firstActiveLoan: activeLoans[0] || targetLoans[0],
    };
  }, [loans, selectedBorrower]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered & Sorted Loans
  const filteredLoans = useMemo(() => {
    return loans.filter(loan => {
      // Borrower filter
      if (selectedBorrower && loan.personName.toLowerCase() !== selectedBorrower.toLowerCase()) {
        return false;
      }

      // Search query (matches loan ID or borrower name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = loan.personName.toLowerCase().includes(q);
        const matchesId = loan.loanId.toLowerCase().includes(q);
        if (!matchesName && !matchesId) return false;
      }

      // Status filter
      const isOverdue = isDateOverdue(loan.nextLoanSubmitDate);
      const days = getDaysRemaining(loan.nextLoanSubmitDate);
      const isSettled = loan.totalDue <= 0 || loan.status === 'paid';

      if (statusFilter === 'active') {
        return !isSettled;
      } else if (statusFilter === 'overdue') {
        return !isSettled && isOverdue;
      } else if (statusFilter === 'due_soon') {
        return !isSettled && days >= 0 && days <= 14;
      } else if (statusFilter === 'paid') {
        return isSettled;
      }

      return true;
    });
  }, [loans, selectedBorrower, searchQuery, statusFilter]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs transition-colors">
      {/* Control Bar: Search + Filter Tabs */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/60">
        {/* Search Input */}
        <div className="relative max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E2136E] focus:border-[#E2136E]"
          />
        </div>

        {/* Status Segmented Buttons for Quick Filtering */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {/* All Loans Button */}
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 ${
              statusFilter === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t.filterAll}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono-numbers ${
                statusFilter === 'all' ? 'bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {lang === 'bn' ? toBanglaNumber(statusCounts.all) : statusCounts.all}
            </span>
          </button>

          {/* Active Status Button */}
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 ${
              statusFilter === 'active'
                ? 'bg-[#E2136E] text-white shadow-pink-500/20 font-bold'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-pink-50 dark:hover:bg-slate-700 hover:text-[#E2136E]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{t.filterActive}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono-numbers ${
                statusFilter === 'active' ? 'bg-pink-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {lang === 'bn' ? toBanglaNumber(statusCounts.active) : statusCounts.active}
            </span>
          </button>

          {/* Overdue Status Button */}
          <button
            onClick={() => setStatusFilter('overdue')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 ${
              statusFilter === 'overdue'
                ? 'bg-rose-600 text-white shadow-rose-500/20 font-bold'
                : statusCounts.overdue > 0
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900 hover:bg-rose-100'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-slate-700 hover:text-rose-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{t.filterOverdue}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono-numbers ${
                statusFilter === 'overdue'
                  ? 'bg-rose-800 text-white'
                  : statusCounts.overdue > 0
                  ? 'bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-300 font-bold'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {lang === 'bn' ? toBanglaNumber(statusCounts.overdue) : statusCounts.overdue}
            </span>
          </button>

          {/* Paid Status Button */}
          <button
            onClick={() => setStatusFilter('paid')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 ${
              statusFilter === 'paid'
                ? 'bg-emerald-600 text-white shadow-emerald-500/20 font-bold'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-700 hover:text-emerald-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t.filterSettled}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono-numbers ${
                statusFilter === 'paid' ? 'bg-emerald-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {lang === 'bn' ? toBanglaNumber(statusCounts.paid) : statusCounts.paid}
            </span>
          </button>

          {/* Due Soon (Upcoming) Button */}
          <button
            onClick={() => setStatusFilter('due_soon')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 ${
              statusFilter === 'due_soon'
                ? 'bg-amber-600 text-white shadow-amber-500/20 font-bold'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-slate-700 hover:text-amber-700'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{t.filterDueSoon}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono-numbers ${
                statusFilter === 'due_soon' ? 'bg-amber-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {lang === 'bn' ? toBanglaNumber(statusCounts.dueSoon) : statusCounts.dueSoon}
            </span>
          </button>

          {/* Quick Clear Status Filter */}
          {statusFilter !== 'all' && (
            <button
              onClick={() => setStatusFilter('all')}
              className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors"
              title={lang === 'bn' ? 'ফিল্টার রিসেট করুন' : 'Clear status filter'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-1.5 self-end lg:self-center">
          <button
            onClick={() => exportLoansToCSV(filteredLoans, lang)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors shadow-2xs whitespace-nowrap"
            title="Download current loan ledger as CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV</span>
          </button>
          <button
            onClick={() => exportLoansToPDF(filteredLoans, lang)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shadow-2xs whitespace-nowrap"
            title="Generate and download printable PDF audit report"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Borrower Quick Switcher Bar */}
      <div className="px-4 py-2.5 bg-slate-100/60 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-xs">
        <span className="text-slate-400 font-medium mr-1 text-[11px] whitespace-nowrap">
          {lang === 'bn' ? 'ব্যক্তি নির্বাচন:' : 'Borrower:'}
        </span>
        <button
          onClick={() => setSelectedBorrower(null)}
          className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
            selectedBorrower === null
              ? 'bg-white text-slate-900 font-semibold shadow-2xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          {t.allBorrowers}
        </button>
        {borrowerNames.map((name) => {
          const count = loans.filter(l => l.personName === name && l.status !== 'paid').length;
          return (
            <button
              key={name}
              onClick={() => setSelectedBorrower(name)}
              className={`px-2.5 py-1 rounded text-xs whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer ${
                selectedBorrower === name
                  ? 'bg-[#E2136E] text-white font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <span>{name}</span>
              <span className={`text-[10px] ${selectedBorrower === name ? 'text-white/80' : 'text-slate-400'}`}>
                ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* BORROWER INSTALLMENT SUMMARY & OPTIONS (এই মাসের কিস্তি, পরের মাসের কিস্তি, ৩য় মাসের কিস্তি অপশন) */}
      <div className="p-3 sm:p-4 bg-gradient-to-r from-pink-50/30 via-white to-slate-50 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#E2136E] text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
              {borrowerEmiSummary.isSpecific ? borrowerEmiSummary.borrowerName?.charAt(0) : '৳'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  {borrowerEmiSummary.isSpecific
                    ? `${borrowerEmiSummary.borrowerName} - ${lang === 'bn' ? 'এর কিস্তিসমূহ ও অপশন' : 'Installment Details & Options'}`
                    : (lang === 'bn' ? 'সকল ঋণগ্রহীতার কিস্তির সামগ্রিক বিবরণ' : 'All Borrowers Installments Overview')}
                </h3>
                <span className="text-[10px] font-semibold bg-pink-100 text-[#E2136E] px-2 py-0.5 rounded-full font-mono-numbers">
                  {borrowerEmiSummary.activeCount} {lang === 'bn' ? 'টি সক্রিয় লোন' : 'Active loans'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {lang === 'bn'
                  ? 'এই মাসের কিস্তি, পরের মাসের কিস্তি এবং ৩য় মাসের কিস্তির একক হিসাব ও কুইক অপশন'
                  : 'Current month, 2nd month, and 3rd month installment amounts and quick options'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            {borrowerEmiSummary.firstActiveLoan && (
              <button
                type="button"
                onClick={() => onPayLoan(borrowerEmiSummary.firstActiveLoan)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#E2136E] hover:bg-[#c40e5d] rounded-md transition-colors shadow-2xs cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'কিস্তি জমা করুন' : 'Pay Installment'}</span>
              </button>
            )}
            {borrowerEmiSummary.isSpecific && (
              <button
                type="button"
                onClick={() => setSelectedBorrower(null)}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                title="View All Borrowers"
              >
                <RotateCcw className="w-3 h-3 text-slate-400" />
                <span>{lang === 'bn' ? 'রিসেট' : 'Reset'}</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Interactive Installment Option Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          {/* Option 1: এই মাসের কিস্তি (বর্তমান মাস) */}
          <button
            type="button"
            onClick={() => setHighlightedEmi(highlightedEmi === 'current' ? 'all' : 'current')}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer shadow-2xs ${
              highlightedEmi === 'current'
                ? 'bg-pink-100/80 border-[#E2136E] ring-2 ring-[#E2136E]/30'
                : 'bg-white border-pink-200 hover:border-[#E2136E] hover:bg-pink-50/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#E2136E] flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{lang === 'bn' ? 'এই মাসের কিস্তি' : 'This Month (EMI 1)'}</span>
              </span>
              <span className="text-[9px] bg-pink-100 text-[#E2136E] px-1.5 py-0.2 rounded font-medium">
                {lang === 'bn' ? 'বর্তমান মাস' : 'Current'}
              </span>
            </div>
            <div className="mt-1 text-base font-bold text-slate-900 font-mono-numbers">
              {formatCurrency(borrowerEmiSummary.currentMonthTotal, lang)}
            </div>
            <div className="mt-0.5 text-[10px] text-slate-500 flex items-center justify-between">
              <span>{lang === 'bn' ? '১ম কিস্তির পরিমাণ' : '1st installment'}</span>
              <span className="text-[#E2136E] font-medium text-[9px]">
                {highlightedEmi === 'current'
                  ? (lang === 'bn' ? 'সক্রিয় ✓' : 'Active ✓')
                  : (lang === 'bn' ? 'ক্লিক করে হাইলাইট' : 'Click to highlight')}
              </span>
            </div>
          </button>

          {/* Option 2: পরের মাসের কিস্তি (২য় মাস) */}
          <button
            type="button"
            onClick={() => setHighlightedEmi(highlightedEmi === 'second' ? 'all' : 'second')}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer shadow-2xs ${
              highlightedEmi === 'second'
                ? 'bg-blue-100/80 border-blue-500 ring-2 ring-blue-400/30'
                : 'bg-white border-blue-200 hover:border-blue-400 hover:bg-blue-50/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-700 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{lang === 'bn' ? 'পরের মাসের কিস্তি' : 'Next Month (EMI 2)'}</span>
              </span>
              <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-medium">
                {lang === 'bn' ? '২য় কিস্তি' : '2nd Month'}
              </span>
            </div>
            <div className="mt-1 text-base font-bold text-slate-900 font-mono-numbers">
              {formatCurrency(borrowerEmiSummary.secondMonthTotal, lang)}
            </div>
            <div className="mt-0.5 text-[10px] text-slate-500 flex items-center justify-between">
              <span>{lang === 'bn' ? 'আগামী মাসের প্রদেয়' : 'Upcoming schedule'}</span>
              <span className="text-blue-600 font-medium text-[9px]">
                {highlightedEmi === 'second'
                  ? (lang === 'bn' ? 'সক্রিয় ✓' : 'Active ✓')
                  : (lang === 'bn' ? 'ক্লিক করে হাইলাইট' : 'Click to highlight')}
              </span>
            </div>
          </button>

          {/* Option 3: ৩য় মাসের কিস্তি */}
          <button
            type="button"
            onClick={() => setHighlightedEmi(highlightedEmi === 'third' ? 'all' : 'third')}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer shadow-2xs ${
              highlightedEmi === 'third'
                ? 'bg-emerald-100/80 border-emerald-500 ring-2 ring-emerald-400/30'
                : 'bg-white border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{lang === 'bn' ? '৩য় মাসের কিস্তি' : '3rd Month (EMI 3)'}</span>
              </span>
              <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded font-medium">
                {lang === 'bn' ? 'শেষ কিস্তি' : 'Final EMI'}
              </span>
            </div>
            <div className="mt-1 text-base font-bold text-slate-900 font-mono-numbers">
              {formatCurrency(borrowerEmiSummary.thirdMonthTotal, lang)}
            </div>
            <div className="mt-0.5 text-[10px] text-slate-500 flex items-center justify-between">
              <span>{lang === 'bn' ? 'চূড়ান্ত কিস্তির পরিমাণ' : 'Final installment'}</span>
              <span className="text-emerald-600 font-medium text-[9px]">
                {highlightedEmi === 'third'
                  ? (lang === 'bn' ? 'সক্রিয় ✓' : 'Active ✓')
                  : (lang === 'bn' ? 'ক্লিক করে হাইলাইট' : 'Click to highlight')}
              </span>
            </div>
          </button>

          {/* Option 4: মোট অবশিষ্ট বকেয়া */}
          <div className="p-2.5 rounded-lg border border-slate-200 bg-white shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <Wallet className="w-3 h-3 text-rose-500" />
                <span>{lang === 'bn' ? 'মোট অবশিষ্ট বকেয়া' : 'Total Outstanding'}</span>
              </span>
              <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-medium font-mono-numbers">
                {borrowerEmiSummary.totalCount} {lang === 'bn' ? 'টি লোন' : 'loans'}
              </span>
            </div>
            <div className="mt-1 text-base font-bold text-[#E2136E] font-mono-numbers">
              {formatCurrency(borrowerEmiSummary.totalDue, lang)}
            </div>
            <div className="mt-0.5 text-[10px] text-slate-400">
              {lang === 'bn' ? 'মূল লোন: ' : 'Principal: '}
              <span className="font-mono-numbers font-medium text-slate-600">
                {formatCurrency(borrowerEmiSummary.totalPrincipal, lang)}
              </span>
            </div>
          </div>
        </div>

        {/* EMI Option Selector Pills */}
        <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 mr-1">
              {lang === 'bn' ? 'কিস্তি অপশন প্রদর্শন:' : 'Installment View Option:'}
            </span>
            <button
              type="button"
              onClick={() => setHighlightedEmi('all')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                highlightedEmi === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {lang === 'bn' ? 'সকল কিস্তি' : 'All EMIs'}
            </button>
            <button
              type="button"
              onClick={() => setHighlightedEmi('current')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                highlightedEmi === 'current'
                  ? 'bg-[#E2136E] text-white'
                  : 'bg-white text-pink-700 border border-pink-200 hover:bg-pink-50'
              }`}
            >
              {lang === 'bn' ? 'এই মাসের কিস্তি' : 'This Month EMI'}
            </button>
            <button
              type="button"
              onClick={() => setHighlightedEmi('second')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                highlightedEmi === 'second'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50'
              }`}
            >
              {lang === 'bn' ? 'পরের মাসের কিস্তি' : 'Next Month EMI'}
            </button>
            <button
              type="button"
              onClick={() => setHighlightedEmi('third')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                highlightedEmi === 'third'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              {lang === 'bn' ? '৩য় মাসের কিস্তি' : '3rd Month EMI'}
            </button>
          </div>

          <div className="text-[11px] text-slate-400 hidden sm:block">
            {lang === 'bn'
              ? 'যেকোনো কিস্তিতে ক্লিক করলে টেবিলে তা হাইলাইট হবে'
              : 'Click any installment card to highlight its column'}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-3.5">{t.colPerson}</th>
              <th className="py-3 px-3">{t.colLoanId}</th>
              <th className="py-3 px-3 text-right">{t.colPrincipal}</th>
              <th
                onClick={() => setHighlightedEmi(highlightedEmi === 'current' ? 'all' : 'current')}
                className={`py-3 px-3 text-right cursor-pointer transition-colors ${
                  highlightedEmi === 'current' ? 'bg-pink-100 text-[#E2136E] font-bold ring-1 ring-inset ring-pink-300' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title="Click to toggle highlight"
              >
                {t.colCurrentEmi}
              </th>
              <th
                onClick={() => setHighlightedEmi(highlightedEmi === 'second' ? 'all' : 'second')}
                className={`py-3 px-3 text-right cursor-pointer transition-colors ${
                  highlightedEmi === 'second' ? 'bg-blue-100 text-blue-800 font-bold ring-1 ring-inset ring-blue-300' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title="Click to toggle highlight"
              >
                {t.colSecondEmi}
              </th>
              <th
                onClick={() => setHighlightedEmi(highlightedEmi === 'third' ? 'all' : 'third')}
                className={`py-3 px-3 text-right cursor-pointer transition-colors ${
                  highlightedEmi === 'third' ? 'bg-emerald-100 text-emerald-800 font-bold ring-1 ring-inset ring-emerald-300' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title="Click to toggle highlight"
              >
                {t.colThirdEmi}
              </th>
              <th className="py-3 px-3 text-right">{t.colTotalDue}</th>
              <th className="py-3 px-3">{t.colPaidProgress}</th>
              <th className="py-3 px-3">{t.colNextDate}</th>
              <th className="py-3 px-3">{t.colStatus}</th>
              <th className="py-3 px-3 text-right">{t.colActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredLoans.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-slate-400">
                  {lang === 'bn' ? 'কোনো লোন রেকর্ড পাওয়া যায়নি' : 'No matching loan records found.'}
                </td>
              </tr>
            ) : (
              filteredLoans.map((loan) => {
                const isOverdue = isDateOverdue(loan.nextLoanSubmitDate);
                const daysRemaining = getDaysRemaining(loan.nextLoanSubmitDate);
                const isSettled = loan.totalDue <= 0 || loan.status === 'paid';

                return (
                  <tr
                    key={loan.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                      isOverdue && !isSettled ? 'bg-rose-50/20 dark:bg-rose-950/20' : ''
                    }`}
                  >
                    {/* Borrower */}
                    <td className="py-3 px-3.5 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                      <button
                        onClick={() => setSelectedBorrower(loan.personName)}
                        className="hover:text-[#E2136E] hover:underline text-left cursor-pointer"
                        title="Filter this borrower"
                      >
                        {loan.personName}
                      </button>
                    </td>

                    {/* Loan ID with Quick Copy */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono-numbers text-slate-700 dark:text-slate-300">
                        <span>{loan.loanId}</span>
                        <button
                          onClick={() => copyToClipboard(loan.loanId)}
                          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
                          title="Copy Loan ID"
                        >
                          {copiedId === loan.loanId ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Total Principal */}
                    <td className="py-3 px-3 text-right font-mono-numbers text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {formatCurrency(loan.totalPrincipalLoan, lang)}
                    </td>

                    {/* Current Month EMI */}
                    <td
                      className={`py-3 px-3 text-right font-mono-numbers font-bold whitespace-nowrap transition-colors ${
                        highlightedEmi === 'current'
                          ? 'bg-pink-50 dark:bg-pink-950/40 text-[#E2136E] ring-1 ring-inset ring-pink-300 dark:ring-pink-700'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {formatCurrency(loan.currentMonthEmi, lang)}
                    </td>

                    {/* 2nd Month EMI */}
                    <td
                      className={`py-3 px-3 text-right font-mono-numbers whitespace-nowrap transition-colors ${
                        highlightedEmi === 'second'
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-bold ring-1 ring-inset ring-blue-300 dark:ring-blue-700'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {loan.secondMonthEmi > 0 ? formatCurrency(loan.secondMonthEmi, lang) : '-'}
                    </td>

                    {/* 3rd Month EMI */}
                    <td
                      className={`py-3 px-3 text-right font-mono-numbers whitespace-nowrap transition-colors ${
                        highlightedEmi === 'third'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold ring-1 ring-inset ring-emerald-300 dark:ring-emerald-700'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {loan.thirdMonthEmi > 0 ? formatCurrency(loan.thirdMonthEmi, lang) : '-'}
                    </td>

                    {/* Total Due */}
                    <td className="py-3 px-3 text-right font-mono-numbers font-bold text-[#E2136E] whitespace-nowrap">
                      {formatCurrency(loan.totalDue, lang)}
                    </td>

                    {/* Visual Repayment Progress Bar */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <RepaymentProgressBar loan={loan} lang={lang} />
                    </td>

                    {/* Next Loan Submit Date */}
                    <td className="py-3 px-3 font-mono-numbers whitespace-nowrap">
                      <div className={isOverdue && !isSettled ? 'text-rose-600 font-bold' : 'text-slate-800 dark:text-slate-200'}>
                        {loan.nextLoanSubmitDate}
                      </div>
                      {!isSettled && (
                        <div className="text-[10px] text-slate-400">
                          {isOverdue ? (
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

                    {/* Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {(() => {
                        const monthInfo = getLoanMonthStatusInfo(loan.nextLoanSubmitDate);
                        if (isSettled) {
                          return (
                            <span className="text-emerald-700 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {t.statusPaid}
                            </span>
                          );
                        }
                        if (isOverdue) {
                          return (
                            <span className="text-rose-600 font-semibold flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {t.statusOverdue}
                            </span>
                          );
                        }
                        if (monthInfo.isCurrentMonth) {
                          return (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                              daysRemaining <= 7 ? 'bg-pink-100 text-[#E2136E] border border-pink-200' : 'bg-pink-50 text-pink-700'
                            }`}>
                              {lang === 'bn' ? monthInfo.badgeLabelBn : monthInfo.badgeLabelEn}
                            </span>
                          );
                        }
                        if (monthInfo.isNextMonth) {
                          return (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              {lang === 'bn' ? monthInfo.badgeLabelBn : monthInfo.badgeLabelEn}
                            </span>
                          );
                        }
                        return (
                          <span className="text-slate-600 font-medium">
                            {lang === 'bn' ? monthInfo.badgeLabelBn : monthInfo.badgeLabelEn}
                          </span>
                        );
                      })()}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isSettled ? (
                          <>
                            {!isReadOnly && (
                              <>
                                <button
                                  onClick={() => onPayLoan(loan, false)}
                                  className="px-2.5 py-1 text-xs font-semibold text-white bg-[#E2136E] hover:bg-[#c40e5d] rounded shadow-2xs transition-colors cursor-pointer"
                                  title={`Pay Current EMI (${formatCurrency(loan.currentMonthEmi, lang)})`}
                                >
                                  {lang === 'bn' ? 'কিস্তি জমা' : 'Pay EMI'}
                                </button>
                                <button
                                  onClick={() => onPayLoan(loan, true)}
                                  className="hidden sm:inline-block px-2 py-1 text-[11px] font-medium text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                  title="Full loan settlement"
                                >
                                  {lang === 'bn' ? 'পূর্ণ পরিশোধ' : 'Settle'}
                                </button>
                              </>
                            )}
                            {loan.lastPaymentDate && (
                              <button
                                onClick={() => onViewReceipt(loan)}
                                className="px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer flex items-center gap-1"
                                title={lang === 'bn' ? 'জমার রশিদ দেখুন ও ডাউনলোড করুন' : 'View & Download Receipt'}
                              >
                                <FileText className="w-3 h-3 text-[#E2136E]" />
                                <span className="hidden md:inline">{lang === 'bn' ? 'রশিদ' : 'Receipt'}</span>
                              </button>
                            )}
                            {isReadOnly && !loan.lastPaymentDate && (
                              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
                                {lang === 'bn' ? 'বকেয়া কিস্তি' : 'Pending'}
                              </span>
                            )}
                          </>
                        ) : (
                          <button
                            onClick={() => onViewReceipt(loan)}
                            className="px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded flex items-center gap-1 cursor-pointer"
                            title={lang === 'bn' ? 'রশিদ দেখুন ও ডাউনলোড করুন' : 'View & Download Receipt'}
                          >
                            <FileText className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{lang === 'bn' ? 'রশিদ দেখুন' : 'View Receipt'}</span>
                          </button>
                        )}
                        {!isReadOnly && (
                          <button
                            onClick={() => onEditLoan(loan)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 cursor-pointer"
                            title="Edit details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Summary Bar */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span>
            {lang === 'bn' ? 'প্রদর্শিত লোন:' : 'Showing:'} {filteredLoans.length} of {loans.length}
          </span>
          <span>·</span>
          <span>
            {lang === 'bn' ? 'বর্তমান মাস বকেয়া সর্বমোট:' : 'Total Due in view:'}{' '}
            <strong className="text-slate-900 font-mono-numbers">
              {formatCurrency(
                filteredLoans.reduce((sum, l) => sum + (l.totalDue || 0), 0),
                lang
              )}
            </strong>
          </span>
        </div>
        <div className="text-[11px] text-slate-400">
          {lang === 'bn'
            ? 'টাকা জমা দিলে স্বয়ংক্রিয়ভাবে পরবর্তী তারিখ ও বকেয়া আপডেট হবে'
            : 'Payment automatically updates schedule and recalculates remaining EMIs'}
        </div>
      </div>
    </div>
  );
};
