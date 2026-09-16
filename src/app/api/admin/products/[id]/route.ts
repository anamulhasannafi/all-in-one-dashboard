import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { products, productImages, productVariants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

const variantSchema = z.object({
  id: z.string().optional(),
  size: z.string().min(1).max(30),
  color: z.string().min(1).max(60),
  colorHex: z.string().max(10).optional().nullable(),
  sku: z.string().max(80).optional().nullable(),
  price: z.number().int().min(0).nullable().optional(),
  stock: z.number().int().min(0).max(100000),
  imageUrl: z.string().max(500).optional().nullable(),
});

const imageSchema = z.object({
  id: z.string().optional(),
  imageUrl: z.string().max(500),
  sortOrder: z.number().int().optional(),
});

const productUpdateSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(220).optional(),
  description: z.string().max(5000).optional().nullable(),
  categoryId: z.string().uuid().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  basePrice: z.number().int().min(0),
  base_price: z.number().int().min(0).optional(),
  comparePrice: z.number().int().min(0).nullable().optional(),
  compare_price: z.number().int().min(0).nullable().optional(),
  fabric: z.string().max(120).optional().nullable(),
  imageUrl: z.string().max(500).optional().nullable(),
  image_url: z.string().max(500).optional().nullable(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
  isNew: z.boolean().optional(),
  bestseller: z.boolean().optional(),
  variants: z.array(variantSchema).optional(),
  images: z.array(imageSchema).optional(),
});

// GET — প্রোডাক্টের ডাটা এডিট ফর্মে পাঠানোর জন্য
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;

  try {
    const productRows = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!productRows || productRows.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const product = productRows[0];
    const images = await db.select().from(productImages).where(eq(productImages.productId, id));
    const variants = await db.select().from(productVariants).where(eq(productVariants.productId, id));

    return NextResponse.json({ ok: true, product, images, variants });
  } catch (e) {
    console.error("Failed to fetch product:", e);
    return NextResponse.json({ error: "Failed to fetch product details" }, { status: 500 });
  }
}

// PUT — এডিট করা তথ্য ডাটাবেজে সেভ করার জন্য
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;

  try {
    const body = await req.json();
    const parsed = productUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const d = parsed.data;
    const catId = d.categoryId || d.category_id || null;
    const bPrice = d.basePrice ?? d.base_price ?? 0;
    const cPrice = d.comparePrice ?? d.compare_price ?? null;
    const imgUrl = d.imageUrl || d.image_url || null;

    await db.transaction(async (tx) => {
      await tx
        .update(products)
        .set({
          name: d.name.trim(),
          slug: d.slug || d.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          description: d.description || null,
          categoryId: catId,
          basePrice: bPrice,
          comparePrice: cPrice,
          fabric: d.fabric || null,
          imageUrl: imgUrl,
          active: d.active ?? true,
          featured: d.featured ?? false,
          isNew: d.isNew ?? false,
          bestseller: d.bestseller ?? false,
          updatedAt: new Date(),
        })
        .where(eq(products.id, id));

      if (d.images !== undefined) {
        await tx.delete(productImages).where(eq(productImages.productId, id));
        for (let i = 0; i < d.images.length; i++) {
          await tx.insert(productImages).values({
            productId: id,
            url: d.images[i].imageUrl,
            alt: `Product Image ${i + 1}`,
            sortOrder: d.images[i].sortOrder ?? i + 1,
          });
        }
      }

      if (d.variants !== undefined) {
        await tx.delete(productVariants).where(eq(productVariants.productId, id));
        for (let i = 0; i < d.variants.length; i++) {
          const v = d.variants[i];
          await tx.insert(productVariants).values({
            productId: id,
            size: v.size,
            color: v.color,
            colorHex: v.colorHex || null,
            sku: v.sku || null,
            price: v.price ?? null,
            stock: v.stock,
            imageUrl: v.imageUrl || null,
            sortOrder: i,
          });
        }
      }
    });

    return NextResponse.json({ ok: true, message: "Product updated successfully" });
  } catch (e) {
    console.error("Failed to update product:", e);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

// DELETE — প্রোডাক্ট ডিলিট করার জন্য
export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;

  try {
    await db.transaction(async (tx) => {
      await tx.delete(productVariants).where(eq(productVariants.productId, id));
      await tx.delete(productImages).where(eq(productImages.productId, id));
      await tx.delete(products).where(eq(products.id, id));
    });

    return NextResponse.json({ ok: true, message: "Product deleted permanently" });
  } catch (e) {
    console.error("Failed to delete product:", e);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}