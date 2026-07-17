import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface InvoiceData {
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: string;
  subtotal: number;
  tax_rate: number;
  tax: number;
  discount: number;
  total: number;
  notes: string;
  client: {
    name: string;
    email: string;
    phone: string;
    address: string;
    company: string;
  };
  company: {
    name: string;
    address: string;
    logo: string;
  };
  merchant?: {
    name: string;
    type: string;
    bank_name?: string;
    account_number?: string;
    account_email?: string;
  };
  items: InvoiceItem[];
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Colors
  const primary = [25, 25, 25];
  const secondary = [100, 100, 100];
  const lightGray = [248, 248, 248];

  let currentY = 15;

  // === TOP SECTION: Logo left, Invoice metadata right ===
  if (data.company.logo) {
    try {
      const imgPath = process.cwd() + "/public" + data.company.logo;
      const fs = await import("fs/promises");
      const imgData = await fs.readFile(imgPath);
      const base64 = imgData.toString("base64");
      const ext = data.company.logo.split(".").pop() || "png";
      const mime = ext === "png" ? "image/png" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png";
      doc.addImage(`data:${mime};base64,${base64}`, mime.split("/")[1] as any, 20, currentY, 25, 10);
    } catch {
      doc.setFontSize(18);
      doc.setTextColor(primary[0], primary[1], primary[2]);
      doc.setFont("helvetica", "bold");
      doc.text(data.company.name || "Company Name", 20, currentY + 10);
    }
  } else {
    doc.setFontSize(18);
    doc.setTextColor(primary[0], primary[1], primary[2]);
    doc.setFont("helvetica", "bold");
    doc.text(data.company.name || "Company Name", 20, currentY + 10);
  }

  // Invoice metadata right side
  const metaRightX = pageWidth - 20;
  const metaValueX = pageWidth - 20;
  const metaLabelX = 100;

  doc.setFontSize(9);
  doc.setTextColor(secondary[0], secondary[1], secondary[2]);
  doc.setFont("helvetica", "normal");
  doc.text("Invoice Number:", metaLabelX, currentY + 3);
  doc.text("Issue Date:", metaLabelX, currentY + 9);
  doc.text("Due Date:", metaLabelX, currentY + 15);

  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.setFont("helvetica", "bold");
  doc.text(data.invoice_number || "", metaValueX, currentY + 3, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(secondary[0], secondary[1], secondary[2]);
  doc.text(data.issue_date || "", metaValueX, currentY + 9, { align: "right" });
  doc.text(data.due_date || "", metaValueX, currentY + 15, { align: "right" });

  currentY += 24;

  // === INVOICE TITLE ===
  doc.setFontSize(28);
  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", 20, currentY + 5);
  doc.setFontSize(10);
  doc.setTextColor(secondary[0], secondary[1], secondary[2]);
  doc.setFont("helvetica", "normal");
  doc.text(`#${data.invoice_number}`, 20, currentY + 11);

  currentY += 18;

  // Divider line
  doc.setDrawColor(200);
  doc.setLineWidth(0.5);
  doc.line(20, currentY, pageWidth - 20, currentY);
  currentY += 8;

  // === FROM / BILL TO ===
  const fromX = 20;
  const toX = pageWidth / 2 + 5;

  // FROM
  doc.setFontSize(8);
  doc.setTextColor(secondary[0], secondary[1], secondary[2]);
  doc.setFont("helvetica", "bold");
  doc.text("FROM", fromX, currentY);

  doc.setFontSize(11);
  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.setFont("helvetica", "bold");
  doc.text(data.company.name || "Your Company", fromX, currentY + 6);

  doc.setFontSize(9);
  doc.setTextColor(secondary[0], secondary[1], secondary[2]);
  doc.setFont("helvetica", "normal");
  let addrY = currentY + 11;
  if (data.company.address) {
    const addrLines = data.company.address.split("\n");
    addrLines.forEach((line) => {
      doc.text(line.trim(), fromX, addrY);
      addrY += 4.5;
    });
  }

  // BILL TO
  doc.setFontSize(8);
  doc.setTextColor(secondary[0], secondary[1], secondary[2]);
  doc.setFont("helvetica", "bold");
  doc.text("BILL TO", toX, currentY);

  doc.setFontSize(11);
  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.setFont("helvetica", "bold");
  doc.text(data.client.name || "", toX, currentY + 6);

  doc.setFontSize(9);
  doc.setTextColor(secondary[0], secondary[1], secondary[2]);
  doc.setFont("helvetica", "normal");
  let clientY = currentY + 11;
  if (data.client.company) {
    doc.text(data.client.company, toX, clientY);
    clientY += 4.5;
  }
  if (data.client.email) {
    doc.text(data.client.email, toX, clientY);
    clientY += 4.5;
  }
  if (data.client.phone) {
    doc.text(data.client.phone, toX, clientY);
    clientY += 4.5;
  }
  if (data.client.address) {
    const clientAddrLines = data.client.address.split("\n");
    clientAddrLines.forEach((line) => {
      doc.text(line.trim(), toX, clientY);
      clientY += 4.5;
    });
  }

  currentY = Math.max(addrY, clientY) + 5;

  // === ITEMS TABLE ===
  const tableBody = data.items.map((item) => [
    item.description,
    String(item.quantity),
    `$${Number(item.unit_price).toFixed(2)}`,
    `$${Number(item.total).toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [["Description", "Qty", "Unit Price", "Amount"]],
    body: tableBody,
    theme: "plain",
    headStyles: {
      fillColor: primary as any,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 3,
      textColor: [50, 50, 50],
    },
    alternateRowStyles: {
      fillColor: lightGray as any,
    },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 20, halign: "center" },
      2: { cellWidth: 35, halign: "right" },
      3: { cellWidth: 35, halign: "right" },
    },
    margin: { left: 20, right: 20 },
  });

  let finalY = (doc as any).lastAutoTable.finalY + 10;

  // === PAYMENT DETAILS (left) + TOTALS (right) ===
  const paymentX = 20;
  const totalsX = pageWidth - 90;

  // Payment Details
  doc.setFontSize(8);
  doc.setTextColor(secondary[0], secondary[1], secondary[2]);
  doc.setFont("helvetica", "bold");
  doc.text("PAYMENT DETAILS", paymentX, finalY);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  let paymentY = finalY + 5;
  if (data.merchant) {
    doc.setTextColor(secondary[0], secondary[1], secondary[2]);
    doc.text("Method:", paymentX, paymentY);
    doc.setTextColor(primary[0], primary[1], primary[2]);
    doc.setFont("helvetica", "bold");
    doc.text(data.merchant.name || "", paymentX + 18, paymentY);
    doc.setFont("helvetica", "normal");

    if (data.merchant.bank_name) {
      paymentY += 5;
      doc.setTextColor(secondary[0], secondary[1], secondary[2]);
      doc.text("Bank:", paymentX, paymentY);
      doc.setTextColor(primary[0], primary[1], primary[2]);
      doc.text(data.merchant.bank_name, paymentX + 18, paymentY);
    }
    if (data.merchant.account_number) {
      paymentY += 5;
      doc.setTextColor(secondary[0], secondary[1], secondary[2]);
      doc.text("Account:", paymentX, paymentY);
      doc.setTextColor(primary[0], primary[1], primary[2]);
      doc.text(data.merchant.account_number, paymentX + 18, paymentY);
    }
    if (data.merchant.account_email) {
      paymentY += 5;
      doc.setTextColor(secondary[0], secondary[1], secondary[2]);
      doc.text("Email:", paymentX, paymentY);
      doc.setTextColor(primary[0], primary[1], primary[2]);
      doc.text(data.merchant.account_email, paymentX + 18, paymentY);
    }
  } else {
    doc.setTextColor(secondary[0], secondary[1], secondary[2]);
    doc.text("No payment method set", paymentX, paymentY);
  }

  // Totals
  doc.setTextColor(secondary[0], secondary[1], secondary[2]);
  doc.setFontSize(10);
  doc.text("Subtotal", totalsX, finalY);
  doc.text(`$${Number(data.subtotal).toFixed(2)}`, pageWidth - 20, finalY, { align: "right" });

  if (Number(data.tax_rate) > 0) {
    finalY += 6;
    doc.text(`Tax (${data.tax_rate}%)`, totalsX, finalY);
    doc.text(`$${Number(data.tax).toFixed(2)}`, pageWidth - 20, finalY, { align: "right" });
  }

  if (Number(data.discount) > 0) {
    finalY += 6;
    doc.text("Discount", totalsX, finalY);
    doc.setTextColor(180, 50, 50);
    doc.text(`-$${Number(data.discount).toFixed(2)}`, pageWidth - 20, finalY, { align: "right" });
  }

  // Divider before total
  finalY += 6;
  doc.setDrawColor(primary[0], primary[1], primary[2]);
  doc.setLineWidth(0.8);
  doc.line(totalsX, finalY, pageWidth - 20, finalY);

  // Total
  finalY += 7;
  doc.setFontSize(14);
  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.setFont("helvetica", "bold");
  doc.text("Total Amount", totalsX, finalY);
  doc.text(`$${Number(data.total).toFixed(2)}`, pageWidth - 20, finalY, { align: "right" });

  // === FOOTER ===
  const footerY = 280;
  doc.setDrawColor(200);
  doc.setLineWidth(0.3);
  doc.line(20, footerY, pageWidth - 20, footerY);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "normal");
  doc.text("Thank you for choosing Invoice. We appreciate your business.", pageWidth / 2, footerY + 5, { align: "center" });

  return Buffer.from(doc.output("arraybuffer"));
}
