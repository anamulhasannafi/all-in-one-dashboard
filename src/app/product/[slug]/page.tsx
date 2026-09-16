import { notFound } from "next/navigation";
import { db } from "@/db";
import { products, productVariants, productImages, categories, reviews } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import ProductView from "./product-view";

export const dynamic = "force-dynamic";

async function getProduct(slug: string) {
  const rows = await db
    .select({ p: products, catName: categories.name, catSlug: categories.slug })
    .from(products)
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(eq(products.slug, slug))
    .limit(1);
  if (!rows[0] || !rows[0].p.active) return null;
  const p = rows[0].p;
  const variants = await db.select().from(productVariants).where(and(eq(productVariants.productId, p.id), eq(productVariants.active, true))).orderBy(productVariants.sortOrder);
  const images = await db.select().from(productImages).where(eq(productImages.productId, p.id)).orderBy(productImages.sortOrder);
  const revs = await db.select().from(reviews).where(and(eq(reviews.productId, p.id), eq(reviews.status, "approved"))).orderBy(sql`${reviews.createdAt} DESC`).limit(10);
  const rel = p.categoryId
    ? await db.select().from(products).where(and(eq(products.active, true), eq(products.categoryId, p.categoryId))).limit(5)
    : [];
  return { p, catName: rows[0].catName, catSlug: rows[0].catSlug, variants, images, revs, rel: rel.filter((r) => r.id !== p.id).slice(0, 4) };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const data = await getProduct(slug);
    if (!data) return { title: "Product not found" };
    return { title: data.p.name, description: (data.p.description || "").slice(0, 160) };
  } catch {
    return { title: "Product" };
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let data;
  try {
    data = await getProduct(slug);
  } catch {
    data = null;
  }
  if (!data) notFound();
  return <ProductView data={JSON.parse(JSON.stringify(data))} />;
}
