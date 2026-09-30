import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json({ limit: '15mb' }));

// Initialize Google GenAI with API key from environment
let aiClient: GoogleGenAI | null = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    aiClient = new GoogleGenAI({ apiKey });
  } else {
    aiClient = new GoogleGenAI({});
  }
} catch (err) {
  console.warn('Google GenAI initialization warning:', err);
}

// 1. AI Portfolio Health Audit & Collection Strategy Endpoint
app.post('/api/ai/advisor', async (req, res) => {
  try {
    const { loans, transactions, lang = 'bn' } = req.body;

    if (!loans || !Array.isArray(loans)) {
      return res.status(400).json({ error: 'Loans data is required' });
    }

    const totalPrincipal = loans.reduce((s: number, l: any) => s + (l.totalPrincipalLoan || 0), 0);
    const totalDue = loans.reduce((s: number, l: any) => s + (l.totalDue || 0), 0);
    const activeLoans = loans.filter((l: any) => l.totalDue > 0 && l.status !== 'paid');
    const overdueLoans = activeLoans.filter((l: any) => {
      if (!l.nextLoanSubmitDate) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [d, m, y] = l.nextLoanSubmitDate.split('/').map(Number);
      const target = new Date(y, m - 1, d);
      return target < today;
    });

    const currentMonthEmiTotal = activeLoans.reduce((s: number, l: any) => s + (l.currentMonthEmi || 0), 0);
    const totalCollected = (transactions || []).reduce((s: number, t: any) => s + (t.amount || 0), 0);

    const prompt = `You are an expert micro-finance and loan risk manager advising Mostafizur on managing bKash micro-loans.
Analyze the following portfolio data and provide a concise, high-value strategy report.

Portfolio Overview:
- Total Loan Accounts: ${loans.length}
- Active Accounts: ${activeLoans.length}
- Total Principal Disbursed: ৳${totalPrincipal.toFixed(2)}
- Total Outstanding Balance Due: ৳${totalDue.toFixed(2)}
- This Month Scheduled EMI: ৳${currentMonthEmiTotal.toFixed(2)}
- Total Payments Already Collected: ৳${totalCollected.toFixed(2)}
- Overdue Accounts (${overdueLoans.length}): ${overdueLoans.map((l: any) => `${l.personName} (Due ৳${l.totalDue}, Target: ${l.nextLoanSubmitDate})`).join(', ') || 'None'}

Response requirements:
- Language: Output in ${lang === 'bn' ? 'Bengali (বাংলা)' : 'English'}.
- Tone: Professional, encouraging, clear, and actionable.
- Format:
  1. 📌 Executive Health Summary (পোর্টফোলিও সার্বিক অবস্থা)
  2. ⚠️ High-Priority Risks & Overdue Strategy (মেয়াদোত্তীর্ণ ও ঝুঁকিপূর্ণ লোন আদায় কৌশল)
  3. 💡 Recommended Next Actions for This Week (এই সপ্তাহের জন্য করণীয় পদক্ষেপ)`;

    if (aiClient) {
      try {
        const response = await aiClient.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: prompt,
        });

        if (response?.text) {
          return res.json({
            analysis: response.text,
            metrics: {
              activeCount: activeLoans.length,
              overdueCount: overdueLoans.length,
              totalDue,
              currentMonthEmiTotal,
              totalCollected,
            },
          });
        }
      } catch (apiErr) {
        console.warn('Gemini API call failed, falling back to intelligent heuristic analysis:', apiErr);
      }
    }

    // Algorithmic fallback if AI client is unavailable
    const fallbackText = lang === 'bn'
      ? `### 📌 পোর্টফোলিও সার্বিক অবস্থা
আপনার অধীনে বর্তমানে মোট ${loans.length}টি লোন রয়েছে, যার মধ্যে ${activeLoans.length}টি লোন সক্রিয়। সর্বমোট অবশিষ্ট বকেয়া ৳${totalDue.toLocaleString('en-US', { minimumFractionDigits: 2 })} এবং এই মাসে প্রদেয় কিস্তি ৳${currentMonthEmiTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}।

### ⚠️ ঝুঁকিপূর্ণ লোন আদায় কৌশল
${overdueLoans.length > 0 ? `বর্তমানে ${overdueLoans.length}টি লোন নির্ধারিত সময় পার করেছে (${overdueLoans.map((l: any) => l.personName).join(', ')})। এদের সাথে দ্রুত যোগাযোগ করে কিস্তি জমা নিশ্চিত করুন।` : 'বর্তমানে কোনো মেয়াদোত্তীর্ণ লোন নেই। সকল ঋণগ্রহীতা নির্ধারিত সময়ের মধ্যে রয়েছেন।'}

### 💡 এই সপ্তাহের জন্য করণীয়
১. চলতি সপ্তাহের মধ্যে যেসব লোনের কিস্তির তারিখ আসছে, তাদের বিকাশ পেমেন্টের রিমাইন্ডার এসএমএস প্রেরণ করুন।
২. কিস্তি জমা হওয়ার সাথে সাথে সিস্টেমে এন্ট্রি দিয়ে ডিজিটাল রিসিট সংরক্ষণ করুন।`
      : `### 📌 Portfolio Health Summary
You have ${loans.length} loan accounts with ${activeLoans.length} active. Total outstanding balance is ৳${totalDue.toFixed(2)} with ৳${currentMonthEmiTotal.toFixed(2)} scheduled for current month EMI.

### ⚠️ Risk Mitigation
${overdueLoans.length > 0 ? `Currently ${overdueLoans.length} accounts are overdue. Immediate follow-up is recommended for: ${overdueLoans.map((l: any) => l.personName).join(', ')}.` : 'Great job! Zero accounts are currently overdue.'}

### 💡 Action Items
1. Send reminder messages for upcoming installments.
2. Record repayments in the ledger to auto-update next submit dates.`;

    return res.json({
      analysis: fallbackText,
      metrics: {
        activeCount: activeLoans.length,
        overdueCount: overdueLoans.length,
        totalDue,
        currentMonthEmiTotal,
        totalCollected,
      },
    });
  } catch (error: any) {
    console.error('AI Advisor error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate AI analysis' });
  }
});

// 2. AI Interactive Assistant / Chat Endpoint
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, loans = [], transactions = [], lang = 'bn' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const context = `System: You are an intelligent AI Loan Management Assistant for Mostafizur bKash Loan Management.
Current Real-time Loan Ledger Summary:
- Total loans: ${loans.length}
- Borrower list & dues:
${loans.map((l: any) => `  * ${l.personName} | LoanID: ${l.loanId} | Principal: ৳${l.totalPrincipalLoan} | Current EMI: ৳${l.currentMonthEmi} | 2nd EMI: ৳${l.secondMonthEmi} | 3rd EMI: ৳${l.thirdMonthEmi} | Total Due: ৳${l.totalDue} | Next Date: ${l.nextLoanSubmitDate} | Status: ${l.status}`).join('\n')}
- Total Payments Received: ${(transactions || []).length} transactions.

Instructions:
- Answer the user's question directly, accurately and politely in ${lang === 'bn' ? 'Bengali (বাংলা)' : 'English'}.
- Provide exact numbers from the data.
- If asked to write an SMS, compose a courteous and professional SMS message suitable for sending to the borrower on bKash/WhatsApp.`;

    if (aiClient) {
      try {
        const response = await aiClient.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: [
            { role: 'user', parts: [{ text: `${context}\n\nUser Question: ${message}` }] },
          ],
        });

        if (response?.text) {
          return res.json({ reply: response.text });
        }
      } catch (err) {
        console.warn('Gemini chat API fallback:', err);
      }
    }

    // Heuristic response
    const qLower = message.toLowerCase();
    let replyText = '';
    const overdue = loans.filter((l: any) => l.totalDue > 0 && l.status !== 'paid');
    const totalDue = loans.reduce((s: number, l: any) => s + (l.status !== 'paid' ? l.totalDue : 0), 0);

    if (qLower.includes('overdue') || qLower.includes('ঝুঁকি') || qLower.includes('ওভারডিউ')) {
      replyText = lang === 'bn'
        ? `বর্তমানে মোট ${loans.length}টি লোনের মধ্যে বকেয়া লোন রয়েছে। মোট বাকি বকেয়া ৳${totalDue.toFixed(2)}। ঋণগ্রহীতাদের সাথে যোগাযোগ করে কিস্তি আদায় করুন।`
        : `Currently total outstanding due is ৳${totalDue.toFixed(2)} across ${loans.length} accounts. Immediate follow-up recommended.`;
    } else {
      replyText = lang === 'bn'
        ? `আপনার হিসাব অনুযায়ী মোট ${loans.length}টি লোন অ্যাকাউন্টে সর্বমোট ৳${totalDue.toFixed(2)} বকেয়া রয়েছে। কোনো নির্দিষ্ট ব্যক্তির নাম উল্লেখ করলে তার বিস্তারিত হিসাব পাওয়া যাবে।`
        : `Your ledger currently tracks ${loans.length} loans totaling ৳${totalDue.toFixed(2)} in outstanding dues. Mention a borrower name for specific details.`;
    }

    return res.json({ reply: replyText });
  } catch (error: any) {
    console.error('AI Chat error:', error);
    res.status(500).json({ error: error.message || 'AI chat failed' });
  }
});

// 3. AI Smart Reminder SMS Generator Endpoint
app.post('/api/ai/sms', async (req, res) => {
  try {
    const { borrowerName, loanId, currentEmi, totalDue, nextDate, tone = 'polite', lang = 'bn' } = req.body;

    const prompt = `Compose a short, professional SMS reminder in ${lang === 'bn' ? 'Bengali (বাংলা)' : 'English'} for a bKash micro-loan borrower.
Details:
- Borrower Name: ${borrowerName}
- Loan ID: ${loanId}
- Current Installment (EMI): ৳${currentEmi}
- Total Due: ৳${totalDue}
- Due Date: ${nextDate}
- Tone style requested: ${tone} (Options: 'polite' for courteous reminder, 'due_soon' for standard alert, 'urgent' for overdue warning)

Requirements:
- Keep it concise, suitable for SMS (under 250 characters).
- Include Loan ID, Amount, and Due Date clearly.
- Sign off as: 'মোস্তাফিজুর বিকাশ লোন ম্যানেজমেন্ট' (or 'Mostafizur bKash Loan Management').`;

    if (aiClient) {
      try {
        const response = await aiClient.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: prompt,
        });

        if (response?.text) {
          return res.json({ sms: response.text.trim() });
        }
      } catch (err) {
        console.warn('Gemini SMS API fallback:', err);
      }
    }

    const fallbackSms = lang === 'bn'
      ? `প্রিয় ${borrowerName}, আপনার বিকাশ লোন (${loanId})-এর কিস্তি ৳${currentEmi} আগামী ${nextDate}-এর মধ্যে জমা দেওয়ার জন্য অনুরোধ করা হচ্ছে। মোট বকেয়া ৳${totalDue}। ধন্যবাদ - মোস্তাফিজুর বিকাশ লোন ম্যানেজমেন্ট`
      : `Dear ${borrowerName}, this is a reminder for your bKash loan (${loanId}) EMI of ৳${currentEmi} due on ${nextDate}. Remaining due: ৳${totalDue}. Thank you - Mostafizur bKash Loan Management`;

    return res.json({ sms: fallbackSms });
  } catch (error: any) {
    console.error('AI SMS error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate SMS' });
  }
});

// Mount Vite middleware in development or serve static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

startServer();
