import { NextResponse } from "next/server";
import { db } from "@/db";
import { deliveryZones } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const zones = await db
      .select()
      .from(deliveryZones)
      .where(eq(deliveryZones.active, true))
      .orderBy(deliveryZones.sortOrder);
    return NextResponse.json({ items: zones });
  } catch (e) {
    console.error("zones failed", e);
    return NextResponse.json({ error: "Could not load delivery zones" }, { status: 500 });
  }
}
