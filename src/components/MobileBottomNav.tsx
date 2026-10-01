import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  Receipt,
  Sparkles,
  CreditCard,
  PlusCircle,
  User,
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
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1 py-1.5 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] safe-area-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {/* Dashboard */}
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors min-w-[56px] min-h-[48px] cursor-pointer ${
            activeTab === 'dashboard'
              ? 'text-[#E2136E] font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 ${activeTab === 'dashboard' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">
            {lang === 'bn' ? 'হোম' : 'Home'}
          </span>
        </button>

        {/* Borrowers */}
        <button
          type="button"
          onClick={() => setActiveTab('borrowers')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors min-w-[56px] min-h-[48px] cursor-pointer ${
            activeTab === 'borrowers'
              ? 'text-[#E2136E] font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className={`w-5 h-5 ${activeTab === 'borrowers' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">
            {lang === 'bn' ? 'গ্রাহক' : 'Borrowers'}
          </span>
        </button>

        {/* Floating Fast Pay Center Button */}
        <button
          type="button"
          onClick={onOpenPaymentModal}
          className="flex flex-col items-center justify-center -mt-4 bg-[#E2136E] active:bg-[#c40e5d] text-white p-2.5 rounded-full shadow-lg border-2 border-white min-w-[48px] min-h-[48px] cursor-pointer transition-transform active:scale-95"
          title="Record Payment"
        >
          <CreditCard className="w-5 h-5" />
          <span className="sr-only">{lang === 'bn' ? 'কিস্তি জমা' : 'Pay'}</span>
        </button>

        {/* Loans Table */}
        <button
          type="button"
          onClick={() => setActiveTab('loans')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors min-w-[56px] min-h-[48px] relative cursor-pointer ${
            activeTab === 'loans'
              ? 'text-[#E2136E] font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className={`w-5 h-5 ${activeTab === 'loans' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">
            {lang === 'bn' ? 'লোন খতিয়ান' : 'Loans'}
          </span>
          {overdueCount > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          )}
        </button>

        {/* AI Copilot Tab */}
        <button
          type="button"
          onClick={() => setActiveTab('ai')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors min-w-[56px] min-h-[48px] relative cursor-pointer ${
            activeTab === 'ai'
              ? 'text-purple-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <Sparkles className={`w-5 h-5 ${activeTab === 'ai' ? 'text-purple-600 stroke-[2.5]' : 'text-slate-500 stroke-[1.8]'}`} />
            <span className="absolute -top-1 -right-2 text-[8px] bg-gradient-to-r from-pink-500 to-purple-600 text-white font-extrabold px-1 rounded-full">
              AI
            </span>
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">
            {lang === 'bn' ? 'AI উপদেষ্টা' : 'AI Copilot'}
          </span>
        </button>

        {/* Admin Tab (if admin) */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-lg transition-colors min-w-[48px] min-h-[48px] relative cursor-pointer ${
              activeTab === 'admin'
                ? 'text-purple-900 font-bold'
                : 'text-purple-600 hover:text-purple-900'
            }`}
          >
            <span className="text-base leading-none">👑</span>
            <span className="text-[10px] mt-0.5 tracking-tight font-semibold">
              {lang === 'bn' ? 'অ্যাডমিন' : 'Admin'}
            </span>
          </button>
        )}

        {/* User Profile Tab */}
        <button
          type="button"
          onClick={() => {
            if (onOpenProfile) onOpenProfile();
            else setActiveTab('profile');
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors min-w-[50px] min-h-[48px] cursor-pointer ${
            activeTab === 'profile'
              ? 'text-[#E2136E] font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className={`w-5 h-5 ${activeTab === 'profile' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight font-semibold">
            {lang === 'bn' ? 'প্রোফাইল' : 'Profile'}
          </span>
        </button>
      </div>
    </div>
  );
};
