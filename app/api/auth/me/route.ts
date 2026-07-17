import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value || request.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const users = await query(
      "SELECT id, name, email, profile_image, company_name, company_address, company_logo FROM users WHERE id = ?",
      [payload.userId]
    );
    const user = (users as any[])[0];
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value || request.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const company_name = formData.get("company_name") as string;
    const company_address = formData.get("company_address") as string;
    const profile_image = formData.get("profile_image") as File | null;
    const company_logo = formData.get("company_logo") as File | null;

    const updates: string[] = [];
    const params: any[] = [];

    if (name) { updates.push("name = ?"); params.push(name); }
    if (company_name) { updates.push("company_name = ?"); params.push(company_name); }
    if (company_address) { updates.push("company_address = ?"); params.push(company_address); }

    if (profile_image && profile_image.size > 0) {
      const { saveFile } = await import("@/lib/upload");
      const path = await saveFile(profile_image);
      updates.push("profile_image = ?");
      params.push(path);
    }

    if (company_logo && company_logo.size > 0) {
      const { saveFile } = await import("@/lib/upload");
      const path = await saveFile(company_logo, "logos");
      updates.push("company_logo = ?");
      params.push(path);
    }

    if (updates.length > 0) {
      params.push(payload.userId);
      await query(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, params);
    }

    const users = await query(
      "SELECT id, name, email, profile_image, company_name, company_address, company_logo FROM users WHERE id = ?",
      [payload.userId]
    );

    return NextResponse.json({ user: (users as any[])[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
