import React, { useState, useEffect, useMemo } from 'react';
import { PaymentTransaction, LoanRecord, Language } from '../types/loan';
import { formatCurrency, toBanglaNumber } from '../utils/dateUtils';
import {
  Target,
  TrendingUp,
  Award,
  Edit3,
  Check,
  X,
  Sparkles,
  DollarSign,
  AlertCircle,
  Calendar,
} from 'lucide-react';

interface MonthlyCollectionGoalProps {
  transactions: PaymentTransaction[];
  loans: LoanRecord[];
  lang: Language;
}

const STORAGE_KEY_GOAL = 'bkash_monthly_collection_goal_target';
const DEFAULT_GOAL = 15000;

export const MonthlyCollectionGoal: React.FC<MonthlyCollectionGoalProps> = ({
  transactions,
  loans,
  lang,
}) => {
  // Total current month EMI across active loans as an automatic benchmark
  const totalCurrentMonthEmiDue = useMemo(() => {
    return loans
      .filter(l => l.status !== 'paid' && l.totalDue > 0)
      .reduce((sum, l) => sum + (l.currentMonthEmi || 0), 0);
  }, [loans]);

  // Load saved goal or fallback to reasonable target
  const [targetGoal, setTargetGoal] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GOAL);
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return totalCurrentMonthEmiDue > 0 ? Math.ceil(totalCurrentMonthEmiDue / 1000) * 1000 : DEFAULT_GOAL;
  });

  const [isEditing, setIsEditing] = useState(false);
  const [inputVal, setInputVal] = useState<string>(targetGoal.toString());

  // Save target goal to localStorage
  const handleSaveGoal = (val?: number) => {
    const goalToSave = val !== undefined ? val : parseFloat(inputVal);
    if (!isNaN(goalToSave) && goalToSave > 0) {
      setTargetGoal(goalToSave);
      setInputVal(goalToSave.toString());
      try {
        localStorage.setItem(STORAGE_KEY_GOAL, goalToSave.toString());
      } catch (e) {
        console.error(e);
      }
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setInputVal(targetGoal.toString());
    setIsEditing(false);
  };

  // Calculate actual collected payments (all transactions recorded)
  const actualCollected = useMemo(() => {
    return transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }, [transactions]);

  // Progress metrics
  const rawProgress = targetGoal > 0 ? (actualCollected / targetGoal) * 100 : 0;
  const progressPercent = Math.min(100, Math.round(rawProgress * 10) / 10);
  const isGoalAchieved = actualCollected >= targetGoal;
  const remainingToGoal = Math.max(0, targetGoal - actualCollected);
  const surplus = actualCollected > targetGoal ? actualCollected - targetGoal : 0;

  // Preset goal recommendations
  const presets = [
    { label: '৳১০,০০০', value: 10000 },
    { label: '৳১৫,০০০', value: 15000 },
    { label: '৳২০,০০০', value: 20000 },
    { label: '৳২৫,০০০', value: 25000 },
    ...(totalCurrentMonthEmiDue > 0
      ? [{ label: lang === 'bn' ? `মোট কিস্তি (৳${Math.round(totalCurrentMonthEmiDue)})` : `Full EMI`, value: Math.round(totalCurrentMonthEmiDue) }]
      : []),
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden transition-all hover:border-slate-300">
      {/* Top Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-gradient-to-tr from-[#E2136E] to-pink-500 flex items-center justify-center text-white shadow-xs">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight">
                {lang === 'bn' ? 'মাসিক কিস্তি আদায়ের লক্ষ্যমাত্রা' : 'Monthly Collection Goal'}
              </h3>
              {isGoalAchieved ? (
                <span className="text-[10px] font-semibold bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                  <Sparkles className="w-3 h-3 text-emerald-300" />
                  <span>{lang === 'bn' ? 'লক্ষ্যমাত্রা অর্জিত!' : 'Goal Achieved!'}</span>
                </span>
              ) : (
                <span className="text-[10px] font-semibold bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2 py-0.5 rounded-full">
                  {lang === 'bn' ? 'চলতি মাস' : 'Target Income'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300">
              {lang === 'bn'
                ? 'মাসিক টার্গেট নির্ধারণ করুন এবং সংগৃহীত কিস্তির সাথে প্রগ্রেস ট্র্যাক করুন'
                : 'Set your monthly income target and monitor collection progress in real time'}
            </p>
          </div>
        </div>

        {/* Edit Target Action */}
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <button
              onClick={() => {
                setInputVal(targetGoal.toString());
                setIsEditing(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors cursor-pointer shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5 text-pink-400" />
              <span>{lang === 'bn' ? 'টার্গেট পরিবর্তন করুন' : 'Change Target'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-md border border-slate-700">
              <span className="text-xs text-pink-400 pl-1 font-bold">৳</span>
              <input
                type="number"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                placeholder="Target Goal"
                className="w-24 px-2 py-1 text-xs bg-slate-900 text-white rounded border border-slate-600 focus:outline-none focus:border-pink-500 font-mono-numbers"
                autoFocus
              />
              <button
                onClick={() => handleSaveGoal()}
                className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded cursor-pointer"
                title="Save Target"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCancelEdit}
                className="p-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded cursor-pointer"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Preset Target Quick Buttons (Visible when editing) */}
      {isEditing && (
        <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] font-semibold text-slate-600">
            {lang === 'bn' ? 'দ্রুত টার্গেট নির্বাচন করুন:' : 'Quick Presets:'}
          </span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSaveGoal(p.value)}
              className="px-2 py-0.5 bg-white border border-slate-300 hover:border-[#E2136E] text-slate-700 hover:text-[#E2136E] rounded text-[11px] font-medium transition-colors cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Goal Metrics & Progress Bar Section */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* Target Goal */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[11px] font-medium text-slate-500 block">
              {lang === 'bn' ? 'নির্ধারিত লক্ষ্যমাত্রা' : 'Target Goal'}
            </span>
            <span className="text-lg font-bold text-slate-900 font-mono-numbers">
              {formatCurrency(targetGoal, lang)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {lang === 'bn' ? 'চলতি মাসের টার্গেট' : 'Monthly target'}
            </span>
          </div>

          {/* Actual Collected */}
          <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg">
            <span className="text-[11px] font-medium text-emerald-800 block">
              {lang === 'bn' ? 'আদায়কৃত কিস্তি' : 'Actual Collected'}
            </span>
            <span className="text-lg font-bold text-emerald-700 font-mono-numbers">
              {formatCurrency(actualCollected, lang)}
            </span>
            <span className="text-[10px] text-emerald-600 block mt-0.5">
              {transactions.length} {lang === 'bn' ? 'টি লেনদেন সম্পন্ন' : 'payments received'}
            </span>
          </div>

          {/* Remaining / Surplus */}
          <div
            className={`p-3 rounded-lg border ${
              isGoalAchieved
                ? 'bg-purple-50/50 border-purple-200'
                : 'bg-amber-50/50 border-amber-200'
            }`}
          >
            <span
              className={`text-[11px] font-medium block ${
                isGoalAchieved ? 'text-purple-800' : 'text-amber-800'
              }`}
            >
              {isGoalAchieved
                ? (lang === 'bn' ? 'লক্ষ্যের অতিরিক্ত জমা' : 'Surplus Collected')
                : (lang === 'bn' ? 'টার্গেট পূরণে বাকি' : 'Remaining to Target')}
            </span>
            <span
              className={`text-lg font-bold font-mono-numbers ${
                isGoalAchieved ? 'text-purple-700' : 'text-amber-700'
              }`}
            >
              {isGoalAchieved ? formatCurrency(surplus, lang) : formatCurrency(remainingToGoal, lang)}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {isGoalAchieved
                ? (lang === 'bn' ? 'টার্গেট পূরণ সম্পন্ন!' : 'Exceeded target!')
                : (lang === 'bn' ? 'আদায় প্রয়োজন' : 'Needed this month')}
            </span>
          </div>

          {/* Achievement Rate */}
          <div className="p-3 bg-pink-50/50 border border-pink-200 rounded-lg">
            <span className="text-[11px] font-medium text-[#E2136E] block">
              {lang === 'bn' ? 'অর্জিত লক্ষ্যমাত্রা' : 'Achievement Rate'}
            </span>
            <span className="text-lg font-bold text-[#E2136E] font-mono-numbers">
              {lang === 'bn' ? toBanglaNumber(rawProgress.toFixed(1)) : rawProgress.toFixed(1)}%
            </span>
            <span className="text-[10px] text-pink-700 block mt-0.5">
              {isGoalAchieved
                ? (lang === 'bn' ? '১০০% লক্ষ্য পূরণ!' : '100% Milestone Hit')
                : (lang === 'bn' ? 'প্রগ্রেস চলমান' : 'In Progress')}
            </span>
          </div>
        </div>

        {/* Visual Dual-Tone Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700">
                {lang === 'bn' ? 'টার্গেট অগ্রগতি:' : 'Progress to Goal:'}
              </span>
              <span className="font-bold text-[#E2136E] font-mono-numbers text-sm">
                {lang === 'bn' ? toBanglaNumber(progressPercent) : progressPercent}%
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono-numbers">
              {formatCurrency(actualCollected, lang)} / {formatCurrency(targetGoal, lang)}
            </div>
          </div>

          {/* Progress Track */}
          <div className="relative w-full h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                isGoalAchieved
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600'
                  : 'bg-gradient-to-r from-[#E2136E] via-pink-500 to-rose-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(progressPercent, 2))}%` }}
            />
          </div>

          {/* Progress Milestones */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono-numbers pt-0.5 px-0.5">
            <span>০%</span>
            <span>২৫%</span>
            <span>৫০%</span>
            <span>৭৫%</span>
            <span className={isGoalAchieved ? 'text-emerald-700 font-bold' : ''}>১০০% (লক্ষ্যমাত্রা)</span>
          </div>
        </div>

        {/* Motivational Banner / Status Footer */}
        {isGoalAchieved ? (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-800">
              <Award className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {lang === 'bn'
                  ? 'অভিনন্দন! আপনি চলতি মাসের কিস্তি আদায়ের নির্ধারিত লক্ষ্যমাত্রা অতিক্রম করেছেন।'
                  : 'Congratulations! You have successfully achieved your monthly collection goal.'}
              </span>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 whitespace-nowrap bg-emerald-100 px-2 py-0.5 rounded">
              +{formatCurrency(surplus, lang)}
            </span>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#E2136E] shrink-0" />
              <span>
                {lang === 'bn'
                  ? `লক্ষ্যমাত্রা পূর্ণ করতে এখনও ${formatCurrency(remainingToGoal, lang)} কিস্তি আদায় বাকি রয়েছে।`
                  : `${formatCurrency(remainingToGoal, lang)} more in loan repayments needed to reach target.`}
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              <span>{lang === 'bn' ? 'সিস্টেম স্বয়ংক্রিয় হিসাব সিঙ্ক' : 'Real-time auto sync'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
