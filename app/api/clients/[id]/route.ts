import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const clients = await query("SELECT * FROM clients WHERE id = ? AND user_id = ?", [id, user.userId]);
    const client = (clients as any[])[0];
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    return NextResponse.json({ client });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const { name, email, phone, address, company } = await request.json();
    const result = await query(
      "UPDATE clients SET name = ?, email = ?, phone = ?, address = ?, company = ? WHERE id = ? AND user_id = ?",
      [name, email, phone || null, address || null, company || null, id, user.userId]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const clients = await query("SELECT * FROM clients WHERE id = ?", [id]);
    return NextResponse.json({ client: (clients as any[])[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const result = await query("DELETE FROM clients WHERE id = ? AND user_id = ?", [id, user.userId]);
    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Client deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
