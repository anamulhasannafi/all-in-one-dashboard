import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const u = await getCurrentUser();
  if (!u) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: { id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role },
  });
}
