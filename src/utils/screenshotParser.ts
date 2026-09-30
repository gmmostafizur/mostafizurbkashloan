import { LoanRecord } from '../types/loan';
import { bumpDateByOneMonth, formatDDMMYYYY, parseDDMMYYYY } from './dateUtils';

export interface ParsedScreenshotData {
  personName: string;
  loanId: string;
  totalPrincipal: number;
  totalDue: number;
  currentMonthEmi: number;
  secondMonthEmi: number;
  thirdMonthEmi: number;
  nextLoanSubmitDate: string;
  tenure: '3' | '2' | '1';
  notes: string;
  confidence: number;
  extractedFields: string[];
}

export function parseScreenshotText(rawText: string): ParsedScreenshotData {
  const text = rawText.trim();
  const lower = text.toLowerCase();
  const extractedFields: string[] = [];

  // Convert Bengali numerals to English numerals for easy parsing
  const banglaToEnglishMap: { [key: string]: string } = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
  };
  const normalizedText = text.replace(/[০-৯]/g, char => banglaToEnglishMap[char] || char);

  // 1. Extract Loan ID (18-digit sequence or sequence starting with 11000...)
  let loanId = '';
  const loanIdMatch = normalizedText.match(/\b(11\d{10,16})\b/);
  if (loanIdMatch) {
    loanId = loanIdMatch[1];
    extractedFields.push('Loan ID');
  }

  // 2. Extract Date in Month/Day/Year (MM/DD/YYYY) or "Oct 10, 2026"
  let nextDate = '';
  const dateMatch = normalizedText.match(/\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})\b/);
  if (dateMatch) {
    const rawDate = dateMatch[1].replace(/[\-\.]/g, '/');
    const parts = rawDate.split('/');
    let m = parts[0].padStart(2, '0');
    let d = parts[1].padStart(2, '0');
    const y = parts[2];
    
    // If first number > 12, it must be DD/MM/YYYY, so swap to MM/DD/YYYY
    if (parseInt(m, 10) > 12 && parseInt(d, 10) <= 12) {
      const temp = m;
      m = d;
      d = temp;
    }

    nextDate = `${m}/${d}/${y}`;
    extractedFields.push('Next Due Date');
  } else {
    // Try written month e.g. "October 10, 2026" or "10 Oct 2026"
    const monthNames: { [key: string]: string } = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    };
    
    const writtenDateMatch1 = normalizedText.match(/\b([a-zA-Z]{3,9})\s+(\d{1,2}),?\s+(\d{4})\b/i);
    const writtenDateMatch2 = normalizedText.match(/\b(\d{1,2})\s+([a-zA-Z]{3,9})\s+(\d{4})\b/i);

    if (writtenDateMatch1) {
      const mStr = writtenDateMatch1[1].toLowerCase().substring(0, 3);
      const m = monthNames[mStr] || '10';
      const d = writtenDateMatch1[2].padStart(2, '0');
      const y = writtenDateMatch1[3];
      nextDate = `${m}/${d}/${y}`;
      extractedFields.push('Next Due Date');
    } else if (writtenDateMatch2) {
      const d = writtenDateMatch2[1].padStart(2, '0');
      const mStr = writtenDateMatch2[2].toLowerCase().substring(0, 3);
      const m = monthNames[mStr] || '10';
      const y = writtenDateMatch2[3];
      nextDate = `${m}/${d}/${y}`;
      extractedFields.push('Next Due Date');
    }
  }

  // 3. Extract Person / Borrower Name
  let personName = '';
  // Check common labels: Borrower:, Name:, নাম:, গ্রহীতা:
  const nameLabelMatch = normalizedText.match(/(?:borrower|name|customer|নাম|ব্যক্তি|হিসাবধারী)\s*[:=\-]?\s*([A-Za-z\u0980-\u09FF\s]{2,30})/i);
  if (nameLabelMatch) {
    const candidate = nameLabelMatch[1].trim().split(/\n/)[0];
    if (candidate && !candidate.toLowerCase().includes('loan') && !candidate.toLowerCase().includes('bkash')) {
      personName = candidate;
      extractedFields.push('Borrower Name');
    }
  }

  // Fallback: check if standard known names exist
  if (!personName) {
    const knownBorrowers = ['Harun', 'Mostafizur', 'Musha', 'Sohel Apu', 'হারুন', 'মোস্তাফিজুর', 'মুশা', 'মুসা', 'সোহেল অপু'];
    for (const b of knownBorrowers) {
      if (normalizedText.toLowerCase().includes(b.toLowerCase())) {
        personName = b;
        extractedFields.push('Borrower Name');
        break;
      }
    }
  }

  // 4. Extract Amounts: Principal, Due, EMI
  let totalPrincipal = 0;
  let totalDue = 0;
  let currentEmi = 0;

  // Search for Principal (e.g. Principal:, Total Loan:, মূল ঋণ:, Disbursed:)
  const principalMatch = normalizedText.match(/(?:principal|total\s*loan|disbursed|amount|মূল\s*ঋণ|ঋণের\s*পরিমাণ)\s*[:=\-]?\s*(?:tk|৳|\$)?\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/i);
  if (principalMatch) {
    totalPrincipal = parseFloat(principalMatch[1].replace(/,/g, ''));
    extractedFields.push('Principal Amount');
  }

  // Search for Total Due (e.g. Due:, Outstanding:, মোট প্রদেয়:, মোট বকেয়া:, Total Payable:)
  const dueMatch = normalizedText.match(/(?:due|outstanding|total\s*due|payable|মোট\s*বকেয়া|প্রদেয়)\s*[:=\-]?\s*(?:tk|৳|\$)?\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/i);
  if (dueMatch) {
    totalDue = parseFloat(dueMatch[1].replace(/,/g, ''));
    extractedFields.push('Total Due');
  }

  // Search for EMI (e.g. EMI:, Monthly Installment:, মাসিক কিস্তি:, কিস্তি:)
  const emiMatch = normalizedText.match(/(?:emi|monthly\s*installment|installment|মাসিক\s*কিস্তি|কিস্তি)\s*[:=\-]?\s*(?:tk|৳|\$)?\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/i);
  if (emiMatch) {
    currentEmi = parseFloat(emiMatch[1].replace(/,/g, ''));
    extractedFields.push('Monthly EMI');
  }

  // If specific labels failed, collect all floating monetary values
  if (!totalPrincipal || !totalDue) {
    const monetaryMatches = normalizedText.match(/(?:৳|tk|\b)\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/gi) || [];
    const numbers: number[] = [];
    for (const m of monetaryMatches) {
      const clean = m.replace(/[^\d\.]/g, '');
      const num = parseFloat(clean);
      // Filter out long loan IDs or single digits
      if (!isNaN(num) && num >= 100 && clean.length <= 8) {
        if (!numbers.includes(num)) numbers.push(num);
      }
    }

    if (numbers.length >= 2) {
      numbers.sort((a, b) => b - a); // descending
      if (!totalDue) totalDue = numbers[0];
      if (!totalPrincipal) totalPrincipal = numbers[1];
    } else if (numbers.length === 1) {
      if (!totalPrincipal) totalPrincipal = numbers[0];
      if (!totalDue) totalDue = Number((numbers[0] * 1.03).toFixed(2));
    }
  }

  // Deduce or calculate missing amounts
  if (totalPrincipal > 0 && !totalDue) {
    totalDue = Number((totalPrincipal * 1.03).toFixed(2));
  }
  if (totalDue > 0 && !totalPrincipal) {
    totalPrincipal = Number((totalDue / 1.03).toFixed(2));
  }

  // Deduce tenure and EMIs
  let tenure: '3' | '2' | '1' = '3';
  if (normalizedText.includes('1 month') || normalizedText.includes('১ মাস') || normalizedText.includes('single')) {
    tenure = '1';
  } else if (normalizedText.includes('2 month') || normalizedText.includes('২ মাস')) {
    tenure = '2';
  } else if (currentEmi > 0 && totalDue > 0) {
    const ratio = Math.round(totalDue / currentEmi);
    if (ratio === 1) tenure = '1';
    else if (ratio === 2) tenure = '2';
    else tenure = '3';
  }

  let thirdMonthEmi = 0;
  let secondMonthEmi = 0;
  let currentMonthEmi = currentEmi;

  if (tenure === '3') {
    const splitEmi = Number((totalDue / 3).toFixed(2));
    currentMonthEmi = currentEmi > 0 ? currentEmi : splitEmi;
    secondMonthEmi = splitEmi;
    thirdMonthEmi = splitEmi;
  } else if (tenure === '2') {
    const splitEmi = Number((totalDue / 2).toFixed(2));
    currentMonthEmi = currentEmi > 0 ? currentEmi : splitEmi;
    secondMonthEmi = splitEmi;
    thirdMonthEmi = 0;
  } else {
    currentMonthEmi = totalDue;
    secondMonthEmi = 0;
    thirdMonthEmi = 0;
  }

  // Default date if none extracted
  if (!nextDate) {
    const fallback = new Date();
    fallback.setMonth(fallback.getMonth() + 1);
    nextDate = formatDDMMYYYY(fallback);
  }

  // If no loan ID, generate new one
  if (!loanId) {
    loanId = '1100000000' + Math.floor(10000000 + Math.random() * 90000000).toString();
  }

  // Calculate extraction confidence
  let confidence = 0.2;
  if (extractedFields.includes('Loan ID')) confidence += 0.3;
  if (extractedFields.includes('Principal Amount') || extractedFields.includes('Total Due')) confidence += 0.3;
  if (extractedFields.includes('Borrower Name')) confidence += 0.1;
  if (extractedFields.includes('Next Due Date')) confidence += 0.1;

  return {
    personName: personName || 'Borrower',
    loanId,
    totalPrincipal: totalPrincipal || 5000,
    totalDue: totalDue || 5150,
    currentMonthEmi,
    secondMonthEmi,
    thirdMonthEmi,
    nextLoanSubmitDate: nextDate,
    tenure,
    notes: 'Imported from bKash screenshot/text',
    confidence: Math.min(1, confidence),
    extractedFields,
  };
}
