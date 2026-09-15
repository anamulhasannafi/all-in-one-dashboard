import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { products, productVariants, productImages } from "@/db/schema";
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
  sortOrder: z.number().int().optional(),
});

const productSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(220).optional(),
  description: z.string().max(5000).optional().nullable(),
  categoryId: z.string().uuid().nullable().optional(),
  basePrice: z.number().int().min(1),
  comparePrice: z.number().int().min(0).nullable().optional(),
  fabric: z.string().max(120).optional().nullable(),
  imageUrl: z.string().max(500).optional().nullable(),
  images: z.array(z.string().max(500)).optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
  isNew: z.boolean().optional(),
  bestseller: z.boolean().optional(),
  variants: z.array(variantSchema).max(20).optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const productList = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!productList.length) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const product = productList[0];
    const variants = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, id));

    const images = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, id));

    return NextResponse.json({
      product,
      variants,
      images,
    });
  } catch (e) {
    console.error("Fetch product failed", e);
    return NextResponse.json(
      { error: "Could not load product" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();

    const parsed = productSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message },
        { status: 400 }
      );
    }

    const d = parsed.data;

    await db
      .update(products)
      .set({
        ...(d.name && { name: d.name.trim() }),
        ...(d.slug && { slug: d.slug }),
        ...(d.description !== undefined && { description: d.description }),
        ...(d.categoryId !== undefined && { categoryId: d.categoryId }),
        ...(d.basePrice !== undefined && { basePrice: d.basePrice }),
        ...(d.comparePrice !== undefined && { comparePrice: d.comparePrice }),
        ...(d.fabric !== undefined && { fabric: d.fabric }),
        ...(d.imageUrl !== undefined && { imageUrl: d.imageUrl }),
        ...(d.active !== undefined && { active: d.active }),
        ...(d.featured !== undefined && { featured: d.featured }),
        ...(d.isNew !== undefined && { isNew: d.isNew }),
        ...(d.bestseller !== undefined && { bestseller: d.bestseller }),
      })
      .where(eq(products.id, id));

    if (d.images && Array.isArray(d.images)) {
      await db.delete(productImages).where(eq(productImages.productId, id));
      for (let i = 0; i < d.images.length; i++) {
        const imgUrl = d.images[i];
        if (imgUrl) {
          await db.insert(productImages).values({
            productId: id,
            url: imgUrl,
            alt: `Product Image ${i + 1}`,
            sortOrder: i + 1,
          });
        }
      }
    }

    if (d.variants && Array.isArray(d.variants)) {
      await db.delete(productVariants).where(eq(productVariants.productId, id));
      for (let i = 0; i < d.variants.length; i++) {
        const v = d.variants[i];
        await db.insert(productVariants).values({
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

    return NextResponse.json({ ok: true, message: "Product updated successfully" });
  } catch (e) {
    console.error("Product update failed", e);
    return NextResponse.json(
      { error: "Could not update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;

    await db.delete(productVariants).where(eq(productVariants.productId, id));
    await db.delete(productImages).where(eq(productImages.productId, id));
    await db.delete(products).where(eq(products.id, id));

    return NextResponse.json({ ok: true, message: "Product deleted successfully" });
  } catch (e) {
    console.error("Product deletion failed", e);
    return NextResponse.json(
      { error: "Could not delete product" },
      { status: 500 }
    );
  }
}