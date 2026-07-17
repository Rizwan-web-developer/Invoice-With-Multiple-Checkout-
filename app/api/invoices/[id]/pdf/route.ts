import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { generateInvoicePDF } from "@/lib/pdf";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(request);
    const { id } = await params;

    if (!user) {
      const invoices = await query(`
        SELECT i.*, c.name as client_name, c.email as client_email, c.phone as client_phone,
               c.address as client_address, c.company as client_company,
               m.name as merchant_name, m.type as merchant_type,
               m.account_email as merchant_email, m.account_holder as merchant_holder,
               m.account_number as merchant_account, m.bank_name as merchant_bank
        FROM invoices i LEFT JOIN clients c ON i.client_id = c.id
        LEFT JOIN merchants m ON i.merchant_id = m.id WHERE i.id = ?
      `, [id]);
      const invoice = (invoices as any[])[0];
      if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

      const items = await query("SELECT * FROM invoice_items WHERE invoice_id = ?", [id]);
      const users = await query("SELECT * FROM users WHERE id = ?", [invoice.user_id]);
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
        merchant: invoice.merchant_name ? {
          name: invoice.merchant_name,
          type: invoice.merchant_type,
          bank_name: invoice.merchant_bank || "",
          account_number: invoice.merchant_account || "",
          account_email: invoice.merchant_email || "",
        } : undefined,
        items: items as any[],
      };

      const pdfBuffer = await generateInvoicePDF(pdfData);
      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
        },
      });
    }

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
      merchant: invoice.merchant_name ? {
        name: invoice.merchant_name,
        type: invoice.merchant_type,
        bank_name: invoice.merchant_bank || "",
        account_number: invoice.merchant_account || "",
        account_email: invoice.merchant_email || "",
      } : undefined,
      items: items as any[],
    };

    const pdfBuffer = await generateInvoicePDF(pdfData);
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
