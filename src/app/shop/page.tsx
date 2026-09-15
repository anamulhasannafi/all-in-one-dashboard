import { Suspense } from "react";
import ShopClient from "./shop-client";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Shop" };

async function getCats() {
  try {
    return await db.select().from(categories).where(eq(categories.active, true)).orderBy(categories.sortOrder);
  } catch {
    return [];
  }
}

export default async function ShopPage() {
  const cats = await getCats();
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-16 text-center text-ink-500">Loading shop…</div>}>
      <ShopClient categories={cats.map((c) => ({ slug: c.slug, name: c.name }))} />
    </Suspense>
  );
}
