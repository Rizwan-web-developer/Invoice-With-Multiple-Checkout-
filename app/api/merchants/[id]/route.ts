import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const merchants = await query("SELECT * FROM merchants WHERE id = ? AND user_id = ?", [id, user.userId]);
    const merchant = (merchants as any[])[0];
    if (!merchant) return NextResponse.json({ error: "Merchant not found" }, { status: 404 });

    return NextResponse.json({ merchant });
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
    const { name, type, api_key, api_secret, webhook_secret, account_email, account_holder, account_number, bank_name, is_active } = body;

    const updates: string[] = [];
    const updateParams: any[] = [];

    if (name) { updates.push("name = ?"); updateParams.push(name); }
    if (type) { updates.push("type = ?"); updateParams.push(type); }
    if (api_key !== undefined) { updates.push("api_key = ?"); updateParams.push(api_key); }
    if (api_secret !== undefined) { updates.push("api_secret = ?"); updateParams.push(api_secret); }
    if (webhook_secret !== undefined) { updates.push("webhook_secret = ?"); updateParams.push(webhook_secret); }
    if (account_email !== undefined) { updates.push("account_email = ?"); updateParams.push(account_email); }
    if (account_holder !== undefined) { updates.push("account_holder = ?"); updateParams.push(account_holder); }
    if (account_number !== undefined) { updates.push("account_number = ?"); updateParams.push(account_number); }
    if (bank_name !== undefined) { updates.push("bank_name = ?"); updateParams.push(bank_name); }
    if (is_active !== undefined) { updates.push("is_active = ?"); updateParams.push(is_active); }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    updateParams.push(id, user.userId);
    const result = await query(
      `UPDATE merchants SET ${updates.join(", ")} WHERE id = ? AND user_id = ?`,
      updateParams
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    const merchants = await query("SELECT * FROM merchants WHERE id = ?", [id]);
    return NextResponse.json({ merchant: (merchants as any[])[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const result = await query("DELETE FROM merchants WHERE id = ? AND user_id = ?", [id, user.userId]);
    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Merchant deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
