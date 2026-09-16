import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, categories, productVariants } from "@/db/schema";
import { and, asc, desc, eq, ilike, or, sql, gte, lte } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() || "";
    const category = url.searchParams.get("category") || "";
    const sort = url.searchParams.get("sort") || "newest";
    const min = Number(url.searchParams.get("min") || 0);
    const max = Number(url.searchParams.get("max") || 0);
    const featured = url.searchParams.get("featured");
    const bestseller = url.searchParams.get("bestseller");
    const isNew = url.searchParams.get("new");
    const limit = Math.min(60, Math.max(1, Number(url.searchParams.get("limit") || 24)));
    const offset = Math.max(0, Number(url.searchParams.get("offset") || 0));

    const conditions = [eq(products.active, true)];

    if (q) {
      conditions.push(ilike(products.name, `%${q}%`));
    }

    if (category) {
      // স্লাগ (slug) অথবা আইডি (id) দিয়ে ক্যাটাগরি খুঁজে বের করা
      const foundCat = await db
        .select({ id: categories.id })
        .from(categories)
        .where(or(eq(categories.slug, category), eq(categories.id, category)))
        .limit(1);

      if (foundCat.length > 0) {
        conditions.push(eq(products.categoryId, foundCat[0].id));
      } else {
        return NextResponse.json({ items: [], total: 0 });
      }
    }

    if (featured === "1") conditions.push(eq(products.featured, true));
    if (bestseller === "1") conditions.push(eq(products.bestseller, true));
    if (isNew === "1") conditions.push(eq(products.isNew, true));
    if (min > 0) conditions.push(gte(products.basePrice, min));
    if (max > 0) conditions.push(lte(products.basePrice, max));

    let orderByClause = desc(products.createdAt);
    if (sort === "price-asc") orderByClause = asc(products.basePrice);
    if (sort === "price-desc") orderByClause = desc(products.basePrice);
    if (sort === "popular") orderByClause = desc(products.totalSold);

    const items = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        basePrice: products.basePrice,
        comparePrice: products.comparePrice,
        imageUrl: products.imageUrl,
        isNew: products.isNew,
        bestseller: products.bestseller,
        featured: products.featured,
        ratingAvg: products.ratingAvg,
        totalSold: products.totalSold,
        categoryName: categories.name,
        variantStock: sql<number>`COALESCE((SELECT SUM(v.stock) FROM product_variants v WHERE v.product_id = products.id AND v.active = true), 0)::int`,
        minVariantPrice: sql<number>`(SELECT MIN(v.price) FROM product_variants v WHERE v.product_id = products.id AND v.active = true AND v.price IS NOT NULL)::int`,
      })
      .from(products)
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .where(and(...conditions))
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    const countRes = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(products)
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .where(and(...conditions));

    const total = countRes[0]?.count ?? items.length;

    const formattedItems = items.map((r) => ({
      ...r,
      stockOut: Number(r.variantStock ?? 0) <= 0,
    }));

    return NextResponse.json({ items: formattedItems, total });
  } catch (e) {
    console.error("products list failed", e);
    return NextResponse.json({ error: "Could not load products" }, { status: 500 });
  }
}