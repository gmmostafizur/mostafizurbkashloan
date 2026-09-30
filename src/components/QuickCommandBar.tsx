import React, { useState, useRef, useEffect, useMemo } from 'react';
import { LoanRecord, Language } from '../types/loan';
import { getT } from '../utils/translations';
import { parseNaturalLanguageCommand, ParsedCommandResult } from '../utils/nlpParser';
import { parseScreenshotText, ParsedScreenshotData } from '../utils/screenshotParser';
import { formatCurrency, isDateOverdue, getDaysRemaining } from '../utils/dateUtils';
import {
  extractTextFromImage,
  createSamplePaymentScreenshot,
  createSampleLoanScreenshot,
} from '../utils/ocrService';
import {
  Search,
  Sparkles,
  CornerDownLeft,
  Check,
  AlertTriangle,
  Paperclip,
  Image as ImageIcon,
  Camera,
  X,
  RefreshCw,
  PlusCircle,
  FileCheck2,
  UploadCloud,
  User,
  CreditCard,
  ChevronRight,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface QuickCommandBarProps {
  loans: LoanRecord[];
  lang: Language;
  onExecuteCommand: (result: ParsedCommandResult) => void;
  onDirectSearch: (query: string) => void;
  onNewLoanFromScreenshot?: (data: ParsedScreenshotData) => void;
}

export const QuickCommandBar: React.FC<QuickCommandBarProps> = ({
  loans,
  lang,
  onExecuteCommand,
  onDirectSearch,
  onNewLoanFromScreenshot,
}) => {
  const t = getT(lang);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<{
    text: string;
    type: 'success' | 'info' | 'warning';
  } | null>(null);

  // Attachment & OCR state
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState('');
  const [parsedScreenshot, setParsedScreenshot] = useState<ParsedScreenshotData | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  // Handle OCR processing on attached file
  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setFeedback({
        text: lang === 'bn' ? 'অনুগ্রহ করে একটি ছবি বা স্ক্রিনশট ফাইল নির্বাচন করুন।' : 'Please upload a valid image or screenshot file.',
        type: 'warning',
      });
      return;
    }

    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    const preview = URL.createObjectURL(file);
    setAttachedImage(file);
    setImagePreviewUrl(preview);
    setIsScanning(true);
    setOcrProgress(10);
    setOcrStatus(lang === 'bn' ? 'ছবি লোড হচ্ছে...' : 'Loading image...');
    setParsedScreenshot(null);

    try {
      const ocrResult = await extractTextFromImage(file, (progress, status) => {
        setOcrProgress(progress);
        setOcrStatus(status);
      });

      const extractedText = ocrResult.text.trim();
      setIsScanning(false);

      if (!extractedText) {
        setFeedback({
          text: lang === 'bn' ? 'ছবিতে কোনো স্পষ্ট টেক্সট পাওয়া যায়নি।' : 'No clear text detected in the image.',
          type: 'warning',
        });
        return;
      }

      // Analyze extracted text
      const screenshotData = parseScreenshotText(extractedText);
      setParsedScreenshot(screenshotData);

      // Check if it's a payment receipt or new loan
      const isPaymentIntent =
        extractedText.toLowerCase().includes('paid') ||
        extractedText.toLowerCase().includes('repayment') ||
        extractedText.toLowerCase().includes('successful') ||
        extractedText.toLowerCase().includes('পরিশোধ') ||
        extractedText.toLowerCase().includes('জমা');

      if (isPaymentIntent && screenshotData.loanId) {
        // Construct natural payment command
        const autoCommand = `${screenshotData.personName} paid ${screenshotData.totalDue || screenshotData.currentMonthEmi} for Loan ID ${screenshotData.loanId}`;
        setInput(autoCommand);
        setFeedback({
          text:
            lang === 'bn'
              ? `স্ক্রিনশট থেকে পেমেন্ট সনাক্ত: ${screenshotData.personName} (লোন: ${screenshotData.loanId})`
              : `Payment screenshot detected for ${screenshotData.personName} (Loan: ${screenshotData.loanId})`,
          type: 'success',
        });

        // Automatically prepare command execution
        const parsedCmd = parseNaturalLanguageCommand(autoCommand, loans);
        onExecuteCommand(parsedCmd);
      } else {
        // Populates input or offers New Loan
        const autoText = `bKash Loan ${screenshotData.loanId}: ${screenshotData.personName} ৳${screenshotData.totalPrincipal}`;
        setInput(autoText);
        setFeedback({
          text:
            lang === 'bn'
              ? `স্ক্রিনশট ডাটা সনাক্ত: ${screenshotData.personName}, লোন আইডি: ${screenshotData.loanId}`
              : `Screenshot data parsed: ${screenshotData.personName}, Loan ID: ${screenshotData.loanId}`,
          type: 'success',
        });
      }
    } catch (err) {
      console.error(err);
      setIsScanning(false);
      setFeedback({
        text:
          lang === 'bn'
            ? 'ছবিটি প্রক্রিয়াকরণ করতে সমস্যা হয়েছে। আপনি সরাসরি টেক্সট লিখে কমান্ড দিতে পারেন।'
            : 'Error scanning screenshot text. You can type the command directly.',
        type: 'warning',
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleRemoveAttachment = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setAttachedImage(null);
    setImagePreviewUrl(null);
    setParsedScreenshot(null);
    setIsScanning(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Support clipboard paste (Ctrl+V with an image in clipboard)
  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      if (file.type.startsWith('image/')) {
        e.preventDefault();
        processImageFile(file);
      }
    }
  };

  // Support Drag and Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const result = parseNaturalLanguageCommand(input, loans);
    const feedbackMsg = lang === 'bn' ? result.explanationBn : result.explanationEn;

    if (result.action === 'UNKNOWN') {
      setFeedback({ text: feedbackMsg, type: 'warning' });
      onDirectSearch(input);
    } else {
      setFeedback({ text: feedbackMsg, type: 'success' });
      onExecuteCommand(result);
    }
  };

  // Quick sample prompts
  const samplePrompts = [
    {
      label: 'Musha paid 1236.58 TK for October',
      labelBn: 'মুশা অক্টোবর এর জন্য ১২৩৬.৫৮ টাকা পরিশোধ করেছে',
      query: 'Musha paid 1236.58 TK for October',
    },
    {
      label: 'Harun paid 515.25 for Loan ID 110000000044166811 today',
      labelBn: 'হারুন লোন আইডি 110000000044166811-তে ৫১৫.২৫ টাকা পরিশোধ করেছে',
      query: 'Harun paid 515.25 for Loan ID 110000000044166811 today',
    },
    {
      label: 'Show all dues for Mostafizur',
      labelBn: 'মোস্তাফিজুর এর সব বকেয়া দেখাও',
      query: 'Show all dues for Mostafizur',
    },
    {
      label: 'Show Harun loans',
      labelBn: 'হারুনের লোনসমূহ দেখাও',
      query: 'Show Harun loans',
    },
    {
      label: 'Export PDF Ledger',
      labelBn: 'পিডিএফ লেজার ডাউনলোড করুন',
      query: 'Export PDF Ledger',
    },
  ];

  const handlePromptClick = (query: string) => {
    setInput(query);
    const result = parseNaturalLanguageCommand(query, loans);
    const feedbackMsg = lang === 'bn' ? result.explanationBn : result.explanationEn;
    setFeedback({ text: feedbackMsg, type: 'success' });
    onExecuteCommand(result);
  };

  // Load sample screenshot
  const handleAttachSample = async (type: 'payment' | 'loan') => {
    setIsScanning(true);
    setOcrStatus(lang === 'bn' ? 'নমুনা স্ক্রিনশট তৈরি হচ্ছে...' : 'Generating sample screenshot...');
    const file =
      type === 'payment'
        ? await createSamplePaymentScreenshot('Musha', '110000000044657590', '1236.58', '11/11/2026')
        : await createSampleLoanScreenshot('Mostafizur', '110000000049281742', '7500.00', '7725.00', '2575.00', '11/15/2026');
    await processImageFile(file);
  };

  return (
    <div
      onPaste={handlePaste}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`bg-white border transition-all rounded-lg p-3 sm:p-4 shadow-xs relative ${
        isDragOver ? 'border-[#E2136E] ring-2 ring-[#E2136E]/20 bg-pink-50/20' : 'border-slate-200'
      }`}
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Command Input Row */}
      <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
        <div className="relative flex-1 flex items-center">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Sparkles className="w-4 h-4 text-[#E2136E]" />
          </div>

          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (feedback) setFeedback(null);
            }}
            placeholder={
              lang === 'bn'
                ? 'কমান্ড লিখুন অথবা বিকাশ স্ক্রিনশট/ছবি সংযুক্ত করুন (Ctrl+V বা ড্র্যাগ করুন)...'
                : 'Type command or attach bKash screenshot/photo (Ctrl+V or drag & drop)...'
            }
            className="w-full pl-10 pr-32 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#E2136E] focus:border-[#E2136E] transition-all text-slate-900 placeholder:text-slate-400"
          />

          {/* Right Action Icons in Input: Attachment & Submit */}
          <div className="absolute inset-y-0 right-1.5 flex items-center gap-1.5">
            {/* Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 hover:text-[#E2136E] hover:bg-pink-50 border border-slate-200 rounded transition-colors"
              title={lang === 'bn' ? 'ছবি বা স্ক্রিনশট সংযুক্ত করুন' : 'Attach Photo or Screenshot'}
            >
              <Camera className="w-3.5 h-3.5 text-[#E2136E]" />
              <span className="hidden sm:inline text-[11px] font-medium">
                {lang === 'bn' ? 'ছবি / স্ক্রিনশট' : 'Attach Image'}
              </span>
            </button>

            {/* Run Button */}
            <button
              type="submit"
              className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-[#E2136E] hover:bg-[#c40e5d] rounded transition-colors shadow-2xs"
            >
              <span>{lang === 'bn' ? 'প্রয়োগ' : 'Run'}</span>
              <CornerDownLeft className="w-3 h-3" />
            </button>
          </div>
        </div>
      </form>

      {/* ATTACHED SCREENSHOT PREVIEW & OCR PROGRESS CARD */}
      {attachedImage && (
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            {/* Thumbnail */}
            {imagePreviewUrl ? (
              <img
                src={imagePreviewUrl}
                alt="Attached Screenshot"
                className="w-12 h-12 object-cover rounded border border-slate-300 shadow-2xs bg-white shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded bg-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                <ImageIcon className="w-5 h-5" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 line-clamp-1">
                  {attachedImage.name}
                </span>
                <span className="text-[10px] text-slate-500 font-mono-numbers">
                  ({(attachedImage.size / 1024).toFixed(1)} KB)
                </span>
              </div>

              {/* Status / Progress */}
              {isScanning ? (
                <div className="mt-1 flex items-center gap-2 text-[11px] text-[#E2136E] font-medium">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>
                    {lang === 'bn'
                      ? `OCR স্ক্যানিং চলছে... ${ocrProgress}%`
                      : `Scanning screenshot with OCR... ${ocrProgress}%`}
                  </span>
                </div>
              ) : parsedScreenshot ? (
                <div className="mt-0.5 text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {lang === 'bn'
                      ? `সনাক্তকরণ সম্পন্ন: ${parsedScreenshot.personName} | লোন ID: ${parsedScreenshot.loanId}`
                      : `Data Recognized: ${parsedScreenshot.personName} | Loan ID: ${parsedScreenshot.loanId}`}
                  </span>
                </div>
              ) : (
                <span className="text-[11px] text-slate-500">
                  {lang === 'bn' ? 'ছবি সংযুক্ত হয়েছে' : 'Image attached successfully'}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons on attached image */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            {parsedScreenshot && onNewLoanFromScreenshot && (
              <button
                type="button"
                onClick={() => onNewLoanFromScreenshot(parsedScreenshot)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
              >
                <PlusCircle className="w-3 h-3" />
                <span>{lang === 'bn' ? 'নতুন লোন হিসেবে যুক্ত' : 'Add as New Loan'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleRemoveAttachment}
              className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200 transition-colors"
              title="Remove attachment"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Feedback Banner */}
      {feedback && (
        <div
          className={`mt-2.5 px-3 py-2 rounded text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : feedback.type === 'warning'
              ? 'bg-amber-50 text-amber-800 border border-amber-200'
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <Check className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
          )}
          <span className="font-medium">{feedback.text}</span>
        </div>
      )}

      {/* Suggested Quick Prompts & Attachment Test Presets */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
        <span className="text-[11px] font-medium text-slate-400 mr-1">
          {t.aiCommandQuickPrompts}
        </span>
        {samplePrompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handlePromptClick(p.query)}
            className="text-[11px] text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition-colors cursor-pointer text-left"
          >
            {lang === 'bn' ? p.labelBn : p.label}
          </button>
        ))}

        {/* Quick Sample Screenshot Testers */}
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-[10px] text-slate-400 mr-0.5">
            {lang === 'bn' ? 'নমুনা ছবি:' : 'Test Screenshot:'}
          </span>
          <button
            type="button"
            onClick={() => handleAttachSample('payment')}
            className="text-[10px] px-2 py-0.5 bg-pink-50 hover:bg-pink-100 text-[#E2136E] border border-pink-200 rounded font-medium transition-colors"
            title="Attach sample bKash payment voucher screenshot"
          >
            {lang === 'bn' ? 'পেমেন্ট স্লিপ' : 'Payment Slip'}
          </button>
          <button
            type="button"
            onClick={() => handleAttachSample('loan')}
            className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded font-medium transition-colors"
            title="Attach sample bKash new loan details screenshot"
          >
            {lang === 'bn' ? 'নতুন লোন স্ক্রিন' : 'Loan Screen'}
          </button>
        </div>
      </div>
    </div>
  );
};
