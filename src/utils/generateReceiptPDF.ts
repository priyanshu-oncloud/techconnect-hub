import jsPDF from "jspdf";

export interface ReceiptData {
  invoiceNo: string;
  date: string; // ISO
  name: string;
  email: string;
  phone?: string;
  position?: string;
  paymentId: string;
  originalAmount: number;
  discountApplied: number;
  amountPaid: number;
  couponCode?: string | null;
  referralCode?: string | null;
  status: string; // paid | free | refunded
}

const COMPANY = {
  name: "Nestgen Solutions",
  tagline: "Technology & Talent Solutions",
  email: "support@nestgensolutions.com",
  site: "www.nestgensolutions.com",
};

const inr = (n: number) => `Rs. ${Number(n || 0).toFixed(2)}`;

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const buildReceiptPDF = (data: ReceiptData) => {
  const pdf = new jsPDF("portrait", "pt", "a4");
  const W = pdf.internal.pageSize.getWidth();
  const M = 48;

  /* ---------- HEADER BAND ---------- */
  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, 0, W, 110, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.setTextColor(255, 255, 255);
  pdf.text(COMPANY.name, M, 52);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(165, 180, 252);
  pdf.text(COMPANY.tagline, M, 70);
  pdf.text(`${COMPANY.email}  |  ${COMPANY.site}`, M, 86);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(255, 255, 255);
  pdf.text("PAYMENT RECEIPT", W - M, 56, { align: "right" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(203, 213, 225);
  pdf.text(`Invoice: ${data.invoiceNo}`, W - M, 74, { align: "right" });
  pdf.text(fmtDate(data.date), W - M, 88, { align: "right" });

  /* ---------- STATUS ---------- */
  const status = (data.status || "paid").toUpperCase();
  const isRefund = status.includes("REFUND");
  const isFree = status === "FREE";
  if (isRefund) pdf.setFillColor(239, 68, 68);
  else if (isFree) pdf.setFillColor(99, 102, 241);
  else pdf.setFillColor(22, 163, 74);
  pdf.roundedRect(W - M - 96, 132, 96, 26, 6, 6, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(255, 255, 255);
  pdf.text(status, W - M - 48, 149, { align: "center" });

  /* ---------- BILLED TO ---------- */
  pdf.setTextColor(100, 116, 139);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text("BILLED TO", M, 140);

  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(13);
  pdf.text(data.name || "-", M, 160);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(71, 85, 105);
  let y = 176;
  [data.email, data.phone, data.position].filter(Boolean).forEach((line) => {
    pdf.text(String(line), M, y);
    y += 14;
  });

  /* ---------- TABLE ---------- */
  const tableTop = Math.max(y + 20, 220);
  pdf.setFillColor(241, 245, 249);
  pdf.rect(M, tableTop, W - M * 2, 28, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(51, 65, 85);
  pdf.text("DESCRIPTION", M + 14, tableTop + 18);
  pdf.text("AMOUNT", W - M - 14, tableTop + 18, { align: "right" });

  const rows: [string, string][] = [
    [
      `Application / Registration Fee${data.position ? ` - ${data.position}` : ""}`,
      inr(data.originalAmount),
    ],
  ];
  if (data.discountApplied > 0) {
    const label = data.couponCode
      ? `Discount (Coupon ${data.couponCode})`
      : data.referralCode
      ? `Discount (Referral ${data.referralCode})`
      : "Discount";
    rows.push([label, `- ${inr(data.discountApplied)}`]);
  }

  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(30, 41, 59);
  let ry = tableTop + 28;
  rows.forEach(([label, amount]) => {
    ry += 26;
    pdf.text(label, M + 14, ry);
    pdf.text(amount, W - M - 14, ry, { align: "right" });
    pdf.setDrawColor(226, 232, 240);
    pdf.line(M, ry + 10, W - M, ry + 10);
  });

  /* ---------- TOTAL ---------- */
  const totalY = ry + 44;
  pdf.setFillColor(15, 23, 42);
  pdf.roundedRect(W - M - 240, totalY - 24, 240, 40, 6, 6, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(255, 255, 255);
  pdf.text("TOTAL PAID", W - M - 226, totalY + 2);
  pdf.setFontSize(14);
  pdf.text(inr(data.amountPaid), W - M - 14, totalY + 2, { align: "right" });

  /* ---------- PAYMENT META ---------- */
  let my = totalY + 60;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(100, 116, 139);
  pdf.text("PAYMENT DETAILS", M, my);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(51, 65, 85);
  my += 16;
  [
    `Payment ID: ${data.paymentId}`,
    `Method: ${isFree ? "Coupon (no charge)" : "Razorpay"}`,
    `Currency: INR`,
  ].forEach((line) => {
    pdf.text(line, M, my);
    my += 14;
  });

  /* ---------- FOOTER ---------- */
  pdf.setDrawColor(226, 232, 240);
  pdf.line(M, my + 20, W - M, my + 20);
  pdf.setFontSize(9);
  pdf.setTextColor(148, 163, 184);
  pdf.text(
    "This is a computer generated receipt and does not require a signature.",
    M,
    my + 38
  );
  pdf.text(
    `For any billing query, contact ${COMPANY.email} with your invoice number.`,
    M,
    my + 52
  );

  return pdf;
};

export const generateReceiptPDF = (data: ReceiptData) => {
  const pdf = buildReceiptPDF(data);
  pdf.save(`${data.invoiceNo}.pdf`);
};

export const makeInvoiceNo = () => {
  const d = new Date();
  const y = d.getFullYear();
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `NG-${y}-${rand}`;
};
