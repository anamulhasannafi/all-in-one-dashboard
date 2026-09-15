import { NextResponse } from "next/server";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const cats = await db
      .select()
      .from(categories)
      .where(eq(categories.active, true))
      .orderBy(categories.sortOrder);
    const counts = await db.execute(
      sql`SELECT category_id, COUNT(*)::int as cnt FROM products WHERE active = true GROUP BY category_id`
    );
    const map = new Map<string, number>();
    for (const r of counts.rows as { category_id: string; cnt: number }[]) {
      map.set(r.category_id, r.cnt);
    }
    return NextResponse.json({
      items: cats.map((c) => ({ ...c, productCount: map.get(c.id) ?? 0 })),
    });
  } catch (e) {
    console.error("categories failed", e);
    return NextResponse.json({ error: "Could not load categories" }, { status: 500 });
  }
}
