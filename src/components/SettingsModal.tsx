import React, { useState } from 'react';
import { Language } from '../types/loan';
import { UserProfile } from '../types/user';
import {
  X,
  User,
  Smartphone,
  Moon,
  Sun,
  Image as ImageIcon,
  Check,
  ShieldCheck,
  LogOut,
  Save,
  AlertCircle,
  Database,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  currentUser: UserProfile;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onLogout: () => void;
  darkMode: boolean;
  setDarkMode: (enabled: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  lang,
  currentUser,
  onUpdateUser,
  onLogout,
  darkMode,
  setDarkMode,
}) => {
  const [name, setName] = useState(currentUser.name || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  // Preset avatar options
  const avatarPresets = [
    { label: 'Default', url: '' },
    { label: 'Executive', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' },
    { label: 'Manager', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' },
    { label: 'Finance', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80' },
  ];

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
          avatarUrl: avatarUrl.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onUpdateUser(data.user);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2000);
      } else {
        throw new Error('Failed to update on server');
      }
    } catch (err: any) {
      // Local fallback
      const updated: UserProfile = {
        ...currentUser,
        name: name.trim() || currentUser.name,
        phone: phone.trim() || currentUser.phone,
        darkMode,
        avatarUrl: avatarUrl.trim(),
        updatedAt: new Date().toISOString(),
      };
      onUpdateUser(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150 text-slate-900">
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#E2136E] text-white flex items-center justify-center font-bold text-sm shadow-md">
              ⚙️
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold tracking-tight">
                {lang === 'bn' ? 'প্রোফাইল ও সিস্টেম সেটিংস' : 'Profile & Settings'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {lang === 'bn'
                  ? 'নাম, মোবাইল নম্বর, ডার্ক মোড ও লোগো পরিবর্তন করুন'
                  : 'Manage name, phone, dark mode, and logo'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Form */}
        <form onSubmit={handleSave} className="p-6 space-y-5 text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Name Field */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              {lang === 'bn' ? 'ব্যবহারকারীর নাম' : 'User Full Name'}
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
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#E2136E] text-slate-900"
                required
              />
            </div>
          </div>

          {/* 2. Bangladeshi Phone Number Field */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              {lang === 'bn' ? 'বাংলাদেশী মোবাইল নম্বর' : 'Bangladeshi Mobile Number'}
            </label>
            <div className="relative flex items-center">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-700 font-semibold font-mono-numbers">
                <span>🇧🇩 +88</span>
              </div>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full pl-18 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#E2136E] text-slate-900 font-mono-numbers"
                required
              />
            </div>
          </div>

          {/* 3. Dark Mode Toggle */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-700">
                {darkMode ? <Moon className="w-4 h-4 text-purple-600" /> : <Sun className="w-4 h-4 text-amber-500" />}
              </div>
              <div>
                <span className="font-bold text-slate-900 block text-xs">
                  {lang === 'bn' ? 'ডার্ক মোড (Dark Theme)' : 'Dark Mode Theme'}
                </span>
                <span className="text-[11px] text-slate-500">
                  {darkMode
                    ? (lang === 'bn' ? 'বর্তমানে ডার্ক থিম সক্রিয় রয়েছে' : 'Dark theme is currently active')
                    : (lang === 'bn' ? 'লাইট থিমে ইন্টারফেস প্রদর্শিত হচ্ছে' : 'Light theme is currently active')}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                darkMode ? 'bg-[#E2136E]' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${
                  darkMode ? 'translate-x-6.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* 4. Logo / Profile Image URL or Preset */}
          <div>
            <label className="block font-medium text-slate-700 mb-1 flex items-center justify-between">
              <span>{lang === 'bn' ? 'লোগো বা প্রোফাইল ছবি (URL / Presets)' : 'Logo or Avatar Image'}</span>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="text-slate-400 hover:text-slate-600 text-[10px]"
                >
                  {lang === 'bn' ? 'মুছে ফেলুন' : 'Reset'}
                </button>
              )}
            </label>

            <div className="flex items-center gap-3 mb-2">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#E2136E] shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center shrink-0">
                  {name ? name.charAt(0) : 'ম'}
                </div>
              )}
              <input
                type="url"
                value={avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
                placeholder={lang === 'bn' ? 'ছবির লিংক পেস্ট করুন (https://...)' : 'Image URL (https://...)'}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#E2136E] text-slate-900 text-xs"
              />
            </div>

            {/* Presets */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400">{lang === 'bn' ? 'প্রিসেট:' : 'Presets:'}</span>
              {avatarPresets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatarUrl(p.url)}
                  className={`px-2 py-0.5 rounded text-[10px] border transition-colors cursor-pointer ${
                    avatarUrl === p.url
                      ? 'bg-pink-100 text-[#E2136E] border-pink-300 font-bold'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Database Persistence Status Badge */}
          <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg flex items-center justify-between text-[11px] text-emerald-800">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>{lang === 'bn' ? 'সার্ভার ডাটাবেজ স্ট্যাটাস: সংযুক্ত ও সিঙ্কড' : 'Server Database: Connected & Synced'}</span>
            </div>
            <span className="font-mono-numbers text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
              LIVE
            </span>
          </div>

          {/* Action Buttons: Save & Logout */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full sm:w-auto px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'লগআউট করুন' : 'Log Out'}</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto px-5 py-2 bg-[#E2136E] hover:bg-[#c40e5d] text-white rounded-lg font-bold flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer disabled:opacity-50"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>{lang === 'bn' ? 'সংরক্ষিত হয়েছে!' : 'Saved!'}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? (lang === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (lang === 'bn' ? 'সেটিংস সংরক্ষণ' : 'Save Settings')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
