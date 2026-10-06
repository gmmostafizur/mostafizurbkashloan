/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { LoanRecord, PaymentTransaction, Language } from './types/loan';
import {
  INITIAL_LOANS,
  INITIAL_TRANSACTIONS,
  getInitialLoansForPhone,
  getInitialTransactionsForPhone,
} from './data/initialLoans';
import { NavigationSidebar } from './components/NavigationSidebar';
import { StatsCards } from './components/StatsCards';
import { MonthlyCollectionGoal } from './components/MonthlyCollectionGoal';
import { InteractiveAnalyticsDashboard } from './components/InteractiveAnalyticsDashboard';
import { MonthlyCalendarView } from './components/MonthlyCalendarView';
import { QuickCommandBar } from './components/QuickCommandBar';
import { BorrowerBreakdown } from './components/BorrowerBreakdown';
import { LoansTable } from './components/LoansTable';
import { PaymentModal } from './components/PaymentModal';
import { ReceiptModal } from './components/ReceiptModal';
import { NewLoanModal } from './components/NewLoanModal';
import { TransactionLedger } from './components/TransactionLedger';
import { MonthlyReport } from './components/MonthlyReport';
import { MonthlyRolloverModal } from './components/MonthlyRolloverModal';
import { AILoanAdvisor } from './components/AILoanAdvisor';
import { AdminDashboard } from './components/AdminDashboard';
import { UserProfileView } from './components/UserProfileView';
import { MobileBottomNav } from './components/MobileBottomNav';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';
import { UserProfile } from './types/user';
import { ParsedCommandResult } from './utils/nlpParser';
import { parseScreenshotText, ParsedScreenshotData } from './utils/screenshotParser';
import {
  bumpDateByOneMonth,
  formatCurrency,
  isDateOverdue,
  getThreeMonthNames,
  getPaymentMonthName,
  executeLoansMonthlyRollover,
} from './utils/dateUtils';
import { exportLoansToCSV, exportLoansToPDF } from './utils/exportUtils';
import { getT } from './utils/translations';
import { CheckCircle2, RotateCcw, AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react';

const STORAGE_KEY_LOANS = 'mostafizur_bkash_loans_v2';
const STORAGE_KEY_TRANSACTIONS = 'mostafizur_bkash_tx_v2';
const STORAGE_KEY_LANG = 'mostafizur_bkash_lang_v2';
const STORAGE_KEY_USER = 'mostafizur_bkash_user_v2';
const STORAGE_KEY_DARK = 'mostafizur_bkash_dark_v2';
const STORAGE_KEY_VIEW = 'mostafizur_bkash_view_v2';

export default function App() {
  // User & Authentication state first
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  // Load state from localStorage or seed - strictly isolated per user!
  const [loans, setLoans] = useState<LoanRecord[]>(() => {
    try {
      const savedUserStr = localStorage.getItem(STORAGE_KEY_USER);
      const user = savedUserStr ? JSON.parse(savedUserStr) : null;
      if (user?.phone) {
        const saved = localStorage.getItem(`user_loans_${user.phone}`) || (user.phone === '01907239952' ? localStorage.getItem(STORAGE_KEY_LOANS) : null);
        if (saved) return JSON.parse(saved);
        return getInitialLoansForPhone(user.phone);
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_LOANS;
  });

  const [transactions, setTransactions] = useState<PaymentTransaction[]>(() => {
    try {
      const savedUserStr = localStorage.getItem(STORAGE_KEY_USER);
      const user = savedUserStr ? JSON.parse(savedUserStr) : null;
      if (user?.phone) {
        const saved = localStorage.getItem(`user_tx_${user.phone}`) || (user.phone === '01907239952' ? localStorage.getItem(STORAGE_KEY_TRANSACTIONS) : null);
        if (saved) return JSON.parse(saved);
        return getInitialTransactionsForPhone(user.phone);
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_TRANSACTIONS;
  });

  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LANG);
      if (saved === 'bn' || saved === 'en') return saved;
    } catch (e) {
      console.error(e);
    }
    return 'bn';
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'borrowers' | 'loans' | 'ledger' | 'report' | 'ai' | 'admin' | 'profile'>('dashboard');
  const [selectedBorrower, setSelectedBorrower] = useState<string | null>(null);

  // Once a user logs in, they CANNOT see landing page until they explicitly log out!
  const [showLandingPage, setShowLandingPage] = useState<boolean>(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY_USER);
      if (savedUser) return false;
      const saved = localStorage.getItem(STORAGE_KEY_VIEW);
      if (saved === 'dashboard') return false;
    } catch (e) {}
    return true;
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DARK);
      if (saved !== null) return JSON.parse(saved);
    } catch (e) {}
    return false;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Modals state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentTargetLoan, setPaymentTargetLoan] = useState<LoanRecord | null>(null);
  const [paymentInitialAmount, setPaymentInitialAmount] = useState<number | undefined>(undefined);
  const [paymentInitialNote, setPaymentInitialNote] = useState<string | undefined>(undefined);

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptTx, setReceiptTx] = useState<PaymentTransaction | null>(null);
  const [receiptLoan, setReceiptLoan] = useState<LoanRecord | null>(null);

  const [isNewLoanModalOpen, setIsNewLoanModalOpen] = useState(false);
  const [loanToEdit, setLoanToEdit] = useState<LoanRecord | null>(null);

  const [isRolloverModalOpen, setIsRolloverModalOpen] = useState(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const t = getT(lang);

  const isAdmin =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'manager' ||
    currentUser?.role === 'super_admin' ||
    currentUser?.phone === '01907239952' ||
    currentUser?.phone === '01613572749';
  const isReadOnly = !isAdmin;

  // Regular user restriction: "user ra sudhu tader loan, payment history, monthly report dekhte parbe ar kichu korte parbe na"
  useEffect(() => {
    if (isReadOnly && (activeTab === 'dashboard' || activeTab === 'borrowers' || activeTab === 'ai' || activeTab === 'admin')) {
      setActiveTab('loans');
    }
  }, [isReadOnly, activeTab]);

  // Persist state
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOANS, JSON.stringify(loans));
      if (currentUser?.phone) {
        localStorage.setItem(`user_loans_${currentUser.phone}`, JSON.stringify(loans));
      }
    } catch (e) {
      console.error(e);
    }
  }, [loans, currentUser?.phone]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
      if (currentUser?.phone) {
        localStorage.setItem(`user_tx_${currentUser.phone}`, JSON.stringify(transactions));
      }
    } catch (e) {
      console.error(e);
    }
  }, [transactions, currentUser?.phone]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LANG, lang);
    } catch (e) {
      console.error(e);
    }
  }, [lang]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEY_USER);
      }
    } catch (e) {}
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DARK, JSON.stringify(darkMode));
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {}
  }, [darkMode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_VIEW, showLandingPage ? 'landing' : 'dashboard');
    } catch (e) {}
  }, [showLandingPage]);

  // Sync loans to persistent server database whenever updated
  useEffect(() => {
    if (currentUser?.phone) {
      fetch('/api/user/sync-loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: currentUser.phone,
          loans,
          transactions,
        }),
      }).catch(err => console.warn('Database sync:', err));
    }
  }, [loans, transactions, currentUser?.phone]);

  // For regular users: auto-sync in real time from backend database so any Super Admin changes reflect instantly
  useEffect(() => {
    if (!currentUser?.phone || isAdmin) return;

    let isMounted = true;
    const fetchLatestUserLoans = async () => {
      try {
        const res = await fetch(`/api/user/${currentUser.phone}`);
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data?.success && data?.user) {
          if (Array.isArray(data.user.loans)) {
            setLoans(data.user.loans);
            try {
              localStorage.setItem(`user_loans_${currentUser.phone}`, JSON.stringify(data.user.loans));
            } catch (e) {}
          }
          if (Array.isArray(data.user.transactions)) {
            setTransactions(data.user.transactions);
            try {
              localStorage.setItem(`user_tx_${currentUser.phone}`, JSON.stringify(data.user.transactions));
            } catch (e) {}
          }
        }
      } catch (err) {
        // quiet fallback
      }
    };

    // Polling interval: every 4 seconds and whenever tab/window gets focus
    const interval = setInterval(fetchLatestUserLoans, 4000);
    window.addEventListener('focus', fetchLatestUserLoans);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', fetchLatestUserLoans);
    };
  }, [currentUser?.phone, isAdmin]);

  // Dynamic directory of existing borrowers for Super Admin loan assignment
  const existingBorrowers = useMemo(() => {
    const list: Array<{ name: string; phone?: string }> = [
      { name: 'Harun', phone: '01533271817' },
      { name: 'Sohel Apu', phone: '01830026574' },
      { name: 'Musha', phone: '01888141176' },
      { name: 'Mostafizur Rahman', phone: '01907239952' },
    ];
    loans.forEach(l => {
      if (l.personName && !list.some(b => b.name.toLowerCase() === l.personName.toLowerCase())) {
        list.push({ name: l.personName, phone: l.borrowerPhone });
      }
    });
    return list;
  }, [loans]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Record user action to backend activity log
  const recordActivity = (action: string, description: string, metadata?: any) => {
    fetch('/api/activity/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: currentUser?.phone || '01907239952',
        action,
        description,
        metadata,
      }),
    }).catch(err => console.warn('Activity log error:', err));
  };

  // Reset database back to exact 12 initial loans
  const handleResetData = () => {
    if (window.confirm(lang === 'bn' ? 'আপনি কি ডাটাবেজ রিসেট করে ১২টি আদি লোনে ফিরিয়ে নিতে চান?' : 'Reset database to original 12 bKash loan records?')) {
      setLoans(INITIAL_LOANS);
      setTransactions(INITIAL_TRANSACTIONS);
      setSelectedBorrower(null);
      showToast(lang === 'bn' ? 'ডাটাবেজ সফলভাবে রিসেট করা হয়েছে!' : 'Initial database restored successfully!');
    }
  };

  // 1. PAYMENT UPDATES & AUTOMATIC RECALCULATION
  const handleConfirmPayment = (
    loanId: string,
    amount: number,
    paymentDate: string,
    method: 'bKash' | 'Cash' | 'Bank',
    referenceId: string,
    note: string
  ) => {
    if (isReadOnly) {
      showToast(lang === 'bn' ? 'ব্যবহারকারী পেমেন্ট করতে পারবেন না। শুধুমাত্র লোনের তথ্য দেখার অনুমতি রয়েছে।' : 'Users cannot make payments. View-only access.');
      return;
    }
    const loanIndex = loans.findIndex(l => l.loanId === loanId);
    if (loanIndex === -1) return;

    const oldLoan = loans[loanIndex];
    const prevDue = oldLoan.totalDue;
    const prevDate = oldLoan.nextLoanSubmitDate;
    const loanMonths = getThreeMonthNames(prevDate, lang);

    // Recalculate Total Due
    const newTotalDue = Math.max(0, Number((prevDue - amount).toFixed(2)));

    // EMI calculation according to user specification:
    // "current month a payment kora hoye gele seta 2nd month er amount ta sekhanei thakbe. erpor month change hole current month sei month cole asbe ebong sei month er EMI ta asbe. mane je maser payment sei mas dekhabe."
    let newCurrentEmi = oldLoan.currentMonthEmi;
    let newSecondEmi = oldLoan.secondMonthEmi;
    let newThirdEmi = oldLoan.thirdMonthEmi;

    const isFullSettlement = amount >= oldLoan.totalDue || newTotalDue <= 0;
    const targetMonthLabel = isFullSettlement
      ? (lang === 'bn' ? `সকল কিস্তি পূর্ণ পরিশোধ (${loanMonths.month1Short}, ${loanMonths.month2Short}, ${loanMonths.month3Short})` : `Full Settlement (${loanMonths.month1Short}, ${loanMonths.month2Short}, ${loanMonths.month3Short})`)
      : loanMonths.month1;

    if (amount >= oldLoan.currentMonthEmi) {
      // Current month installment is PAID!
      const excess = amount - oldLoan.currentMonthEmi;
      newCurrentEmi = 0; // Current month cleared

      // 2nd and 3rd month EMI STAY IN THEIR PLACES (not shifted prematurely!)
      // Excess payment deducts from upcoming months
      if (excess > 0) {
        if (excess >= newSecondEmi) {
          const excess2 = excess - newSecondEmi;
          newSecondEmi = 0;
          if (excess2 > 0) {
            newThirdEmi = Math.max(0, Number((newThirdEmi - excess2).toFixed(2)));
          }
        } else {
          newSecondEmi = Number((newSecondEmi - excess).toFixed(2));
        }
      }
    } else {
      // Partial payment on current month EMI
      newCurrentEmi = Math.max(0, Number((newCurrentEmi - amount).toFixed(2)));
    }

    // If total due is 0, clear all EMIs
    if (newTotalDue <= 0) {
      newCurrentEmi = 0;
      newSecondEmi = 0;
      newThirdEmi = 0;
    }

    // User requirement: When payment is made in the current month, the 2nd month amount stays right there in 2nd month.
    // The submit date stays anchored to the current month's billing cycle so Current Month shows as Paid (৳0),
    // and 2nd Month EMI remains in 2nd Month. Only when month changes (or on rollover) does it advance to the next month!
    const newNextDate = prevDate;

    const updatedLoan: LoanRecord = {
      ...oldLoan,
      totalDue: newTotalDue,
      currentMonthEmi: newCurrentEmi,
      secondMonthEmi: newSecondEmi,
      thirdMonthEmi: newThirdEmi,
      nextLoanSubmitDate: newNextDate,
      status: newTotalDue <= 0 ? 'paid' : 'active',
      lastPaymentDate: paymentDate,
    };

    // Update loans array
    const updatedLoans = [...loans];
    updatedLoans[loanIndex] = updatedLoan;
    setLoans(updatedLoans);

    // Create Transaction Record with targetMonth
    const newTx: PaymentTransaction = {
      id: `TXN-${Date.now()}`,
      loanId: oldLoan.loanId,
      personName: oldLoan.personName,
      amount,
      paymentDate,
      timestamp: new Date().toISOString(),
      previousDue: prevDue,
      newDue: newTotalDue,
      previousNextDate: prevDate,
      newNextDate,
      targetMonth: targetMonthLabel,
      method,
      referenceId: referenceId || `BKASH-${Date.now().toString().slice(-6)}`,
      note: note || (lang === 'bn' ? `${oldLoan.personName}-এর ${targetMonthLabel} কিস্তি জমা ৳${amount.toFixed(2)}` : `Payment of ৳${amount.toFixed(2)} for ${targetMonthLabel}`),
    };

    setTransactions([newTx, ...transactions]);

    // Show toast and open receipt
    showToast(
      lang === 'bn'
        ? `${oldLoan.personName}-এর ${targetMonthLabel} কিস্তি ৳${amount.toFixed(2)} জমা হয়েছে! ২য় মাসের কিস্তি (${loanMonths.month2}) অপরিবর্তিত রয়েছে।`
        : `Payment of ৳${amount.toFixed(2)} for ${targetMonthLabel} recorded for ${oldLoan.personName}! 2nd month EMI (${loanMonths.month2}) stays in place.`
    );

    setReceiptTx(newTx);
    setReceiptLoan(updatedLoan);
    setIsReceiptModalOpen(true);

    recordActivity('PAYMENT', `${oldLoan.personName}-এর বিকাশ লোনে ${targetMonthLabel} কিস্তি ৳${amount.toFixed(2)} জমা হয়েছে (বকেয়া: ৳${newTotalDue})`, {
      loanId,
      amount,
      borrower: oldLoan.personName,
      targetMonth: targetMonthLabel,
    });
  };

  // Open Payment Modal for specific loan
  const handlePayLoan = (loan: LoanRecord, fullSettlement = false) => {
    if (isReadOnly) {
      showToast(lang === 'bn' ? 'ব্যবহারকারী পেমেন্ট করতে পারবেন না। শুধুমাত্র লোনের তথ্য দেখার অনুমতি রয়েছে।' : 'Users cannot make payments. View-only access.');
      return;
    }
    setPaymentTargetLoan(loan);
    setPaymentInitialAmount(fullSettlement ? loan.totalDue : loan.currentMonthEmi);
    setPaymentInitialNote(
      fullSettlement
        ? `Full settlement for Loan ID ${loan.loanId}`
        : `EMI installment payment for Loan ID ${loan.loanId}`
    );
    setIsPaymentModalOpen(true);
  };

  // View Receipt for loan
  const handleViewReceiptForLoan = (loan: LoanRecord) => {
    const matchingTx = transactions.find(t => t.loanId === loan.loanId);
    setReceiptTx(matchingTx || null);
    setReceiptLoan(loan);
    setIsReceiptModalOpen(true);
  };

  // Save new or edited loan with immediate real-time sync to User ID
  const handleSaveLoan = async (loanRecord: LoanRecord) => {
    try {
      const res = await fetch('/api/admin/save-loan-and-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: currentUser?.phone || '01907239952',
          role: currentUser?.role || 'admin',
          loan: loanRecord,
        }),
      });
      const data = await res.json();
      if (data?.success && Array.isArray(data.masterLoans)) {
        setLoans(data.masterLoans);
        showToast(
          lang === 'bn'
            ? `💾 লোন (${loanRecord.loanId}) সফলভাবে সেভ হয়েছে এবং ${loanRecord.personName}-এর আইডিতে রিয়েল-টাইমে পৌঁছে গেছে!`
            : `💾 Loan (${loanRecord.loanId}) saved and real-time synced to ${loanRecord.personName}'s account!`
        );
      } else {
        const index = loans.findIndex(l => l.loanId === loanRecord.loanId || l.id === loanRecord.id);
        if (index >= 0) {
          const copy = [...loans];
          copy[index] = loanRecord;
          setLoans(copy);
        } else {
          setLoans([loanRecord, ...loans]);
        }
        showToast(lang === 'bn' ? 'লোন তথ্য সংরক্ষিত হয়েছে' : 'Loan record updated');
      }
    } catch (e) {
      console.error(e);
      const index = loans.findIndex(l => l.loanId === loanRecord.loanId || l.id === loanRecord.id);
      if (index >= 0) {
        const copy = [...loans];
        copy[index] = loanRecord;
        setLoans(copy);
      } else {
        setLoans([loanRecord, ...loans]);
      }
      showToast(lang === 'bn' ? 'লোন তথ্য হালনাগাদ করা হয়েছে' : 'Loan record updated');
    }
    recordActivity(
      'SAVE_LOAN',
      `${loanRecord.personName}-এর বিকাশ লোন (${loanRecord.loanId}) সেভ ও ইউজারের আইডিতে রিয়েল-টাইমে সিঙ্ক করা হয়েছে`,
      { loanId: loanRecord.loanId, person: loanRecord.personName }
    );
    setLoanToEdit(null);
  };

  // Bulk Save and Real-Time Sync to all user accounts
  const handleSaveAllToUsers = async () => {
    try {
      const res = await fetch('/api/admin/save-and-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: currentUser?.phone || '01907239952',
          role: currentUser?.role || 'admin',
          loans,
          transactions,
          changeDescription: 'সুপার অ্যাডমিন কর্তৃক সকল লোন এক ক্লিকে সকল ইউজারের আইডিতে সেভ ও রিয়েল-টাইমে সিঙ্ক করা হয়েছে',
        }),
      });
      const data = await res.json();
      if (data?.success) {
        if (Array.isArray(data.masterLoans)) {
          setLoans(data.masterLoans);
        }
        showToast(
          lang === 'bn'
            ? '✅ সফলভাবে সকল লোন ডাটাবেজে সেভ হয়েছে এবং সকল ইউজারের আইডিতে রিয়েল-টাইমে সিঙ্ক সম্পন্ন হয়েছে!'
            : '✅ All loans successfully saved and real-time synced to all user accounts!'
        );
      } else {
        showToast(lang === 'bn' ? 'ডাটাবেজে সেভ সম্পন্ন হয়েছে' : 'Saved to database');
      }
    } catch (e) {
      showToast(lang === 'bn' ? 'ডাটাবেজে সেভ সম্পন্ন হয়েছে' : 'Saved to database');
    }
  };

  // Edit loan
  const handleEditLoan = (loan: LoanRecord) => {
    setLoanToEdit(loan);
    setIsNewLoanModalOpen(true);
  };

  // Delete loan (Super Admin full authority)
  const handleDeleteLoan = (loanId: string) => {
    if (window.confirm(lang === 'bn' ? 'সুপার অ্যাডমিন: আপনি কি নিশ্চিত যে এই লোন রেকর্ডটি সম্পূর্ণ মুছে ফেলতে চান? এটি সংশ্লিষ্ট ইউজারের অ্যাকাউন্ট থেকেও মুছে যাবে।' : 'Super Admin: Permanently delete this loan record? It will be removed from the borrower account as well.')) {
      const target = loans.find(l => l.loanId === loanId);
      const filtered = loans.filter(l => l.loanId !== loanId);
      setLoans(filtered);
      showToast(lang === 'bn' ? 'লোন সফলভাবে মুছে ফেলা হয়েছে এবং সংশ্লিষ্ট ইউজারের অ্যাকাউন্টে সিন্ক হয়েছে' : 'Loan deleted successfully & synced across accounts');
      if (target) {
        recordActivity('DELETE_LOAN', `${target.personName}-এর লোন (${loanId}) মুছে ফেলা হয়েছে`, { loanId, person: target.personName });
      }
    }
  };

  // Open New Loan Modal pre-filled from attached screenshot
  const handleNewLoanFromScreenshot = (data: ParsedScreenshotData) => {
    const candidateLoan: LoanRecord = {
      id: data.loanId,
      personName: data.personName,
      loanId: data.loanId,
      totalPrincipalLoan: data.totalPrincipal,
      totalDue: data.totalDue,
      originalTotalDue: data.totalDue,
      currentMonthEmi: data.currentMonthEmi,
      secondMonthEmi: data.secondMonthEmi,
      thirdMonthEmi: data.thirdMonthEmi,
      nextLoanSubmitDate: data.nextLoanSubmitDate,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      notes: data.notes || 'Imported from attached screenshot',
    };
    setLoanToEdit(candidateLoan);
    setIsNewLoanModalOpen(true);
    showToast(
      lang === 'bn'
        ? `সংযুক্ত স্ক্রিনশটের তথ্য দিয়ে ${data.personName}-এর নতুন লোন ফরম প্রস্তুত করা হয়েছে`
        : `New loan form pre-filled from attached screenshot for ${data.personName}`
    );
  };

  // Monthly Rollover Execution: Advances month for paid loans and audits dues
  const handleExecuteRollover = async () => {
    const { updatedLoans, rolledOverCount, overdueCount } = executeLoansMonthlyRollover(loans);
    setLoans(updatedLoans);

    // Save and sync to backend / users in real-time
    try {
      await fetch('/api/admin/save-and-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: currentUser?.phone || '01907239952',
          role: currentUser?.role || 'admin',
          loans: updatedLoans,
          transactions,
          changeDescription: `মাসিক রোল-ওভার প্রয়োগ: ${rolledOverCount}টি লোন নতুন মাসে স্থানান্তরিত, ${overdueCount}টি ওভারডিউ চিহ্নিত`,
        }),
      });
    } catch (e) {
      console.warn('Rollover sync error:', e);
    }

    recordActivity(
      'ROLLOVER',
      `মাসিক রোল-ওভার সম্পন্ন: ${rolledOverCount}টি লোন পরবর্তী মাসে স্থানান্তরিত এবং ${overdueCount}টি ওভারডিউ নিরীক্ষিত`
    );

    showToast(
      lang === 'bn'
        ? `✅ মাসিক রোল-ওভার সম্পন্ন! ${rolledOverCount}টি লোনের ২য় মাসের কিস্তি বর্তমান মাসে চলে এসেছে এবং শিডিউল আপডেট হয়েছে।`
        : `✅ Monthly rollover complete! ${rolledOverCount} loans advanced to current month.`
    );
  };

  // Handle Natural Language Commands
  const handleExecuteCommand = (result: ParsedCommandResult) => {
    if (result.action === 'PAYMENT' && result.payload) {
      const targetLoan = result.payload.targetLoan;
      const amt = result.payload.amount;

      if (targetLoan) {
        setPaymentTargetLoan(targetLoan);
        setPaymentInitialAmount(amt || targetLoan.currentMonthEmi);
        setPaymentInitialNote(result.payload.note || 'bKash quick payment');
        setIsPaymentModalOpen(true);
      } else if (result.payload.loanId) {
        const found = loans.find(l => l.loanId === result.payload!.loanId);
        if (found) {
          setPaymentTargetLoan(found);
          setPaymentInitialAmount(amt || found.currentMonthEmi);
          setIsPaymentModalOpen(true);
        } else {
          showToast(lang === 'bn' ? 'লোন আইডি পাওয়া যায়নি' : 'Loan ID not found');
        }
      } else {
        setIsPaymentModalOpen(true);
      }
    } else if (result.action === 'SEARCH_BORROWER' && result.payload?.personName) {
      setSelectedBorrower(result.payload.personName);
      setActiveTab('borrowers');
      showToast(
        lang === 'bn'
          ? `${result.payload.personName}-এর সকল লোন ও বকেয়া দেখানো হচ্ছে`
          : `Showing all dues for ${result.payload.personName}`
      );
    } else if (result.action === 'FILTER_STATUS') {
      setActiveTab('loans');
    } else if (result.action === 'ROLLOVER') {
      setIsRolloverModalOpen(true);
    } else if (result.action === 'EXPORT_CSV') {
      exportLoansToCSV(loans, lang);
      showToast(lang === 'bn' ? 'সিএসভি ফাইল ডাউনলোড হচ্ছে...' : 'Exporting loan ledger CSV file...');
    } else if (result.action === 'EXPORT_PDF') {
      exportLoansToPDF(loans, lang);
      showToast(lang === 'bn' ? 'পিডিএফ অডিট রিপোর্ট ডাউনলোড হচ্ছে...' : 'Generating loan ledger PDF document...');
    }
  };

  // User Authentication Handlers
  const handleLoginSuccess = (user: UserProfile, userLoans?: any, userTx?: any) => {
    setCurrentUser(user);
    if (user.darkMode !== undefined) setDarkMode(user.darkMode);
    setShowLandingPage(false);

    if (user.role === 'admin' && user.phone === '01613572749') {
      // Super Admin platform console
      setLoans([]);
      setTransactions([]);
      setActiveTab('admin');
    } else {
      // Resolve loans for this account:
      // Priority 1: Backend payload (if non-empty)
      // Priority 2: Stored localStorage for this phone
      // Priority 3: Preset account loans (Mostafizur has all 12, Harun has his 4, Sohel Apu has 1, Musha has 1)
      const savedLoansStr = localStorage.getItem(`user_loans_${user.phone}`) || (user.phone === '01907239952' ? localStorage.getItem(STORAGE_KEY_LOANS) : null);
      const resolvedLoans = (userLoans && userLoans.length > 0)
        ? userLoans
        : (savedLoansStr ? JSON.parse(savedLoansStr) : getInitialLoansForPhone(user.phone));

      const savedTxStr = localStorage.getItem(`user_tx_${user.phone}`) || (user.phone === '01907239952' ? localStorage.getItem(STORAGE_KEY_TRANSACTIONS) : null);
      const resolvedTx = (userTx && userTx.length > 0)
        ? userTx
        : (savedTxStr ? JSON.parse(savedTxStr) : getInitialTransactionsForPhone(user.phone));

      setLoans(resolvedLoans);
      setTransactions(resolvedTx);
      const isUserAdmin = user.role === 'admin' || user.phone === '01907239952' || user.phone === '01613572749';
      setActiveTab(isUserAdmin ? 'dashboard' : 'loans');

      try {
        localStorage.setItem(`user_loans_${user.phone}`, JSON.stringify(resolvedLoans));
        localStorage.setItem(`user_tx_${user.phone}`, JSON.stringify(resolvedTx));
      } catch (e) {}
    }

    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEY_VIEW, 'dashboard');
    } catch (e) {}

    showToast(
      lang === 'bn'
        ? `স্বাগতম, ${user.name}! লগইন সফল হয়েছে।`
        : `Welcome, ${user.name}! Logged in successfully.`
    );
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoans([]);
    setTransactions([]);
    setShowLandingPage(true);
    setActiveTab('dashboard');
    try {
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.setItem(STORAGE_KEY_VIEW, 'landing');
    } catch (e) {}
    showToast(lang === 'bn' ? 'লগআউট সম্পন্ন হয়েছে' : 'Logged out successfully');
  };

  // Once logged in, user CANNOT access landing page or login/registration without logging out first
  if (showLandingPage && !currentUser) {
    return (
      <>
        <LandingPage
          lang={lang}
          setLang={setLang}
          currentUser={currentUser}
          onOpenAuth={(mode) => {
            setAuthModalMode(mode || 'login');
            setIsAuthModalOpen(true);
          }}
          onEnterDashboard={() => setShowLandingPage(false)}
          onLoginSuccess={handleLoginSuccess}
          onLogout={handleLogout}
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          lang={lang}
          initialMode={authModalMode}
          onLoginSuccess={handleLoginSuccess}
        />

        {toastMessage && (
          <div className="no-print fixed bottom-5 right-5 z-50 max-w-md bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2.5 animate-in slide-in-from-bottom-3 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row font-sans transition-colors">
      {/* Computer Screens: Left Side Navigation Panel (NO top bar on computer screens!) */}
      <NavigationSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        setLang={setLang}
        currentUser={currentUser}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        isReadOnly={isReadOnly}
        onOpenPaymentModal={() => {
          if (isReadOnly) return;
          setPaymentTargetLoan(null);
          setPaymentInitialAmount(undefined);
          setPaymentInitialNote(undefined);
          setIsPaymentModalOpen(true);
        }}
        onOpenNewLoanModal={() => {
          if (isReadOnly) return;
          setLoanToEdit(null);
          setIsNewLoanModalOpen(true);
        }}
        onOpenRolloverModal={() => {
          if (isReadOnly) return;
          setIsRolloverModalOpen(true);
        }}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Workspace Container (Right side on desktop, full width on mobile) */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="no-print fixed bottom-5 right-5 z-50 max-w-md bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-lg shadow-xl border border-slate-700 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            {receiptTx && (
              <button
                onClick={() => setIsReceiptModalOpen(true)}
                className="shrink-0 px-2.5 py-1 text-[11px] font-semibold text-white bg-[#E2136E] hover:bg-[#c40e5d] rounded transition-colors cursor-pointer shadow-2xs ml-2"
              >
                {lang === 'bn' ? 'রশিদ দেখুন' : 'View Receipt'}
              </button>
            )}
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6 space-y-6">
          {/* Top natural language query & search bar - for Managers only */}
          {!isReadOnly && (
            <QuickCommandBar
              loans={loans}
              lang={lang}
              onExecuteCommand={handleExecuteCommand}
              onDirectSearch={(query) => {
                setSelectedBorrower(query);
                setActiveTab('loans');
              }}
              onNewLoanFromScreenshot={handleNewLoanFromScreenshot}
            />
          )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* AI Assistant Quick Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-3.5 sm:p-4 rounded-xl shadow-xs border border-purple-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-pink-500 to-purple-500 flex items-center justify-center shadow-xs shrink-0">
                  <Sparkles className="w-4 h-4 text-white animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm">
                      {lang === 'bn' ? 'AI লোন কোপাইলট ও রিকভারি উপদেষ্টা' : 'AI Loan Copilot & Advisory Assistant'}
                    </span>
                    <span className="text-[10px] bg-pink-500/30 text-pink-300 border border-pink-500/40 px-2 py-0.5 rounded-full font-medium">
                      Gemini 3.8
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    {lang === 'bn'
                      ? 'পোর্টফোলিও রিস্ক অ্যানালাইসিস, গ্রাহকদের জন্য এসএমএস ড্রাফট ও কিস্তি আদায় কৌশল পান'
                      : 'Get real-time risk audit, automated borrower reminder SMS, and collection advice'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('ai')}
                className="px-3.5 py-1.5 bg-[#E2136E] hover:bg-[#c40e5d] text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer self-start sm:self-auto flex items-center gap-1.5"
              >
                <span>{lang === 'bn' ? 'AI ওপেন করুন' : 'Open AI Copilot'}</span>
                <span className="text-sm">→</span>
              </button>
            </div>

            {/* Visual Dashboard Widgets */}
            <StatsCards
              loans={loans}
              transactions={transactions}
              lang={lang}
              onFilterOverdue={() => {
                setActiveTab('loans');
              }}
              onFilterDueSoon={() => {
                setActiveTab('loans');
              }}
            />

            {/* Monthly Collection Goal & Target Progress */}
            <MonthlyCollectionGoal
              transactions={transactions}
              loans={loans}
              lang={lang}
            />

            {/* Interactive Modern Visual Graphics, Charts & Borrower Distribution Map */}
            <InteractiveAnalyticsDashboard
              loans={loans}
              transactions={transactions}
              lang={lang}
              onPayLoan={(l, full) => handlePayLoan(l, full)}
              onViewReceipt={handleViewReceiptForLoan}
              onSelectBorrowerFilter={(name) => {
                setSelectedBorrower(name);
                setActiveTab('loans');
              }}
            />

            {/* Monthly Calendar View (Payment schedule for current month) */}
            <MonthlyCalendarView
              loans={loans}
              lang={lang}
              onPayLoan={(l) => handlePayLoan(l, false)}
              onSelectBorrower={(b) => setSelectedBorrower(b)}
            />

            {/* If borrower is filtered, show detailed borrower breakdown */}
            {selectedBorrower && (
              <BorrowerBreakdown
                personName={selectedBorrower}
                loans={loans}
                lang={lang}
                onPayLoan={(l) => handlePayLoan(l, false)}
                onViewReceipt={handleViewReceiptForLoan}
                onClearFilter={() => setSelectedBorrower(null)}
              />
            )}

            {/* Main Loans Table */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  {lang === 'bn' ? 'বর্তমান মাস বিকাশ লোন তালিকা' : 'Active bKash Loans & Dues'}
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{loans.length} {lang === 'bn' ? 'টি লোন অ্যাকাউন্ট' : 'Loan Accounts'}</span>
                  <span>·</span>
                  <button
                    onClick={handleResetData}
                    className="hover:text-slate-900 text-slate-500 underline flex items-center gap-1"
                    title="Reset to 12 original records"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{t.resetDemoData}</span>
                  </button>
                </div>
              </div>

              <LoansTable
                loans={loans}
                lang={lang}
                selectedBorrower={selectedBorrower}
                setSelectedBorrower={setSelectedBorrower}
                onPayLoan={handlePayLoan}
                onViewReceipt={handleViewReceiptForLoan}
                onEditLoan={handleEditLoan}
                onDeleteLoan={isAdmin ? handleDeleteLoan : undefined}
                isReadOnly={isReadOnly}
                onSaveLoan={handleSaveLoan}
              />
            </div>
          </div>
        )}

        {/* Borrowers View Tab */}
        {activeTab === 'borrowers' && !isReadOnly && (
          <div className="space-y-6">
            {/* Borrower selector bar */}
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-700 block mb-2">
                {lang === 'bn' ? 'ঋণগ্রহীতা নির্বাচন করুন:' : 'Select Borrower to View Profile & Dues:'}
              </span>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(loans.map(l => l.personName))).map((name) => {
                  const bLoans = loans.filter(l => l.personName === name && l.status !== 'paid');
                  const isSelected = selectedBorrower === name;
                  return (
                    <button
                      key={name}
                      onClick={() => setSelectedBorrower(name)}
                      className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#E2136E] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>{name}</span>
                      <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                        ({bLoans.length} active)
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedBorrower ? (
              <BorrowerBreakdown
                personName={selectedBorrower}
                loans={loans}
                lang={lang}
                onPayLoan={(l) => handlePayLoan(l, false)}
                onViewReceipt={handleViewReceiptForLoan}
                onClearFilter={() => setSelectedBorrower(null)}
              />
            ) : (
              <div className="space-y-4">
                {Array.from(new Set(loans.map(l => l.personName))).map((name) => (
                  <BorrowerBreakdown
                    key={name}
                    personName={name}
                    loans={loans}
                    lang={lang}
                    onPayLoan={(l) => handlePayLoan(l, false)}
                    onViewReceipt={handleViewReceiptForLoan}
                    onClearFilter={() => {}}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* All Loans Tab */}
        {activeTab === 'loans' && (
          <div className="space-y-4">
            <LoansTable
              loans={loans}
              lang={lang}
              selectedBorrower={selectedBorrower}
              setSelectedBorrower={setSelectedBorrower}
              onPayLoan={handlePayLoan}
              onViewReceipt={handleViewReceiptForLoan}
              onEditLoan={handleEditLoan}
              onDeleteLoan={isAdmin ? handleDeleteLoan : undefined}
              isReadOnly={isReadOnly}
              onSaveLoan={handleSaveLoan}
            />
          </div>
        )}

        {/* Transaction Ledger Tab */}
        {activeTab === 'ledger' && (
          <TransactionLedger
            transactions={transactions}
            lang={lang}
            onViewReceipt={(tx) => {
              setReceiptTx(tx);
              const matching = loans.find(l => l.loanId === tx.loanId);
              setReceiptLoan(matching || null);
              setIsReceiptModalOpen(true);
            }}
          />
        )}

        {/* Monthly Report Tab */}
        {activeTab === 'report' && (
          <MonthlyReport
            loans={loans}
            transactions={transactions}
            lang={lang}
            onSelectBorrower={(name) => {
              setSelectedBorrower(name);
              setActiveTab('borrowers');
            }}
          />
        )}

        {/* AI Copilot & Financial Advisor Tab */}
        {activeTab === 'ai' && (
          <AILoanAdvisor
            loans={loans}
            transactions={transactions}
            lang={lang}
            onPayLoan={(l) => handlePayLoan(l, false)}
            onSelectBorrower={(name) => {
              setSelectedBorrower(name);
              setActiveTab('loans');
            }}
          />
        )}

        {/* Admin Control Center Tab (for Admin) */}
        {activeTab === 'admin' && currentUser && (
          <AdminDashboard
            lang={lang}
            currentUser={currentUser}
          />
        )}

        {/* User Profile View Tab */}
        {activeTab === 'profile' && currentUser && (
          <UserProfileView
            lang={lang}
            currentUser={currentUser}
            onUpdateUser={(updated) => {
              setCurrentUser(updated);
              showToast(
                lang === 'bn'
                  ? 'প্রোফাইল তথ্য সফলভাবে আপডেট হয়েছে!'
                  : 'Profile updated successfully!'
              );
            }}
            onLogout={handleLogout}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            loans={loans}
            transactions={transactions}
          />
        )}
      </main>

      {/* Modals */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        loans={loans}
        initialLoan={paymentTargetLoan}
        initialAmount={paymentInitialAmount}
        initialNote={paymentInitialNote}
        lang={lang}
        onConfirmPayment={handleConfirmPayment}
      />

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        transaction={receiptTx}
        loan={receiptLoan}
        lang={lang}
      />

      <NewLoanModal
        isOpen={isNewLoanModalOpen}
        onClose={() => setIsNewLoanModalOpen(false)}
        loanToEdit={loanToEdit}
        lang={lang}
        onSaveLoan={handleSaveLoan}
        existingBorrowers={existingBorrowers}
      />

      <MonthlyRolloverModal
        isOpen={isRolloverModalOpen}
        onClose={() => setIsRolloverModalOpen(false)}
        loans={loans}
        lang={lang}
        onExecuteRollover={handleExecuteRollover}
      />

      {/* User Settings Modal */}
      {currentUser && (
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          lang={lang}
          currentUser={currentUser}
          onUpdateUser={(updated) => {
            setCurrentUser(updated);
            showToast(
              lang === 'bn'
                ? 'প্রোফাইল ও সেটিংস সফলভাবে আপডেট হয়েছে!'
                : 'Profile & settings updated successfully!'
            );
          }}
          onLogout={handleLogout}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        lang={lang}
        initialMode={authModalMode}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Footer */}
      <footer className="no-print mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 text-center text-xs text-slate-500 mb-14 md:mb-0 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Mostafizur bKash Loan Management System</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            {lang === 'bn'
              ? 'বিকাশ ক্ষুদ্রঋণ কিস্তি ট্র্যাকিং ও হিসাব ব্যবস্থাপনা'
              : 'Automated Micro-loan EMI calculations & schedule synchronization'}
          </div>
        </div>
      </footer>
      </div>

      {/* Mobile Bottom Navigation Dock */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        onOpenPaymentModal={() => {
          if (isReadOnly) return;
          setPaymentTargetLoan(null);
          setPaymentInitialAmount(undefined);
          setPaymentInitialNote(undefined);
          setIsPaymentModalOpen(true);
        }}
        overdueCount={loans.filter(l => l.totalDue > 0 && isDateOverdue(l.nextLoanSubmitDate)).length}
        isAdmin={isAdmin}
        isReadOnly={isReadOnly}
        onOpenProfile={() => setActiveTab('profile')}
      />
    </div>
  );
}
