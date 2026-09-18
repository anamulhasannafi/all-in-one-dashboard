import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ১. অফার পেজের জন্য কুপন লিস্ট তুলে আনার GET মেথড
export async function GET() {
  try {
    const allCoupons = await db.select().from(coupons);

    return NextResponse.json(allCoupons, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
        "Pragma": "no-cache",
      },
    });
  } catch (error) {
    console.error("GET /api/coupons error:", error);
    return NextResponse.json({ error: "Failed to fetch coupons", coupons: [] }, { status: 500 });
  }
}

// ২. চেকআউট পেজে কুপন ভ্যালিডেট করার POST মেথড
const schema = z.object({
  code: z.string().trim().min(2),
  subtotal: z.number().min(0),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Enter a valid coupon code" }, { status: 400 });
    }

    const code = parsed.data.code.toUpperCase();
    const rows = await db.select().from(coupons).where(eq(coupons.code, code)).limit(1);
    const c = rows[0];

    // কুপন সক্রিয় (Active) কি না তার নিরাপদ চেকিং
    const isActive = c && c.active !== false && (c as any).active !== 0 && (c as any).active !== "false";

    if (!c || !isActive) {
      return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 });
    }

    // মেয়াদ উত্তীর্ণের চেকিং
    if (c.expiresAt && new Date(c.expiresAt) < new Date()) {
      return NextResponse.json({ error: "This coupon has expired" }, { status: 400 });
    }

    // মিনিমাম সাবটোটাল চেকিং
    const minSub = c.minSubtotal ?? 0;
    if (parsed.data.subtotal < minSub) {
      return NextResponse.json(
        { error: `Needs minimum order of ৳${minSub.toLocaleString()}` },
        { status: 400 }
      );
    }

    // ব্যবহারের লিমিট চেকিং
    if (c.usageLimit != null && (c.usedCount ?? 0) >= c.usageLimit) {
      return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 });
    }

    // ডিসকাউন্ট হিসাব
    let discount = c.type === "percent" ? Math.round((parsed.data.subtotal * c.value) / 100) : c.value;

    if (c.maxDiscount != null && c.maxDiscount > 0) {
      discount = Math.min(discount, c.maxDiscount);
    }

    discount = Math.min(discount, parsed.data.subtotal);

    return NextResponse.json({
      ok: true,
      code: c.code,
      discount,
      type: c.type,
      value: c.value,
    });
  } catch (e) {
    console.error("coupon validate failed", e);
    return NextResponse.json({ error: "Could not validate coupon" }, { status: 500 });
  }
}