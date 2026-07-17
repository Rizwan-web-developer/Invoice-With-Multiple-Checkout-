import { NextRequest, NextResponse } from "next/server";
import { query, initializeDatabase } from "@/lib/db";
import { hashPassword, generateToken } from "@/lib/auth";
import { saveFile } from "@/lib/upload";

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const profileImage = formData.get("profile_image") as File | null;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
    }

    const existing = await query("SELECT id FROM users WHERE email = ?", [email]);
    if ((existing as any[]).length > 0) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    let profileImagePath = null;
    if (profileImage && profileImage.size > 0) {
      profileImagePath = await saveFile(profileImage);
    }

    const hashedPassword = hashPassword(password);
    const result = await query(
      "INSERT INTO users (name, email, password, profile_image) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, profileImagePath]
    );

    const insertResult = result as any;
    const token = generateToken({ userId: insertResult.insertId, email });

    const response = NextResponse.json({
      message: "User created successfully",
      token,
      user: { id: insertResult.insertId, name, email, profile_image: profileImagePath },
    });
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}
