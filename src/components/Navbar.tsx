import React from 'react';
import { Language } from '../types/loan';
import { UserProfile } from '../types/user';
import { getT } from '../utils/translations';
import {
  CreditCard,
  CalendarClock,
  Sparkles,
  Settings,
  LogIn,
  User,
  Sun,
  Moon,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'borrowers' | 'loans' | 'ledger' | 'report' | 'ai' | 'admin' | 'profile';
  setActiveTab: (tab: 'dashboard' | 'borrowers' | 'loans' | 'ledger' | 'report' | 'ai' | 'admin' | 'profile') => void;
  lang: Language;
  setLang: (lang: Language) => void;
  currentUser: UserProfile | null;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onOpenPaymentModal: () => void;
  onOpenNewLoanModal: () => void;
  onOpenRolloverModal: () => void;
  onResetData: () => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onGoToLanding?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  lang,
  setLang,
  currentUser,
  darkMode,
  setDarkMode,
  onOpenPaymentModal,
  onOpenRolloverModal,
  onOpenSettings,
  onOpenAuth,
}) => {
  const t = getT(lang);

  return (
    <header className="no-print sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors shadow-2xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          
          {/* SECTION 1: PROTHOME APP NAM & LOGO (First: App Name & Logo) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="group flex items-center gap-2 sm:gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E2136E] rounded-xl transition-all duration-200 active:scale-95 cursor-pointer min-w-0"
              title="Dashboard"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-[#c40e5d] to-[#E2136E] flex items-center justify-center text-white font-black text-lg shadow-sm shadow-pink-500/20 group-hover:scale-105 transition-transform shrink-0">
                {currentUser?.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt="Logo" className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover" />
                ) : (
                  '৳'
                )}
              </div>
              <div className="min-w-0 truncate">
                <span className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white block leading-tight truncate">
                  {currentUser?.name || (lang === 'bn' ? 'মোস্তাফিজুর বিকাশ লোন' : 'Mostafizur bKash Loan')}
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate hidden xs:block">
                  {currentUser ? `🇧🇩 +88 ${currentUser.phone}` : (lang === 'bn' ? 'অটোমেটেড কিস্তি সফটওয়্যার' : 'Automated Loan Software')}
                </span>
              </div>
            </button>
          </div>

          {/* SECTION 2: DESKTOP NAVIGATION LINKS (Center Alignment) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 justify-center flex-1 px-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-slate-900 text-white dark:bg-pink-600 dark:text-white shadow-2xs font-bold scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {t.navDashboard}
            </button>
            <button
              onClick={() => setActiveTab('borrowers')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
                activeTab === 'borrowers'
                  ? 'bg-slate-900 text-white dark:bg-pink-600 dark:text-white shadow-2xs font-bold scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {t.navBorrowers}
            </button>
            <button
              onClick={() => setActiveTab('loans')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
                activeTab === 'loans'
                  ? 'bg-slate-900 text-white dark:bg-pink-600 dark:text-white shadow-2xs font-bold scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {t.navLoans}
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
                activeTab === 'ledger'
                  ? 'bg-slate-900 text-white dark:bg-pink-600 dark:text-white shadow-2xs font-bold scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {t.navLedger}
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
                activeTab === 'report'
                  ? 'bg-slate-900 text-white dark:bg-pink-600 dark:text-white shadow-2xs font-bold scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {t.navReport}
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'ai'
                  ? 'bg-purple-900 text-white dark:bg-purple-600 shadow-2xs font-bold scale-[1.02]'
                  : 'text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-purple-400" />
              <span>{lang === 'bn' ? 'AI উপদেষ্টা' : 'AI Copilot'}</span>
            </button>

            {/* Admin Dashboard Tab (visible to admin only) */}
            {(currentUser?.role === 'admin' || currentUser?.phone === '01613572749') && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-purple-900 text-white shadow-2xs font-bold scale-[1.02]'
                    : 'text-purple-600 hover:text-purple-900 hover:bg-purple-100 dark:hover:bg-purple-950/40'
                }`}
              >
                <span>👑</span>
                <span>{lang === 'bn' ? 'অ্যাডমিন' : 'Admin'}</span>
              </button>
            )}
          </nav>

          {/* SECTION 3: RECORD PAYMENT BUTTON & CONTROLS (Right Aligned, Perfectly Spaced) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* RECORD PAYMENT BUTTON (Beautifully aligned with animation on both mobile & desktop) */}
            <button
              onClick={onOpenPaymentModal}
              className="group relative flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-[#c40e5d] to-[#E2136E] hover:from-[#b00b52] hover:to-[#c40e5d] active:scale-95 rounded-xl shadow-sm shadow-pink-600/30 transition-all duration-200 whitespace-nowrap cursor-pointer"
              title={lang === 'bn' ? 'কিস্তি জমা দিন' : 'Record Payment'}
            >
              <CreditCard className="w-3.5 h-3.5 text-pink-100 group-hover:rotate-12 transition-transform duration-200" />
              <span className="tracking-tight">{t.recordPayment}</span>
            </button>

            {/* Monthly Rollover (Desktop quick action) */}
            <button
              onClick={onOpenRolloverModal}
              className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all active:scale-95 whitespace-nowrap cursor-pointer"
              title="Run monthly schedule check & rollover"
            >
              <CalendarClock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>{t.monthlyRollover}</span>
            </button>

            {/* Dark / Light Mode Switcher (With smooth icon spin and color animation) */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 sm:p-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 active:scale-90 flex items-center justify-center cursor-pointer shadow-2xs"
              title={
                darkMode
                  ? (lang === 'bn' ? 'লাইট মোড চালু করুন' : 'Switch to Light Mode')
                  : (lang === 'bn' ? 'ডার্ক মোড চালু করুন' : 'Switch to Dark Mode')
              }
              aria-label="Toggle Theme"
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400 rotate-0 transition-transform duration-300 hover:rotate-45" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300 rotate-0 transition-transform duration-300 hover:-rotate-12" />
              )}
            </button>

            {/* Language switch (বাং / EN) */}
            <button
              onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
              className="px-2 sm:px-2.5 py-1.5 text-xs font-extrabold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 active:scale-90 whitespace-nowrap cursor-pointer shadow-2xs font-mono-numbers"
              title="Toggle Language"
            >
              {lang === 'en' ? 'বাং' : 'EN'}
            </button>

            {/* User Profile / Settings Button */}
            {currentUser && (
              <button
                onClick={onOpenSettings}
                className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer border border-slate-200 dark:border-slate-700"
                title={lang === 'bn' ? 'সেটিংস ও প্রোফাইল' : 'Settings & Profile'}
              >
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt="User"
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-[#E2136E] text-white flex items-center justify-center font-black text-[10px]">
                    {currentUser.name ? currentUser.name.charAt(0) : 'ম'}
                  </div>
                )}
                <span className="hidden sm:inline max-w-[90px] truncate font-medium text-slate-800 dark:text-slate-100">
                  {currentUser.name}
                </span>
                <Settings className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>
            )}

            {/* Note: Login button on mobile is explicitly REMOVED per user request ("mobile theke upore menu bar a login option ta remove koro"). Only on desktop if unauthenticated */}
            {!currentUser && (
              <button
                onClick={onOpenAuth}
                className="hidden md:flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
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
