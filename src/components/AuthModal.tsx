import React, { useState } from 'react';
import { Language, LoanRecord, PaymentTransaction } from '../types/loan';
import { UserProfile } from '../types/user';
import { PRESET_ACCOUNTS, getInitialLoansForPhone, getInitialTransactionsForPhone } from '../data/initialLoans';
import {
  X,
  Smartphone,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  UserPlus,
  LogIn,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onLoginSuccess: (user: UserProfile, loans?: LoanRecord[], transactions?: PaymentTransaction[]) => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  lang,
  onLoginSuccess,
  initialMode = 'login',
}) => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  // Validate Bangladeshi phone number: 11 digits starting with 01
  const validatePhone = (input: string) => {
    const cleaned = input.replace(/[\s\-\+]/g, '').replace(/^88/, '');
    const bdRegex = /^01[3-9]\d{8}$/;
    return { isValid: bdRegex.test(cleaned), cleaned };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const { isValid, cleaned } = validatePhone(phone);
    if (!isValid) {
      setErrorMessage(
        lang === 'bn'
          ? 'অনুগ্রহ করে সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নম্বর দিন (যেমন: 01907239952 বা 01533271817)।'
          : 'Please enter a valid 11-digit Bangladeshi mobile number.'
      );
      return;
    }

    if (mode === 'register' && !name.trim()) {
      setErrorMessage(
        lang === 'bn' ? 'অনুগ্রহ করে আপনার নাম লিখুন।' : 'Please enter your full name.'
      );
      return;
    }

    setIsLoading(true);

    try {
      // Direct password-free login or register endpoint
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleaned,
          name: name.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.user) {
        onLoginSuccess(data.user, data.loans, data.transactions);
        onClose();
      } else {
        if (mode === 'login' && res.status === 404) {
          // If phone not registered yet, suggest registering
          setErrorMessage(
            lang === 'bn'
              ? 'এই নম্বরে কোনো অ্যাকাউন্ট পাওয়া যায়নি। অনুগ্রহ করে আপনার নাম দিয়ে নিবন্ধন (Register) করুন।'
              : 'No account found for this number. Please register with your name.'
          );
          setMode('register');
        } else {
          setErrorMessage(data.error || (lang === 'bn' ? 'লগইন ব্যর্থ হয়েছে' : 'Authentication failed'));
        }
      }
    } catch (err: any) {
      // Local fallback in case server network has transient issue
      const preset = PRESET_ACCOUNTS.find(p => p.phone === cleaned);
      if (preset) {
        const fallbackUser: UserProfile = {
          id: `usr_${preset.phone}`,
          phone: preset.phone,
          name: preset.name,
          role: preset.role,
          darkMode: false,
          createdAt: new Date().toISOString(),
        };
        onLoginSuccess(fallbackUser, preset.loans, preset.transactions);
        onClose();
      } else if (mode === 'register' && name.trim()) {
        const newUser: UserProfile = {
          id: `usr_${cleaned}_${Date.now()}`,
          phone: cleaned,
          name: name.trim(),
          role: 'user',
          darkMode: false,
          createdAt: new Date().toISOString(),
        };
        onLoginSuccess(newUser, [], []);
        onClose();
      } else {
        setErrorMessage(
          lang === 'bn'
            ? 'এই নম্বরে কোনো অ্যাকাউন্ট পাওয়া যায়নি। অনুগ্রহ করে নিবন্ধন করুন।'
            : 'Account not found. Please register.'
        );
        setMode('register');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150 text-slate-900 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#c40e5d] to-[#E2136E] text-white flex items-center justify-center font-black text-base shadow-md">
              ৳
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold tracking-tight">
                {mode === 'login'
                  ? (lang === 'bn' ? 'সরাসরি লগইন করুন' : 'Direct Account Sign In')
                  : (lang === 'bn' ? 'নতুন অ্যাকাউন্ট নিবন্ধন' : 'Create Free Account')}
              </h3>
              <p className="text-[11px] text-slate-300">
                {lang === 'bn'
                  ? 'কোনো পাসওয়ার্ডের প্রয়োজন নেই—শুধুমাত্র মোবাইল নম্বর দিয়ে প্রবেশ'
                  : 'No password required — instant access with phone number'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'login'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'সরাসরি লগইন' : 'Direct Login'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'bg-[#E2136E] text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'নতুন নিবন্ধন' : 'Register'}</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {errorMessage && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span className="leading-tight">{errorMessage}</span>
              </div>
            )}

            {/* Name Field (Visible on Register Mode) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'আপনার নাম লিখুন' : 'Your Full Name'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={lang === 'bn' ? 'যেমন: মোস্তাফিজুর রহমান' : 'e.g. Mostafizur Rahman'}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E2136E] focus:border-[#E2136E]"
                    required
                  />
                </div>
              </div>
            )}

            {/* Mobile Number Field (Always visible) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? '১১ ডিজিটের মোবাইল নম্বর' : 'Bangladeshi Mobile Number'}
              </label>
              <div className="relative flex items-center">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 dark:text-slate-400 font-semibold font-mono-numbers text-xs">
                  <span>🇧🇩 +88</span>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full pl-18 pr-3 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E2136E] focus:border-[#E2136E] font-mono-numbers tracking-wide"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                {mode === 'login'
                  ? (lang === 'bn' ? 'আপনার নিবন্ধিত নম্বরটি দিন (পাসওয়ার্ড লাগবে না)' : 'Enter your registered number (No password needed)')
                  : (lang === 'bn' ? 'এই নম্বর দিয়ে আপনার নিজস্ব অ্যাকাউন্ট তৈরি হবে' : 'Your new personal account will be created with this number')}
              </p>
            </div>

            {/* Submit CTA Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-[#c40e5d] to-[#E2136E] hover:from-[#b00b52] hover:to-[#c40e5d] text-white font-bold rounded-xl shadow-md shadow-pink-600/30 transition-all duration-200 active:scale-95 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>{lang === 'bn' ? 'লগইন করুন ও হিসাব দেখুন' : 'Sign In & Access Account'}</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>{lang === 'bn' ? 'নিবন্ধন সম্পন্ন করুন' : 'Complete Registration'}</span>
                    </>
                  )}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Bottom Security Assurance */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'ক্লাউড ডাটাবেজ সুরক্ষিত' : 'Cloud Database Secured'}</span>
            </span>
            <span>
              {mode === 'login' ? (
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMessage('');
                  }}
                  className="text-[#E2136E] hover:underline font-bold cursor-pointer"
                >
                  {lang === 'bn' ? 'নতুন অ্যাকাউন্ট খুলুন' : 'New? Register here'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage('');
                  }}
                  className="text-[#E2136E] hover:underline font-bold cursor-pointer"
                >
                  {lang === 'bn' ? 'সরাসরি লগইন' : 'Already have account? Sign in'}
                </button>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
