import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: Promise<{ invoiceId: string }> }) {
  try {
    const { invoiceId } = await params;
    const invoices = await query(`
      SELECT i.*, c.name as client_name, c.email as client_email, c.phone as client_phone,
             c.address as client_address, c.company as client_company,
             m.id as merchant_id, m.name as merchant_name, m.type as merchant_type,
             m.api_key, m.account_email, m.account_holder, m.account_number, m.bank_name
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      LEFT JOIN merchants m ON i.merchant_id = m.id AND m.is_active = 1
      WHERE i.id = ?
    `, [invoiceId]);

    const invoice = (invoices as any[])[0];
    if (!invoice) return NextResponse.json({ error: "Invoice not found or no active merchant" }, { status: 404 });

    const items = await query("SELECT * FROM invoice_items WHERE invoice_id = ?", [invoiceId]);
    const users = await query("SELECT * FROM users WHERE id = ?", [invoice.user_id]);
    const company = (users as any[])[0];

    return NextResponse.json({ invoice, items, company });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
