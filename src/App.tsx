/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LoanRecord, PaymentTransaction, Language } from './types/loan';
import { INITIAL_LOANS, INITIAL_TRANSACTIONS } from './data/initialLoans';
import { Navbar } from './components/Navbar';
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
import { bumpDateByOneMonth, formatCurrency, isDateOverdue } from './utils/dateUtils';
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
  // Load state from localStorage or seed
  const [loans, setLoans] = useState<LoanRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOANS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_LOANS;
  });

  const [transactions, setTransactions] = useState<PaymentTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
      if (saved) return JSON.parse(saved);
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

  // User & Authentication state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const [showLandingPage, setShowLandingPage] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VIEW);
      if (saved === 'dashboard') return false;
      if (saved === 'landing') return true;
    } catch (e) {}
    // If not logged in, show landing page first!
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

  // Persist state
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOANS, JSON.stringify(loans));
    } catch (e) {
      console.error(e);
    }
  }, [loans]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.error(e);
    }
  }, [transactions]);

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
    const loanIndex = loans.findIndex(l => l.loanId === loanId);
    if (loanIndex === -1) return;

    const oldLoan = loans[loanIndex];
    const prevDue = oldLoan.totalDue;
    const prevDate = oldLoan.nextLoanSubmitDate;

    // Recalculate Total Due
    const newTotalDue = Math.max(0, Number((prevDue - amount).toFixed(2)));

    // Shift EMI schedule
    let newCurrentEmi = oldLoan.currentMonthEmi;
    let newSecondEmi = oldLoan.secondMonthEmi;
    let newThirdEmi = oldLoan.thirdMonthEmi;

    if (amount >= oldLoan.currentMonthEmi) {
      // Shift installments forward
      const excess = amount - oldLoan.currentMonthEmi;
      newCurrentEmi = oldLoan.secondMonthEmi;
      newSecondEmi = oldLoan.thirdMonthEmi;
      newThirdEmi = 0;

      // If excess payment exists, deduct from upcoming EMIs
      if (excess > 0 && newCurrentEmi > 0) {
        if (excess >= newCurrentEmi) {
          const excess2 = excess - newCurrentEmi;
          newCurrentEmi = newSecondEmi;
          newSecondEmi = 0;
          if (excess2 > 0 && newCurrentEmi > 0) {
            newCurrentEmi = Math.max(0, Number((newCurrentEmi - excess2).toFixed(2)));
          }
        } else {
          newCurrentEmi = Number((newCurrentEmi - excess).toFixed(2));
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

    // Bump Next Loan Submit Date by +1 month
    const newNextDate = bumpDateByOneMonth(prevDate);

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

    // Create Transaction Record
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
      method,
      referenceId: referenceId || `BKASH-${Date.now().toString().slice(-6)}`,
      note: note || `Payment of ৳${amount.toFixed(2)} received`,
    };

    setTransactions([newTx, ...transactions]);

    // Show toast and open receipt
    showToast(
      lang === 'bn'
        ? `${oldLoan.personName}-এর জন্য ৳${amount.toFixed(2)} জমা হয়েছে! পরবর্তী জমা তারিখ: ${newNextDate}`
        : `Payment of ৳${amount.toFixed(2)} recorded for ${oldLoan.personName}! Next submit date bumped to ${newNextDate}`
    );

    setReceiptTx(newTx);
    setReceiptLoan(updatedLoan);
    setIsReceiptModalOpen(true);

    recordActivity('PAYMENT', `${oldLoan.personName}-এর বিকাশ লোনে ৳${amount.toFixed(2)} কিস্তি জমা হয়েছে (বকেয়া: ৳${newTotalDue})`, {
      loanId,
      amount,
      borrower: oldLoan.personName,
    });
  };

  // Open Payment Modal for specific loan
  const handlePayLoan = (loan: LoanRecord, fullSettlement = false) => {
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

  // Save new or edited loan
  const handleSaveLoan = (loanRecord: LoanRecord) => {
    const index = loans.findIndex(l => l.loanId === loanRecord.loanId || l.id === loanRecord.id);
    if (index >= 0) {
      const copy = [...loans];
      copy[index] = loanRecord;
      setLoans(copy);
      showToast(lang === 'bn' ? 'লোন তথ্য হালনাগাদ করা হয়েছে' : 'Loan record updated successfully');
    } else {
      setLoans([loanRecord, ...loans]);
      showToast(lang === 'bn' ? 'নতুন লোন যুক্ত করা হয়েছে' : 'New loan record added successfully');
    }
    recordActivity(
      index >= 0 ? 'EDIT_LOAN' : 'NEW_LOAN',
      `${loanRecord.personName}-এর বিকাশ লোন (${loanRecord.loanId}) ${index >= 0 ? 'সংশোধন' : 'নতুন যুক্ত'} করা হয়েছে`,
      { loanId: loanRecord.loanId, person: loanRecord.personName }
    );
    setLoanToEdit(null);
  };

  // Edit loan
  const handleEditLoan = (loan: LoanRecord) => {
    setLoanToEdit(loan);
    setIsNewLoanModalOpen(true);
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

  // Monthly Rollover Execution
  const handleExecuteRollover = () => {
    const updated = loans.map(loan => {
      if (loan.status === 'paid' || loan.totalDue <= 0) return loan;

      const overdue = isDateOverdue(loan.nextLoanSubmitDate);
      if (overdue) {
        return {
          ...loan,
          status: 'overdue' as const,
        };
      }
      return loan;
    });

    setLoans(updated);
    recordActivity('ROLLOVER', 'মাসিক রোল-ওভার এবং কিস্তির শিডিউল নিরীক্ষা সফলভাবে সম্পন্ন হয়েছে');
    showToast(
      lang === 'bn'
        ? 'মাসিক রোল-ওভার সমাপ্ত হয়েছে। বকেয়া কিস্তিসমূহ সফলভাবে নিরীক্ষিত হয়েছে।'
        : 'Monthly rollover audit complete! Installment statuses updated.'
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
  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    if (user.darkMode !== undefined) setDarkMode(user.darkMode);
    setShowLandingPage(false);
    showToast(
      lang === 'bn'
        ? `স্বাগতম, ${user.name}! লগইন সফল হয়েছে।`
        : `Welcome, ${user.name}! Logged in successfully.`
    );
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowLandingPage(true);
    showToast(lang === 'bn' ? 'লগআউট সম্পন্ন হয়েছে' : 'Logged out successfully');
  };

  if (showLandingPage) {
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        setLang={setLang}
        currentUser={currentUser}
        onOpenPaymentModal={() => {
          setPaymentTargetLoan(null);
          setPaymentInitialAmount(undefined);
          setPaymentInitialNote(undefined);
          setIsPaymentModalOpen(true);
        }}
        onOpenNewLoanModal={() => {
          setLoanToEdit(null);
          setIsNewLoanModalOpen(true);
        }}
        onOpenRolloverModal={() => setIsRolloverModalOpen(true)}
        onResetData={handleResetData}
        onExportCSV={() => exportLoansToCSV(loans, lang)}
        onExportPDF={() => exportLoansToPDF(loans, lang)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenAuth={() => {
          setAuthModalMode('login');
          setIsAuthModalOpen(true);
        }}
        onGoToLanding={() => setShowLandingPage(true)}
      />

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
        {/* Top natural language query & search bar */}
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
              />
            </div>
          </div>
        )}

        {/* Borrowers View Tab */}
        {activeTab === 'borrowers' && (
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
            loans={loans}
            transactions={transactions}
            onSelectBorrower={(name) => {
              setSelectedBorrower(name);
              setActiveTab('borrowers');
            }}
            onPayLoan={(l) => handlePayLoan(l, false)}
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
      <footer className="no-print mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 mb-14 md:mb-0">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-slate-600 font-medium">
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

      {/* Mobile Bottom Navigation Dock */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        onOpenPaymentModal={() => {
          setPaymentTargetLoan(null);
          setPaymentInitialAmount(undefined);
          setPaymentInitialNote(undefined);
          setIsPaymentModalOpen(true);
        }}
        overdueCount={loans.filter(l => l.totalDue > 0 && isDateOverdue(l.nextLoanSubmitDate)).length}
        isAdmin={currentUser?.role === 'admin' || currentUser?.phone === '01613572749'}
        onOpenProfile={() => setActiveTab('profile')}
      />
    </div>
  );
}
