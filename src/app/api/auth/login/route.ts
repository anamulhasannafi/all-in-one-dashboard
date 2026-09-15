import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, createSession } from "@/lib/auth";

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Enter a valid email and password" }, { status: 400 });
    }
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.email, parsed.data.email.toLowerCase()))
      .limit(1);
    const u = rows[0];
    if (!u) {
      return NextResponse.json({ error: "No account found with this email" }, { status: 401 });
    }
    const ok = await verifyPassword(parsed.data.password, u.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }
    await createSession({ userId: u.id, email: u.email, name: u.name, role: u.role });
    return NextResponse.json({
      ok: true,
      user: { id: u.id, name: u.name, email: u.email, role: u.role },
    });
  } catch (e) {
    console.error("login failed", e);
    return NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 });
  }
}
