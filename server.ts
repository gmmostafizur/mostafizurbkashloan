import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json({ limit: '20mb' }));

// Database directory & persistent file initialization
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'database.json');
const PRESET_FILE = path.resolve(DATA_DIR, 'presetAccounts.json');

function getPresetAccounts(): any[] {
  try {
    if (fs.existsSync(PRESET_FILE)) {
      return JSON.parse(fs.readFileSync(PRESET_FILE, 'utf-8'));
    }
  } catch (e) {
    console.warn('Could not read presetAccounts.json:', e);
  }
  return [];
}

function initDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    let db: any = { users: {}, activityLogs: [] };
    if (fs.existsSync(DB_FILE)) {
      try {
        db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      } catch (e) {
        db = { users: {}, activityLogs: [] };
      }
    }
    if (!db.users) db.users = {};
    if (!db.activityLogs) db.activityLogs = [];

    // Seed preset accounts: Mostafizur Rahman (01907239952), Harun (01533271817), Sohel Apu (01830026574), Musha (01888141176), Admin (01613572749)
    const presetAccounts = getPresetAccounts();
    for (const preset of presetAccounts) {
      if (!db.users[preset.phone]) {
        db.users[preset.phone] = {
          id: `usr_${preset.phone}`,
          phone: preset.phone,
          name: preset.name,
          role: preset.role,
          darkMode: false,
          avatarUrl: '',
          loans: preset.loans,
          transactions: preset.transactions,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
      } else {
        // Keep updated name, role, and attach preset loans if loans list is empty
        db.users[preset.phone].name = preset.name;
        db.users[preset.phone].role = preset.role;
        if (!db.users[preset.phone].loans || db.users[preset.phone].loans.length === 0) {
          db.users[preset.phone].loans = preset.loans;
        }
        if (!db.users[preset.phone].transactions || db.users[preset.phone].transactions.length === 0) {
          db.users[preset.phone].transactions = preset.transactions;
        }
        // Remove password requirement from existing accounts
        delete db.users[preset.phone].password;
      }
    }

    // Strip passwords from any user accounts across the system
    for (const phoneKey of Object.keys(db.users)) {
      delete db.users[phoneKey].password;
    }

    // Initial demo log if empty
    if (db.activityLogs.length === 0) {
      db.activityLogs.push({
        id: `log_init_${Date.now()}`,
        userId: 'usr_01907239952',
        userName: 'Mostafizur Rahman',
        userPhone: '01907239952',
        action: 'SYSTEM_SETUP',
        description: 'সিস্টেমে মোস্তাফিজুর রহমান, হারুন, সোহেল আপু, মুসা ও অ্যাডমিন অ্যাকাউন্ট সক্রিয় করা হয়েছে',
        timestamp: new Date().toISOString(),
        device: 'System Server',
      });
    }

    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}

initDatabase();

function readDatabase(): any {
  try {
    if (!fs.existsSync(DB_FILE)) initDatabase();
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed.users) parsed.users = {};
    if (!parsed.activityLogs) parsed.activityLogs = [];
    return parsed;
  } catch (err) {
    console.error('Error reading database file:', err);
    return { users: {}, activityLogs: [] };
  }
}

function writeDatabase(data: any): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing database file:', err);
    return false;
  }
}

// ================= USER AUTH & DATABASE ROUTES =================

// 1. Password-Free Direct Login with Phone Number
app.post('/api/auth/login', (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ error: 'মোবাইল নম্বর দেওয়া বাধ্যতামূলক' });
    }

    const cleanedPhone = phone.replace(/[\s\-\+]/g, '').replace(/^88/, '');
    const db = readDatabase();
    const user = db.users?.[cleanedPhone];

    if (!user) {
      return res.status(404).json({
        error: 'এই নম্বরে কোনো অ্যাকাউন্ট পাওয়া যায়নি। অনুগ্রহ করে রেজিস্ট্রেশন করুন।'
      });
    }

    user.lastLoginAt = new Date().toISOString();
    user.updatedAt = new Date().toISOString();
    db.users[cleanedPhone] = user;

    const userAgent = (req.headers['user-agent'] || 'Web Browser').toString().slice(0, 80);
    db.activityLogs.unshift({
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: user.id,
      userName: user.name,
      userPhone: user.phone,
      action: 'LOGIN',
      description: `${user.name} (${user.phone}) মোবাইল নম্বর দিয়ে পাসওয়ার্ড ছাড়াই সরাসরি লগইন করেছেন`,
      timestamp: new Date().toISOString(),
      device: userAgent,
    });
    if (db.activityLogs.length > 300) db.activityLogs = db.activityLogs.slice(0, 300);
    writeDatabase(db);

    const { password: _p, ...safeUser } = user;
    return res.json({
      success: true,
      user: safeUser,
      loans: user.loans || [],
      transactions: user.transactions || [],
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// 2. Password-Free Registration with Phone and Name
app.post('/api/auth/register', (req, res) => {
  try {
    const { phone, name } = req.body;
    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ error: 'মোবাইল নম্বর দেওয়া বাধ্যতামূলক' });
    }
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'আপনার নাম দেওয়া বাধ্যতামূলক' });
    }

    const cleanedPhone = phone.replace(/[\s\-\+]/g, '').replace(/^88/, '');
    const db = readDatabase();
    if (!db.users) db.users = {};
    if (!db.activityLogs) db.activityLogs = [];

    let user = db.users[cleanedPhone];
    const isNew = !user;

    if (isNew) {
      user = {
        id: `usr_${cleanedPhone}_${Date.now()}`,
        phone: cleanedPhone,
        name: name.trim(),
        role: cleanedPhone === '01613572749' || cleanedPhone === '01907239952' ? 'admin' : 'user',
        darkMode: false,
        avatarUrl: '',
        loans: [],
        transactions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      db.users[cleanedPhone] = user;
    } else {
      user.name = name.trim();
      user.lastLoginAt = new Date().toISOString();
      user.updatedAt = new Date().toISOString();
      db.users[cleanedPhone] = user;
    }

    const userAgent = (req.headers['user-agent'] || 'Web Browser').toString().slice(0, 80);
    db.activityLogs.unshift({
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: user.id,
      userName: user.name,
      userPhone: user.phone,
      action: 'LOGIN',
      description: isNew
        ? `${user.name} (${user.phone}) নতুন অ্যাকাউন্ট নিবন্ধন করে সিস্টেমে প্রবেশ করেছেন`
        : `${user.name} (${user.phone}) তথ্য আপডেট করে লগইন করেছেন`,
      timestamp: new Date().toISOString(),
      device: userAgent,
    });
    if (db.activityLogs.length > 300) db.activityLogs = db.activityLogs.slice(0, 300);
    writeDatabase(db);

    const { password: _p, ...safeUser } = user;
    return res.json({
      success: true,
      isNew,
      user: safeUser,
      loans: user.loans || [],
      transactions: user.transactions || [],
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// 3. Login or Register (Fallback / Flexible Endpoint, No Password Required)
app.post('/api/auth/login-or-register', (req, res) => {
  try {
    const { phone, name } = req.body;

    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ error: 'মোবাইল নম্বর দেওয়া বাধ্যতামূলক' });
    }

    const cleanedPhone = phone.replace(/[\s\-\+]/g, '').replace(/^88/, '');
    const db = readDatabase();
    if (!db.users) db.users = {};
    if (!db.activityLogs) db.activityLogs = [];

    let user = db.users[cleanedPhone];
    const isNew = !user;

    if (isNew) {
      user = {
        id: `usr_${cleanedPhone}_${Date.now()}`,
        phone: cleanedPhone,
        name: (name && name.trim()) || 'ব্যবহারকারী',
        role: cleanedPhone === '01613572749' || cleanedPhone === '01907239952' ? 'admin' : 'user',
        darkMode: false,
        avatarUrl: '',
        loans: [],
        transactions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      db.users[cleanedPhone] = user;
    } else {
      if (name && name.trim() && name.trim() !== user.name) {
        user.name = name.trim();
      }
      user.lastLoginAt = new Date().toISOString();
      user.updatedAt = new Date().toISOString();
      db.users[cleanedPhone] = user;
    }

    // Add activity log for login
    const userAgent = (req.headers['user-agent'] || 'Web Browser').toString().slice(0, 80);
    db.activityLogs.unshift({
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: user.id,
      userName: user.name,
      userPhone: user.phone,
      action: 'LOGIN',
      description: isNew
        ? `${user.name} (${user.phone}) নতুন অ্যাকাউন্ট তৈরি করে সিস্টেমে প্রবেশ করেছেন`
        : `${user.name} (${user.phone}) সিস্টেমে সফলভাবে লগইন করেছেন`,
      timestamp: new Date().toISOString(),
      device: userAgent,
    });
    if (db.activityLogs.length > 300) db.activityLogs = db.activityLogs.slice(0, 300);

    writeDatabase(db);

    const { password: _p, ...safeUser } = user;
    return res.json({
      success: true,
      isNew,
      user: safeUser,
      loans: user.loans || [],
      transactions: user.transactions || [],
    });
  } catch (err: any) {
    console.error('Auth error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// 2. Get User Profile by Phone
app.get('/api/user/:phone', (req, res) => {
  try {
    const cleanedPhone = req.params.phone.replace(/[\s\-\+]/g, '').replace(/^88/, '');
    const db = readDatabase();
    const user = db.users?.[cleanedPhone];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ success: true, user });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// 3. Update User Settings (Name, Phone, Dark Mode, Avatar/Logo)
app.post('/api/user/settings', (req, res) => {
  try {
    const { phone, newPhone, name, darkMode, avatarUrl } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Current phone is required' });
    }

    const currentPhone = phone.replace(/[\s\-\+]/g, '').replace(/^88/, '');
    const db = readDatabase();

    if (!db.users || !db.users[currentPhone]) {
      return res.status(404).json({ error: 'User not found in database' });
    }

    const user = db.users[currentPhone];

    if (name !== undefined) user.name = name.trim();
    if (darkMode !== undefined) user.darkMode = Boolean(darkMode);
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    user.updatedAt = new Date().toISOString();

    // If user changed their phone number
    if (newPhone && newPhone.trim()) {
      const cleanedNewPhone = newPhone.replace(/[\s\-\+]/g, '').replace(/^88/, '');
      if (cleanedNewPhone !== currentPhone) {
        user.phone = cleanedNewPhone;
        delete db.users[currentPhone];
        db.users[cleanedNewPhone] = user;
      }
    }

    writeDatabase(db);
    return res.json({ success: true, user });
  } catch (err: any) {
    console.error('Settings update error:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// 4. Sync User Loan Data to Persistent Database
app.post('/api/user/sync-loans', (req, res) => {
  try {
    const { phone, loans, transactions } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone is required' });

    const cleanedPhone = phone.replace(/[\s\-\+]/g, '').replace(/^88/, '');
    const db = readDatabase();

    if (!db.users || !db.users[cleanedPhone]) {
      return res.status(404).json({ error: 'User not found' });
    }

    db.users[cleanedPhone].loans = loans;
    db.users[cleanedPhone].transactions = transactions;
    db.users[cleanedPhone].lastSyncAt = new Date().toISOString();

    writeDatabase(db);
    return res.json({ success: true, lastSyncAt: db.users[cleanedPhone].lastSyncAt });
  } catch (err) {
    res.status(500).json({ error: 'Failed to sync loans' });
  }
});

// 5. Record User Action / Activity Log
app.post('/api/activity/log', (req, res) => {
  try {
    const { phone, action, description, metadata } = req.body;
    const db = readDatabase();
    if (!db.activityLogs) db.activityLogs = [];

    const cleanedPhone = phone ? phone.replace(/[\s\-\+]/g, '').replace(/^88/, '') : '';
    const user = db.users?.[cleanedPhone];

    const newLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: user?.id || (cleanedPhone ? `usr_${cleanedPhone}` : 'guest'),
      userName: user?.name || (cleanedPhone ? `User (${cleanedPhone})` : 'সিস্টেম ইউজার'),
      userPhone: cleanedPhone || 'Unknown',
      action: action || 'ACTION',
      description: description || 'কার্যক্রম সম্পন্ন হয়েছে',
      timestamp: new Date().toISOString(),
      device: (req.headers['user-agent'] || 'Web Browser').toString().slice(0, 80),
      metadata,
    };

    db.activityLogs.unshift(newLog);
    if (db.activityLogs.length > 300) db.activityLogs = db.activityLogs.slice(0, 300);
    writeDatabase(db);

    return res.json({ success: true, log: newLog });
  } catch (err) {
    console.error('Error logging activity:', err);
    res.status(500).json({ error: 'Failed to record activity log' });
  }
});

// 6. Get All Registered Users (For Admin Dashboard)
app.get('/api/admin/users', (req, res) => {
  try {
    const db = readDatabase();
    const usersList = Object.values(db.users || {}).map((u: any) => {
      const { password, ...safe } = u;
      return safe;
    });
    return res.json({ success: true, users: usersList });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// 7. Get All Activity Logs (For Admin Audit View)
app.get('/api/admin/activity-logs', (req, res) => {
  try {
    const db = readDatabase();
    return res.json({ success: true, logs: db.activityLogs || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// 8. Clear Activity Logs
app.delete('/api/admin/activity-logs', (req, res) => {
  try {
    const db = readDatabase();
    db.activityLogs = [];
    writeDatabase(db);
    return res.json({ success: true, message: 'Logs cleared successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear logs' });
  }
});

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
