import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { generateInvoicePDF } from "@/lib/pdf";
import { sendInvoiceEmail } from "@/lib/email";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const invoices = await query(`
      SELECT i.*, c.name as client_name, c.email as client_email, c.phone as client_phone,
             c.address as client_address, c.company as client_company,
             m.name as merchant_name, m.type as merchant_type,
             m.account_email as merchant_email, m.account_holder as merchant_holder,
             m.account_number as merchant_account, m.bank_name as merchant_bank
      FROM invoices i LEFT JOIN clients c ON i.client_id = c.id
      LEFT JOIN merchants m ON i.merchant_id = m.id
      WHERE i.id = ? AND i.user_id = ?
    `, [id, user.userId]);

    const invoice = (invoices as any[])[0];
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    const items = await query("SELECT * FROM invoice_items WHERE invoice_id = ?", [id]);
    const users = await query("SELECT * FROM users WHERE id = ?", [user.userId]);
    const company = (users as any[])[0];

    const pdfData = {
      invoice_number: invoice.invoice_number,
      issue_date: invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString() : "",
      due_date: invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "",
      status: invoice.status,
      subtotal: invoice.subtotal,
      tax_rate: invoice.tax_rate,
      tax: invoice.tax,
      discount: invoice.discount,
      total: invoice.total,
      notes: invoice.notes,
      client: {
        name: invoice.client_name,
        email: invoice.client_email,
        phone: invoice.client_phone || "",
        address: invoice.client_address || "",
        company: invoice.client_company || "",
      },
      company: {
        name: company?.company_name || "",
        address: company?.company_address || "",
        logo: company?.company_logo || "",
      },
      items: items as any[],
    };

    const pdfBuffer = await generateInvoicePDF(pdfData);
    const baseUrl = process.env.BASE_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const checkoutUrl = `${baseUrl}/api/payments/redirect/${id}`;

    const emailHtml = `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 700px; margin: 0 auto; padding: 0; background: #ffffff;">
        <!-- Header: Logo + Business Name + Invoice Meta -->
        <table width="100%" cellpadding="0" cellspacing="0" style="padding: 30px 40px 20px 40px;">
          <tr>
            <td style="vertical-align: top; width: 50%;">
              ${company?.company_logo
                ? `<img src="${baseUrl}${company.company_logo}" style="max-height: 50px; max-width: 180px; object-fit: contain;" />`
                : `<div style="width: 50px; height: 50px; background: #f5f5f5; border-radius: 8px; text-align: center; line-height: 50px; color: #999; font-size: 20px;">&#9632;</div>`
              }
              <h2 style="margin: 8px 0 0 0; font-size: 16px; color: #1a1a1a; font-weight: bold;">${company?.company_name || "Your Business"}</h2>
              ${company?.company_address ? `<p style="margin: 2px 0 0 0; font-size: 11px; color: #888; white-space: pre-line;">${company.company_address}</p>` : ""}
            </td>
            <td style="vertical-align: top; width: 50%; text-align: right; font-size: 12px; color: #666;">
              <p style="margin: 0 0 4px 0;">Invoice Number: <strong style="color: #1a1a1a;">${invoice.invoice_number}</strong></p>
              <p style="margin: 0 0 4px 0;">Issue Date: <strong style="color: #1a1a1a;">${invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString() : ""}</strong></p>
              <p style="margin: 0;">Due Date: <strong style="color: #1a1a1a;">${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : ""}</strong></p>
            </td>
          </tr>
        </table>

        <!-- INVOICE Title -->
        <table width="100%" cellpadding="0" cellspacing="0" style="padding: 0 40px 15px 40px;">
          <tr>
            <td>
              <h1 style="margin: 0; font-size: 32px; font-weight: bold; color: #1a1a1a; text-transform: uppercase; letter-spacing: 2px;">Invoice</h1>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #888;">#${invoice.invoice_number}</p>
            </td>
          </tr>
        </table>

        <!-- Divider -->
        <table width="100%" cellpadding="0" cellspacing="0" style="padding: 0 40px;">
          <tr><td style="border-top: 1px solid #e0e0e0; font-size: 1px; line-height: 1px;">&nbsp;</td></tr>
        </table>

        <!-- From / Bill To -->
        <table width="100%" cellpadding="0" cellspacing="0" style="padding: 20px 40px;">
          <tr>
            <td style="vertical-align: top; width: 50%; padding-right: 20px;">
              <p style="margin: 0 0 6px 0; font-size: 10px; font-weight: bold; color: #999; text-transform: uppercase; letter-spacing: 1px;">From</p>
              <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold; color: #1a1a1a;">${company?.company_name || "Your Business"}</p>
              ${company?.company_address ? `<p style="margin: 0; font-size: 12px; color: #666; white-space: pre-line;">${company.company_address}</p>` : ""}
            </td>
            <td style="vertical-align: top; width: 50%;">
              <p style="margin: 0 0 6px 0; font-size: 10px; font-weight: bold; color: #999; text-transform: uppercase; letter-spacing: 1px;">Bill To</p>
              <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold; color: #1a1a1a;">${invoice.client_name}</p>
              ${invoice.client_company ? `<p style="margin: 0 0 2px 0; font-size: 12px; color: #666;">${invoice.client_company}</p>` : ""}
              <p style="margin: 0 0 2px 0; font-size: 12px; color: #666;">${invoice.client_email}</p>
              ${invoice.client_phone ? `<p style="margin: 0 0 2px 0; font-size: 12px; color: #666;">${invoice.client_phone}</p>` : ""}
              ${invoice.client_address ? `<p style="margin: 0; font-size: 12px; color: #888; white-space: pre-line;">${invoice.client_address}</p>` : ""}
            </td>
          </tr>
        </table>

        <!-- Items Table -->
        <table width="100%" cellpadding="0" cellspacing="0" style="padding: 0 40px;">
          <tr>
            <td style="padding: 12px 0 8px 0; border-bottom: 2px solid #1a1a1a; font-size: 12px; font-weight: bold; color: #1a1a1a;">Description</td>
            <td style="padding: 12px 0 8px 0; border-bottom: 2px solid #1a1a1a; font-size: 12px; font-weight: bold; color: #1a1a1a; text-align: center;">Qty</td>
            <td style="padding: 12px 0 8px 0; border-bottom: 2px solid #1a1a1a; font-size: 12px; font-weight: bold; color: #1a1a1a; text-align: right;">Unit Price</td>
            <td style="padding: 12px 0 8px 0; border-bottom: 2px solid #1a1a1a; font-size: 12px; font-weight: bold; color: #1a1a1a; text-align: right;">Amount</td>
          </tr>
          ${(items as any[]).map((item: any, idx: number) => `
            <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#fafafa'};">
              <td style="padding: 10px 0; font-size: 12px; color: #333; border-bottom: 1px solid #f0f0f0;">${item.description}</td>
              <td style="padding: 10px 0; font-size: 12px; color: #333; text-align: center; border-bottom: 1px solid #f0f0f0;">${item.quantity}</td>
              <td style="padding: 10px 0; font-size: 12px; color: #333; text-align: right; border-bottom: 1px solid #f0f0f0;">$${Number(item.unit_price).toFixed(2)}</td>
              <td style="padding: 10px 0; font-size: 12px; color: #1a1a1a; font-weight: bold; text-align: right; border-bottom: 1px solid #f0f0f0;">$${Number(item.total).toFixed(2)}</td>
            </tr>
          `).join("")}
        </table>

        <!-- Payment Details + Totals -->
        <table width="100%" cellpadding="0" cellspacing="0" style="padding: 20px 40px;">
          <tr>
            <td style="vertical-align: top; width: 50%;">
              <p style="margin: 0 0 6px 0; font-size: 10px; font-weight: bold; color: #999; text-transform: uppercase; letter-spacing: 1px;">Payment Details</p>
              ${invoice.merchant_name ? `
                <p style="margin: 0 0 2px 0; font-size: 12px; color: #666;">Method: <strong style="color: #1a1a1a;">${invoice.merchant_name}</strong></p>
                ${invoice.merchant_bank ? `<p style="margin: 0 0 2px 0; font-size: 12px; color: #666;">Bank: ${invoice.merchant_bank}</p>` : ""}
                ${invoice.merchant_account ? `<p style="margin: 0 0 2px 0; font-size: 12px; color: #666;">Account: ${invoice.merchant_account}</p>` : ""}
                ${invoice.merchant_email ? `<p style="margin: 0; font-size: 12px; color: #666;">Email: ${invoice.merchant_email}</p>` : ""}
              ` : `<p style="margin: 0; font-size: 12px; color: #999;">No payment method set</p>`}
            </td>
            <td style="vertical-align: top; width: 50%; text-align: right;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #666;">Subtotal: <span style="color: #1a1a1a;">$${Number(invoice.subtotal).toFixed(2)}</span></p>
              ${Number(invoice.tax) > 0 ? `<p style="margin: 0 0 6px 0; font-size: 12px; color: #666;">Tax (${invoice.tax_rate}%): <span style="color: #1a1a1a;">$${Number(invoice.tax).toFixed(2)}</span></p>` : ""}
              ${Number(invoice.discount) > 0 ? `<p style="margin: 0 0 6px 0; font-size: 12px; color: #666;">Discount: <span style="color: #c00;">-$${Number(invoice.discount).toFixed(2)}</span></p>` : ""}
              <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top: 2px solid #1a1a1a; font-size: 1px; line-height: 1px;">&nbsp;</td></tr></table>
              <p style="margin: 8px 0 0 0; font-size: 18px; font-weight: bold; color: #1a1a1a;">Total Amount: $${Number(invoice.total).toFixed(2)}</p>
            </td>
          </tr>
        </table>

        <!-- Buttons -->
        <table width="100%" cellpadding="0" cellspacing="0" style="padding: 10px 40px 30px 40px;">
          <tr>
            <td style="text-align: center;">
              <a href="${checkoutUrl}" style="display: inline-block; background: #1a1a1a; color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 6px; font-size: 14px; font-weight: bold; margin-right: 10px;">Pay Now</a>
              <a href="${baseUrl}/api/invoices/${id}/pdf" style="display: inline-block; background: #ffffff; color: #1a1a1a; text-decoration: none; padding: 14px 36px; border-radius: 6px; font-size: 14px; font-weight: bold; border: 2px solid #1a1a1a;">Download PDF</a>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid #e0e0e0;">
          <tr>
            <td style="padding: 20px 40px; text-align: center; font-size: 11px; color: #999;">
              Thank you for choosing Invoice. We appreciate your business.
              ${company?.company_name ? `<br/>${company.company_name}` : ""}
              ${company?.company_address ? ` | ${company.company_address}` : ""}
            </td>
          </tr>
        </table>
      </div>
    `;

    await sendInvoiceEmail({
      to: invoice.client_email,
      subject: `Invoice #${invoice.invoice_number} from ${company?.company_name || "Company"}`,
      html: emailHtml,
      pdfBuffer: Buffer.from(new Uint8Array(pdfBuffer)),
      pdfFilename: `invoice-${invoice.invoice_number}.pdf`,
    });

    await query("UPDATE invoices SET status = 'sent' WHERE id = ? AND status = 'draft'", [id]);

    return NextResponse.json({ message: "Email sent successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
