import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const invoices = await query("SELECT * FROM invoices WHERE id = ?", [id]);
    const invoice = (invoices as any[])[0];
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    if (invoice.status === "paid") {
      return NextResponse.json({ message: "Already marked as paid" });
    }

    await query("UPDATE invoices SET status = 'paid' WHERE id = ?", [id]);
    await query(
      "INSERT INTO payments (invoice_id, amount, status, paid_at) VALUES (?, ?, 'completed', NOW())",
      [id, invoice.total]
    );

    return NextResponse.json({ message: "Invoice marked as paid" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
