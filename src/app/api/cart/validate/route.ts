import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { products, productVariants } from "@/db/schema";
import { eq } from "drizzle-orm";

const schema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        variantId: z.string().uuid().nullable().optional(),
        quantity: z.number().int().min(1).max(99),
      })
    )
    .max(30),
});

// POST /api/cart/validate — re-price + stock check from server truth
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid bag" }, { status: 400 });
    const out: {
      productId: string;
      variantId: string | null;
      price: number;
      stock: number;
      available: boolean;
      name: string;
    }[] = [];
    for (const it of parsed.data.items) {
      const p = (await db.select().from(products).where(eq(products.id, it.productId)).limit(1))[0];
      if (!p || !p.active) {
        out.push({ productId: it.productId, variantId: it.variantId ?? null, price: 0, stock: 0, available: false, name: "Unavailable" });
        continue;
      }
      if (it.variantId) {
        const v = (await db.select().from(productVariants).where(eq(productVariants.id, it.variantId)).limit(1))[0];
        if (!v || !v.active || v.productId !== p.id) {
          out.push({ productId: it.productId, variantId: it.variantId, price: 0, stock: 0, available: false, name: p.name });
          continue;
        }
        out.push({
          productId: p.id,
          variantId: v.id,
          price: v.price ?? p.basePrice,
          stock: v.stock,
          available: v.stock > 0,
          name: p.name,
        });
      } else {
        out.push({ productId: p.id, variantId: null, price: p.basePrice, stock: 99, available: true, name: p.name });
      }
    }
    return NextResponse.json({ items: out });
  } catch (e) {
    console.error("cart validate failed", e);
    return NextResponse.json({ error: "Could not validate bag" }, { status: 500 });
  }
}
