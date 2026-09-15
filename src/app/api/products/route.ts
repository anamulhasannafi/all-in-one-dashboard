import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, categories, productVariants } from "@/db/schema";
import { and, asc, desc, eq, ilike, or, sql, gte, lte } from "drizzle-orm";

// GET /api/products?q=&category=&sort=&min=&max=&featured=&limit=&offset=
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

    const conds: ReturnType<typeof eq>[] = [eq(products.active, true)];
    // build with sql-safe approach
    const whereParts: string[] = [`p.active = true`];
    const params: unknown[] = [];
    let pi = 1;

    if (q) {
      whereParts.push(`(p.name ILIKE $${pi} OR p.description ILIKE $${pi})`);
      params.push(`%${q}%`);
      pi++;
    }
    if (category) {
      whereParts.push(`c.slug = $${pi}`);
      params.push(category);
      pi++;
    }
    if (featured === "1") whereParts.push(`p.featured = true`);
    if (bestseller === "1") whereParts.push(`p.bestseller = true`);
    if (isNew === "1") whereParts.push(`p.is_new = true`);
    if (min > 0) {
      whereParts.push(`p.base_price >= $${pi}`);
      params.push(min);
      pi++;
    }
    if (max > 0) {
      whereParts.push(`p.base_price <= $${pi}`);
      params.push(max);
      pi++;
    }

    const orderBy =
      sort === "price-asc"
        ? `p.base_price ASC`
        : sort === "price-desc"
          ? `p.base_price DESC`
          : sort === "popular"
            ? `p.total_sold DESC`
            : `p.created_at DESC`;

    const whereSql = whereParts.join(" AND ");
    const rows = await db.execute(
      sql.raw(
        `SELECT p.*, c.name as category_name,
          (SELECT MIN(v.price) FROM product_variants v WHERE v.product_id = p.id AND v.active = true AND v.price IS NOT NULL) as min_variant_price,
          (SELECT COALESCE(SUM(v.stock),0) FROM product_variants v WHERE v.product_id = p.id AND v.active = true) as variant_stock
         FROM products p LEFT JOIN categories c ON c.id = p.category_id
         WHERE ${whereSql}
         ORDER BY ${orderBy}
         LIMIT ${limit} OFFSET ${offset}`
      )
    );

    // count
    const countRes = await db.execute(
      sql.raw(
        `SELECT COUNT(*)::int as cnt FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE ${whereSql}`
      )
    );

    void conds; void and; void asc; void desc; void eq; void ilike; void or; void gte; void lte;
    void categories; void productVariants;

    const items = (rows.rows as Record<string, unknown>[]).map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      basePrice: r.base_price,
      comparePrice: r.compare_price,
      imageUrl: r.image_url,
      isNew: r.is_new,
      bestseller: r.bestseller,
      featured: r.featured,
      ratingAvg: r.rating_avg,
      totalSold: r.total_sold,
      categoryName: r.category_name,
      minVariantPrice: r.min_variant_price,
      stockOut: Number(r.variant_stock ?? 0) <= 0,
    }));

    const total = (countRes.rows[0] as { cnt: number })?.cnt ?? items.length;
    void params;
    return NextResponse.json({ items, total });
  } catch (e) {
    console.error("products list failed", e);
    return NextResponse.json({ error: "Could not load products" }, { status: 500 });
  }
}
