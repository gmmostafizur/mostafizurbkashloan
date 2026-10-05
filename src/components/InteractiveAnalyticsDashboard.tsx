import React, { useState, useMemo } from 'react';
import { LoanRecord, PaymentTransaction, Language } from '../types/loan';
import { formatCurrency, isDateOverdue, getDaysRemaining, toBanglaNumber } from '../utils/dateUtils';
import {
  PieChart as PieChartIcon,
  BarChart3,
  LayoutGrid,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  X,
  CreditCard,
  FileText,
  User,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  ShieldAlert,
  Layers,
  ArrowUpRight,
  Info,
} from 'lucide-react';

interface InteractiveAnalyticsDashboardProps {
  loans: LoanRecord[];
  transactions: PaymentTransaction[];
  lang: Language;
  onPayLoan: (loan: LoanRecord, fullSettlement?: boolean) => void;
  onViewReceipt: (loan: LoanRecord) => void;
  onSelectBorrowerFilter: (borrowerName: string) => void;
  isReadOnly?: boolean;
}

type AnalyticsViewMode = 'status_donut' | 'cashflow_bars' | 'borrower_map' | 'risk_clusters';

interface DrillDownState {
  title: string;
  subtitle: string;
  badgeText: string;
  badgeColor: string;
  loans: LoanRecord[];
}

export const InteractiveAnalyticsDashboard: React.FC<InteractiveAnalyticsDashboardProps> = ({
  loans,
  transactions,
  lang,
  onPayLoan,
  onViewReceipt,
  onSelectBorrowerFilter,
  isReadOnly = false,
}) => {
  const [activeView, setActiveView] = useState<AnalyticsViewMode>('status_donut');
  const [drillDown, setDrillDown] = useState<DrillDownState | null>(null);
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  // Status segmentation counts & loans
  const statusData = useMemo(() => {
    const activeOnTime: LoanRecord[] = [];
    const dueSoon: LoanRecord[] = [];
    const overdue: LoanRecord[] = [];
    const paid: LoanRecord[] = [];

    loans.forEach(loan => {
      const isSettled = loan.totalDue <= 0 || loan.status === 'paid';
      const isOver = isDateOverdue(loan.nextLoanSubmitDate);
      const days = getDaysRemaining(loan.nextLoanSubmitDate);

      if (isSettled) {
        paid.push(loan);
      } else if (isOver) {
        overdue.push(loan);
      } else if (days >= 0 && days <= 14) {
        dueSoon.push(loan);
      } else {
        activeOnTime.push(loan);
      }
    });

    const totalActiveDues = loans
      .filter(l => l.totalDue > 0 && l.status !== 'paid')
      .reduce((sum, l) => sum + l.totalDue, 0);

    const totalPrincipal = loans.reduce((sum, l) => sum + l.totalPrincipalLoan, 0);
    const totalCollected = transactions.reduce((sum, tx) => sum + tx.amount, 0);

    return {
      activeOnTime,
      dueSoon,
      overdue,
      paid,
      totalLoans: loans.length,
      totalActiveDues,
      totalPrincipal,
      totalCollected,
    };
  }, [loans, transactions]);

  // Cash flow EMIs across months
  const cashflowData = useMemo(() => {
    const active = loans.filter(l => l.totalDue > 0 && l.status !== 'paid');
    const emi1 = active.reduce((s, l) => s + (l.currentMonthEmi || 0), 0);
    const emi2 = active.reduce((s, l) => s + (l.secondMonthEmi || 0), 0);
    const emi3 = active.reduce((s, l) => s + (l.thirdMonthEmi || 0), 0);
    const collected = transactions.reduce((s, t) => s + t.amount, 0);
    const maxVal = Math.max(emi1, emi2, emi3, collected, 1);

    return {
      emi1,
      emi2,
      emi3,
      collected,
      maxVal,
      activeLoans: active,
    };
  }, [loans, transactions]);

  // Borrower map aggregation
  const borrowerData = useMemo(() => {
    const map = new Map<string, LoanRecord[]>();
    loans.forEach(l => {
      const arr = map.get(l.personName) || [];
      arr.push(l);
      map.set(l.personName, arr);
    });

    return Array.from(map.entries()).map(([name, bLoans]) => {
      const totalDue = bLoans.reduce((s, l) => s + (l.status !== 'paid' ? l.totalDue : 0), 0);
      const totalPrincipal = bLoans.reduce((s, l) => s + l.totalPrincipalLoan, 0);
      const hasOverdue = bLoans.some(l => l.status !== 'paid' && isDateOverdue(l.nextLoanSubmitDate));
      const hasDueSoon = bLoans.some(l => {
        const days = getDaysRemaining(l.nextLoanSubmitDate);
        return l.status !== 'paid' && days >= 0 && days <= 14;
      });
      const allPaid = bLoans.every(l => l.status === 'paid' || l.totalDue <= 0);

      let riskCategory: 'overdue' | 'due_soon' | 'active' | 'paid' = 'active';
      if (allPaid) riskCategory = 'paid';
      else if (hasOverdue) riskCategory = 'overdue';
      else if (hasDueSoon) riskCategory = 'due_soon';

      return {
        name,
        loans: bLoans,
        totalDue,
        totalPrincipal,
        loanCount: bLoans.length,
        riskCategory,
      };
    }).sort((a, b) => b.totalDue - a.totalDue);
  }, [loans]);

  // Risk clusters based on days remaining
  const riskClusters = useMemo(() => {
    const overdue: LoanRecord[] = [];
    const urgent7: LoanRecord[] = [];
    const upcoming15: LoanRecord[] = [];
    const safeLater: LoanRecord[] = [];

    loans.forEach(l => {
      if (l.totalDue <= 0 || l.status === 'paid') return;
      const days = getDaysRemaining(l.nextLoanSubmitDate);
      if (isDateOverdue(l.nextLoanSubmitDate)) {
        overdue.push(l);
      } else if (days <= 7) {
        urgent7.push(l);
      } else if (days <= 15) {
        upcoming15.push(l);
      } else {
        safeLater.push(l);
      }
    });

    return {
      overdue,
      urgent7,
      upcoming15,
      safeLater,
    };
  }, [loans]);

  // Donut chart calculations
  const donutSegments = useMemo(() => {
    const total = statusData.totalLoans || 1;
    const slices = [
      {
        id: 'overdue',
        label: lang === 'bn' ? 'মেয়াদোত্তীর্ণ কিস্তি' : 'Overdue',
        count: statusData.overdue.length,
        color: '#e11d48', // rose-600
        bgColor: 'bg-rose-600',
        textColor: 'text-rose-600',
        loans: statusData.overdue,
        dueAmount: statusData.overdue.reduce((s, l) => s + l.totalDue, 0),
      },
      {
        id: 'due_soon',
        label: lang === 'bn' ? 'আসন্ন কিস্তি (১৪ দিন)' : 'Due Soon (≤14d)',
        count: statusData.dueSoon.length,
        color: '#d97706', // amber-600
        bgColor: 'bg-amber-600',
        textColor: 'text-amber-600',
        loans: statusData.dueSoon,
        dueAmount: statusData.dueSoon.reduce((s, l) => s + l.totalDue, 0),
      },
      {
        id: 'active_on_time',
        label: lang === 'bn' ? 'নিয়মিত সক্রিয় লোন' : 'Active On Schedule',
        count: statusData.activeOnTime.length,
        color: '#E2136E', // bKash pink
        bgColor: 'bg-[#E2136E]',
        textColor: 'text-[#E2136E]',
        loans: statusData.activeOnTime,
        dueAmount: statusData.activeOnTime.reduce((s, l) => s + l.totalDue, 0),
      },
      {
        id: 'paid',
        label: lang === 'bn' ? 'পরিশোধিত লোন' : 'Fully Settled',
        count: statusData.paid.length,
        color: '#059669', // emerald-600
        bgColor: 'bg-emerald-600',
        textColor: 'text-emerald-600',
        loans: statusData.paid,
        dueAmount: 0,
      },
    ];

    // Compute stroke-dasharray & stroke-dashoffset for SVG circle (circumference = 2 * PI * 40 = 251.32)
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    let accumulatedPercent = 0;

    return slices.map(s => {
      const percent = (s.count / total) * 100;
      const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`;
      const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
      accumulatedPercent += percent;

      return {
        ...s,
        percent: Math.round(percent * 10) / 10,
        strokeDasharray,
        strokeDashoffset,
      };
    });
  }, [statusData, lang]);

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden transition-all hover:border-slate-300">
      {/* Top Header & Visual Tab Switcher */}
      <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-[#E2136E] text-white flex items-center justify-center shadow-xs">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight">
                {lang === 'bn' ? 'আধুনিক ভিজ্যুয়াল অ্যানালিটিক্স ও ইন্টারঅ্যাক্টিভ ম্যাপ' : 'Visual Analytics & Interactive Map'}
              </h3>
              <span className="text-[10px] bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2 py-0.5 rounded-full font-medium hidden sm:inline-flex items-center gap-1">
                <Info className="w-3 h-3" />
                {lang === 'bn' ? 'ক্লিক করে বিস্তারিত দেখুন' : 'Click to drill-down'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              {lang === 'bn'
                ? 'গ্রাফিক্স, চার্ট অথবা ম্যাপের যেকোনো অংশে ক্লিক করলে সরাসরি ফিল্টার ও বিস্তারিত দেখা যাবে'
                : 'Interactive charts, cash flow bars, and borrower risk maps with clickable drill-downs'}
            </p>
          </div>
        </div>

        {/* 4 View Tabs */}
        <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-lg border border-slate-700/60 overflow-x-auto">
          <button
            onClick={() => setActiveView('status_donut')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeView === 'status_donut'
                ? 'bg-[#E2136E] text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <PieChartIcon className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'স্ট্যাটাস পাই' : 'Status Donut'}</span>
          </button>

          <button
            onClick={() => setActiveView('cashflow_bars')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeView === 'cashflow_bars'
                ? 'bg-[#E2136E] text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'কিস্তি গ্রাফ' : 'Cash Flow'}</span>
          </button>

          <button
            onClick={() => setActiveView('borrower_map')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeView === 'borrower_map'
                ? 'bg-[#E2136E] text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'ঋণগ্রহীতা ম্যাপ' : 'Borrower Map'}</span>
          </button>

          <button
            onClick={() => setActiveView('risk_clusters')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeView === 'risk_clusters'
                ? 'bg-[#E2136E] text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'ঝুঁকি ক্লাস্টার' : 'Due Clusters'}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Visual Canvas */}
      <div className="p-4 sm:p-5">
        {/* VIEW 1: STATUS DONUT CHART WITH CLICKABLE PIECES */}
        {activeView === 'status_donut' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* SVG Donut Graphic */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center relative p-2">
              <div className="relative w-52 h-52">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                  {/* Track circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#f1f5f9"
                    strokeWidth="12"
                  />
                  {/* Slices */}
                  {donutSegments.map(slice => {
                    if (slice.count === 0) return null;
                    const isHovered = hoveredSlice === slice.id;
                    return (
                      <circle
                        key={slice.id}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke={slice.color}
                        strokeWidth={isHovered ? '14' : '12'}
                        strokeDasharray={slice.strokeDasharray}
                        strokeDashoffset={slice.strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-300 cursor-pointer hover:opacity-90"
                        onMouseEnter={() => setHoveredSlice(slice.id)}
                        onMouseLeave={() => setHoveredSlice(null)}
                        onClick={() =>
                          setDrillDown({
                            title: slice.label,
                            subtitle: `${slice.count} ${lang === 'bn' ? 'টি লোন অ্যাকাউন্ট' : 'accounts'} (${slice.percent}%)`,
                            badgeText: formatCurrency(slice.dueAmount, lang),
                            badgeColor: slice.bgColor,
                            loans: slice.loans,
                          })
                        }
                      />
                    );
                  })}
                </svg>

                {/* Donut Center Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-xs font-semibold text-slate-400">
                    {lang === 'bn' ? 'মোট লোন' : 'Total Loans'}
                  </span>
                  <span className="text-2xl font-extrabold text-slate-900 font-mono-numbers">
                    {lang === 'bn' ? toBanglaNumber(statusData.totalLoans) : statusData.totalLoans}
                  </span>
                  <span className="text-[10px] text-[#E2136E] font-medium font-mono-numbers">
                    {formatCurrency(statusData.totalActiveDues, lang)}
                  </span>
                </div>
              </div>

              <div className="mt-2 text-center text-[11px] text-slate-400 flex items-center gap-1 justify-center">
                <span>{lang === 'bn' ? 'যেকোনো অংশে ক্লিক করলে সম্পূর্ণ তালিকা দেখতে পারবেন' : 'Click any donut segment to see full loan list'}</span>
              </div>
            </div>

            {/* Clickable Status Cards / Legend */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {donutSegments.map(slice => {
                const isHovered = hoveredSlice === slice.id;
                return (
                  <button
                    key={slice.id}
                    type="button"
                    onMouseEnter={() => setHoveredSlice(slice.id)}
                    onMouseLeave={() => setHoveredSlice(null)}
                    onClick={() =>
                      setDrillDown({
                        title: slice.label,
                        subtitle: `${slice.count} ${lang === 'bn' ? 'টি লোন অ্যাকাউন্ট' : 'accounts'} (${slice.percent}%)`,
                        badgeText: formatCurrency(slice.dueAmount, lang),
                        badgeColor: slice.bgColor,
                        loans: slice.loans,
                      })
                    }
                    className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer shadow-2xs group relative overflow-hidden ${
                      isHovered
                        ? 'border-slate-400 bg-slate-50 ring-2 ring-slate-300'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${slice.bgColor}`} />
                        <span className="text-xs font-bold text-slate-900 group-hover:text-[#E2136E] transition-colors">
                          {slice.label}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-600 font-mono-numbers">
                        {slice.percent}%
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between mt-2">
                      <div>
                        <span className="text-lg font-bold text-slate-900 font-mono-numbers">
                          {lang === 'bn' ? toBanglaNumber(slice.count) : slice.count}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">
                          {lang === 'bn' ? 'টি লোন' : 'loans'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-700 font-mono-numbers block">
                          {formatCurrency(slice.dueAmount, lang)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {slice.id === 'paid' ? (lang === 'bn' ? 'সম্পূর্ণ পরিশোধিত' : 'Settled') : (lang === 'bn' ? 'বকেয়া' : 'Due')}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="group-hover:text-slate-900 font-medium flex items-center gap-1">
                        <span>{lang === 'bn' ? 'বিস্তারিত দেখুন' : 'View Details'}</span>
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono-numbers">
                        {slice.count > 0 ? (lang === 'bn' ? 'ক্লিক করুন' : 'Click') : (lang === 'bn' ? 'খালি' : 'Empty')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: CASH FLOW & EMI 3-MONTH BARS WITH DRILL-DOWN */}
        {activeView === 'cashflow_bars' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
              <span>{lang === 'bn' ? 'মাসিক কিস্তির হিসাব ও আদায় প্রবাহ (বার বা স্তম্ভে ক্লিক করে বিস্তারিত দেখুন)' : 'Monthly EMI Schedule & Collections (Click any column to view loans)'}</span>
              <span className="font-mono-numbers text-slate-700 font-semibold">
                {lang === 'bn' ? 'সর্বোচ্চ:' : 'Peak:'} {formatCurrency(cashflowData.maxVal, lang)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Bar 1: Already Collected */}
              <button
                type="button"
                onClick={() =>
                  setDrillDown({
                    title: lang === 'bn' ? 'ইতোমধ্যে সংগৃহীত পেমেন্ট লেনদেন' : 'Collected Payments (Ledger)',
                    subtitle: `${transactions.length} ${lang === 'bn' ? 'টি সফল লেনদেন' : 'transactions completed'}`,
                    badgeText: formatCurrency(cashflowData.collected, lang),
                    badgeColor: 'bg-emerald-600',
                    loans: loans.filter(l => l.lastPaymentDate),
                  })
                }
                className="p-3.5 rounded-lg border border-slate-200 bg-emerald-50/30 hover:bg-emerald-50/70 hover:border-emerald-300 text-left transition-all cursor-pointer shadow-2xs group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{lang === 'bn' ? 'ইতোমধ্যে সংগৃহীত' : 'Collected So Far'}</span>
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                      {lang === 'bn' ? 'আদায়' : 'Received'}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-emerald-700 font-mono-numbers mt-1">
                    {formatCurrency(cashflowData.collected, lang)}
                  </div>
                </div>

                <div className="mt-4">
                  {/* Vertical bar indicator */}
                  <div className="w-full bg-emerald-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(10, (cashflowData.collected / cashflowData.maxVal) * 100))}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-emerald-700 mt-1.5 font-medium">
                    <span>{transactions.length} {lang === 'bn' ? 'টি জমা রিসিট' : 'receipts'}</span>
                    <span className="group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      {lang === 'bn' ? 'ক্লিক করুন →' : 'Click →'}
                    </span>
                  </div>
                </div>
              </button>

              {/* Bar 2: EMI 1 (Current Month) */}
              <button
                type="button"
                onClick={() =>
                  setDrillDown({
                    title: lang === 'bn' ? 'চলতি মাসের কিস্তির লোন তালিকা' : 'This Month (1st EMI) Loans',
                    subtitle: `${cashflowData.activeLoans.length} ${lang === 'bn' ? 'টি সক্রিয় লোন অন্তর্ভুক্ত' : 'active loans'}`,
                    badgeText: formatCurrency(cashflowData.emi1, lang),
                    badgeColor: 'bg-[#E2136E]',
                    loans: cashflowData.activeLoans,
                  })
                }
                className="p-3.5 rounded-lg border border-pink-200 bg-pink-50/40 hover:bg-pink-100/60 hover:border-[#E2136E] text-left transition-all cursor-pointer shadow-2xs group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#E2136E] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'এই মাসের কিস্তি (১ম)' : 'This Month (EMI 1)'}</span>
                    </span>
                    <span className="text-[10px] bg-pink-100 text-[#E2136E] px-1.5 py-0.2 rounded font-semibold">
                      {lang === 'bn' ? 'বর্তমান' : 'Current'}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-slate-900 font-mono-numbers mt-1">
                    {formatCurrency(cashflowData.emi1, lang)}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="w-full bg-pink-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-[#E2136E] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(10, (cashflowData.emi1 / cashflowData.maxVal) * 100))}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#E2136E] mt-1.5 font-medium">
                    <span>{lang === 'bn' ? 'প্রদেয় কিস্তি' : 'Upcoming'}</span>
                    <span className="group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      {lang === 'bn' ? 'ক্লিক করুন →' : 'Click →'}
                    </span>
                  </div>
                </div>
              </button>

              {/* Bar 3: EMI 2 (Next Month) */}
              <button
                type="button"
                onClick={() =>
                  setDrillDown({
                    title: lang === 'bn' ? 'পরবর্তী মাসের কিস্তির লোন তালিকা (২য় মাস)' : 'Next Month (2nd EMI) Loans',
                    subtitle: `${cashflowData.activeLoans.filter(l => l.secondMonthEmi > 0).length} ${lang === 'bn' ? 'টি লোন অন্তর্ভুক্ত' : 'loans scheduled'}`,
                    badgeText: formatCurrency(cashflowData.emi2, lang),
                    badgeColor: 'bg-blue-600',
                    loans: cashflowData.activeLoans.filter(l => l.secondMonthEmi > 0),
                  })
                }
                className="p-3.5 rounded-lg border border-blue-200 bg-blue-50/40 hover:bg-blue-100/60 hover:border-blue-400 text-left transition-all cursor-pointer shadow-2xs group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'পরের মাসের কিস্তি (২য়)' : 'Next Month (EMI 2)'}</span>
                    </span>
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-semibold">
                      {lang === 'bn' ? '২য় মাস' : 'Month 2'}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-slate-900 font-mono-numbers mt-1">
                    {formatCurrency(cashflowData.emi2, lang)}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="w-full bg-blue-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(10, (cashflowData.emi2 / cashflowData.maxVal) * 100))}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-blue-700 mt-1.5 font-medium">
                    <span>{lang === 'bn' ? 'আগামী মাসের হিসাব' : 'Next schedule'}</span>
                    <span className="group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      {lang === 'bn' ? 'ক্লিক করুন →' : 'Click →'}
                    </span>
                  </div>
                </div>
              </button>

              {/* Bar 4: EMI 3 (Final Month) */}
              <button
                type="button"
                onClick={() =>
                  setDrillDown({
                    title: lang === 'bn' ? '৩য় মাসের কিস্তির লোন তালিকা (চূড়ান্ত কিস্তি)' : '3rd Month (Final EMI) Loans',
                    subtitle: `${cashflowData.activeLoans.filter(l => l.thirdMonthEmi > 0).length} ${lang === 'bn' ? 'টি লোন অন্তর্ভুক্ত' : 'loans scheduled'}`,
                    badgeText: formatCurrency(cashflowData.emi3, lang),
                    badgeColor: 'bg-indigo-600',
                    loans: cashflowData.activeLoans.filter(l => l.thirdMonthEmi > 0),
                  })
                }
                className="p-3.5 rounded-lg border border-indigo-200 bg-indigo-50/40 hover:bg-indigo-100/60 hover:border-indigo-400 text-left transition-all cursor-pointer shadow-2xs group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? '৩য় মাসের কিস্তি (শেষ)' : '3rd Month (EMI 3)'}</span>
                    </span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-semibold">
                      {lang === 'bn' ? 'শেষ কিস্তি' : 'Final'}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-slate-900 font-mono-numbers mt-1">
                    {formatCurrency(cashflowData.emi3, lang)}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="w-full bg-indigo-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(10, (cashflowData.emi3 / cashflowData.maxVal) * 100))}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-indigo-700 mt-1.5 font-medium">
                    <span>{lang === 'bn' ? 'চূড়ান্ত প্রদেয়' : 'Final schedule'}</span>
                    <span className="group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      {lang === 'bn' ? 'ক্লিক করুন →' : 'Click →'}
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* VIEW 3: BORROWER RISK & DEBT DISTRIBUTION HEATMAP / VISUAL MATRIX */}
        {activeView === 'borrower_map' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pb-1">
              <span>{lang === 'bn' ? 'ঋণগ্রহীতা ডিস্ট্রিবিউশন টাইলস (যেকোনো ব্যক্তির কার্ডে ক্লিক করলে তার সকল লোন ও অ্যাকশন দেখতে পাবেন)' : 'Borrower Distribution Map (Click any borrower tile to view and manage their loans)'}</span>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> {lang === 'bn' ? 'মেয়াদোত্তীর্ণ' : 'Overdue'}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> {lang === 'bn' ? 'আসন্ন' : 'Due Soon'}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#E2136E]" /> {lang === 'bn' ? 'নিয়মিত' : 'Active'}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> {lang === 'bn' ? 'পরিশোধিত' : 'Settled'}</span>
              </div>
            </div>

            {/* Interactive Grid of Borrowers */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {borrowerData.map(b => {
                const isOver = b.riskCategory === 'overdue';
                const isSoon = b.riskCategory === 'due_soon';
                const isPaid = b.riskCategory === 'paid';

                let borderClass = 'border-slate-200 bg-white hover:border-[#E2136E]';
                let tagClass = 'bg-pink-100 text-[#E2136E]';
                let tagText = lang === 'bn' ? 'নিয়মিত' : 'Active';

                if (isPaid) {
                  borderClass = 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-400';
                  tagClass = 'bg-emerald-100 text-emerald-800';
                  tagText = lang === 'bn' ? 'পরিশোধিত' : 'Settled';
                } else if (isOver) {
                  borderClass = 'border-rose-300 bg-rose-50/40 hover:border-rose-500';
                  tagClass = 'bg-rose-100 text-rose-800 font-bold';
                  tagText = lang === 'bn' ? 'মেয়াদোত্তীর্ণ' : 'Overdue';
                } else if (isSoon) {
                  borderClass = 'border-amber-300 bg-amber-50/30 hover:border-amber-500';
                  tagClass = 'bg-amber-100 text-amber-800';
                  tagText = lang === 'bn' ? 'আসন্ন' : 'Due Soon';
                }

                return (
                  <button
                    key={b.name}
                    type="button"
                    onClick={() =>
                      setDrillDown({
                        title: `${b.name} - ${lang === 'bn' ? 'এর লোন হিসাব' : 'Loans Portfolio'}`,
                        subtitle: `${b.loanCount} ${lang === 'bn' ? 'টি লোন' : 'loans'} · ${tagText}`,
                        badgeText: formatCurrency(b.totalDue, lang),
                        badgeColor: isOver ? 'bg-rose-600' : isPaid ? 'bg-emerald-600' : 'bg-[#E2136E]',
                        loans: b.loans,
                      })
                    }
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer shadow-2xs group relative overflow-hidden ${borderClass}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                          {b.name.charAt(0)}
                        </div>
                        <span className="font-bold text-xs text-slate-900 truncate group-hover:text-[#E2136E] transition-colors">
                          {b.name}
                        </span>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-medium shrink-0 ${tagClass}`}>
                        {tagText}
                      </span>
                    </div>

                    <div className="mt-2 flex items-baseline justify-between">
                      <div className="text-sm font-bold text-slate-900 font-mono-numbers">
                        {formatCurrency(b.totalDue, lang)}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono-numbers">
                        {b.loanCount} {lang === 'bn' ? 'টি লোন' : 'loans'}
                      </span>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{lang === 'bn' ? 'মূল লোন:' : 'Principal:'} {formatCurrency(b.totalPrincipal, lang)}</span>
                      <ArrowUpRight className="w-3 h-3 group-hover:text-[#E2136E] transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 4: DUE DATE & TIMELINE RISK CLUSTERS */}
        {activeView === 'risk_clusters' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Cluster 1: Overdue */}
            <button
              type="button"
              onClick={() =>
                setDrillDown({
                  title: lang === 'bn' ? 'মেয়াদোত্তীর্ণ কিস্তি (জরুরি সমাধান প্রয়োজন)' : 'Overdue Loans (Action Needed)',
                  subtitle: `${riskClusters.overdue.length} ${lang === 'bn' ? 'টি লোন নির্ধারিত তারিখ পার হয়েছে' : 'loans passed deadline'}`,
                  badgeText: formatCurrency(riskClusters.overdue.reduce((s, l) => s + l.totalDue, 0), lang),
                  badgeColor: 'bg-rose-600',
                  loans: riskClusters.overdue,
                })
              }
              className="p-4 rounded-lg border border-rose-300 bg-rose-50/50 hover:bg-rose-100/60 text-left transition-all cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>{lang === 'bn' ? 'মেয়াদোত্তীর্ণ (Overdue)' : 'Overdue Deadlines'}</span>
                </span>
                <span className="text-xs font-bold bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full font-mono-numbers">
                  {riskClusters.overdue.length}
                </span>
              </div>
              <div className="mt-3">
                <div className="text-xl font-extrabold text-rose-700 font-mono-numbers">
                  {formatCurrency(riskClusters.overdue.reduce((s, l) => s + l.totalDue, 0), lang)}
                </div>
                <p className="text-[11px] text-rose-600 mt-1">
                  {lang === 'bn' ? 'তাৎক্ষণিক কিস্তি আদায় প্রয়োজন' : 'Immediate repayment action'}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-rose-200/60 flex items-center justify-between text-[11px] text-rose-700 font-medium">
                <span>{lang === 'bn' ? 'ক্লিক করে লোনগুলো দেখুন' : 'View loans list'}</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Cluster 2: Urgent 1-7 Days */}
            <button
              type="button"
              onClick={() =>
                setDrillDown({
                  title: lang === 'bn' ? 'জরুরি কিস্তি (১ থেকে ৭ দিনের মধ্যে প্রদেয়)' : 'Urgent: Due in 1-7 Days',
                  subtitle: `${riskClusters.urgent7.length} ${lang === 'bn' ? 'টি লোনের তারিখ নিকটবর্তী' : 'loans due this week'}`,
                  badgeText: formatCurrency(riskClusters.urgent7.reduce((s, l) => s + l.totalDue, 0), lang),
                  badgeColor: 'bg-amber-600',
                  loans: riskClusters.urgent7,
                })
              }
              className="p-4 rounded-lg border border-amber-300 bg-amber-50/50 hover:bg-amber-100/60 text-left transition-all cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>{lang === 'bn' ? '১-৭ দিন বাকি (Urgent)' : 'Due in 1-7 Days'}</span>
                </span>
                <span className="text-xs font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-mono-numbers">
                  {riskClusters.urgent7.length}
                </span>
              </div>
              <div className="mt-3">
                <div className="text-xl font-extrabold text-amber-800 font-mono-numbers">
                  {formatCurrency(riskClusters.urgent7.reduce((s, l) => s + l.totalDue, 0), lang)}
                </div>
                <p className="text-[11px] text-amber-700 mt-1">
                  {lang === 'bn' ? 'এই সপ্তাহে পরিশোধযোগ্য' : 'Repayable within 7 days'}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px] text-amber-800 font-medium">
                <span>{lang === 'bn' ? 'ক্লিক করে লোনগুলো দেখুন' : 'View loans list'}</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Cluster 3: Upcoming 8-15 Days */}
            <button
              type="button"
              onClick={() =>
                setDrillDown({
                  title: lang === 'bn' ? 'আসন্ন কিস্তি (৮ থেকে ১৫ দিন বাকি)' : 'Upcoming: Due in 8-15 Days',
                  subtitle: `${riskClusters.upcoming15.length} ${lang === 'bn' ? 'টি লোন দ্বিতীয় সপ্তাহে প্রদেয়' : 'loans scheduled next week'}`,
                  badgeText: formatCurrency(riskClusters.upcoming15.reduce((s, l) => s + l.totalDue, 0), lang),
                  badgeColor: 'bg-blue-600',
                  loans: riskClusters.upcoming15,
                })
              }
              className="p-4 rounded-lg border border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 text-left transition-all cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>{lang === 'bn' ? '৮-১৫ দিন বাকি' : 'Due in 8-15 Days'}</span>
                </span>
                <span className="text-xs font-bold bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full font-mono-numbers">
                  {riskClusters.upcoming15.length}
                </span>
              </div>
              <div className="mt-3">
                <div className="text-xl font-extrabold text-blue-800 font-mono-numbers">
                  {formatCurrency(riskClusters.upcoming15.reduce((s, l) => s + l.totalDue, 0), lang)}
                </div>
                <p className="text-[11px] text-blue-700 mt-1">
                  {lang === 'bn' ? 'পরবর্তী সপ্তাহে সময়সূচি' : 'Repayable next week'}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-blue-200/60 flex items-center justify-between text-[11px] text-blue-800 font-medium">
                <span>{lang === 'bn' ? 'ক্লিক করে লোনগুলো দেখুন' : 'View loans list'}</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Cluster 4: Safe 16+ Days */}
            <button
              type="button"
              onClick={() =>
                setDrillDown({
                  title: lang === 'bn' ? 'পর্যাপ্ত সময় বাকি (১৬+ দিন)' : 'Safe Window: 16+ Days',
                  subtitle: `${riskClusters.safeLater.length} ${lang === 'bn' ? 'টি লোন নিরাপদ সময়সীমায় আছে' : 'loans in safe schedule'}`,
                  badgeText: formatCurrency(riskClusters.safeLater.reduce((s, l) => s + l.totalDue, 0), lang),
                  badgeColor: 'bg-emerald-600',
                  loans: riskClusters.safeLater,
                })
              }
              className="p-4 rounded-lg border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 text-left transition-all cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'bn' ? '১৬+ দিন বাকি (Safe)' : 'Safe: 16+ Days'}</span>
                </span>
                <span className="text-xs font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-mono-numbers">
                  {riskClusters.safeLater.length}
                </span>
              </div>
              <div className="mt-3">
                <div className="text-xl font-extrabold text-emerald-800 font-mono-numbers">
                  {formatCurrency(riskClusters.safeLater.reduce((s, l) => s + l.totalDue, 0), lang)}
                </div>
                <p className="text-[11px] text-emerald-700 mt-1">
                  {lang === 'bn' ? 'যথেষ্ট সময় হাতে রয়েছে' : 'Sufficient buffer available'}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-emerald-800 font-medium">
                <span>{lang === 'bn' ? 'ক্লিক করে লোনগুলো দেখুন' : 'View loans list'}</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        )}
      </div>

      {/* DRILL-DOWN MODAL / DETAIL DRAWER (ক্লিক করলে বিস্তারিত দেখা যাবে) */}
      {drillDown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold tracking-tight">
                    {drillDown.title}
                  </h3>
                  <span className={`text-[11px] font-mono-numbers text-white px-2 py-0.5 rounded-full font-semibold ${drillDown.badgeColor}`}>
                    {drillDown.badgeText}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">{drillDown.subtitle}</p>
              </div>
              <button
                onClick={() => setDrillDown(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Loan List Content */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 bg-slate-50">
              {drillDown.loans.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  {lang === 'bn' ? 'এই বিভাগে কোনো লোন রেকর্ড নেই।' : 'No loan records found in this category.'}
                </div>
              ) : (
                drillDown.loans.map(loan => {
                  const isSettled = loan.totalDue <= 0 || loan.status === 'paid';
                  const isOver = isDateOverdue(loan.nextLoanSubmitDate);
                  const days = getDaysRemaining(loan.nextLoanSubmitDate);

                  return (
                    <div
                      key={loan.id}
                      className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      {/* Left: Borrower & Loan Details */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-slate-900">
                            {loan.personName}
                          </span>
                          <span className="font-mono-numbers text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                            {loan.loanId}
                          </span>
                          {isSettled ? (
                            <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                              {lang === 'bn' ? 'পরিশোধিত' : 'Settled'}
                            </span>
                          ) : isOver ? (
                            <span className="text-[10px] font-semibold bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded">
                              {lang === 'bn' ? 'মেয়াদোত্তীর্ণ' : 'Overdue'}
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold bg-pink-100 text-[#E2136E] px-1.5 py-0.2 rounded">
                              {days} {lang === 'bn' ? 'দিন বাকি' : 'days left'}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-mono-numbers">
                          <span>
                            {lang === 'bn' ? 'মূল লোন:' : 'Principal:'}{' '}
                            <strong className="text-slate-800">{formatCurrency(loan.totalPrincipalLoan, lang)}</strong>
                          </span>
                          <span>·</span>
                          <span>
                            {lang === 'bn' ? 'এই মাসের কিস্তি:' : 'EMI 1:'}{' '}
                            <strong className="text-[#E2136E]">{formatCurrency(loan.currentMonthEmi, lang)}</strong>
                          </span>
                          <span>·</span>
                          <span>
                            {lang === 'bn' ? 'মোট বকেয়া:' : 'Total Due:'}{' '}
                            <strong className="text-slate-900">{formatCurrency(loan.totalDue, lang)}</strong>
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono-numbers">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>
                            {lang === 'bn' ? 'জমার নির্ধারিত তারিখ:' : 'Submit Date:'} {loan.nextLoanSubmitDate}
                          </span>
                        </div>
                      </div>

                      {/* Right: Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {!isSettled ? (
                          <>
                            {!isReadOnly && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDrillDown(null);
                                    onPayLoan(loan, false);
                                  }}
                                  className="px-3 py-1.5 text-xs font-semibold text-white bg-[#E2136E] hover:bg-[#c40e5d] rounded-md transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  <span>{lang === 'bn' ? 'কিস্তি জমা' : 'Pay EMI'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDrillDown(null);
                                    onPayLoan(loan, true);
                                  }}
                                  className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-colors cursor-pointer"
                                >
                                  {lang === 'bn' ? 'পূর্ণ পরিশোধ' : 'Settle'}
                                </button>
                              </>
                            )}
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setDrillDown(null);
                              onViewReceipt(loan);
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{lang === 'bn' ? 'রশিদ দেখুন' : 'View Receipt'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setDrillDown(null);
                            onSelectBorrowerFilter(loan.personName);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-800 rounded hover:bg-slate-100 cursor-pointer"
                          title={lang === 'bn' ? 'এই ব্যক্তির সকল লোন ফিল্টার করুন' : 'Filter by this borrower'}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span className="font-mono-numbers">
                {lang === 'bn' ? 'মোট রেকর্ড:' : 'Total Records:'} <strong>{drillDown.loans.length}</strong>
              </span>
              <button
                type="button"
                onClick={() => setDrillDown(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold cursor-pointer"
              >
                {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
