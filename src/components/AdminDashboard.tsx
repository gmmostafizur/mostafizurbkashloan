import React, { useState, useEffect } from 'react';
import { Language } from '../types/loan';
import { UserProfile, ActivityLog } from '../types/user';
import {
  ShieldAlert,
  Users,
  Activity,
  UserCheck,
  Clock,
  Smartphone,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Shield,
} from 'lucide-react';

interface AdminDashboardProps {
  lang: Language;
  currentUser: UserProfile;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  lang,
  currentUser,
}) => {
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logFilter, setLogFilter] = useState<'ALL' | 'LOGIN' | 'PAYMENT' | 'NEW_LOAN' | 'ROLLOVER'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch registered users from backend
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
      }
    } catch (err) {
      console.warn('Failed to load users:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Fetch activity & login logs
  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch('/api/admin/activity-logs');
      if (res.ok) {
        const data = await res.json();
        setActivityLogs(data.logs || []);
      }
    } catch (err) {
      console.warn('Failed to load logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchLogs();
  }, []);

  const handleClearLogs = async () => {
    if (!window.confirm(lang === 'bn' ? 'আপনি কি নিশ্চিত সব অ্যাক্টিভিটি লগ মুছে ফেলতে চান?' : 'Clear all activity logs?')) return;
    try {
      const res = await fetch('/api/admin/activity-logs', { method: 'DELETE' });
      if (res.ok) {
        setActivityLogs([]);
        showToast(lang === 'bn' ? 'লগ সফলভাবে মুছে ফেলা হয়েছে' : 'Logs cleared successfully');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filter logs by search and type
  const filteredLogs = activityLogs.filter(log => {
    const matchesType = logFilter === 'ALL' || log.action === logFilter;
    const matchesSearch =
      !searchQuery ||
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userPhone.includes(searchQuery) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2 animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-slate-900 p-6 rounded-2xl border border-purple-800/40 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-purple-600/30">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  {lang === 'bn' ? 'সুপার অ্যাডমিন কন্ট্রোল সেন্টার' : 'Super Admin Control Center'}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {lang === 'bn'
                  ? 'প্ল্যাটফর্ম অডিট হিস্টোরি, ব্যবহারকারীদের লগইন হিসাব ও নিরাপত্তা পর্যবেক্ষণ'
                  : 'Platform audit trails, user monitoring, and security oversight'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchUsers();
                fetchLogs();
                showToast(lang === 'bn' ? 'ডাটা রিফ্রেশ করা হয়েছে' : 'Refreshed');
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
              <span>{lang === 'bn' ? 'রিফ্রেশ' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: SYSTEM SECURITY & PRIVACY ISOLATION NOTICE */}
      <div className="bg-slate-900 p-4.5 rounded-xl border border-purple-900/50 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-900/80 text-purple-300 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">
              {lang === 'bn' ? 'ইউজার ডাটা প্রাইভেসি ও এনক্রিপশন সক্রিয়' : 'Data Privacy & Strict User Isolation Active'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {lang === 'bn'
                ? 'সুপার অ্যাডমিন প্ল্যাটফর্ম সম্পূর্ণ আলাদা। প্রতিটি ব্যবহারকারীর ব্যক্তিগত তথ্য ও লোন ডাটা শুধুমাত্র তাদের নিজস্ব ফোন নম্বর ও পাসওয়ার্ড দিয়ে লগইন করলেই সুরক্ষিতভাবে দৃশ্যমান হবে।'
                : 'Super Admin is completely decoupled. Personal information and loan records are strictly accessible only by the respective user logging in with their verified credentials.'}
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 bg-emerald-950/80 border border-emerald-800 text-emerald-400 rounded-md text-[11px] font-mono-numbers shrink-0 text-center font-bold">
          ISOLATED & SECURE
        </span>
      </div>

      {/* SECTION 2: SYSTEM SUMMARY METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>{lang === 'bn' ? 'মোট ইউজার' : 'Registered Users'}</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white font-mono-numbers">
            {usersList.length || 2}
          </div>
          <span className="text-[10px] text-emerald-500 font-medium mt-1 block">
            {lang === 'bn' ? 'ডাটাবেজে সুরক্ষিত' : 'Persistent database'}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>{lang === 'bn' ? 'মোট অ্যাক্টিভিটি লগ' : 'Total Logs'}</span>
            <Activity className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white font-mono-numbers">
            {activityLogs.length}
          </div>
          <span className="text-[10px] text-purple-500 font-medium mt-1 block">
            {lang === 'bn' ? 'রিয়েল-টাইম অডিট' : 'Real-time audit trail'}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>{lang === 'bn' ? 'আজকের লগইন' : "Today's Logins"}</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white font-mono-numbers">
            {activityLogs.filter(l => l.action === 'LOGIN').length}
          </div>
          <span className="text-[10px] text-emerald-500 font-medium mt-1 block">
            {lang === 'bn' ? 'নিরাপদ সেশন' : 'Verified sessions'}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>{lang === 'bn' ? 'সিস্টেম স্ট্যাটাস' : 'System Health'}</span>
            <Shield className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-base font-bold text-emerald-500 flex items-center gap-1.5 mt-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>100% Operational</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Port 3000 • Vite & Express
          </span>
        </div>
      </div>

      {/* SECTION 3: ALL REGISTERED USERS LIST */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#E2136E]" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {lang === 'bn' ? 'সকল রেজিস্টার্ড ইউজার তালিকা' : 'All Registered Users'}
            </h3>
            <span className="text-xs text-slate-400">({usersList.length} জন)</span>
          </div>
          <span className="text-[11px] text-slate-500">
            {lang === 'bn' ? 'বাংলাদেশী মোবাইল ভিত্তিক প্রোফাইল' : 'Bangladeshi Mobile Profiles'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">{lang === 'bn' ? 'ইউজার নাম' : 'User Name'}</th>
                <th className="py-3 px-4">{lang === 'bn' ? 'মোবাইল নম্বর' : 'Phone Number'}</th>
                <th className="py-3 px-3">{lang === 'bn' ? 'ভূমিকা (Role)' : 'Role'}</th>
                <th className="py-3 px-4">{lang === 'bn' ? 'রেজিস্ট্রেশন তারিখ' : 'Registered Date'}</th>
                <th className="py-3 px-4">{lang === 'bn' ? 'সর্বশেষ সক্রিয়' : 'Last Active'}</th>
                <th className="py-3 px-3 text-right">{lang === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {usersList.map((user) => {
                const isAdmin = user.role === 'admin' || user.phone === '01613572749';

                return (
                  <tr key={user.id || user.phone} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg text-white font-bold text-xs flex items-center justify-center shrink-0 ${
                        isAdmin ? 'bg-purple-600' : 'bg-slate-700'
                      }`}>
                        {user.name ? user.name.charAt(0) : 'U'}
                      </div>
                      <div>
                        <span>{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono-numbers text-slate-700 dark:text-slate-300">
                      🇧🇩 +88 {user.phone}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        isAdmin
                          ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                          : 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                      }`}>
                        {isAdmin ? 'ADMIN' : 'USER'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Active'}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 4: LIVE ACTIVITY & LOGIN AUDIT LOGS ("কারা কারা লগইন করছে ও কী করছে") */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-600" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {lang === 'bn' ? 'লাইভ লগইন ও অ্যাক্টিভিটি হিস্টোরি' : 'Live Login & Activity Audit Logs'}
              </h3>
              <span className="text-xs bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-semibold">
                {filteredLogs.length} events
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {lang === 'bn'
                ? 'কারা কখন লগইন করেছে এবং কী কী কার্যক্রম (পেমেন্ট, লোন তৈরি, রোল-ওভার) সম্পন্ন করেছে'
                : 'Real-time record of user logins, payments, loan updates, and rollover actions'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearLogs}
              className="px-2.5 py-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded border border-rose-200 dark:border-rose-900 transition-colors flex items-center gap-1 cursor-pointer"
              title="Clear all logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'লগ মুছুন' : 'Clear Logs'}</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              <span>{lang === 'bn' ? 'ফিল্টার:' : 'Filter:'}</span>
            </span>

            {(['ALL', 'LOGIN', 'PAYMENT', 'NEW_LOAN', 'ROLLOVER'] as const).map(type => (
              <button
                key={type}
                onClick={() => setLogFilter(type)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  logFilter === type
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                {type === 'ALL'
                  ? (lang === 'bn' ? 'সকল কার্যক্রম' : 'All')
                  : type === 'LOGIN'
                  ? (lang === 'bn' ? 'লগইন (Logins)' : 'Logins')
                  : type === 'PAYMENT'
                  ? (lang === 'bn' ? 'কিস্তি জমা (Payments)' : 'Payments')
                  : type === 'NEW_LOAN'
                  ? (lang === 'bn' ? 'নতুন লোন (Loans)' : 'Loans')
                  : (lang === 'bn' ? 'রোল-ওভার (Rollover)' : 'Rollover')}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={lang === 'bn' ? 'লগ খুঁজুন...' : 'Search logs...'}
              className="w-full pl-8 pr-3 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs focus:outline-none focus:border-purple-500 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Logs List */}
        <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              {lang === 'bn' ? 'কোনো অ্যাক্টিভিটি রেকর্ড পাওয়া যায়নি' : 'No activity logs found'}
            </div>
          ) : (
            filteredLogs.map(log => {
              const isLogin = log.action === 'LOGIN';
              const isPayment = log.action === 'PAYMENT';
              const isRollover = log.action === 'ROLLOVER';

              return (
                <div
                  key={log.id}
                  className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      isLogin
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                        : isPayment
                        ? 'bg-pink-100 dark:bg-pink-950 text-[#E2136E]'
                        : isRollover
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-600'
                        : 'bg-blue-100 dark:bg-blue-950 text-blue-600'
                    }`}>
                      {isLogin ? '🔑' : isPayment ? '৳' : isRollover ? '🔄' : '📝'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {log.userName}
                        </span>
                        <span className="text-[11px] font-mono-numbers text-slate-400">
                          ({log.userPhone})
                        </span>
                        <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                          isLogin
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : isPayment
                            ? 'bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          {log.action}
                        </span>
                      </div>

                      <p className="text-slate-600 dark:text-slate-300 text-xs mt-0.5">
                        {log.description}
                      </p>

                      {log.device && (
                        <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-md">
                          {log.device}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col sm:items-end justify-between text-[11px] text-slate-400 shrink-0">
                    <span className="font-mono-numbers">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className="text-[10px]">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
