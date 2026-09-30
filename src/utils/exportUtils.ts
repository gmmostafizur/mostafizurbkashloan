import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LoanRecord, PaymentTransaction, Language } from '../types/loan';
import { formatCurrency, isDateOverdue, getDaysRemaining } from './dateUtils';

export function exportLoansToCSV(loans: LoanRecord[], lang: Language = 'en') {
  const headers = [
    'SL',
    'Borrower Name',
    'Loan ID',
    'Principal Loan (BDT)',
    'Current Month EMI (BDT)',
    '2nd Month EMI (BDT)',
    '3rd Month EMI (BDT)',
    'Total Due (BDT)',
    'Next Loan Submit Date',
    'Status',
    'Notes',
  ];

  const rows = loans.map((l, idx) => {
    const isOverdue = isDateOverdue(l.nextLoanSubmitDate);
    const isSettled = l.totalDue <= 0 || l.status === 'paid';
    const statusText = isSettled ? 'Settled' : isOverdue ? 'Overdue' : 'Active';

    return [
      idx + 1,
      `"${l.personName.replace(/"/g, '""')}"`,
      `"${l.loanId}"`,
      l.totalPrincipalLoan.toFixed(2),
      l.currentMonthEmi.toFixed(2),
      l.secondMonthEmi.toFixed(2),
      l.thirdMonthEmi.toFixed(2),
      l.totalDue.toFixed(2),
      l.nextLoanSubmitDate,
      statusText,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
    ];
  });

  const totalPrincipal = loans.reduce((sum, l) => sum + l.totalPrincipalLoan, 0);
  const totalDue = loans.reduce((sum, l) => sum + l.totalDue, 0);

  // Total summary footer row
  const summaryRow = [
    'TOTAL',
    `"${loans.length} Accounts"`,
    '',
    totalPrincipal.toFixed(2),
    '',
    '',
    '',
    totalDue.toFixed(2),
    '',
    '',
    '',
  ];

  const csvContent =
    'data:text/csv;charset=utf-8,\uFEFF' +
    [headers.join(','), ...rows.map(r => r.join(',')), summaryRow.join(',')].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `bkash_loan_ledger_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportLoansToPDF(loans: LoanRecord[], lang: Language = 'en') {
  // Create PDF document in landscape orientation for clean tabular width
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const totalPrincipal = loans.reduce((sum, l) => sum + l.totalPrincipalLoan, 0);
  const totalDue = loans.reduce((sum, l) => sum + (l.status !== 'paid' ? l.totalDue : 0), 0);
  const activeCount = loans.filter(l => l.status !== 'paid' && l.totalDue > 0).length;
  const overdueCount = loans.filter(l => l.status !== 'paid' && isDateOverdue(l.nextLoanSubmitDate)).length;

  // Header Banner
  doc.setFillColor(226, 19, 110); // bKash Pink #E2136E
  doc.rect(0, 0, 297, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Mostafizur bKash Loan Management - Master Loan Ledger', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Official Ledger Audit | Generated: ${new Date().toLocaleDateString('en-GB')} | Total Accounts: ${loans.length} (${activeCount} Active)`,
    14,
    18
  );

  // Summary KPI Cards Box
  doc.setDrawColor(220, 225, 230);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 28, 269, 14, 2, 2, 'FD');

  doc.setTextColor(50, 60, 75);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');

  doc.text(`Total Disbursed: BDT ${totalPrincipal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 20, 36);
  doc.text(`Total Due Remaining: BDT ${totalDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 105, 36);
  doc.text(`Overdue Accounts: ${overdueCount}`, 200, 36);
  doc.text(`Active Accounts: ${activeCount}`, 240, 36);

  // Table Body Rows
  const tableData = loans.map((l, idx) => {
    const isOverdue = isDateOverdue(l.nextLoanSubmitDate);
    const isSettled = l.totalDue <= 0 || l.status === 'paid';
    const statusText = isSettled ? 'Settled' : isOverdue ? 'OVERDUE' : 'Active';

    return [
      idx + 1,
      l.personName,
      l.loanId,
      l.totalPrincipalLoan.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      l.currentMonthEmi.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      l.secondMonthEmi > 0 ? l.secondMonthEmi.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-',
      l.thirdMonthEmi > 0 ? l.thirdMonthEmi.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-',
      l.totalDue.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      l.nextLoanSubmitDate,
      statusText,
    ];
  });

  // Render Table using autoTable
  autoTable(doc, {
    startY: 46,
    head: [[
      'SL',
      'Borrower',
      'Loan ID',
      'Principal',
      'Current EMI',
      '2nd Mo EMI',
      '3rd Mo EMI',
      'Total Due',
      'Next Date',
      'Status',
    ]],
    body: tableData,
    foot: [[
      '',
      'TOTAL',
      `${loans.length} Accounts`,
      totalPrincipal.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      '',
      '',
      '',
      totalDue.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      '',
      `${activeCount} Active`,
    ]],
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      font: 'helvetica',
      textColor: [30, 41, 59],
    },
    headStyles: {
      fillColor: [15, 23, 42], // Slate-900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 32, fontStyle: 'bold' },
      2: { cellWidth: 42, font: 'courier' },
      3: { cellWidth: 26, halign: 'right' },
      4: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 24, halign: 'right' },
      6: { cellWidth: 24, halign: 'right' },
      7: { cellWidth: 28, halign: 'right', fontStyle: 'bold', textColor: [226, 19, 110] },
      8: { cellWidth: 25, halign: 'center' },
      9: { cellWidth: 24, halign: 'center' },
    },
    didParseCell: (data) => {
      // Highlight overdue in red
      if (data.column.index === 9 && data.cell.raw === 'OVERDUE') {
        data.cell.styles.textColor = [220, 38, 38];
        data.cell.styles.fontStyle = 'bold';
      } else if (data.column.index === 9 && data.cell.raw === 'Settled') {
        data.cell.styles.textColor = [22, 163, 74];
      }
    },
  });

  // Footer page numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Mostafizur bKash Loan Management Software | Page ${i} of ${pageCount}`,
      14,
      202
    );
  }

  doc.save(`bkash_loan_ledger_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportReceiptToPDF(
  transaction: PaymentTransaction,
  loan?: LoanRecord | null,
  lang: Language = 'bn'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5',
  });

  const personName = transaction?.personName || loan?.personName || 'Borrower';
  const loanId = transaction?.loanId || loan?.loanId || '';
  const amountPaid = transaction?.amount || 0;
  const remainingDue = transaction?.newDue !== undefined ? transaction.newDue : (loan?.totalDue || 0);
  const nextSubmitDate = transaction?.newNextDate || loan?.nextLoanSubmitDate || '';
  const paymentDate = transaction?.paymentDate || loan?.lastPaymentDate || new Date().toLocaleDateString('en-GB');
  const trxId = transaction?.referenceId || `BKASH-${Date.now().toString().slice(-8)}`;
  const method = transaction?.method || 'bKash';
  const previousDue = transaction?.previousDue !== undefined ? transaction.previousDue : (loan?.totalPrincipalLoan || 0);

  // Background Header - bKash Pink
  doc.setFillColor(226, 19, 110);
  doc.rect(0, 0, 148, 28, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('bKash Micro-Loan Repayment Voucher', 14, 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Mostafizur bKash Loan Management System | Money Receipt', 14, 18);
  doc.text(`TrxID: ${trxId} | Generated: ${new Date().toLocaleString()}`, 14, 23);

  // Info Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(12, 34, 124, 22, 2, 2, 'FD');

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Borrower Name:', 16, 42);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(personName, 48, 42);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Loan Account ID:', 16, 50);
  doc.setFont('courier', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(loanId, 48, 50);

  // Repayment Breakdown Table
  autoTable(doc, {
    startY: 62,
    head: [['Description / Details', 'Amount / Information']],
    body: [
      ['Payment Date', paymentDate],
      ['Payment Method', method],
      ['Transaction Reference ID', trxId],
      ['Previous Total Due', `BDT ${previousDue.toFixed(2)}`],
      ['Amount Paid (This Voucher)', `BDT ${amountPaid.toFixed(2)}`],
      ['Remaining Balance Due', `BDT ${remainingDue.toFixed(2)}`],
      ['Next Loan Submit Date (New)', nextSubmitDate],
    ],
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      font: 'helvetica',
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 58, fontStyle: 'bold', textColor: [51, 65, 85] },
      1: { cellWidth: 66, halign: 'right' },
    },
    didParseCell: (data) => {
      // Amount paid highlight
      if (data.row.index === 4 && data.column.index === 1) {
        data.cell.styles.textColor = [22, 163, 74];
        data.cell.styles.fontStyle = 'bold';
      }
      // Remaining due highlight
      if (data.row.index === 5 && data.column.index === 1) {
        data.cell.styles.textColor = [226, 19, 110];
        data.cell.styles.fontStyle = 'bold';
      }
      // Next date highlight
      if (data.row.index === 6 && data.column.index === 1) {
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 120;

  // Verification Seal & Note
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(12, finalY + 6, 124, 16, 2, 2, 'FD');

  doc.setTextColor(21, 128, 61);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Verified Digital Repayment Voucher', 16, finalY + 12);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('This voucher confirms successful payment and automatic rollover.', 16, finalY + 18);

  // Signatures
  doc.setDrawColor(203, 213, 225);
  doc.line(16, finalY + 40, 58, finalY + 40);
  doc.line(90, finalY + 40, 132, finalY + 40);

  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Borrower Signature', 20, finalY + 44);
  doc.text('Authorized Signature', 94, finalY + 44);

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('bKash Micro-Loan Management. Please preserve this receipt for your records.', 14, 202);

  doc.save(`bkash_receipt_${loanId.slice(-6)}_${paymentDate.replace(/[\/\-\.]/g, '')}.pdf`);
}

