import React, { useState, useEffect } from 'react';
import { LoanRecord, PaymentTransaction, Language } from '../types/loan';
import { formatCurrency, isDateOverdue, getDaysRemaining } from '../utils/dateUtils';
import {
  Sparkles,
  Bot,
  Send,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Lightbulb,
  ShieldCheck,
  User,
  ArrowRight,
  Clock,
  Smartphone,
  TrendingUp,
} from 'lucide-react';

interface AILoanAdvisorProps {
  loans: LoanRecord[];
  transactions: PaymentTransaction[];
  lang: Language;
  onPayLoan: (loan: LoanRecord) => void;
  onSelectBorrower: (borrowerName: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  matchedLoans?: LoanRecord[];
}

export const AILoanAdvisor: React.FC<AILoanAdvisorProps> = ({
  loans,
  transactions,
  lang,
  onPayLoan,
  onSelectBorrower,
}) => {
  const [subTab, setSubTab] = useState<'strategy' | 'chat' | 'sms'>('strategy');

  // Strategy state
  const [strategyText, setStrategyText] = useState<string>('');
  const [isLoadingStrategy, setIsLoadingStrategy] = useState<boolean>(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: '1',
      sender: 'ai',
      text:
        lang === 'bn'
          ? 'আসসালামু আলাইকুম! আমি আপনার মোস্তাফিজুর বিকাশ লোন ম্যানেজমেন্ট AI কোপাইলট। পোর্টফোলিও বিশ্লেষণ, ঋণগ্রহীতাদের রিমাইন্ডার তৈরি অথবা হিসাব সংক্রান্ত যেকোনো প্রশ্ন করতে পারেন।'
          : 'Hello! I am your AI Loan Copilot. Ask me anything about borrower dues, upcoming installments, overdue recovery, or reminder messages.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [userInput, setUserInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // SMS Generator state
  const activeLoans = loans.filter(l => l.totalDue > 0 && l.status !== 'paid');
  const [selectedLoanId, setSelectedLoanId] = useState<string>(activeLoans[0]?.loanId || '');
  const [smsTone, setSmsTone] = useState<'polite' | 'due_soon' | 'urgent'>('polite');
  const [generatedSms, setGeneratedSms] = useState<string>('');
  const [isGeneratingSms, setIsGeneratingSms] = useState<boolean>(false);
  const [copiedSms, setCopiedSms] = useState<boolean>(false);

  // Quick prompt chips
  const quickPrompts = [
    {
      label: lang === 'bn' ? '⚠️ ঝুঁকিপূর্ণ লোনসমূহ' : '⚠️ Overdue Risks',
      query: lang === 'bn' ? 'কোন কোন লোন ওভারডিউ রয়েছে এবং তাদের মোট বকেয়া কত?' : 'Which loans are overdue and what is the total due amount?',
    },
    {
      label: lang === 'bn' ? '💰 এই মাসের কিস্তি আদায়' : '💰 Current Month EMIs',
      query: lang === 'bn' ? 'চলতি মাসে কোন কোন ঋণগ্রহীতার কিস্তি প্রদেয় এবং মোট কত টাকা আসবে?' : 'Whose EMIs are due this month and what is the expected collection?',
    },
    {
      label: lang === 'bn' ? '📊 কালেকশন বাড়ানোর টিপস' : '📊 Recovery Tips',
      query: lang === 'bn' ? 'বিকাশ কিস্তি দ্রুত ও সহজে আদায় নিশ্চিত করার ৩টি সেরা উপায় কি?' : 'What are the top 3 strategies to maximize timely bKash loan recoveries?',
    },
    {
      label: lang === 'bn' ? '🏆 সেরা পরিশোধকারী গ্রাহক' : '🏆 Best Borrowers',
      query: lang === 'bn' ? 'সবচেয়ে সময়মত কিস্তি পরিশোধকারী গ্রাহকদের তথ্য দিন।' : 'Give details about the borrowers who settled on time.',
    },
  ];

  // Fetch or trigger Strategy analysis
  const fetchStrategyAnalysis = async () => {
    setIsLoadingStrategy(true);
    try {
      const res = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loans, transactions, lang }),
      });
      if (res.ok) {
        const data = await res.json();
        setStrategyText(data.analysis);
      } else {
        throw new Error('Server error');
      }
    } catch (err) {
      // Fallback local heuristic
      const overdue = loans.filter(l => l.totalDue > 0 && isDateOverdue(l.nextLoanSubmitDate));
      const totalDue = loans.reduce((s, l) => s + (l.status !== 'paid' ? l.totalDue : 0), 0);
      const totalMonth1 = loans.reduce((s, l) => s + (l.status !== 'paid' ? l.currentMonthEmi : 0), 0);

      setStrategyText(
        lang === 'bn'
          ? `### 📌 পোর্টফোলিও পর্যবেক্ষণ
বর্তমানে মোট সক্রিয় বকেয়া ৳${totalDue.toLocaleString()} এবং এই মাসে আদায়যোগ্য কিস্তি ৳${totalMonth1.toLocaleString()}।

### ⚠️ ঝুঁকি পর্যালোচনা
${overdue.length > 0 ? `বর্তমানে ${overdue.length}টি লোন নির্ধারিত তারিখ পার করেছে। জরুরি ভিত্তিতে ${overdue.map(l => l.personName).join(', ')}-এর সাথে যোগাযোগ করুন।` : 'কোনো লোন মেয়াদোত্তীর্ণ নেই। সমস্ত অ্যাকাউন্ট নির্ধারিত শিডিউলে চলমান।'}

### 💡 সুপারিশ
১. আগামী ৭ দিনের মধ্যে যেসব লোনের কিস্তির তারিখ আসছে, তাদের স্বয়ংক্রিয় এসএমএস রিমাইন্ডার প্রেরণ করুন।
২. কিস্তি জমা পাওয়ার সাথে সাথে ডিজিটাল রশিদ তৈরি করে তাদের বিকাশ/হোয়াটসঅ্যাপে শেয়ার করুন।`
          : `### 📌 Portfolio Health Overview
Total outstanding balance is ৳${totalDue.toLocaleString()} with ৳${totalMonth1.toLocaleString()} scheduled in 1st EMIs.

### ⚠️ Risk Mitigation
${overdue.length > 0 ? `${overdue.length} accounts are currently overdue. Recommended priority collection for ${overdue.map(l => l.personName).join(', ')}.` : 'Zero overdue accounts. Healthy portfolio.'}

### 💡 Recommended Next Actions
1. Send automated reminder SMS to borrowers due within the next 7 days.
2. Provide payment receipts immediately upon collection to encourage trust.`
      );
    } finally {
      setIsLoadingStrategy(false);
    }
  };

  useEffect(() => {
    if (!strategyText) {
      fetchStrategyAnalysis();
    }
  }, [loans.length, lang]);

  // Handle Send Chat
  const handleSendMessage = async (textToSend?: string) => {
    const q = textToSend || userInput;
    if (!q.trim() || isSendingMessage) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setUserInput('');

    // Direct instant search for matching loans by name or ID
    const qLower = q.toLowerCase();
    const banglaBorrowerMap: Record<string, string> = {
      'মুশা': 'Musha',
      'মুসা': 'Musha',
      'সোহেল অপু': 'Sohel Apu',
      'সোহেল': 'Sohel Apu',
      'হারুন': 'Harun',
      'মোস্তাফিজুর': 'Mostafizur',
      'মুস্তাফিজুর': 'Mostafizur',
    };

    let translatedQuery = qLower;
    for (const [bn, en] of Object.entries(banglaBorrowerMap)) {
      if (qLower.includes(bn.toLowerCase())) {
        translatedQuery = en.toLowerCase();
        break;
      }
    }

    const matched = loans.filter(l => {
      const name = l.personName.toLowerCase();
      const id = l.loanId.toLowerCase();
      return (
        name.includes(qLower) ||
        name.includes(translatedQuery) ||
        id.includes(qLower) ||
        (qLower.includes('overdue') && isDateOverdue(l.nextLoanSubmitDate) && l.totalDue > 0)
      );
    });

    if (matched.length > 0) {
      const totalDue = matched.reduce((s, l) => s + (l.status !== 'paid' ? l.totalDue : 0), 0);
      const currentEmi = matched.reduce((s, l) => s + (l.status !== 'paid' ? l.currentMonthEmi : 0), 0);
      const personNames = Array.from(new Set(matched.map(l => l.personName))).join(', ');

      const responseText = lang === 'bn'
        ? `🔍 "${q}" অনুসন্ধানে ${personNames}-এর মোট ${matched.length}টি লোন রেকর্ড পাওয়া গেছে।\n• সর্বমোট বকেয়া: ৳${totalDue.toLocaleString()}\n• চলতি মাসের প্রদেয় কিস্তি: ৳${currentEmi.toLocaleString()}\nনিচের কার্ড থেকে সরাসরি কিস্তি জমা অথবা তাগিদ এসএমএস ড্রাফট তৈরি করুন:`
        : `🔍 Search for "${q}" found ${matched.length} loan accounts for ${personNames}.\n• Total Outstanding: ৳${totalDue.toFixed(2)}\n• Current Month EMI: ৳${currentEmi.toFixed(2)}\nUse the action buttons below to pay EMI or generate reminder SMS:`;

      const instantAiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: responseText,
        matchedLoans: matched,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, instantAiMsg]);
      return;
    }

    setIsSendingMessage(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, loans, transactions, lang }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error('AI service error');
      }
    } catch (e) {
      const fallbackMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text:
          lang === 'bn'
            ? `আপনার প্রশ্ন পেয়েছি। বর্তমানে পোর্টফোলিওতে মোট ${loans.length}টি লোন রয়েছে, যার মোট বকেয়া ৳${loans.reduce((s, l) => s + (l.status !== 'paid' ? l.totalDue : 0), 0).toFixed(2)}।`
            : `System report: Total ${loans.length} loans tracked. Total outstanding due is ৳${loans.reduce((s, l) => s + (l.status !== 'paid' ? l.totalDue : 0), 0).toFixed(2)}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Generate Personalized SMS
  const handleGenerateSms = async () => {
    const targetLoan = loans.find(l => l.loanId === selectedLoanId);
    if (!targetLoan) return;

    setIsGeneratingSms(true);
    try {
      const res = await fetch('/api/ai/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          borrowerName: targetLoan.personName,
          loanId: targetLoan.loanId,
          currentEmi: targetLoan.currentMonthEmi,
          totalDue: targetLoan.totalDue,
          nextDate: targetLoan.nextLoanSubmitDate,
          tone: smsTone,
          lang,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedSms(data.sms);
      } else {
        throw new Error('Server error');
      }
    } catch (err) {
      const fallback =
        lang === 'bn'
          ? `প্রিয় ${targetLoan.personName}, আপনার বিকাশ লোন (${targetLoan.loanId})-এর এই মাসের কিস্তি ৳${targetLoan.currentMonthEmi} আগামী ${targetLoan.nextLoanSubmitDate}-এর মধ্যে জমা দেওয়ার জন্য অনুরোধ করা হচ্ছে। মোট বকেয়া: ৳${targetLoan.totalDue}। ধন্যবাদ - মোস্তাফিজুর বিকাশ লোন ম্যানেজমেন্ট`
          : `Dear ${targetLoan.personName}, reminder for your bKash loan (${targetLoan.loanId}) EMI ৳${targetLoan.currentMonthEmi} due on ${targetLoan.nextLoanSubmitDate}. Total balance: ৳${targetLoan.totalDue}. Thank you - Mostafizur bKash Loan Management`;
      setGeneratedSms(fallback);
    } finally {
      setIsGeneratingSms(false);
    }
  };

  const handleCopyGeneratedSms = () => {
    if (!generatedSms) return;
    navigator.clipboard.writeText(generatedSms);
    setCopiedSms(true);
    setTimeout(() => setCopiedSms(false), 2000);
  };

  const currentSelectedLoan = loans.find(l => l.loanId === selectedLoanId);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden transition-all">
      {/* Top Banner with Gemini AI Branding */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#E2136E] to-purple-500 flex items-center justify-center text-white shadow-md shrink-0">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                {lang === 'bn' ? 'AI লোন উপদেষ্টা ও ফিনান্সিয়াল কোপাইলট' : 'AI Loan Advisor & Financial Copilot'}
              </h2>
              <span className="text-[10px] font-semibold bg-gradient-to-r from-pink-500 to-purple-500 text-white px-2 py-0.5 rounded-full shadow-2xs">
                Gemini 3.8
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {lang === 'bn'
                ? 'স্মার্ট পোর্টফোলিও অডিট, রিয়েল-টাইম রিকভারি পরামর্শ এবং অটোমেটেড রিমাইন্ডার মেসেজ'
                : 'Smart portfolio health check, automated recovery insights, and SMS draft generation'}
            </p>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-lg border border-slate-700/60 overflow-x-auto self-start md:self-auto">
          <button
            type="button"
            onClick={() => setSubTab('strategy')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              subTab === 'strategy'
                ? 'bg-[#E2136E] text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'AI অডিট ও কৌশল' : 'AI Audit & Strategy'}</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('chat')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              subTab === 'chat'
                ? 'bg-[#E2136E] text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'ইন্টেলিজেন্ট AI চ্যাট' : 'AI Assistant Chat'}</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('sms')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              subTab === 'sms'
                ? 'bg-[#E2136E] text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'স্মার্ট এসএমএস ড্রাফট' : 'Smart SMS Draft'}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: AI STRATEGY & PORTFOLIO AUDIT */}
      {subTab === 'strategy' && (
        <div className="p-4 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>{lang === 'bn' ? 'পোর্টফোলিও রিস্ক ও কালেকশন অ্যানালাইসিস' : 'Portfolio Risk & Collection Analysis'}</span>
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'bn'
                  ? 'বর্তমান ঋণের তথ্য, বকেয়া এবং মেয়াদোত্তীর্ণ রেকর্ডের ভিত্তিতে AI কর্তৃক প্রস্তুতকৃত রিপোর্ট'
                  : 'Actionable executive insights generated dynamically by Gemini AI'}
              </p>
            </div>
            <button
              onClick={fetchStrategyAnalysis}
              disabled={isLoadingStrategy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoadingStrategy ? 'animate-spin' : ''}`} />
              <span>{isLoadingStrategy ? (lang === 'bn' ? 'বিশ্লেষণ হচ্ছে...' : 'Analyzing...') : (lang === 'bn' ? 'রিফ্রেশ রিপোর্ট' : 'Refresh Report')}</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 block">{lang === 'bn' ? 'সক্রিয় অ্যাকাউন্ট' : 'Active Accounts'}</span>
              <span className="text-lg font-bold text-slate-900 font-mono-numbers">
                {loans.filter(l => l.totalDue > 0 && l.status !== 'paid').length}
              </span>
            </div>
            <div className="p-3 bg-pink-50/50 rounded-lg border border-pink-200">
              <span className="text-[11px] text-pink-700 block">{lang === 'bn' ? 'এই মাসের কিস্তি' : 'This Month EMI'}</span>
              <span className="text-lg font-bold text-[#E2136E] font-mono-numbers">
                {formatCurrency(loans.reduce((s, l) => s + (l.status !== 'paid' ? l.currentMonthEmi : 0), 0), lang)}
              </span>
            </div>
            <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-200">
              <span className="text-[11px] text-rose-700 block">{lang === 'bn' ? 'মেয়াদোত্তীর্ণ অ্যাকাউন্ট' : 'Overdue Accounts'}</span>
              <span className="text-lg font-bold text-rose-600 font-mono-numbers">
                {loans.filter(l => l.totalDue > 0 && isDateOverdue(l.nextLoanSubmitDate)).length}
              </span>
            </div>
            <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200">
              <span className="text-[11px] text-emerald-700 block">{lang === 'bn' ? 'আদায়কৃত মোট লেনদেন' : 'Collected Payments'}</span>
              <span className="text-lg font-bold text-emerald-700 font-mono-numbers">
                {formatCurrency(transactions.reduce((s, t) => s + t.amount, 0), lang)}
              </span>
            </div>
          </div>

          {/* Strategy Text Content */}
          <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-50 via-white to-pink-50/20 border border-slate-200 rounded-xl relative">
            {isLoadingStrategy ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-500 space-y-3">
                <RefreshCw className="w-7 h-7 text-[#E2136E] animate-spin" />
                <p className="text-xs font-medium">
                  {lang === 'bn' ? 'Gemini AI আপনার ঋণ ও কিস্তির তথ্য বিশ্লেষণ করছে...' : 'Gemini AI is analyzing your loan records...'}
                </p>
              </div>
            ) : (
              <div className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line space-y-2">
                {strategyText}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE AI CHAT */}
      {subTab === 'chat' && (
        <div className="p-4 sm:p-6 space-y-4 flex flex-col">
          {/* Quick Prompts Bar */}
          <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center gap-1">
              <Bot className="w-3.5 h-3.5 text-[#E2136E]" />
              <span>{lang === 'bn' ? 'দ্রুত প্রশ্ন করুন:' : 'Quick Questions:'}</span>
            </span>
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(p.query)}
                className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-pink-50 hover:text-[#E2136E] border border-slate-200 hover:border-pink-300 rounded-full text-slate-700 transition-colors cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Message History */}
          <div className="h-80 sm:h-96 overflow-y-auto space-y-3 p-3 bg-slate-50/60 rounded-xl border border-slate-200">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-full bg-[#E2136E] text-white flex items-center justify-center shrink-0 text-xs shadow-2xs font-bold">
                    AI
                  </div>
                )}
                <div
                  className={`max-w-[90%] sm:max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm shadow-2xs whitespace-pre-wrap leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-slate-900 text-white rounded-tr-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                  }`}
                >
                  <p>{msg.text}</p>

                  {/* Render Matched Loans Cards */}
                  {msg.matchedLoans && msg.matchedLoans.length > 0 && (
                    <div className="mt-3 space-y-2 border-t border-slate-100 pt-2.5">
                      {msg.matchedLoans.map(loan => {
                        const isOver = isDateOverdue(loan.nextLoanSubmitDate);
                        const days = getDaysRemaining(loan.nextLoanSubmitDate);
                        const isSettled = loan.totalDue <= 0 || loan.status === 'paid';

                        return (
                          <div
                            key={loan.id}
                            className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col gap-2 hover:border-[#E2136E]/40 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 text-xs">
                                {loan.personName}
                              </span>
                              <span className="text-[10px] font-mono-numbers text-slate-500">
                                {loan.loanId}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div>
                                <span className="text-slate-500 block text-[10px]">
                                  {lang === 'bn' ? 'চলতি কিস্তি:' : 'Current EMI:'}
                                </span>
                                <span className="font-bold text-slate-900 font-mono-numbers">
                                  {formatCurrency(loan.currentMonthEmi, lang)}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 block text-[10px]">
                                  {lang === 'bn' ? 'মোট বকেয়া:' : 'Total Due:'}
                                </span>
                                <span className="font-bold text-[#E2136E] font-mono-numbers">
                                  {formatCurrency(loan.totalDue, lang)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-200/60">
                              <span className="font-mono-numbers text-slate-600">
                                {lang === 'bn' ? 'তারিখ:' : 'Due:'} {loan.nextLoanSubmitDate}{' '}
                                {isSettled ? (
                                  <span className="text-emerald-600 font-semibold">(পরিশোধিত)</span>
                                ) : isOver ? (
                                  <span className="text-rose-600 font-bold">(মেয়াদোত্তীর্ণ)</span>
                                ) : (
                                  <span className="text-amber-600 font-medium">({days} দিন বাকি)</span>
                                )}
                              </span>

                              {/* Interactive Actions */}
                              <div className="flex items-center gap-1">
                                {!isSettled && (
                                  <button
                                    type="button"
                                    onClick={() => onPayLoan(loan)}
                                    className="px-2 py-0.5 bg-[#E2136E] hover:bg-[#c40e5d] text-white text-[10px] font-semibold rounded shadow-2xs cursor-pointer flex items-center gap-0.5"
                                  >
                                    <span>{lang === 'bn' ? 'কিস্তি জমা' : 'Pay'}</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedLoanId(loan.loanId);
                                    setSubTab('sms');
                                    handleGenerateSms();
                                  }}
                                  className="px-2 py-0.5 bg-purple-100 hover:bg-purple-200 text-purple-900 text-[10px] font-medium rounded cursor-pointer"
                                  title="Generate SMS"
                                >
                                  <span>{lang === 'bn' ? 'তাগিদ SMS' : 'SMS'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onSelectBorrower(loan.personName)}
                                  className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-[10px] font-medium rounded cursor-pointer"
                                >
                                  <span>{lang === 'bn' ? 'খতিয়ানে দেখুন' : 'View'}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <span
                    className={`block text-[10px] mt-1.5 text-right ${
                      msg.sender === 'user' ? 'text-slate-400' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 text-xs shadow-2xs">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}
            {isSendingMessage && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-full bg-[#E2136E] text-white flex items-center justify-center shrink-0 text-xs font-bold animate-pulse">
                  AI
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-2.5 text-xs text-slate-500 shadow-2xs flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#E2136E]" />
                  <span>{lang === 'bn' ? 'উত্তর তৈরি হচ্ছে...' : 'AI is thinking...'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              placeholder={
                lang === 'bn'
                  ? 'লোন বা ঋণগ্রহীতা সম্পর্কে যেকোনো কিছু বাংলায় বা ইংরেজিতে লিখুন...'
                  : 'Ask about any loan, overdue status, or calculation...'
              }
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-[#E2136E] focus:ring-1 focus:ring-[#E2136E] bg-white shadow-inner"
            />
            <button
              type="submit"
              disabled={!userInput.trim() || isSendingMessage}
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#E2136E] hover:bg-[#c40e5d] rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">{lang === 'bn' ? 'পাঠান' : 'Send'}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: SMART PERSONALIZED SMS DRAFT GENERATOR */}
      {subTab === 'sms' && (
        <div className="p-4 sm:p-6 space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-[#E2136E]" />
              <span>{lang === 'bn' ? 'ঋণগ্রহীতার জন্য কাস্টমাইজড তাগিদ এসএমএস' : 'Smart SMS Reminder Generator'}</span>
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'bn'
                ? 'ঋণগ্রহীতা নির্বাচন করে বিনীত, আসন্ন কিস্তি অথবা জরুরি মেয়াদের স্টাইলে মুহূর্তেই বাংলা এসএমএস ড্রাফট তৈরি করুন'
                : 'Select a borrower and tone to generate personalized SMS drafts with exact amounts and deadlines'}
            </p>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {/* Borrower selector */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                {lang === 'bn' ? 'ঋণগ্রহীতা নির্বাচন করুন' : 'Select Borrower'}
              </label>
              <select
                value={selectedLoanId}
                onChange={e => setSelectedLoanId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:border-[#E2136E] bg-white"
              >
                {activeLoans.map(l => (
                  <option key={l.loanId} value={l.loanId}>
                    {l.personName} - {l.loanId} (Due: ৳{l.totalDue})
                  </option>
                ))}
              </select>
            </div>

            {/* Tone selector */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                {lang === 'bn' ? 'বার্তা বা টোনের ধরন' : 'Message Tone'}
              </label>
              <select
                value={smsTone}
                onChange={e => setSmsTone(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:border-[#E2136E] bg-white"
              >
                <option value="polite">{lang === 'bn' ? 'বিনীত ও বন্ধুত্বপূর্ণ তাগিদ' : 'Courteous & Polite Reminder'}</option>
                <option value="due_soon">{lang === 'bn' ? 'আসন্ন কিস্তি নোটিশ (Standard Alert)' : 'Upcoming Due Notice'}</option>
                <option value="urgent">{lang === 'bn' ? 'জরুরি মেয়াদোত্তীর্ণ নোটিশ (Urgent Warning)' : 'Urgent Overdue Warning'}</option>
              </select>
            </div>

            {/* Trigger Button */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleGenerateSms}
                disabled={isGeneratingSms || !selectedLoanId}
                className="w-full px-4 py-2 text-xs font-semibold text-white bg-[#E2136E] hover:bg-[#c40e5d] rounded-md transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isGeneratingSms ? (lang === 'bn' ? 'তৈরি হচ্ছে...' : 'Generating...') : (lang === 'bn' ? 'এসএমএস তৈরি করুন' : 'Generate SMS')}</span>
              </button>
            </div>
          </div>

          {/* Borrower Quick Status Card */}
          {currentSelectedLoan && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">{currentSelectedLoan.personName}</span>
                <span className="font-mono-numbers text-slate-500">({currentSelectedLoan.loanId})</span>
              </div>
              <div className="flex items-center gap-3">
                <span>
                  {lang === 'bn' ? 'এই মাসের কিস্তি:' : 'Current EMI:'}{' '}
                  <strong className="text-slate-900 font-mono-numbers">৳{currentSelectedLoan.currentMonthEmi}</strong>
                </span>
                <span>
                  {lang === 'bn' ? 'বকেয়া তারিখ:' : 'Due Date:'}{' '}
                  <strong className="text-[#E2136E] font-mono-numbers">{currentSelectedLoan.nextLoanSubmitDate}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => onPayLoan(currentSelectedLoan)}
                  className="px-2 py-0.5 text-[11px] font-semibold text-white bg-[#E2136E] rounded shadow-2xs hover:bg-[#c40e5d]"
                >
                  {lang === 'bn' ? 'কিস্তি জমা' : 'Pay'}
                </button>
              </div>
            </div>
          )}

          {/* Generated SMS Preview Box */}
          {generatedSms ? (
            <div className="p-4 bg-pink-50/50 border border-pink-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'bn' ? 'প্রস্তুতকৃত এসএমএস ড্রাফট:' : 'Generated SMS Preview:'}</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono-numbers">
                  {generatedSms.length} {lang === 'bn' ? 'অক্ষর' : 'chars'}
                </span>
              </div>

              <div className="p-3.5 bg-white border border-pink-200 rounded-lg text-xs sm:text-sm text-slate-800 leading-relaxed font-sans shadow-inner">
                {generatedSms}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="text-[11px] text-slate-500">
                  {lang === 'bn'
                    ? 'কপি করে সরাসরি বিকাশ এসএমএস বা হোয়াটসঅ্যাপে গ্রাহককে পাঠান।'
                    : 'Copy text to send via SMS or WhatsApp.'}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyGeneratedSms}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors cursor-pointer shadow-2xs"
                  >
                    {copiedSms ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSms ? (lang === 'bn' ? 'কপি হয়েছে!' : 'Copied!') : (lang === 'bn' ? 'এসএমএস কপি করুন' : 'Copy SMS')}</span>
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(generatedSms)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors cursor-pointer"
                  >
                    <span>{lang === 'bn' ? 'WhatsApp-এ পাঠান' : 'Share on WhatsApp'}</span>
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs">
              {lang === 'bn'
                ? 'ঋণগ্রহীতা নির্বাচন করে "এসএমএস তৈরি করুন" বাটনে ক্লিক করুন।'
                : 'Select a borrower above and click "Generate SMS" to preview the message.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
