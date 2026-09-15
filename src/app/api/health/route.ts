import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ ok: true, app: "sushre", time: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "db unreachable" }, { status: 500 });
  }
}
