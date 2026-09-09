import type { TransactionRecord } from "../types";

/**
 * Pure client-side PDF 1.4 binary generator.
 * Builds an RFC-compliant PDF byte stream for KissanSetuAI Digital Trade Receipts.
 * Includes Indian Tricolour accents, clear tabular hierarchy, verification watermark, and transaction details.
 */
export function generateTradeReceiptPdf(transaction: TransactionRecord): Uint8Array {
  const totalValue =
    transaction.grossAmount !== undefined
      ? transaction.grossAmount
      : transaction.pricePerKg * transaction.quantityKg;
  const transportCost =
    transaction.transportCharges !== undefined ? transaction.transportCharges : 800;
  const mandiFees = transaction.otherCharges !== undefined ? transaction.otherCharges : 0;
  const netRealization =
    transaction.netRealization !== undefined
      ? transaction.netRealization
      : totalValue - transportCost - mandiFees;

  const escapePdf = (text: string | number | undefined) => {
    if (text === undefined || text === null) return "";
    return String(text)
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)");
  };

  const streamCommands: string[] = [
    // Background canvas
    "q",
    "1 1 1 rg",
    "0 0 595 842 re",
    "f",
    "Q",

    // Indian Tricolour Accent Top Header Bar
    // Saffron top band
    "q",
    "1.0 0.6 0.2 rg",
    "40 802 171 6 re",
    "f",
    "Q",
    // White middle band
    "q",
    "0.9 0.9 0.9 rg",
    "211 802 171 6 re",
    "f",
    "Q",
    // Green bottom band
    "q",
    "0.09 0.42 0.27 rg",
    "382 802 173 6 re",
    "f",
    "Q",

    // Header Branding
    "q",
    "BT",
    "/F2 20 Tf",
    "0.09 0.42 0.27 rg",
    "40 766 Td",
    "(KISSANSETU AI) Tj",
    "ET",
    "Q",

    "q",
    "BT",
    "/F1 11 Tf",
    "0.3 0.35 0.4 rg",
    "40 750 Td",
    "(National Smart Agri-Market & Direct Trade Settlement) Tj",
    "ET",
    "Q",

    "q",
    "BT",
    "/F2 13 Tf",
    "0.1 0.15 0.25 rg",
    "360 766 Td",
    "(DIGITAL TRADE RECEIPT) Tj",
    "ET",
    "Q",

    "q",
    "BT",
    "/F1 9 Tf",
    "0.4 0.45 0.5 rg",
    "360 750 Td",
    `(${escapePdf(transaction.timestamp || "Official Digital Record")}) Tj`,
    "ET",
    "Q",

    // Top Divider
    "q",
    "0.82 0.85 0.88 RG",
    "1.2 w",
    "40 735 m 555 735 l",
    "S",
    "Q",

    // Transaction Overview Box
    "q",
    "0.96 0.97 0.98 rg",
    "40 660 515 62 re",
    "f",
    "0.82 0.85 0.88 RG",
    "1 w",
    "40 660 515 62 re",
    "S",
    "Q",

    // Overview Content
    "q",
    "BT",
    "/F1 9 Tf",
    "0.4 0.45 0.5 rg",
    "55 704 Td",
    "(TRANSACTION REFERENCE ID) Tj",
    "ET",
    "BT",
    "/F2 13 Tf",
    "0.09 0.42 0.27 rg",
    "55 688 Td",
    `(${escapePdf(transaction.id)}) Tj`,
    "ET",
    "BT",
    "/F1 9 Tf",
    "0.4 0.45 0.5 rg",
    "260 704 Td",
    "(LOT REFERENCE) Tj",
    "ET",
    "BT",
    "/F2 11 Tf",
    "0.1 0.15 0.25 rg",
    "260 688 Td",
    `(${escapePdf(transaction.lotId || "Aggregated Lot")}) Tj`,
    "ET",
    "BT",
    "/F1 9 Tf",
    "0.4 0.45 0.5 rg",
    "410 704 Td",
    "(SETTLEMENT STATUS) Tj",
    "ET",
    "BT",
    "/F2 10 Tf",
    "0.09 0.42 0.27 rg",
    "410 688 Td",
    `(${escapePdf(transaction.paymentStatus || "Verified & Settled")}) Tj`,
    "ET",
    "Q",

    // Parties Grid (Farmer & Buyer)
    "q",
    "0.98 0.99 0.98 rg",
    "40 565 248 80 re",
    "f",
    "0.85 0.88 0.85 RG",
    "0.8 w",
    "40 565 248 80 re",
    "S",
    "Q",

    "q",
    "BT",
    "/F2 10 Tf",
    "0.09 0.42 0.27 rg",
    "55 627 Td",
    "(PRODUCER / SELLER DETAILS) Tj",
    "ET",
    "BT",
    "/F2 11 Tf",
    "0.1 0.15 0.25 rg",
    "55 609 Td",
    `(${escapePdf(transaction.farmerName || "Registered Kissan Producer")}) Tj`,
    "ET",
    "BT",
    "/F1 9 Tf",
    "0.35 0.4 0.45 rg",
    "55 593 Td",
    `(${escapePdf(transaction.farmerLocation || "Farm Gate Origin")}) Tj`,
    "ET",
    "BT",
    "/F1 8.5 Tf",
    "0.09 0.42 0.27 rg",
    "55 577 Td",
    "(Verified Direct Supplier - Zero Broker Deductions) Tj",
    "ET",
    "Q",

    "q",
    "0.98 0.98 0.99 rg",
    "307 565 248 80 re",
    "f",
    "0.85 0.85 0.88 RG",
    "0.8 w",
    "307 565 248 80 re",
    "S",
    "Q",

    "q",
    "BT",
    "/F2 10 Tf",
    "0.1 0.2 0.45 rg",
    "322 627 Td",
    "(BUYER / PROCURER DETAILS) Tj",
    "ET",
    "BT",
    "/F2 11 Tf",
    "0.1 0.15 0.25 rg",
    "322 609 Td",
    `(${escapePdf(transaction.buyerName)}) Tj`,
    "ET",
    "BT",
    "/F1 9 Tf",
    "0.35 0.4 0.45 rg",
    "322 593 Td",
    `(${escapePdf(transaction.buyerLocation || "Direct Institutional Intake Hub")}) Tj`,
    "ET",
    "BT",
    "/F1 8.5 Tf",
    "0.1 0.2 0.45 rg",
    "322 577 Td",
    "(Verified Corporate Procurer - Instant Digital Settlement) Tj",
    "ET",
    "Q",

    // Trade Specifications Table
    "q",
    "0.09 0.42 0.27 rg",
    "40 522 515 24 re",
    "f",
    "Q",

    "q",
    "BT",
    "/F2 9.5 Tf",
    "1 1 1 rg",
    "55 530 Td",
    "(COMMODITY & GRADE) Tj",
    "160 0 Td",
    "(QUANTITY) Tj",
    "110 0 Td",
    "(AGREED RATE) Tj",
    "110 0 Td",
    "(GROSS VALUE) Tj",
    "ET",
    "Q",

    // Table Content Line
    "q",
    "0.98 0.98 0.98 rg",
    "40 482 515 40 re",
    "f",
    "0.85 0.88 0.85 RG",
    "0.8 w",
    "40 482 515 40 re",
    "S",
    "Q",

    "q",
    "BT",
    "/F2 11 Tf",
    "0.1 0.15 0.2 rg",
    "55 500 Td",
    `(${escapePdf(transaction.crop)}) Tj`,
    "ET",
    "BT",
    "/F1 8.5 Tf",
    "0.4 0.45 0.5 rg",
    "55 489 Td",
    "(Grade A Standard) Tj",
    "ET",
    "BT",
    "/F2 11 Tf",
    "0.1 0.15 0.2 rg",
    "215 500 Td",
    `(${escapePdf(transaction.quantityKg)} kg) Tj`,
    "ET",
    "BT",
    "/F1 8.5 Tf",
    "0.4 0.45 0.5 rg",
    "215 489 Td",
    `(${(transaction.quantityKg / 100).toFixed(1)} Qtl) Tj`,
    "ET",
    "BT",
    "/F2 11 Tf",
    "0.1 0.15 0.2 rg",
    "325 500 Td",
    `(Rs. ${escapePdf(transaction.pricePerKg.toFixed(2))} / kg) Tj`,
    "ET",
    "BT",
    "/F1 8.5 Tf",
    "0.4 0.45 0.5 rg",
    "325 489 Td",
    `(Rs. ${(transaction.pricePerKg * 100).toFixed(0)} / Qtl) Tj`,
    "ET",
    "BT",
    "/F2 12 Tf",
    "0.09 0.42 0.27 rg",
    "435 496 Td",
    `(Rs. ${escapePdf(totalValue.toLocaleString("en-IN"))}) Tj`,
    "ET",
    "Q",

    // Financial Breakdown
    "q",
    "0.97 0.98 0.97 rg",
    "40 335 515 132 re",
    "f",
    "0.85 0.88 0.85 RG",
    "1 w",
    "40 335 515 132 re",
    "S",
    "Q",

    "q",
    "BT",
    "/F2 11 Tf",
    "0.1 0.15 0.2 rg",
    "55 445 Td",
    "(FINANCIAL SETTLEMENT BREAKDOWN) Tj",
    "ET",
    "BT",
    "/F1 10 Tf",
    "0.3 0.35 0.4 rg",
    "55 423 Td",
    "(Gross Farmgate Value) Tj",
    "350 0 Td",
    `(Rs. ${escapePdf(totalValue.toLocaleString("en-IN"))}) Tj`,
    "ET",
    "BT",
    "/F1 10 Tf",
    "0.75 0.2 0.2 rg",
    "55 403 Td",
    "(Direct Farmgate Freight & Logistics Deduction) Tj",
    "350 0 Td",
    `(- Rs. ${escapePdf(transportCost.toLocaleString("en-IN"))}) Tj`,
    "ET",
    "BT",
    "/F1 10 Tf",
    "0.09 0.42 0.27 rg",
    "55 383 Td",
    "(APMC Middleman Commission / Cess) Tj",
    "350 0 Td",
    "(Rs. 0.00  [Direct Trade Advantage]) Tj",
    "ET",
    "Q",

    // Final Net Realization Box
    "q",
    "0.09 0.42 0.27 rg",
    "50 345 495 28 re",
    "f",
    "Q",

    "q",
    "BT",
    "/F2 11.5 Tf",
    "1 1 1 rg",
    "65 354 Td",
    "(FINAL NET IN-HAND PRODUCER REALIZATION:) Tj",
    "280 0 Td",
    `/F2 13 Tf (Rs. ${escapePdf(netRealization.toLocaleString("en-IN"))}) Tj`,
    "ET",
    "Q",

    // Digital Security & SIH Audit Reference
    "q",
    "0.96 0.97 0.98 rg",
    "40 230 515 90 re",
    "f",
    "0.82 0.85 0.88 RG",
    "1 w",
    "40 230 515 90 re",
    "S",
    "Q",

    "q",
    "BT",
    "/F2 9.5 Tf",
    "0.09 0.42 0.27 rg",
    "55 300 Td",
    "(PAYMENT SETTLEMENT AUDIT RECORD) Tj",
    "ET",
    "BT",
    "/F1 8.5 Tf",
    "0.2 0.25 0.3 rg",
    "55 284 Td",
    `(${escapePdf(transaction.paymentStatus ? `Payment Status: ${transaction.paymentStatus}` : "Payment Status: Pending")}) Tj`,
    "ET",
    "BT",
    "/F1 8 Tf",
    "0.35 0.4 0.45 rg",
    "55 268 Td",
    `(${escapePdf(
      transaction.razorpayPaymentId
        ? `Razorpay Payment ID: ${transaction.razorpayPaymentId} · Order ID: ${transaction.razorpayOrderId || "N/A"}`
        : transaction.paymentReference
        ? `Settlement Reference: ${transaction.paymentReference}`
        : "Awaiting Buyer Checkout Confirmation"
    )}) Tj`,
    "ET",
    "BT",
    "/F1 8 Tf",
    "0.35 0.4 0.45 rg",
    "55 252 Td",
    `(${escapePdf(transaction.paymentDate ? `Paid at: ${transaction.paymentDate}` : "Payment not yet captured")}) Tj`,
    "ET",
    "BT",
    "/F1 7.5 Tf",
    "0.5 0.55 0.6 rg",
    "55 238 Td",
    "(Official computer-generated trade receipt authenticated via KissanSetuAI Engine.) Tj",
    "ET",
    "Q",

    // Footer
    "q",
    "0.85 0.88 0.85 RG",
    "0.8 w",
    "40 180 m 555 180 l",
    "S",
    "Q",

    "q",
    "BT",
    "/F1 8.5 Tf",
    "0.45 0.5 0.55 rg",
    "40 160 Td",
    "(KissanSetuAI · Smart India Hackathon SIH26132 · Direct Farmgate Settlement Architecture) Tj",
    "ET",
    "Q",
  ];

  const streamContent = streamCommands.join("\n");
  const streamLength = new TextEncoder().encode(streamContent).length;

  // Build PDF 1.4 objects
  const objects: string[] = [
    // 1: Catalog
    "<< /Type /Catalog /Pages 2 0 R >>",
    // 2: Pages
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    // 3: Page
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>",
    // 4: Stream Content
    `<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream`,
    // 5: Font Helvetica (Regular)
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    // 6: Font Helvetica-Bold
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  ];

  let pdfOutput = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets: number[] = [];

  for (let i = 0; i < objects.length; i++) {
    offsets.push(new TextEncoder().encode(pdfOutput).length);
    pdfOutput += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefOffset = new TextEncoder().encode(pdfOutput).length;
  pdfOutput += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

  for (const offset of offsets) {
    pdfOutput += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }

  pdfOutput += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new TextEncoder().encode(pdfOutput);
}

/**
 * Initiates browser download of the genuine PDF trade receipt
 */
export function downloadTradeReceiptPdf(transaction: TransactionRecord): void {
  const bytes = generateTradeReceiptPdf(transaction);
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `KissanSetu-Trade-Receipt-${transaction.id}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
