import { Language } from '../types/loan';

export const translations = {
  en: {
    appTitle: 'Mostafizur bKash Loan Management Software',
    appSubtitle: 'Automated Loan Tracking, EMI Recalculation & Monthly Rollover System',
    navDashboard: 'Dashboard',
    navBorrowers: 'Borrowers',
    navLoans: 'All Loans',
    navLedger: 'Transaction Ledger',
    navReport: 'Monthly Report',
    
    // Stats
    totalOutstanding: 'Total Outstanding Due',
    totalPrincipal: 'Total Principal Disbursed',
    activeBorrowers: 'Active Borrowers',
    activeLoansCount: 'Active Loans',
    collectionThisMonth: 'Recorded Collections',
    dueWithin7Days: 'Due Within 14 Days',
    overdueLoans: 'Overdue Installments',
    
    // Quick Actions
    recordPayment: 'Record Payment',
    addNewLoan: 'Add New Loan',
    monthlyRollover: 'Monthly Rollover',
    resetDemoData: 'Reset Initial DB',
    exportCsv: 'Export CSV',
    printReport: 'Print Report',
    
    // Natural Language Search / Command
    aiCommandPlaceholder: 'Type natural command: e.g. "Harun paid 515.25 for Loan ID 110000000044166811 today" or "Show all dues for Mostafizur"...',
    aiCommandRun: 'Execute Command',
    aiCommandQuickPrompts: 'Quick Actions:',
    
    // Table Columns
    colPerson: 'Borrower',
    colLoanId: 'Loan ID',
    colPrincipal: 'Total Principal',
    colThirdEmi: '3rd Mo EMI',
    colSecondEmi: '2nd Mo EMI',
    colCurrentEmi: 'Current Mo EMI',
    colTotalDue: 'Total Due',
    colPaidProgress: 'Repayment Progress',
    colNextDate: 'Next Submit Date',
    colStatus: 'Status',
    colActions: 'Actions',
    
    // Statuses
    statusActive: 'Active',
    statusDueSoon: 'Due Soon',
    statusOverdue: 'Overdue',
    statusPaid: 'Settled',
    
    // Search & Filter
    searchPlaceholder: 'Search by person name or loan ID...',
    allBorrowers: 'All Borrowers',
    filterAll: 'All Loans',
    filterActive: 'Active Dues',
    filterOverdue: 'Overdue',
    filterDueSoon: 'Due Soon (≤14d)',
    filterSettled: 'Fully Settled',
    
    // Borrower breakdown
    borrowerBreakdownTitle: 'Borrower Summary Report',
    borrowerTotalLoans: 'Total Loans',
    borrowerTotalPrincipal: 'Total Principal Taken',
    borrowerTotalDue: 'Total Due Remaining',
    borrowerEarliestDate: 'Earliest Due Date',
    
    // Modals
    payModalTitle: 'Record bKash Loan Payment',
    selectLoan: 'Select Loan',
    paymentAmount: 'Payment Amount (৳)',
    paymentDate: 'Payment Date (MM/DD/YYYY)',
    paymentMethod: 'Payment Method',
    referenceId: 'bKash TrxID / Ref',
    paymentNote: 'Note / Reason',
    previewRecalc: 'Recalculation Preview',
    beforePayment: 'Current Due',
    afterPayment: 'Remaining Due',
    currentDateLabel: 'Current Next Date',
    bumpedDateLabel: 'Updated Next Date',
    confirmPaymentBtn: 'Confirm & Update Due',
    cancel: 'Cancel',
    
    // Receipt
    receiptTitle: 'bKash Loan Repayment Voucher',
    receiptTagline: 'Official Micro-loan Repayment Confirmation Slip',
    receiptPrint: 'Print Slip',
    receiptCopySms: 'Copy SMS Format',
    receiptClose: 'Close',
    
    // Notifications & Feedback
    paymentSuccess: 'Payment recorded successfully! Next submit date bumped & dues recalculated.',
    errorInvalidLoan: 'Could not find matching loan ID or borrower name.',
    errorInvalidAmount: 'Please specify a valid payment amount.',
    commandProcessed: 'Command processed successfully',
    
    // Language Toggle
    toggleLang: 'বাংলায় দেখুন',
  },
  bn: {
    appTitle: 'মোস্তাফিজুর বিকাশ লোন ম্যানেজমেন্ট সফটওয়্যার',
    appSubtitle: 'স্বয়ংক্রিয় লোন ট্র্যাকিং, ইএমআই পুনঃহিসাব এবং মাসিক রোল-ওভার সিস্টেম',
    navDashboard: 'ড্যাশবোর্ড',
    navBorrowers: 'ঋণগ্রহীতারা',
    navLoans: 'সকল লোন',
    navLedger: 'লেনদেন খতিয়ান',
    navReport: 'মাসিক রিপোর্ট',
    
    // Stats
    totalOutstanding: 'মোট বকেয়া লোন',
    totalPrincipal: 'মোট আসল লোন প্রদান',
    activeBorrowers: 'সক্রিয় ঋণগ্রহীতা',
    activeLoansCount: 'সক্রিয় লোনের সংখ্যা',
    collectionThisMonth: 'মোট আদায়কৃত কিস্তি',
    dueWithin7Days: '১৪ দিনের মধ্যে প্রদেয়',
    overdueLoans: 'মেয়াদোত্তীর্ণ কিস্তি',
    
    // Quick Actions
    recordPayment: 'কিস্তি জমা করুন',
    addNewLoan: 'নতুন লোন যোগ করুন',
    monthlyRollover: 'মাসিক রোল-ওভার',
    resetDemoData: 'আদি ডাটাবেজ রিসেট',
    exportCsv: 'এক্সপোর্ট সিএসভি',
    printReport: 'রিপোর্ট প্রিন্ট',
    
    // Natural Language Search / Command
    aiCommandPlaceholder: 'কমান্ড লিখুন: যেমন "Harun paid 515.25 for Loan ID 110000000044166811 today" অথবা "Show all dues for Mostafizur"...',
    aiCommandRun: 'প্রয়োগ করুন',
    aiCommandQuickPrompts: 'কুইক অ্যাকশন:',
    
    // Table Columns
    colPerson: 'ঋণগ্রহীতার নাম',
    colLoanId: 'লোন আইডি',
    colPrincipal: 'মূল লোন',
    colThirdEmi: '৩য় মাসের কিস্তি',
    colSecondEmi: '২য় মাসের কিস্তি',
    colCurrentEmi: 'বর্তমান মাসের কিস্তি',
    colTotalDue: 'মোট বকেয়া',
    colPaidProgress: 'পরিশোধ অগ্রগতি',
    colNextDate: 'পরবর্তী জমা তারিখ',
    colStatus: 'স্ট্যাটাস',
    colActions: 'কার্যক্রম',
    
    // Statuses
    statusActive: 'এই মাসের কিস্তি',
    statusDueSoon: 'আসন্ন কিস্তি',
    statusOverdue: 'মেয়াদোত্তীর্ণ',
    statusPaid: 'পরিশোধিত',
    
    // Search & Filter
    searchPlaceholder: 'নাম অথবা লোন আইডি দিয়ে খুঁজুন...',
    allBorrowers: 'সকল ঋণগ্রহীতা',
    filterAll: 'সকল লোন',
    filterActive: 'এই মাসের কিস্তি',
    filterOverdue: 'মেয়াদোত্তীর্ণ',
    filterDueSoon: 'আসন্ন কিস্তি',
    filterSettled: 'সম্পূর্ণ পরিশোধিত',
    
    // Borrower breakdown
    borrowerBreakdownTitle: 'ঋণগ্রহীতার বিস্তারিত লোন বিবরণী',
    borrowerTotalLoans: 'মোট লোনের সংখ্যা',
    borrowerTotalPrincipal: 'গৃহীত মূল লোন',
    borrowerTotalDue: 'অবশিষ্ট মোট বকেয়া',
    borrowerEarliestDate: 'নিকটতম জমা তারিখ',
    
    // Modals
    payModalTitle: 'বিকাশ লোন কিস্তি পরিশোধ এন্ট্রি',
    selectLoan: 'লোন নির্বাচন করুন',
    paymentAmount: 'পরিশোধের পরিমাণ (৳)',
    paymentDate: 'পরিশোধের তারিখ (মাস/দিন/বছর - MM/DD/YYYY)',
    paymentMethod: 'পরিশোধ মাধ্যম',
    referenceId: 'বিকাশ TrxID / রেফারেন্স',
    paymentNote: 'মন্তব্য / বিবরণ',
    previewRecalc: 'হিসাব পরিবর্তনের প্রিভিউ',
    beforePayment: 'বর্তমান বকেয়া',
    afterPayment: 'পরিশোধ পরবর্তী বকেয়া',
    currentDateLabel: 'বর্তমান জমা তারিখ',
    bumpedDateLabel: 'নতুন পরবর্তী জমা তারিখ',
    confirmPaymentBtn: 'নিশ্চিত করুন ও বকেয়া আপডেট করুন',
    cancel: 'বাতিল',
    
    // Receipt
    receiptTitle: 'বিকাশ লোন পরিশোধ মানি রিসিট',
    receiptTagline: 'অফিসিয়াল ক্ষুদ্রঋণ কিস্তি পরিশোধ নিশ্চিতকরণ ভাউচার',
    receiptPrint: 'রিসিট প্রিন্ট',
    receiptCopySms: 'এসএমএস ফরম্যাট কপি',
    receiptClose: 'বন্ধ করুন',
    
    // Notifications & Feedback
    paymentSuccess: 'কিস্তি সফলভাবে জমা হয়েছে! পরবর্তী জমা তারিখ এগিয়ে গেছে এবং বকেয়া পুনঃহিসাব করা হয়েছে।',
    errorInvalidLoan: 'সঠিক লোন আইডি অথবা ঋণগ্রহীতার নাম পাওয়া যায়নি।',
    errorInvalidAmount: 'অনুগ্রহ করে সঠিক টাকার পরিমাণ উল্লেখ করুন।',
    commandProcessed: 'কমান্ড সফলভাবে কার্যকর করা হয়েছে',
    
    // Language Toggle
    toggleLang: 'View in English',
  },
};

export function getT(lang: Language) {
  return translations[lang] || translations.en;
}
