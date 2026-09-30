import React from 'react';
import { Language } from '../types/loan';
import { getT } from '../utils/translations';
import { PlusCircle, CreditCard, RotateCcw, CalendarClock, Download, FileSpreadsheet, Sparkles } from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'borrowers' | 'loans' | 'ledger' | 'report' | 'ai';
  setActiveTab: (tab: 'dashboard' | 'borrowers' | 'loans' | 'ledger' | 'report' | 'ai') => void;
  lang: Language;
  setLang: (lang: Language) => void;
  onOpenPaymentModal: () => void;
  onOpenNewLoanModal: () => void;
  onOpenRolloverModal: () => void;
  onResetData: () => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  lang,
  setLang,
  onOpenPaymentModal,
  onOpenNewLoanModal,
  onOpenRolloverModal,
  onResetData,
  onExportCSV,
  onExportPDF,
}) => {
  const t = getT(lang);

  return (
    <header className="no-print sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E2136E] rounded-md"
            >
              <div className="w-8 h-8 rounded-lg bg-[#E2136E] flex items-center justify-center text-white font-bold text-lg shadow-sm">
                ৳
              </div>
              <div>
                <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 block leading-tight">
                  {lang === 'bn' ? 'মোস্তাফিজুর বিকাশ লোন ম্যানেজার' : 'Mostafizur bKash Loan Manager'}
                </span>
                <span className="text-[11px] text-slate-500 font-medium hidden sm:block">
                  {lang === 'bn' ? 'অটোমেটেড কিস্তি ও হিসাব ব্যবস্থা' : 'Automated EMI & Due Management'}
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Clean text navigation links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {t.navDashboard}
            </button>
            <button
              onClick={() => setActiveTab('borrowers')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'borrowers'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {t.navBorrowers}
            </button>
            <button
              onClick={() => setActiveTab('loans')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'loans'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {t.navLoans}
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'ledger'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {t.navLedger}
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'report'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {t.navReport}
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'ai'
                  ? 'bg-purple-100 text-purple-900 border border-purple-200 shadow-2xs font-bold'
                  : 'text-purple-700 hover:text-purple-900 hover:bg-purple-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
              <span>{lang === 'bn' ? 'AI উপদেষ্টা' : 'AI Copilot'}</span>
            </button>
          </nav>

          {/* Zone 3: Primary actions & language toggle */}
          <div className="flex items-center gap-2">
            {/* Export buttons in navbar */}
            <div className="hidden xl:flex items-center gap-1 border-r border-slate-200 pr-2 mr-1">
              <button
                onClick={onExportCSV}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 border border-slate-200 rounded hover:bg-slate-50 transition-colors whitespace-nowrap"
                title="Export CSV"
              >
                <Download className="w-3 h-3 text-slate-500" />
                <span>CSV</span>
              </button>
              <button
                onClick={onExportPDF}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-900 border border-slate-300 rounded hover:bg-slate-100 transition-colors whitespace-nowrap"
                title="Export PDF Document"
              >
                <FileSpreadsheet className="w-3 h-3 text-[#E2136E]" />
                <span>PDF</span>
              </button>
            </div>

            {/* Language switch */}
            <button
              onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
              className="px-2.5 py-1 text-xs font-bold rounded border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap"
              title="Toggle Language / ভাষা পরিবর্তন করুন"
            >
              {lang === 'en' ? 'বাংলা' : 'English'}
            </button>

            {/* Quick Rollover */}
            <button
              onClick={onOpenRolloverModal}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap"
              title="Run monthly schedule check & rollover"
            >
              <CalendarClock className="w-3.5 h-3.5 text-slate-500" />
              <span>{t.monthlyRollover}</span>
            </button>

            {/* Record Payment CTA */}
            <button
              onClick={onOpenPaymentModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#E2136E] hover:bg-[#c40e5d] rounded-md shadow-sm transition-colors whitespace-nowrap"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{t.recordPayment}</span>
            </button>

            {/* New Loan Button */}
            <button
              onClick={onOpenNewLoanModal}
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>{t.addNewLoan}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
