import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { products, productVariants, productImages } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

const variantSchema = z.object({
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

export async function GET() {
  try {
    const allProducts = await db.select().from(products);

    let allVariants: any[] = [];
    let allImages: any[] = [];

    try {
      allVariants = await db.select().from(productVariants);
    } catch (e) {
      console.error("Variants query error:", e);
    }

    try {
      allImages = await db.select().from(productImages);
    } catch (e) {
      console.error("Images query error:", e);
    }

    const productsWithDetails = allProducts.map((p: any) => ({
      ...p,
      variants: allVariants.filter(
        (v: any) => v && (v.productId === p.id || v.product_id === p.id)
      ),
      images: allImages.filter(
        (img: any) => img && (img.productId === p.id || img.product_id === p.id)
      ),
    }));

    return NextResponse.json(productsWithDetails);
  } catch (e) {
    console.error("Fetch products failed", e);
    return NextResponse.json(
      { error: "Could not load products" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = productSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const slug =
      d.slug ||
      d.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

    const [newProduct] = await db
      .insert(products)
      .values({
        name: d.name.trim(),
        slug,
        description: d.description || null,
        categoryId: d.categoryId || null,
        basePrice: d.basePrice,
        comparePrice: d.comparePrice || null,
        fabric: d.fabric || null,
        imageUrl: d.imageUrl || null,
        active: d.active ?? true,
        featured: d.featured ?? false,
        isNew: d.isNew ?? false,
        bestseller: d.bestseller ?? false,
      })
      .returning();

    if (d.images && Array.isArray(d.images)) {
      for (let i = 0; i < d.images.length; i++) {
        const imgUrl = d.images[i];
        if (imgUrl) {
          await db.insert(productImages).values({
            productId: newProduct.id,
            url: imgUrl,
            alt: `Product Image ${i + 1}`,
            sortOrder: i + 1,
          });
        }
      }
    }

    if (d.variants && Array.isArray(d.variants)) {
      for (let i = 0; i < d.variants.length; i++) {
        const v = d.variants[i];
        await db.insert(productVariants).values({
          productId: newProduct.id,
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

    return NextResponse.json({ ok: true, product: newProduct });
  } catch (e) {
    console.error("Create product failed", e);
    return NextResponse.json(
      { error: "Could not create product" },
      { status: 500 }
    );
  }
}