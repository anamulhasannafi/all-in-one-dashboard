import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, createSession, normalizeBdPhone, isBdPhone } from "@/lib/auth";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  phone: z.string().trim().optional(),
  password: z.string().min(6).max(72),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    const { name, email, phone, password } = parsed.data;
    const lowerEmail = email.toLowerCase();
    if (phone && phone.trim() && !isBdPhone(phone.trim())) {
      return NextResponse.json({ error: "Enter a valid Bangladeshi mobile number" }, { status: 400 });
    }
    const existing = await db.select().from(users).where(eq(users.email, lowerEmail)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }
    const passwordHash = await hashPassword(password);
    const rows = await db
      .insert(users)
      .values({
        name: name.trim(),
        email: lowerEmail,
        phone: phone?.trim() ? normalizeBdPhone(phone.trim()) : null,
        passwordHash,
        role: "customer",
      })
      .returning({ id: users.id, name: users.name, email: users.email, role: users.role });
    const u = rows[0];
    await createSession({ userId: u.id, email: u.email, name: u.name, role: u.role });
    return NextResponse.json({ ok: true, user: u });
  } catch (e) {
    console.error("register failed", e);
    return NextResponse.json({ error: "Could not create account. Please try again." }, { status: 500 });
  }
}
