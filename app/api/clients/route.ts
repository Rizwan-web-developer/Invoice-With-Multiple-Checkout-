import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const clients = await query("SELECT * FROM clients WHERE user_id = ? ORDER BY created_at DESC", [user.userId]);
    return NextResponse.json({ clients });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, email, phone, address, company } = await request.json();
    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const result = await query(
      "INSERT INTO clients (user_id, name, email, phone, address, company) VALUES (?, ?, ?, ?, ?, ?)",
      [user.userId, name, email, phone || null, address || null, company || null]
    );

    const client = await query("SELECT * FROM clients WHERE id = ?", [(result as any).insertId]);
    return NextResponse.json({ client: (client as any[])[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
