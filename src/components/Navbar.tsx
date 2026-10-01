import React from 'react';
import { Language } from '../types/loan';
import { UserProfile } from '../types/user';
import { getT } from '../utils/translations';
import {
  PlusCircle,
  CreditCard,
  RotateCcw,
  CalendarClock,
  Download,
  FileSpreadsheet,
  Sparkles,
  Settings,
  Home,
  LogIn,
  User,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'borrowers' | 'loans' | 'ledger' | 'report' | 'ai' | 'admin' | 'profile';
  setActiveTab: (tab: 'dashboard' | 'borrowers' | 'loans' | 'ledger' | 'report' | 'ai' | 'admin' | 'profile') => void;
  lang: Language;
  setLang: (lang: Language) => void;
  currentUser: UserProfile | null;
  onOpenPaymentModal: () => void;
  onOpenNewLoanModal: () => void;
  onOpenRolloverModal: () => void;
  onResetData: () => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onGoToLanding: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  lang,
  setLang,
  currentUser,
  onOpenPaymentModal,
  onOpenNewLoanModal,
  onOpenRolloverModal,
  onResetData,
  onExportCSV,
  onExportPDF,
  onOpenSettings,
  onOpenAuth,
  onGoToLanding,
}) => {
  const t = getT(lang);

  return (
    <header className="no-print sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Wordmark & Landing Home Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E2136E] rounded-md cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-[#E2136E] flex items-center justify-center text-white font-bold text-lg shadow-sm">
                {currentUser?.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
                ) : (
                  '৳'
                )}
              </div>
              <div>
                <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white block leading-tight">
                  {currentUser?.name || (lang === 'bn' ? 'মোস্তাফিজুর বিকাশ লোন ম্যানেজার' : 'Mostafizur bKash Loan Manager')}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                  {currentUser ? `🇧🇩 +88 ${currentUser.phone}` : (lang === 'bn' ? 'অটোমেটেড কিস্তি ও হিসাব ব্যবস্থা' : 'Automated EMI & Due Management')}
                </span>
              </div>
            </button>

            {/* Back to Landing Page Icon */}
            <button
              onClick={onGoToLanding}
              className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title={lang === 'bn' ? 'ল্যান্ডিং পেজে ফিরে যান' : 'Go to Landing Page'}
            >
              <Home className="w-4 h-4" />
            </button>
          </div>

          {/* Zone 2: Clean text navigation links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-slate-900 text-white dark:bg-pink-600 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {t.navDashboard}
            </button>
            <button
              onClick={() => setActiveTab('borrowers')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'borrowers'
                  ? 'bg-slate-900 text-white dark:bg-pink-600 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {t.navBorrowers}
            </button>
            <button
              onClick={() => setActiveTab('loans')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'loans'
                  ? 'bg-slate-900 text-white dark:bg-pink-600 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {t.navLoans}
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'ledger'
                  ? 'bg-slate-900 text-white dark:bg-pink-600 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {t.navLedger}
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'report'
                  ? 'bg-slate-900 text-white dark:bg-pink-600 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {t.navReport}
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'ai'
                  ? 'bg-purple-100 text-purple-900 border border-purple-200 shadow-2xs font-bold'
                  : 'text-purple-700 hover:text-purple-900 hover:bg-purple-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
              <span>{lang === 'bn' ? 'AI উপদেষ্টা' : 'AI Copilot'}</span>
            </button>

            {/* Admin Dashboard Tab (visible to admin) */}
            {(currentUser?.role === 'admin' || currentUser?.phone === '01613572749') && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-purple-900 text-white shadow-2xs font-bold'
                    : 'text-purple-600 hover:text-purple-900 hover:bg-purple-100 dark:hover:bg-purple-950/40'
                }`}
              >
                <span>👑</span>
                <span>{lang === 'bn' ? 'অ্যাডমিন প্যানেল' : 'Admin Panel'}</span>
              </button>
            )}

            {/* Profile Tab in Navigation */}
            {currentUser && (
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-slate-900 text-white dark:bg-pink-600 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <User className="w-3.5 h-3.5 text-[#E2136E]" />
                <span>{lang === 'bn' ? 'প্রোফাইল' : 'Profile'}</span>
              </button>
            )}
          </nav>

          {/* Zone 3: Primary actions & language toggle */}
          <div className="flex items-center gap-2">
            {/* Language switch */}
            <button
              onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
              className="px-2.5 py-1 text-xs font-bold rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
              title="Toggle Language"
            >
              {lang === 'en' ? 'বাংলা' : 'English'}
            </button>

            {/* Quick Rollover */}
            <button
              onClick={onOpenRolloverModal}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 rounded-md transition-colors whitespace-nowrap cursor-pointer"
              title="Run monthly schedule check & rollover"
            >
              <CalendarClock className="w-3.5 h-3.5 text-slate-500" />
              <span>{t.monthlyRollover}</span>
            </button>

            {/* Record Payment CTA */}
            <button
              onClick={onOpenPaymentModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#E2136E] hover:bg-[#c40e5d] rounded-md shadow-sm transition-colors whitespace-nowrap cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{t.recordPayment}</span>
            </button>

            {/* User Profile / Settings Button */}
            {currentUser ? (
              <button
                onClick={onOpenSettings}
                className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                title={lang === 'bn' ? 'সেটিংস ও প্রোফাইল' : 'Settings & Profile'}
              >
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt="User"
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-[#E2136E] text-white flex items-center justify-center font-bold text-[10px]">
                    {currentUser.name ? currentUser.name.charAt(0) : 'ম'}
                  </div>
                )}
                <span className="hidden sm:inline max-w-[100px] truncate">{currentUser.name}</span>
                <Settings className="w-3.5 h-3.5 text-slate-500" />
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-[#E2136E]" />
                <span>{lang === 'bn' ? 'লগইন' : 'Sign In'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
