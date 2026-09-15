import { Suspense } from "react";
import ShopClient from "../shop/shop-client";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Search" };

export default async function SearchPage() {
  let cats: { slug: string; name: string }[] = [];
  try {
    const rows = await db.select().from(categories).where(eq(categories.active, true)).orderBy(categories.sortOrder);
    cats = rows.map((c) => ({ slug: c.slug, name: c.name }));
  } catch {}
  return (
    <Suspense fallback={<div className="py-16 text-center text-ink-500">Searching…</div>}>
      <ShopClient categories={cats} />
    </Suspense>
  );
}
