import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, productVariants, productImages } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await context.params;
    const id = params.id;

    const productList = await db
      .select()
      .from(products)
      .where(eq(products.id, id));

    if (!productList || productList.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const product = productList[0];

    let variants: any[] = [];
    let images: any[] = [];

    try {
      variants = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.productId, id));
    } catch (e) {
      console.error("Variants fetch error:", e);
    }

    try {
      images = await db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, id));
    } catch (e) {
      console.error("Images fetch error:", e);
    }

    return NextResponse.json({
      ...product,
      variants,
      images,
      product: {
        ...product,
        variants,
        images,
      },
    });
  } catch (e) {
    console.error("Fetch single product failed", e);
    return NextResponse.json(
      { error: "Could not load product" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const params = await context.params;
    const id = params.id;
    const body = await req.json();

    await db
      .update(products)
      .set({
        name: body.name,
        slug: body.slug,
        description: body.description,
        basePrice: body.basePrice,
        comparePrice: body.comparePrice,
        fabric: body.fabric,
        imageUrl: body.imageUrl,
        active: body.active,
        featured: body.featured,
        isNew: body.isNew,
        bestseller: body.bestseller,
      })
      .where(eq(products.id, id));

    if (body.variants && Array.isArray(body.variants)) {
      await db.delete(productVariants).where(eq(productVariants.productId, id));
      for (let i = 0; i < body.variants.length; i++) {
        const v = body.variants[i];
        await db.insert(productVariants).values({
          productId: id,
          size: v.size || "Default",
          color: v.color || "Default",
          colorHex: v.colorHex || null,
          sku: v.sku || null,
          price: v.price ?? null,
          stock: v.stock ?? 0,
          imageUrl: v.imageUrl || null,
          sortOrder: i,
        });
      }
    }

    return NextResponse.json({ ok: true, message: "Product updated successfully" });
  } catch (e) {
    console.error("Update product failed", e);
    return NextResponse.json(
      { error: "Could not update product" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  return PUT(req, context);
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const params = await context.params;
    const id = params.id;

    await db.delete(productVariants).where(eq(productVariants.productId, id));
    await db.delete(productImages).where(eq(productImages.productId, id));
    await db.delete(products).where(eq(products.id, id));

    return NextResponse.json({ ok: true, message: "Product deleted successfully" });
  } catch (e) {
    console.error("Delete product failed", e);
    return NextResponse.json(
      { error: "Could not delete product" },
      { status: 500 }
    );
  }
}