import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { eq } from "drizzle-orm";

const schema = z.object({
  code: z.string().trim().min(2),
  subtotal: z.number().int().min(0),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Enter a coupon code" }, { status: 400 });
    const code = parsed.data.code.toUpperCase();
    const rows = await db.select().from(coupons).where(eq(coupons.code, code)).limit(1);
    const c = rows[0];
    if (!c || !c.active) return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 });
    if (c.expiresAt && new Date(c.expiresAt) < new Date())
      return NextResponse.json({ error: "This coupon has expired" }, { status: 400 });
    if (parsed.data.subtotal < (c.minSubtotal ?? 0))
      return NextResponse.json(
        { error: `Needs minimum order of ৳${(c.minSubtotal ?? 0).toLocaleString()}` },
        { status: 400 }
      );
    if (c.usageLimit != null && (c.usedCount ?? 0) >= c.usageLimit)
      return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 });
    let discount = c.type === "percent" ? Math.round((parsed.data.subtotal * c.value) / 100) : c.value;
    if (c.maxDiscount != null) discount = Math.min(discount, c.maxDiscount);
    discount = Math.min(discount, parsed.data.subtotal);
    return NextResponse.json({ ok: true, code: c.code, discount, type: c.type, value: c.value });
  } catch (e) {
    console.error("coupon validate failed", e);
    return NextResponse.json({ error: "Could not validate coupon" }, { status: 500 });
  }
}
