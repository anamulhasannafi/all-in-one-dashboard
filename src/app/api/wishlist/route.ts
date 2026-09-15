import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { wishlists, products } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ items: [] });
  try {
    const rows = await db.select({ w: wishlists, p: products }).from(wishlists).leftJoin(products, eq(products.id, wishlists.productId)).where(eq(wishlists.userId, session.userId));
    return NextResponse.json({
      items: rows.map((r) => ({
        productId: r.w.productId,
        product: r.p
          ? { id: r.p.id, name: r.p.name, slug: r.p.slug, basePrice: r.p.basePrice, comparePrice: r.p.comparePrice, imageUrl: r.p.imageUrl }
          : null,
      })),
    });
  } catch {
    return NextResponse.json({ items: [] });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: true, guest: true });
  try {
    const body = await req.json();
    const parsed = z.object({ productId: z.string().uuid() }).safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid product" }, { status: 400 });
    await db.insert(wishlists).values({ userId: session.userId, productId: parsed.data.productId }).onConflictDoNothing();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: true, guest: true });
  try {
    const body = await req.json();
    const parsed = z.object({ productId: z.string().uuid() }).safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid product" }, { status: 400 });
    await db.delete(wishlists).where(and(eq(wishlists.userId, session.userId), eq(wishlists.productId, parsed.data.productId)));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
