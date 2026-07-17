import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

const MERCHANT_TYPES = ["stripe", "paypal", "payoneer", "razorpay", "square", "bank_transfer", "other"];

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const merchants = await query("SELECT * FROM merchants WHERE user_id = ? ORDER BY created_at DESC", [user.userId]);
    return NextResponse.json({ merchants });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, type, api_key, api_secret, webhook_secret, account_email, account_holder, account_number, bank_name } = body;

    if (!type) {
      return NextResponse.json({ error: "Payment type is required" }, { status: 400 });
    }

    const merchantName = name || type;

    if (!MERCHANT_TYPES.includes(type)) {
      return NextResponse.json({ error: "Invalid merchant type" }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO merchants (user_id, name, type, api_key, api_secret, webhook_secret, account_email, account_holder, account_number, bank_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user.userId, merchantName, type, api_key || null, api_secret || null, webhook_secret || null, account_email || null, account_holder || null, account_number || null, bank_name || null]
    );

    const merchant = await query("SELECT * FROM merchants WHERE id = ?", [(result as any).insertId]);
    return NextResponse.json({ merchant: (merchant as any[])[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
