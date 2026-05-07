import PDFDocument from "pdfkit";
import { PassThrough } from "stream";

// ====================================================
// PDF Invoice Data Type
// ====================================================
export interface InvoicePDFData {
  invoiceNumber: string;
  tenantName: string;
  tenantPhone: string;
  propertyName: string;
  unitName: string;
  month: string;
  year: number;
  paymentDate: Date;
  paymentMethod: string;
  transactionId?: string;
  baseRent: number;
  waterBill: number;
  gasBill: number;
  electricityBill: number;
  serviceCharge: number;
  otherBill: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  ownerName: string;
  status: "Paid" | "Partial" | "Unpaid";
}

// ====================================================
// PDF Buffer তৈরি করা (ইমেইল attachment বা download এর জন্য)
// ====================================================
export const generateInvoicePDF = (data: InvoicePDFData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    const stream = new PassThrough();

    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
    doc.pipe(stream);

    // ====================================================
    // রঙ palette
    // ====================================================
    const PURPLE = "#702ae1";
    const DARK = "#1e1b4b";
    const GRAY = "#64748b";
    const LIGHT_BG = "#f8fafc";
    const GREEN = "#059669";
    const RED = "#dc2626";
    const WHITE = "#ffffff";
    const BORDER = "#e2e8f0";

    const pageW = doc.page.width;
    const margin = 50;
    const contentW = pageW - margin * 2;

    // ====================================================
    // HEADER — গ্রেডিয়েন্ট ব্যাকগ্রাউন্ড
    // ====================================================
    doc.rect(0, 0, pageW, 140).fill(PURPLE);

    // লোগো সার্কেল
    doc.circle(margin + 25, 50, 25).fill(WHITE);
    doc
      .fontSize(14)
      .fill(PURPLE)
      .font("Helvetica-Bold")
      .text("BW", margin + 12, 43);

    // হেডার টেক্সট
    doc
      .fontSize(22)
      .fill(WHITE)
      .font("Helvetica-Bold")
      .text("Bariowla Property Management", margin + 65, 32);

    doc
      .fontSize(10)
      .fill("rgba(255,255,255,0.8)")
      .font("Helvetica")
      .text("baribhara.com | Professional Rental Solutions", margin + 65, 58);

    // ইনভয়েস ব্যাজ (ডানদিকে)
    const badgeColor = data.status === "Paid" ? GREEN : data.status === "Partial" ? "#d97706" : RED;
    doc.roundedRect(pageW - margin - 120, 28, 120, 80, 8).fill("rgba(255,255,255,0.1)");
    doc
      .fontSize(9)
      .fill(WHITE)
      .font("Helvetica")
      .text("INVOICE", pageW - margin - 110, 40, { width: 100, align: "center" });
    doc
      .fontSize(9)
      .fill(WHITE)
      .font("Helvetica-Bold")
      .text(`#${data.invoiceNumber}`, pageW - margin - 110, 55, { width: 100, align: "center" });
    doc
      .fontSize(9)
      .fill(badgeColor)
      .font("Helvetica-Bold")
      .text(data.status === "Paid" ? "● PAID" : data.status === "Partial" ? "● PARTIAL" : "● UNPAID", pageW - margin - 110, 80, { width: 100, align: "center" });

    // ====================================================
    // TENANT INFO SECTION
    // ====================================================
    let y = 165;
    doc.rect(margin, y, contentW, 85).fill(LIGHT_BG).stroke(BORDER);

    // বাম — ভাড়াটিয়ার তথ্য
    doc.fontSize(8).fill(GRAY).font("Helvetica").text("BILLED TO", margin + 15, y + 12);
    doc.fontSize(12).fill(DARK).font("Helvetica-Bold").text(data.tenantName, margin + 15, y + 26);
    doc.fontSize(9).fill(GRAY).font("Helvetica").text(`Phone: ${data.tenantPhone}`, margin + 15, y + 44);
    doc.fontSize(9).fill(GRAY).text(`${data.propertyName} — ${data.unitName}`, margin + 15, y + 58);

    // ডান — পেমেন্ট তথ্য
    const rightX = margin + contentW / 2 + 10;
    doc.fontSize(8).fill(GRAY).font("Helvetica").text("PAYMENT INFO", rightX, y + 12);
    doc.fontSize(11).fill(DARK).font("Helvetica-Bold").text(`${data.month} ${data.year}`, rightX, y + 26);
    doc.fontSize(9).fill(GRAY).font("Helvetica").text(`Date: ${new Date(data.paymentDate).toLocaleDateString("en-GB")}`, rightX, y + 44);
    doc.fontSize(9).fill(GRAY).text(`Method: ${data.paymentMethod}`, rightX, y + 58);
    if (data.transactionId) {
      doc.fontSize(8).fill(GRAY).text(`TxID: ${data.transactionId}`, rightX, y + 70);
    }

    // ====================================================
    // BILLING TABLE HEADER
    // ====================================================
    y += 105;
    doc.rect(margin, y, contentW, 28).fill(DARK);
    doc.fontSize(9).fill(WHITE).font("Helvetica-Bold");
    doc.text("DESCRIPTION", margin + 15, y + 10);
    doc.text("AMOUNT (৳)", pageW - margin - 100, y + 10, { width: 90, align: "right" });

    // ====================================================
    // BILLING ROWS
    // ====================================================
    const rows = [
      { label: "Base Rent", amount: data.baseRent },
      { label: "Water Bill", amount: data.waterBill },
      { label: "Gas Bill", amount: data.gasBill },
      { label: "Electricity Bill", amount: data.electricityBill },
      { label: "Service Charge", amount: data.serviceCharge },
      { label: "Other Charges", amount: data.otherBill },
    ].filter((r) => r.amount > 0);

    y += 28;
    rows.forEach((row, i) => {
      const rowBg = i % 2 === 0 ? WHITE : LIGHT_BG;
      doc.rect(margin, y, contentW, 26).fill(rowBg).stroke(BORDER);
      doc.fontSize(10).fill(DARK).font("Helvetica").text(row.label, margin + 15, y + 8);
      doc
        .fontSize(10)
        .fill(DARK)
        .font("Helvetica-Bold")
        .text(`${row.amount.toLocaleString()}`, pageW - margin - 100, y + 8, { width: 90, align: "right" });
      y += 26;
    });

    // ====================================================
    // TOTAL SECTION
    // ====================================================
    // বিভাজক রেখা
    doc.rect(margin, y, contentW, 1).fill(BORDER);
    y += 8;

    // মোট বিল
    doc.rect(margin, y, contentW, 30).fill(LIGHT_BG).stroke(BORDER);
    doc.fontSize(11).fill(DARK).font("Helvetica-Bold").text("Total Bill", margin + 15, y + 9);
    doc.fontSize(11).fill(DARK).font("Helvetica-Bold").text(`${data.totalAmount.toLocaleString()}`, pageW - margin - 100, y + 9, { width: 90, align: "right" });
    y += 30;

    // পরিশোধিত
    doc.rect(margin, y, contentW, 30).fill("#d1fae5").stroke(BORDER);
    doc.fontSize(11).fill(GREEN).font("Helvetica-Bold").text("Paid Amount", margin + 15, y + 9);
    doc.fontSize(11).fill(GREEN).font("Helvetica-Bold").text(`${data.paidAmount.toLocaleString()}`, pageW - margin - 100, y + 9, { width: 90, align: "right" });
    y += 30;

    // বকেয়া
    const dueColor = data.dueAmount <= 0 ? GREEN : RED;
    const dueBg = data.dueAmount <= 0 ? "#d1fae5" : "#fee2e2";
    doc.rect(margin, y, contentW, 34).fill(dueBg).stroke(BORDER);
    doc.fontSize(13).fill(dueColor).font("Helvetica-Bold").text(data.dueAmount <= 0 ? "PAID IN FULL ✓" : `Due Amount`, margin + 15, y + 10);
    doc.fontSize(13).fill(dueColor).font("Helvetica-Bold").text(`${Math.max(0, data.dueAmount).toLocaleString()}`, pageW - margin - 100, y + 10, { width: 90, align: "right" });
    y += 44;

    // ====================================================
    // BIG AMOUNT BOX
    // ====================================================
    doc.rect(margin, y, contentW, 70).fill(PURPLE);
    doc.fontSize(11).fill(WHITE).font("Helvetica").text("AMOUNT PAID", margin, y + 12, { width: contentW, align: "center" });
    doc.fontSize(30).fill(WHITE).font("Helvetica-Bold").text(`BDT ${data.paidAmount.toLocaleString()}`, margin, y + 28, { width: contentW, align: "center" });
    y += 80;

    // ====================================================
    // OWNER SIGNATURE AREA
    // ====================================================
    y += 10;
    doc.rect(margin, y, contentW / 2 - 10, 60).fill(LIGHT_BG).stroke(BORDER);
    doc.fontSize(8).fill(GRAY).font("Helvetica").text("LANDLORD", margin + 15, y + 10);
    doc.fontSize(10).fill(DARK).font("Helvetica-Bold").text(data.ownerName, margin + 15, y + 24);
    doc.fontSize(8).fill(GRAY).font("Helvetica").text("Authorized Signature", margin + 15, y + 44);

    doc.rect(margin + contentW / 2 + 10, y, contentW / 2 - 10, 60).fill(LIGHT_BG).stroke(BORDER);
    doc.fontSize(8).fill(GRAY).font("Helvetica").text("GENERATED ON", margin + contentW / 2 + 25, y + 10);
    doc.fontSize(10).fill(DARK).font("Helvetica-Bold").text(new Date().toLocaleDateString("en-GB"), margin + contentW / 2 + 25, y + 24);
    doc.fontSize(8).fill(GRAY).font("Helvetica").text("Bariowla — Digital Receipt", margin + contentW / 2 + 25, y + 44);

    // ====================================================
    // FOOTER
    // ====================================================
    const footerY = doc.page.height - 50;
    doc.rect(0, footerY - 10, pageW, 60).fill(DARK);
    doc
      .fontSize(9)
      .fill(WHITE)
      .font("Helvetica")
      .text(
        "This is a computer-generated invoice. No physical signature required. | Bariowla Property Management System",
        margin,
        footerY + 5,
        { width: contentW, align: "center" }
      );

    doc.end();
  });
};

// ====================================================
// Invoice Number তৈরি করা
// ====================================================
export const generateInvoiceNumber = (invoiceId: string): string => {
  const timestamp = Date.now().toString().slice(-6);
  const idSlice = invoiceId.slice(-4).toUpperCase();
  return `BW-${timestamp}-${idSlice}`;
};
