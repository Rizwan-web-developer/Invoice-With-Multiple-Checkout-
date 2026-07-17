import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const invoices = await query(`
      SELECT i.*, c.name as client_name, c.email as client_email, c.phone as client_phone,
             c.address as client_address, c.company as client_company,
             m.name as merchant_name, m.type as merchant_type,
             m.account_email as merchant_email, m.account_holder as merchant_holder,
             m.account_number as merchant_account, m.bank_name as merchant_bank,
             u.company_name, u.company_address, u.company_logo
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      LEFT JOIN merchants m ON i.merchant_id = m.id
      LEFT JOIN users u ON i.user_id = u.id
      WHERE i.id = ? AND i.user_id = ?
    `, [id, user.userId]);

    const invoice = (invoices as any[])[0];
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    const items = await query("SELECT * FROM invoice_items WHERE invoice_id = ?", [id]);

    return NextResponse.json({ invoice, items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const body = await request.json();
    const { client_id, issue_date, due_date, items, tax_rate, discount, notes, status, merchant_id } = body;

    if (items) {
      const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0);
      const tax = subtotal * ((tax_rate || 0) / 100);
      const total = subtotal + tax - (discount || 0);

      await query(
        `UPDATE invoices SET client_id=?, issue_date=?, due_date=?, subtotal=?, tax=?, tax_rate=?, discount=?, total=?, notes=?, status=?, merchant_id=? WHERE id=? AND user_id=?`,
        [client_id, issue_date, due_date, subtotal, tax, tax_rate || 0, discount || 0, total, notes || null, status || "draft", merchant_id || null, id, user.userId]
      );

      await query("DELETE FROM invoice_items WHERE invoice_id = ?", [id]);
      for (const item of items) {
        const itemTotal = item.quantity * item.unit_price;
        await query(
          "INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?)",
          [id, item.description, item.quantity, item.unit_price, itemTotal]
        );
      }
    } else {
      const updates: string[] = [];
      const updateParams: any[] = [];
      if (client_id) { updates.push("client_id = ?"); updateParams.push(client_id); }
      if (issue_date) { updates.push("issue_date = ?"); updateParams.push(issue_date); }
      if (due_date) { updates.push("due_date = ?"); updateParams.push(due_date); }
      if (notes !== undefined) { updates.push("notes = ?"); updateParams.push(notes); }
      if (status) { updates.push("status = ?"); updateParams.push(status); }
      if (merchant_id !== undefined) { updates.push("merchant_id = ?"); updateParams.push(merchant_id); }

      if (updates.length > 0) {
        updateParams.push(id, user.userId);
        await query(`UPDATE invoices SET ${updates.join(", ")} WHERE id = ? AND user_id = ?`, updateParams);
      }
    }

    const invoices = await query(`
      SELECT i.*, c.name as client_name, c.email as client_email
      FROM invoices i LEFT JOIN clients c ON i.client_id = c.id WHERE i.id = ?
    `, [id]);

    const items2 = await query("SELECT * FROM invoice_items WHERE invoice_id = ?", [id]);
    return NextResponse.json({ invoice: (invoices as any[])[0], items: items2 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    await query("DELETE FROM invoices WHERE id = ? AND user_id = ?", [id, user.userId]);
    return NextResponse.json({ message: "Invoice deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
