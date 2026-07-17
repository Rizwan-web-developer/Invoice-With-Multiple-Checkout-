import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const invoices = await query(`
      SELECT i.*, c.name as client_name, c.email as client_email, c.company as client_company,
             m.name as merchant_name, m.type as merchant_type
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      LEFT JOIN merchants m ON i.merchant_id = m.id
      WHERE i.user_id = ?
      ORDER BY i.created_at DESC
    `, [user.userId]);

    return NextResponse.json({ invoices });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { client_id, issue_date, due_date, items, tax_rate, discount, notes, status, merchant_id } = body;

    if (!client_id || !issue_date || !due_date || !items || items.length === 0) {
      return NextResponse.json({ error: "Client, dates, and items are required" }, { status: 400 });
    }

    const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0);
    const tax = subtotal * ((tax_rate || 0) / 100);
    const total = subtotal + tax - (discount || 0);

    const date = new Date();
    const invoiceNumber = `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}-${Date.now().toString(36).toUpperCase()}`;

    const result = await query(
      `INSERT INTO invoices (user_id, client_id, invoice_number, issue_date, due_date, subtotal, tax, tax_rate, discount, total, notes, status, merchant_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user.userId, client_id, invoiceNumber, issue_date, due_date, subtotal, tax, tax_rate || 0, discount || 0, total, notes || null, status || "sent", merchant_id || null]
    );

    const invoiceId = (result as any).insertId;

    for (const item of items) {
      const itemTotal = item.quantity * item.unit_price;
      await query(
        "INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?)",
        [invoiceId, item.description, item.quantity, item.unit_price, itemTotal]
      );
    }

    const invoices = await query(`
      SELECT i.*, c.name as client_name, c.email as client_email
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      WHERE i.id = ?
    `, [invoiceId]);

    return NextResponse.json({ invoice: (invoices as any[])[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
