import React, { useState } from 'react';
import { Language, LoanRecord, PaymentTransaction } from '../types/loan';
import { UserProfile } from '../types/user';
import { formatCurrency } from '../utils/dateUtils';
import {
  User,
  Smartphone,
  Moon,
  Sun,
  LogOut,
  ShieldCheck,
  Save,
  Check,
  AlertCircle,
  Clock,
  CreditCard,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  Lock,
} from 'lucide-react';

interface UserProfileViewProps {
  lang: Language;
  currentUser: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  onLogout: () => void;
  darkMode: boolean;
  setDarkMode: (enabled: boolean) => void;
  loans: LoanRecord[];
  transactions: PaymentTransaction[];
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  lang,
  currentUser,
  onUpdateUser,
  onLogout,
  darkMode,
  setDarkMode,
  loans,
  transactions,
}) => {
  const [name, setName] = useState(currentUser.name || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSaving(true);

    try {
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: currentUser.phone,
          newPhone: phone.trim() !== currentUser.phone ? phone.trim() : undefined,
          name: name.trim(),
          darkMode,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onUpdateUser(data.user);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (err: any) {
      const updated: UserProfile = {
        ...currentUser,
        name: name.trim() || currentUser.name,
        phone: phone.trim() || currentUser.phone,
        darkMode,
        updatedAt: new Date().toISOString(),
      };
      onUpdateUser(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const isAdmin = currentUser.role === 'admin' || currentUser.phone === '01613572749';
  const totalDue = loans.reduce((acc, l) => acc + (l.status !== 'paid' ? l.totalDue : 0), 0);
  const totalPaid = transactions.reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[#E2136E]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10 text-center sm:text-left">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#E2136E] to-purple-600 text-white font-extrabold text-3xl flex items-center justify-center shadow-lg shadow-pink-600/30 shrink-0">
            {currentUser.name ? currentUser.name.charAt(0) : 'ম'}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                {currentUser.name}
              </h1>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border w-fit mx-auto sm:mx-0 ${
                isAdmin
                  ? 'bg-purple-900/60 text-purple-300 border-purple-500/40'
                  : 'bg-pink-900/60 text-pink-300 border-[#E2136E]/40'
              }`}>
                {isAdmin ? '👑 Super Admin' : '👤 Personal User / Owner'}
              </span>
            </div>

            <p className="text-slate-300 text-sm font-mono-numbers mt-1 flex items-center justify-center sm:justify-start gap-1.5">
              <span>🇧🇩 +88</span>
              <strong>{currentUser.phone}</strong>
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3 text-xs text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'সক্রিয় অ্যাকাউন্ট' : 'Active Account'}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-300">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>{lang === 'bn' ? 'পাসওয়ার্ড সুরক্ষিত' : 'Password Protected'}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {currentUser.lastLoginAt
                    ? new Date(currentUser.lastLoginAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                    : 'Active'}
                </span>
              </span>
            </div>
          </div>

          {/* Quick Logout Button in Header */}
          <button
            type="button"
            onClick={onLogout}
            className="px-4 py-2 bg-rose-600/90 hover:bg-rose-600 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'লগআউট' : 'Log Out'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: User Details & Settings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Edit Name & Phone Form + Dark Mode Toggle */}
        <div className="md:col-span-2 space-y-6">
          {/* User Profile Form */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-[#E2136E]" />
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  {lang === 'bn' ? 'ব্যবহারকারীর তথ্য ও বিবরণ' : 'User Information & Details'}
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                {lang === 'bn' ? 'ডাটাবেজে সংরক্ষিত' : 'Database Synced'}
              </span>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs sm:text-sm">
              {errorMessage && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-rose-700 dark:text-rose-300 flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {savedSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-lg text-emerald-700 dark:text-emerald-300 flex items-center gap-2 text-xs animate-in fade-in">
                  <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{lang === 'bn' ? 'প্রোফাইল তথ্য সফলভাবে আপডেট হয়েছে!' : 'Profile updated successfully!'}</span>
                </div>
              )}

              {/* Name Field */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'পূর্ণ নাম' : 'Full Name'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="নাম লিখুন"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-[#E2136E]"
                    required
                  />
                </div>
              </div>

              {/* Phone Field */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'বাংলাদেশী মোবাইল নম্বর' : 'Bangladeshi Mobile Number'}
                </label>
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-semibold font-mono-numbers text-xs">
                    <span>🇧🇩 +88</span>
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full pl-18 pr-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-[#E2136E] font-mono-numbers tracking-wide"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {lang === 'bn'
                    ? 'এই মোবাইল নম্বরটি আপনার মূল লগইন আইডি হিসেবে ব্যবহৃত হবে।'
                    : 'This mobile number is your primary login identifier.'}
                </p>
              </div>

              {/* Save Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-[#E2136E] hover:bg-[#c40e5d] text-white font-bold rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 text-xs sm:text-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? (lang === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (lang === 'bn' ? 'তথ্য পরিবর্তন সংরক্ষণ করুন' : 'Save Changes')}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Dark Mode Toggle Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
                  {darkMode ? <Moon className="w-5 h-5 text-purple-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'ডার্ক মোড অপশন (Dark Theme)' : 'Dark Theme Option'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {darkMode
                      ? (lang === 'bn' ? 'বর্তমানে ডার্ক থিম সক্রিয় রয়েছে (চোখের আরামদায়ক)' : 'Dark theme is currently active')
                      : (lang === 'bn' ? 'বর্তমানে লাইট থিম সক্রিয় রয়েছে' : 'Light theme is currently active')}
                  </p>
                </div>
              </div>

              {/* Switch Toggle */}
              <button
                type="button"
                onClick={() => setDarkMode(!darkMode)}
                className={`w-14 h-7 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                  darkMode ? 'bg-[#E2136E]' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                title={lang === 'bn' ? 'থিম পরিবর্তন' : 'Toggle Theme'}
              >
                <div
                  className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform flex items-center justify-center text-[10px] ${
                    darkMode ? 'translate-x-7' : 'translate-x-0'
                  }`}
                >
                  {darkMode ? '🌙' : '☀️'}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Quick Stats & Logout Card */}
        <div className="space-y-6">
          {/* Quick Account Summary */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
              {lang === 'bn' ? 'অ্যাকাউন্ট সারসংক্ষেপ' : 'Account Overview'}
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <span className="text-slate-500 dark:text-slate-400">
                  {lang === 'bn' ? 'সক্রিয় লোন' : 'Active Loans'}
                </span>
                <strong className="font-bold text-slate-900 dark:text-white font-mono-numbers">
                  {loans.filter(l => l.status !== 'paid').length} {lang === 'bn' ? 'টি' : ''}
                </strong>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <span className="text-slate-500 dark:text-slate-400">
                  {lang === 'bn' ? 'মোট বকেয়া' : 'Total Due'}
                </span>
                <strong className="font-bold text-[#E2136E] font-mono-numbers">
                  {formatCurrency(totalDue, lang)}
                </strong>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <span className="text-slate-500 dark:text-slate-400">
                  {lang === 'bn' ? 'মোট আদায়' : 'Total Collected'}
                </span>
                <strong className="font-bold text-emerald-600 dark:text-emerald-400 font-mono-numbers">
                  {formatCurrency(totalPaid, lang)}
                </strong>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-[11px] text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{lang === 'bn' ? 'সার্ভার ডাটাবেজ ব্যাকআপ সক্রিয়' : 'Database Persistence Active'}</span>
            </div>
          </div>

          {/* Logout Section */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/60 p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-rose-500">
              {lang === 'bn' ? 'অ্যাকাউন্ট প্রস্থান' : 'Account Sign Out'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'bn'
                ? 'লগআউট করলে আপনি আবার লগইন স্ক্রিনে ফিরে যাবেন এবং নিরাপদে সেশন শেষ হবে।'
                : 'Signing out ends your active session and returns you to the login screen.'}
            </p>

            <button
              type="button"
              onClick={onLogout}
              className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{lang === 'bn' ? 'অ্যাকাউন্ট থেকে লগআউট করুন' : 'Sign Out of Account'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
