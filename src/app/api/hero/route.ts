import { NextResponse } from "next/server";
import { db } from "@/db";
import { heroSettings } from "@/db/schema";

export async function GET() {
  try {
    const rows = await db.select().from(heroSettings).limit(1);
    return NextResponse.json({ hero: rows[0] ?? null });
  } catch (e) {
    console.error("hero fetch failed", e);
    return NextResponse.json({ hero: null });
  }
}
