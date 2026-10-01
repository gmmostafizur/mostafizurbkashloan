import { LoanRecord } from '../types/loan';

export interface ParsedCommandResult {
  action: 'PAYMENT' | 'SEARCH_BORROWER' | 'FILTER_STATUS' | 'ROLLOVER' | 'EXPORT_CSV' | 'EXPORT_PDF' | 'UNKNOWN';
  payload?: {
    personName?: string;
    loanId?: string;
    amount?: number;
    targetLoan?: LoanRecord;
    filterQuery?: string;
    statusFilter?: 'all' | 'active' | 'overdue' | 'due_soon' | 'paid';
    note?: string;
  };
  explanationEn: string;
  explanationBn: string;
  confidence: number;
}

export function parseNaturalLanguageCommand(
  rawInput: string,
  loans: LoanRecord[]
): ParsedCommandResult {
  const input = rawInput.trim();
  if (!input) {
    return {
      action: 'UNKNOWN',
      explanationEn: 'Please enter a command or query.',
      explanationBn: 'অনুগ্রহ করে একটি নির্দেশ বা সার্চ কুয়েরি লিখুন।',
      confidence: 0,
    };
  }

  const lower = input.toLowerCase();

  // 1. Dynamic Borrower Search / Dues View
  // Extract all distinct borrower names dynamically from the database
  const distinctBorrowers = Array.from(new Set(loans.map(l => l.personName)));
  const banglaBorrowerMap: { [key: string]: string } = {
    'মুশা': 'Musha',
    'মুসা': 'Musha',
    'সোহেল অপু': 'Sohel Apu',
    'সোহেল': 'Sohel Apu',
    'হারুন': 'Harun',
    'মোস্তাফিজুর': 'Mostafizur',
    'মুস্তাফিজুর': 'Mostafizur',
  };

  // Check Bangla borrower name matches
  for (const [bnName, enName] of Object.entries(banglaBorrowerMap)) {
    if (input.includes(bnName)) {
      const actual = distinctBorrowers.find(b => b.toLowerCase().includes(enName.toLowerCase())) || enName;
      return {
        action: 'SEARCH_BORROWER',
        payload: { personName: actual, filterQuery: actual },
        explanationEn: `Filtering all active loans & dues for ${actual}.`,
        explanationBn: `${actual}-এর সকল বর্তমান মাস লোন ও বকেয়ার বিস্তারিত বিবরণ প্রদর্শিত হচ্ছে।`,
        confidence: 0.98,
      };
    }
  }

  // Check dynamic borrower names in English
  for (const bName of distinctBorrowers) {
    const bLower = bName.toLowerCase();
    if (
      lower.includes(bLower) ||
      bLower.includes(lower) ||
      lower.split(/\s+/).some(part => part.length >= 3 && bLower.includes(part))
    ) {
      return {
        action: 'SEARCH_BORROWER',
        payload: { personName: bName, filterQuery: bName },
        explanationEn: `Filtering all active loans & dues for ${bName}.`,
        explanationBn: `${bName}-এর সকল বর্তমান মাস লোন ও বকেয়া প্রদর্শিত হচ্ছে।`,
        confidence: 0.95,
      };
    }
  }

  // 2. Check for Overdue Filter
  if (
    lower.includes('overdue') ||
    lower.includes('বকেয়া মেয়াদোত্তীর্ণ') ||
    lower.includes('লেট কিস্তি') ||
    lower.includes('expired')
  ) {
    return {
      action: 'FILTER_STATUS',
      payload: { statusFilter: 'overdue' },
      explanationEn: 'Showing all overdue loans and missed installments.',
      explanationBn: 'সকল মেয়াদোত্তীর্ণ ও বকেয়া কিস্তি তালিকাভুক্ত করা হচ্ছে।',
      confidence: 0.9,
    };
  }

  // 3. Check for Payment Entry
  // e.g., "Musha paid 1236.58 TK for October"
  // "Harun paid 515.25 for Loan ID 110000000044166811 today"
  // "Pay 1236.58 for loan 110000000044657590"
  // "Paid 500 for Harun"
  const isPaymentIntent =
    lower.includes('paid') ||
    lower.includes('pay') ||
    lower.includes('payment') ||
    lower.includes('পরিশোধ') ||
    lower.includes('জমা') ||
    lower.includes('দিয়েছে');

  // Extract Loan ID (18 digits or 10+ digits starting with 11)
  const loanIdMatch = input.match(/\b(11\d{10,16})\b/);
  const loanId = loanIdMatch ? loanIdMatch[1] : undefined;

  // Extract Amount (e.g. 1236.58, 515.25, 1000, 3,765.46)
  // Look for number following "paid", "৳", "tk", or standalone decimal/number
  const amountMatch = input.match(/(?:paid|pay|৳|tk|টাকা|\$)?\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)\s*(?:tk|taka|bdt|৳|টাকা)?/i);
  let parsedAmount: number | undefined;

  // Let's refine amount extraction
  // Avoid taking the loan ID as the amount!
  const numberTokens = input.match(/\b\d+(?:\.\d+)?\b/g) || [];
  for (const token of numberTokens) {
    // If it's a long number, it's likely a loan ID
    if (token.length > 8) continue;
    const num = parseFloat(token);
    if (!isNaN(num) && num > 0) {
      parsedAmount = num;
      break;
    }
  }

  // Fallback for amount with commas e.g. 1,236.58
  if (!parsedAmount && amountMatch) {
    const rawNum = amountMatch[1].replace(/,/g, '');
    const num = parseFloat(rawNum);
    if (!isNaN(num) && rawNum.length < 9) {
      parsedAmount = num;
    }
  }

  // Detect Borrower Name in input
  let detectedBorrower: string | undefined;
  for (const bName of distinctBorrowers) {
    if (lower.includes(bName.toLowerCase())) {
      detectedBorrower = bName;
      break;
    }
  }
  if (!detectedBorrower) {
    for (const [bnName, enName] of Object.entries(banglaBorrowerMap)) {
      if (input.includes(bnName)) {
        detectedBorrower = enName;
        break;
      }
    }
  }

  if (isPaymentIntent && (parsedAmount || loanId || detectedBorrower)) {
    // Find candidate loan
    let targetLoan: LoanRecord | undefined;

    if (loanId) {
      targetLoan = loans.find(l => l.loanId === loanId);
    }

    if (!targetLoan && detectedBorrower) {
      // Find candidate loan for this borrower
      const borrowerLoans = loans.filter(
        l => l.personName.toLowerCase() === detectedBorrower!.toLowerCase() && l.status !== 'paid'
      );
      if (borrowerLoans.length === 1) {
        targetLoan = borrowerLoans[0];
      } else if (borrowerLoans.length > 1 && parsedAmount) {
        // Find loan matching EMI or Total Due closely
        targetLoan = borrowerLoans.find(
          l =>
            Math.abs(l.currentMonthEmi - parsedAmount!) < 1 ||
            Math.abs(l.totalDue - parsedAmount!) < 1
        ) || borrowerLoans[0];
      } else {
        targetLoan = borrowerLoans[0];
      }
    }

    return {
      action: 'PAYMENT',
      payload: {
        personName: targetLoan?.personName || detectedBorrower,
        loanId: targetLoan?.loanId || loanId,
        amount: parsedAmount,
        targetLoan,
        note: input,
      },
      explanationEn: targetLoan && parsedAmount
        ? `Payment detected: ${targetLoan.personName} paying ৳${parsedAmount.toFixed(2)} for Loan ID ${targetLoan.loanId}.`
        : `Payment intent recognized. Ready to apply payment.`,
      explanationBn: targetLoan && parsedAmount
        ? `কিস্তি পরিশোধ সনাক্ত: ${targetLoan.personName}-এর লোন আইডি ${targetLoan.loanId}-তে ৳${parsedAmount.toFixed(2)} জমা করার প্রস্তুতি।`
        : `কিস্তি পরিশোধ নির্দেশ সনাক্ত করা হয়েছে।`,
      confidence: 0.9,
    };
  }

  // 4. Check for Rollover Command
  if (lower.includes('rollover') || lower.includes('রোল ওভার') || lower.includes('মাস পরিবর্তন')) {
    return {
      action: 'ROLLOVER',
      explanationEn: 'Triggering monthly rollover check for all active loans.',
      explanationBn: 'সকল বর্তমান মাস লোনের শিডিউল রোল-ওভার চালু করা হচ্ছে।',
      confidence: 0.85,
    };
  }

  // 5. Check for Export PDF / CSV
  if (lower.includes('pdf') || lower.includes('পিডিএফ') || lower.includes('print ledger') || lower.includes('download pdf')) {
    return {
      action: 'EXPORT_PDF',
      explanationEn: 'Generating and downloading current loan ledger PDF document.',
      explanationBn: 'বর্তমান লোন লেজারের পিডিএফ ডকুমেন্ট তৈরি করে ডাউনলোড করা হচ্ছে।',
      confidence: 0.95,
    };
  }

  if (lower.includes('csv') || lower.includes('সিএসভি') || lower.includes('excel') || lower.includes('spreadsheet') || lower.includes('এক্সপোর্ট')) {
    return {
      action: 'EXPORT_CSV',
      explanationEn: 'Exporting current loan ledger to CSV file.',
      explanationBn: 'বর্তমান লোন লেজার সিএসভি ফাইল হিসেবে এক্সপোর্ট করা হচ্ছে।',
      confidence: 0.95,
    };
  }

  // Default Search fallback
  return {
    action: 'SEARCH_BORROWER',
    payload: { filterQuery: input },
    explanationEn: `Searching database for "${input}"...`,
    explanationBn: `ডাটাবেজে "${input}" অনুসন্ধান করা হচ্ছে...`,
    confidence: 0.5,
  };
}
