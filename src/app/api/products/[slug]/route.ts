import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, productVariants, productImages, categories, reviews } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await ctx.params;
    const rows = await db
      .select({ p: products, catName: categories.name })
      .from(products)
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .where(eq(products.slug, slug))
      .limit(1);
    if (!rows[0]) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    const p = rows[0].p;
    if (!p.active) return NextResponse.json({ error: "Product unavailable" }, { status: 410 });

    const variants = await db
      .select()
      .from(productVariants)
      .where(and(eq(productVariants.productId, p.id), eq(productVariants.active, true)))
      .orderBy(productVariants.sortOrder);
    const images = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, p.id))
      .orderBy(productImages.sortOrder);
    const revs = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.productId, p.id), eq(reviews.status, "approved")))
      .orderBy(sql`${reviews.createdAt} DESC`)
      .limit(12);

    // related
    const related = p.categoryId
      ? await db
          .select()
          .from(products)
          .where(and(eq(products.active, true), eq(products.categoryId, p.categoryId)))
          .limit(8)
      : await db.select().from(products).where(eq(products.active, true)).limit(8);

    return NextResponse.json({
      product: { ...p, categoryName: rows[0].catName },
      variants,
      images,
      reviews: revs,
      related: related.filter((r) => r.id !== p.id).slice(0, 4),
    });
  } catch (e) {
    console.error("product detail failed", e);
    return NextResponse.json({ error: "Could not load product" }, { status: 500 });
  }
}
