import Tesseract from 'tesseract.js';

export interface OcrResult {
  text: string;
  confidence: number;
}

export async function extractTextFromImage(
  imageSource: File | Blob | string,
  onProgress?: (progress: number, status: string) => void
): Promise<OcrResult> {
  try {
    const result = await Tesseract.recognize(
      imageSource,
      'eng',
      {
        logger: (m) => {
          if (onProgress && m.status) {
            onProgress(Math.round((m.progress || 0) * 100), m.status);
          }
        },
      }
    );

    return {
      text: result.data.text || '',
      confidence: result.data.confidence || 0,
    };
  } catch (error) {
    console.error('OCR Error:', error);
    throw error;
  }
}

/**
 * Creates a synthetic bKash payment confirmation screenshot as a PNG File
 * for testing instant image attachments
 */
export function createSamplePaymentScreenshot(
  borrowerName = 'Musha',
  loanId = '110000000044657590',
  amount = '1236.58',
  date = '10/11/2026'
): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 420;
    const ctx = canvas.getContext('2d')!;

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header pink bar
    ctx.fillStyle = '#E2136E';
    ctx.fillRect(0, 0, canvas.width, 80);

    // Header text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillText('bKash Loan Repayment Successful', 24, 48);

    // Card border
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 100, canvas.width - 40, canvas.height - 120);

    // Details text
    ctx.fillStyle = '#1E293B';
    ctx.font = '16px Arial, sans-serif';

    ctx.fillText(`Borrower: ${borrowerName}`, 40, 140);
    ctx.fillText(`Loan ID: ${loanId}`, 40, 180);
    ctx.fillText(`Amount Paid: Tk ${amount}`, 40, 220);
    ctx.fillText(`Next Due Date: ${date}`, 40, 260);
    ctx.fillText('TrxID: BKASH9K8J210', 40, 300);
    ctx.fillText('Status: Payment Completed & Settled', 40, 340);

    canvas.toBlob((blob) => {
      const file = new File([blob!], `bKash_Payment_${borrowerName}_${loanId.slice(-6)}.png`, {
        type: 'image/png',
      });
      resolve(file);
    }, 'image/png');
  });
}

/**
 * Creates a synthetic bKash loan details screenshot as a PNG File
 * for testing new loan creation via screenshot
 */
export function createSampleLoanScreenshot(
  borrowerName = 'Mostafizur',
  loanId = '110000000049281742',
  principal = '7500.00',
  due = '7725.00',
  emi = '2575.00',
  date = '11/15/2026'
): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 440;
    const ctx = canvas.getContext('2d')!;

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header pink bar
    ctx.fillStyle = '#E2136E';
    ctx.fillRect(0, 0, canvas.width, 80);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillText('bKash Micro Loan Details', 24, 48);

    // Card border
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 100, canvas.width - 40, canvas.height - 120);

    // Details text
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 16px Arial, sans-serif';

    ctx.fillText(`Customer Name: ${borrowerName}`, 40, 140);
    ctx.fillText(`Loan ID: ${loanId}`, 40, 180);
    ctx.fillText(`Principal Amount: Tk ${principal}`, 40, 220);
    ctx.fillText(`Total Due Amount: Tk ${due}`, 40, 260);
    ctx.fillText(`Monthly Installment (EMI): Tk ${emi}`, 40, 300);
    ctx.fillText(`Next Repayment Date: ${date}`, 40, 340);
    ctx.fillText('Tenure: 3 Months', 40, 380);

    canvas.toBlob((blob) => {
      const file = new File([blob!], `bKash_NewLoan_${borrowerName}_${loanId.slice(-6)}.png`, {
        type: 'image/png',
      });
      resolve(file);
    }, 'image/png');
  });
}
