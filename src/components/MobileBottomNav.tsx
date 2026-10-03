import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  CreditCard,
  User,
  Sparkles,
} from 'lucide-react';
import { Language } from '../types/loan';

interface MobileBottomNavProps {
  activeTab: 'dashboard' | 'borrowers' | 'loans' | 'ledger' | 'report' | 'ai' | 'admin' | 'profile';
  setActiveTab: (tab: 'dashboard' | 'borrowers' | 'loans' | 'ledger' | 'report' | 'ai' | 'admin' | 'profile') => void;
  lang: Language;
  onOpenPaymentModal: () => void;
  overdueCount?: number;
  isAdmin?: boolean;
  onOpenProfile?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  lang,
  onOpenPaymentModal,
  overdueCount = 0,
  isAdmin = false,
  onOpenProfile,
}) => {
  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 shadow-[0_-8px_25px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_25px_rgba(0,0,0,0.4)] safe-area-bottom select-none"
    >
      <div className="relative max-w-md mx-auto px-2 py-1.5 flex items-center justify-between">
        {/* 1. Home / Dashboard */}
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-200 active:scale-90 cursor-pointer ${
            activeTab === 'dashboard'
              ? 'text-[#E2136E] font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <LayoutDashboard className={`w-5 h-5 transition-transform duration-200 ${
              activeTab === 'dashboard' ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
            }`} />
            {activeTab === 'dashboard' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#E2136E] animate-pulse" />
            )}
          </div>
          <span className="text-[10px] mt-1 font-medium tracking-tight">
            {lang === 'bn' ? 'হোম' : 'Home'}
          </span>
        </button>

        {/* 2. Borrowers (গ্রাহক) */}
        <button
          type="button"
          onClick={() => setActiveTab('borrowers')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-200 active:scale-90 cursor-pointer ${
            activeTab === 'borrowers'
              ? 'text-[#E2136E] font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Users className={`w-5 h-5 transition-transform duration-200 ${
              activeTab === 'borrowers' ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
            }`} />
            {activeTab === 'borrowers' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#E2136E] animate-pulse" />
            )}
          </div>
          <span className="text-[10px] mt-1 font-medium tracking-tight">
            {lang === 'bn' ? 'গ্রাহক' : 'Borrowers'}
          </span>
        </button>

        {/* 3. MIDDLE: Elevated Floating Record Payment CTA with Animated Glow */}
        <div className="flex-1 flex flex-col items-center justify-center -mt-6 relative z-10">
          <button
            type="button"
            onClick={onOpenPaymentModal}
            className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-[#c40e5d] via-[#E2136E] to-pink-500 text-white shadow-[0_6px_20px_rgba(226,19,110,0.45)] border-4 border-white dark:border-slate-900 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-90"
            title={lang === 'bn' ? 'কিস্তি জমা দিন (Record Payment)' : 'Record Payment'}
          >
            {/* Pulsing ring animation */}
            <span className="absolute inset-0 rounded-full bg-[#E2136E] opacity-40 animate-ping pointer-events-none -z-10" />

            {/* Glowing gradient background */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-pink-600 to-[#E2136E] opacity-90 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10 flex flex-col items-center justify-center">
              <CreditCard className="w-6 h-6 text-white stroke-[2.2] transition-transform duration-300 group-hover:rotate-12 group-active:scale-95" />
            </div>
          </button>
          <span className="text-[10px] mt-1 font-bold text-[#E2136E] tracking-tight">
            {lang === 'bn' ? 'কিস্তি জমা' : 'Pay'}
          </span>
        </div>

        {/* 4. Loans Ledger (লোন খতিয়ান) */}
        <button
          type="button"
          onClick={() => setActiveTab('loans')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-200 active:scale-90 cursor-pointer ${
            activeTab === 'loans'
              ? 'text-[#E2136E] font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <FileSpreadsheet className={`w-5 h-5 transition-transform duration-200 ${
              activeTab === 'loans' ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
            }`} />
            {overdueCount > 0 && (
              <span className="absolute -top-1 -right-2 w-2.5 h-2.5 bg-rose-500 border-2 border-white dark:border-slate-900 rounded-full animate-bounce" />
            )}
            {activeTab === 'loans' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#E2136E] animate-pulse" />
            )}
          </div>
          <span className="text-[10px] mt-1 font-medium tracking-tight">
            {lang === 'bn' ? 'লোন খতিয়ান' : 'Loans'}
          </span>
        </button>

        {/* 5. User Profile (প্রোফাইল) */}
        <button
          type="button"
          onClick={() => {
            if (onOpenProfile) onOpenProfile();
            else setActiveTab('profile');
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-200 active:scale-90 cursor-pointer ${
            activeTab === 'profile'
              ? 'text-[#E2136E] font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <User className={`w-5 h-5 transition-transform duration-200 ${
              activeTab === 'profile' ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
            }`} />
            {isAdmin && (
              <span className="absolute -top-1.5 -right-2 text-[9px] bg-purple-600 text-white rounded-full px-1 leading-tight font-extrabold shadow-xs">
                👑
              </span>
            )}
            {activeTab === 'profile' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#E2136E] animate-pulse" />
            )}
          </div>
          <span className="text-[10px] mt-1 font-medium tracking-tight">
            {lang === 'bn' ? 'প্রোফাইল' : 'Profile'}
          </span>
        </button>
      </div>
    </nav>
  );
};
