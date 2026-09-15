import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { coupons, deliveryZones, siteSettings, categories, reviews, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

// Combined lightweight admin endpoints to save routes:
// GET ?resource=coupons|zones|site|categories|reviews|customers|errors
export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const r = url.searchParams.get("resource") || "coupons";
  try {
    if (r === "coupons") {
      const rows = await db.select().from(coupons).orderBy(coupons.createdAt);
      return NextResponse.json({ items: rows });
    }
    if (r === "zones") {
      const rows = await db.select().from(deliveryZones).orderBy(deliveryZones.sortOrder);
      return NextResponse.json({ items: rows });
    }
    if (r === "site") {
      const rows = await db.select().from(siteSettings).limit(1);
      return NextResponse.json({ site: rows[0] ?? null });
    }
    if (r === "categories") {
      const rows = await db.select().from(categories).orderBy(categories.sortOrder);
      return NextResponse.json({ items: rows });
    }
    if (r === "reviews") {
      const rows = await db.execute(sql`SELECT r.*, p.name as product_name FROM reviews r LEFT JOIN products p ON p.id=r.product_id ORDER BY r.created_at DESC LIMIT 100`);
      return NextResponse.json({ items: rows.rows });
    }
    if (r === "customers") {
      const rows = await db.execute(sql`SELECT u.id, u.name, u.email, u.phone, u.created_at, COUNT(o.id)::int as orders, COALESCE(SUM(o.total),0)::int as spent FROM users u LEFT JOIN orders o ON o.user_id=u.id GROUP BY u.id ORDER BY u.created_at DESC LIMIT 100`);
      return NextResponse.json({ items: rows.rows });
    }
    if (r === "errors") {
      const rows = await db.execute(sql`SELECT * FROM error_logs ORDER BY created_at DESC LIMIT 50`);
      return NextResponse.json({ items: rows.rows });
    }
    return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
  } catch (e) {
    console.error("admin misc get failed", e);
    return NextResponse.json({ error: "Load failed" }, { status: 500 });
  }
}

// POST ?resource=coupons|zones|categories  — create
// PUT ?resource=site|reviews|coupons|zones — update (body must include id where relevant)
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const r = url.searchParams.get("resource") || "";
  try {
    const body = await req.json();
    if (r === "coupons") {
      const s = z.object({
        code: z.string().min(2).max(40),
        type: z.enum(["percent", "fixed"]),
        value: z.number().int().min(1),
        minSubtotal: z.number().int().min(0).default(0),
        maxDiscount: z.number().int().min(0).nullable().optional(),
        usageLimit: z.number().int().min(1).nullable().optional(),
        active: z.boolean().default(true),
      }).safeParse(body);
      if (!s.success) return NextResponse.json({ error: "Invalid coupon" }, { status: 400 });
      await db.insert(coupons).values({
        code: s.data.code.toUpperCase().trim(),
        type: s.data.type,
        value: s.data.value,
        minSubtotal: s.data.minSubtotal,
        maxDiscount: s.data.maxDiscount ?? null,
        usageLimit: s.data.usageLimit ?? null,
        active: s.data.active,
      });
      return NextResponse.json({ ok: true });
    }
    if (r === "zones") {
      const s = z.object({
        name: z.string().min(2).max(120),
        charge: z.number().int().min(0),
        freeAbove: z.number().int().min(0).nullable().optional(),
        estimatedText: z.string().max(120).default("2-4 days"),
      }).safeParse(body);
      if (!s.success) return NextResponse.json({ error: "Invalid zone" }, { status: 400 });
      await db.insert(deliveryZones).values({
        name: s.data.name,
        charge: s.data.charge,
        freeAbove: s.data.freeAbove ?? null,
        estimatedText: s.data.estimatedText,
        active: true,
        sortOrder: 0,
      });
      return NextResponse.json({ ok: true });
    }
    if (r === "categories") {
      const s = z.object({
        name: z.string().min(2).max(120),
        description: z.string().max(500).optional(),
        imageUrl: z.string().max(500).optional(),
      }).safeParse(body);
      if (!s.success) return NextResponse.json({ error: "Invalid category" }, { status: 400 });
      const slug = s.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      await db.insert(categories).values({
        name: s.data.name,
        slug: slug + "-" + Date.now().toString(36),
        description: s.data.description || null,
        imageUrl: s.data.imageUrl || null,
        sortOrder: 0,
        active: true,
      });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
  } catch (e) {
    console.error("admin misc post failed", e);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const r = url.searchParams.get("resource") || "";
  try {
    const body = await req.json();
    if (r === "site") {
      const { eq: eqq } = await import("drizzle-orm");
      const existing = await db.select().from(siteSettings).limit(1);
      const values = {
        announcementText: body.announcementText ?? null,
        announcementEnabled: body.announcementEnabled ?? true,
        freeShippingThreshold: body.freeShippingThreshold ?? null,
        supportPhone: body.supportPhone ?? null,
        supportEmail: body.supportEmail ?? null,
        facebook: body.facebook ?? null,
        instagram: body.instagram ?? null,
        tiktok: body.tiktok ?? null,
        youtube: body.youtube ?? null,
        updatedAt: new Date(),
      };
      if (existing.length === 0) await db.insert(siteSettings).values({ id: 1, ...values });
      else await db.update(siteSettings).set(values).where(eqq(siteSettings.id, 1));
      return NextResponse.json({ ok: true });
    }
    if (r === "coupons" && body.id) {
      await db.update(coupons).set({
        active: body.active,
        ...(body.value != null ? { value: body.value } : {}),
        ...(body.usageLimit !== undefined ? { usageLimit: body.usageLimit } : {}),
      }).where(eq(coupons.id, body.id));
      if (body.delete) await db.delete(coupons).where(eq(coupons.id, body.id));
      return NextResponse.json({ ok: true });
    }
    if (r === "zones" && body.id) {
      if (body.delete) await db.delete(deliveryZones).where(eq(deliveryZones.id, body.id));
      else
        await db.update(deliveryZones).set({
          name: body.name,
          charge: body.charge,
          freeAbove: body.freeAbove ?? null,
          estimatedText: body.estimatedText,
          active: body.active ?? true,
        }).where(eq(deliveryZones.id, body.id));
      return NextResponse.json({ ok: true });
    }
    if (r === "reviews" && body.id) {
      if (body.delete) {
        const { eq: eq2 } = await import("drizzle-orm");
        await db.delete(reviews).where(eq2(reviews.id, body.id));
      } else {
        await db.update(reviews).set({ status: body.status }).where(eq(reviews.id, body.id));
      }
      return NextResponse.json({ ok: true });
    }
    if (r === "categories" && body.id) {
      if (body.delete) await db.delete(categories).where(eq(categories.id, body.id));
      else await db.update(categories).set({ name: body.name, imageUrl: body.imageUrl ?? null, active: body.active ?? true }).where(eq(categories.id, body.id));
      return NextResponse.json({ ok: true });
    }
    if (r === "customers" && body.id) {
      await db.update(users).set({ role: body.role }).where(eq(users.id, body.id));
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
  } catch (e) {
    console.error("admin misc put failed", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
