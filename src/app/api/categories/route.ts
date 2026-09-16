import { NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, slug, description, imageUrl, sortOrder, active } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and Slug are required" }, { status: 400 });
    }

    const inserted = await db
      .insert(categories)
      .values({
        name,
        slug,
        description: description || null,
        imageUrl: imageUrl || null,
        sortOrder: Number(sortOrder) || 0,
        active: active ?? true,
      })
      .returning();

    return NextResponse.json({ ok: true, category: inserted[0] });
  } catch (e) {
    console.error("Category creation failed", e);
    return NextResponse.json({ error: "Could not create category" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { id, name, slug, description, imageUrl, sortOrder, active } = body;

    if (!id) return NextResponse.json({ error: "Category ID is required" }, { status: 400 });

    const updated = await db
      .update(categories)
      .set({
        name,
        slug,
        description: description || null,
        imageUrl: imageUrl || null,
        sortOrder: Number(sortOrder) || 0,
        active: active ?? true,
      })
      .where(eq(categories.id, id))
      .returning();

    return NextResponse.json({ ok: true, category: updated[0] });
  } catch (e) {
    console.error("Category update failed", e);
    return NextResponse.json({ error: "Could not update category" }, { status: 500 });
  }
}