import React, { useState } from 'react';
import { Language } from '../types/loan';
import { UserProfile } from '../types/user';
import { getT } from '../utils/translations';
import {
  CreditCard,
  PlusCircle,
  RotateCcw,
  CalendarClock,
  Sparkles,
  Settings,
  User,
  Sun,
  Moon,
  LogOut,
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  Receipt,
  FileBarChart,
  ShieldAlert,
  Globe,
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

interface NavigationSidebarProps {
  activeTab: 'dashboard' | 'borrowers' | 'loans' | 'ledger' | 'report' | 'ai' | 'admin' | 'profile';
  setActiveTab: (tab: 'dashboard' | 'borrowers' | 'loans' | 'ledger' | 'report' | 'ai' | 'admin' | 'profile') => void;
  lang: Language;
  setLang: (lang: Language) => void;
  currentUser: UserProfile | null;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  isReadOnly: boolean;
  onOpenPaymentModal: () => void;
  onOpenNewLoanModal: () => void;
  onOpenRolloverModal: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  activeTab,
  setActiveTab,
  lang,
  setLang,
  currentUser,
  darkMode,
  setDarkMode,
  isReadOnly,
  onOpenPaymentModal,
  onOpenNewLoanModal,
  onOpenRolloverModal,
  onOpenSettings,
  onLogout,
}) => {
  const t = getT(lang);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const isManager = !isReadOnly;

  // Navigation Links based on User Role:
  // Regular users only see Loans, Payment History & Monthly Report
  const navItems = isManager
    ? [
        { id: 'dashboard', label: lang === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard', icon: LayoutDashboard },
        { id: 'borrowers', label: lang === 'bn' ? 'গ্রাহক তালিকা' : 'Borrowers', icon: Users },
        { id: 'loans', label: lang === 'bn' ? 'লোন খতিয়ান' : 'All Loans', icon: FileSpreadsheet },
        { id: 'ledger', label: lang === 'bn' ? 'পেমেন্ট হিস্ট্রি' : 'Payment History', icon: Receipt },
        { id: 'report', label: lang === 'bn' ? 'মাসিক রিপোর্ট' : 'Monthly Report', icon: FileBarChart },
        { id: 'ai', label: lang === 'bn' ? 'AI উপদেষ্টা' : 'AI Copilot', icon: Sparkles },
        ...(currentUser?.role === 'admin' || currentUser?.phone === '01613572749'
          ? [{ id: 'admin', label: lang === 'bn' ? 'অ্যাডমিন প্যানেল' : 'Admin Panel', icon: ShieldAlert }]
          : []),
      ]
    : [
        { id: 'loans', label: lang === 'bn' ? 'আমার লোন' : 'My Loans', icon: FileSpreadsheet },
        { id: 'ledger', label: lang === 'bn' ? 'পেমেন্ট হিস্ট্রি' : 'Payment History', icon: Receipt },
        { id: 'report', label: lang === 'bn' ? 'মাসিক রিপোর্ট' : 'Monthly Report', icon: FileBarChart },
        { id: 'profile', label: lang === 'bn' ? 'আমার প্রোফাইল' : 'My Profile', icon: User },
      ];

  const handleTabClick = (tabId: any) => {
    setActiveTab(tabId);
    setMobileDrawerOpen(false);
  };

  // Reusable Sidebar Inner Content
  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-4 sm:p-5 select-none">
      {/* Top: Branding + User Profile Card */}
      <div className="space-y-4">
        {/* App Logo & Title */}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#c40e5d] to-[#E2136E] flex items-center justify-center text-white font-black text-xl shadow-md shadow-pink-600/25 shrink-0">
            {currentUser?.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt="Logo" className="w-10 h-10 rounded-2xl object-cover" />
            ) : (
              '৳'
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-black tracking-tight text-slate-900 dark:text-white leading-tight truncate">
              {currentUser?.name || (lang === 'bn' ? 'মোস্তাফিজুর বিকাশ লোন' : 'Mostafizur bKash Loan')}
            </h1>
            <p className="text-[11px] font-mono-numbers text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {currentUser ? `🇧🇩 +88 ${currentUser.phone}` : '01907239952'}
            </p>
          </div>
        </div>

        {/* User Account Type Badge Card */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {lang === 'bn' ? 'অ্যাকাউন্ট স্ট্যাটাস' : 'Account Type'}
            </span>
            {isManager ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>{lang === 'bn' ? 'ম্যানেজার / অ্যাডমিন' : 'Manager'}</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                {lang === 'bn' ? 'ঋণগ্রহীতা (ভিউ অনলি)' : 'Borrower (View Only)'}
              </span>
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-xs">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
              {currentUser?.name || (lang === 'bn' ? 'ব্যবহারকারী' : 'User')}
            </span>
          </div>
        </div>

        {/* Action Buttons: ONLY FOR MANAGERS (Hidden for regular users!) */}
        {isManager && (
          <div className="space-y-2 pt-1">
            {/* Record Payment CTA Button */}
            <button
              type="button"
              onClick={onOpenPaymentModal}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-r from-[#c40e5d] to-[#E2136E] hover:from-[#b00b52] hover:to-[#c40e5d] text-white font-bold rounded-xl shadow-md shadow-pink-600/30 transition-all duration-150 active:scale-95 text-xs cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>{lang === 'bn' ? 'কিস্তি জমা করুন' : 'Record Payment'}</span>
            </button>

            {/* Secondary Action: Add New Loan */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={onOpenNewLoanModal}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] transition-all cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 text-[#E2136E]" />
                <span>{lang === 'bn' ? 'নতুন লোন' : 'New Loan'}</span>
              </button>
              <button
                type="button"
                onClick={onOpenRolloverModal}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] transition-all cursor-pointer"
              >
                <CalendarClock className="w-3.5 h-3.5 text-blue-500" />
                <span>{lang === 'bn' ? 'রোলওভার' : 'Rollover'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Read-Only Mode Explanation Notice */}
        {!isManager && (
          <div className="p-2.5 bg-blue-50/80 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/60 text-[11px] text-blue-800 dark:text-blue-300 leading-snug">
            {lang === 'bn'
              ? 'এখানে আপনি শুধুমাত্র আপনার লোনের বকেয়া, জমা হিস্ট্রি এবং মাসিক রিপোর্ট দেখতে পারবেন।'
              : 'You have view-only access to your loans, payment history, and monthly report.'}
          </div>
        )}

        {/* Navigation Panel Menu Links */}
        <nav className="space-y-1 pt-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-1.5">
            {lang === 'bn' ? 'মেন্যু নেভিগেশন' : 'Navigation'}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? 'text-pink-400 dark:text-[#E2136E]'
                        : 'text-slate-400 dark:text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Utilities: Theme, Language, Profile & Logout */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center gap-1.5">
          {/* Theme switcher */}
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            title="Toggle Dark Mode"
          >
            {darkMode ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>{lang === 'bn' ? 'লাইট' : 'Light'}</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-500" />
                <span>{lang === 'bn' ? 'ডার্ক' : 'Dark'}</span>
              </>
            )}
          </button>

          {/* Language Switcher */}
          <button
            type="button"
            onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            title="Toggle Language"
          >
            <Globe className="w-3.5 h-3.5 text-[#E2136E]" />
            <span>{lang === 'bn' ? 'English' : 'বাংলা'}</span>
          </button>
        </div>

        {/* Settings Button */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'সেটিংস' : 'Settings'}</span>
          </div>
          <span className="text-[10px] text-slate-400">Ctrl+,</span>
        </button>

        {/* Logout Button */}
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <LogOut className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'লগআউট' : 'Log Out'}</span>
          </div>
          <span className="text-[10px] opacity-75">Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ========================================================
          DESKTOP LEFT SIDEBAR NAVIGATION PANEL (For Computer Screens)
          Notice: On computer screens, there is ZERO top bar.
          Everything sits comfortably in this Left Sidebar!
          ======================================================== */}
      <aside className="no-print hidden md:flex flex-col w-64 lg:w-72 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-screen sticky top-0 overflow-y-auto z-40 transition-colors">
        {sidebarContent}
      </aside>

      {/* ========================================================
          MOBILE ONLY HEADER (Hidden on Computer Screens!)
          ======================================================== */}
      <header className="no-print md:hidden sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors shadow-2xs">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#c40e5d] to-[#E2136E] flex items-center justify-center text-white font-black text-base shadow-xs shrink-0">
              ৳
            </div>
            <div className="min-w-0">
              <span className="text-xs font-extrabold text-slate-900 dark:text-white block leading-tight truncate">
                {currentUser?.name || (lang === 'bn' ? 'মোস্তাফিজুর বিকাশ লোন' : 'bKash Loan')}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono-numbers truncate">
                {currentUser?.phone || '01907239952'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isManager && (
              <button
                type="button"
                onClick={onOpenPaymentModal}
                className="px-2.5 py-1 text-xs font-bold text-white bg-gradient-to-r from-[#c40e5d] to-[#E2136E] rounded-lg shadow-2xs cursor-pointer active:scale-95"
              >
                {lang === 'bn' ? 'কিস্তি জমা' : 'Pay'}
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl z-50">
            <div className="absolute top-3 right-3">
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
