import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { heroSettings } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

const schema = z.object({
  heroType: z.enum(["image", "video"]),
  videoUrl: z.string().max(500).nullable().optional(),
  mobileVideoUrl: z.string().max(500).nullable().optional(),
  posterUrl: z.string().max(500).nullable().optional(),
  mobilePosterUrl: z.string().max(500).nullable().optional(),
  imageUrl: z.string().max(500).nullable().optional(),
  mobileImageUrl: z.string().max(500).nullable().optional(),
  badgeText: z.string().max(160).nullable().optional(),
  headline: z.string().max(300).nullable().optional(),
  subheadline: z.string().max(600).nullable().optional(),
  primaryCtaText: z.string().max(80).nullable().optional(),
  primaryCtaLink: z.string().max(300).nullable().optional(),
  secondaryCtaText: z.string().max(80).nullable().optional(),
  secondaryCtaLink: z.string().max(300).nullable().optional(),
  overlayOpacity: z.number().int().min(0).max(90),
  animation: z.enum(["fade", "slide-up", "zoom", "cinematic", "none"]),
  enabled: z.boolean(),
});

function emptyToNull(v?: string | null) {
  if (v === undefined) return undefined;
  if (v === null) return null;
  const t = v.trim();
  return t === "" ? null : t;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await db.select().from(heroSettings).limit(1);
  return NextResponse.json({ hero: rows[0] ?? null });
}

export async function PUT(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }
    const d = parsed.data;
    const values = {
      heroType: d.heroType,
      videoUrl: emptyToNull(d.videoUrl) ?? null,
      mobileVideoUrl: emptyToNull(d.mobileVideoUrl) ?? null,
      posterUrl: emptyToNull(d.posterUrl) ?? null,
      mobilePosterUrl: emptyToNull(d.mobilePosterUrl) ?? null,
      imageUrl: emptyToNull(d.imageUrl) ?? null,
      mobileImageUrl: emptyToNull(d.mobileImageUrl) ?? null,
      badgeText: emptyToNull(d.badgeText) ?? null,
      headline: emptyToNull(d.headline) ?? null,
      subheadline: emptyToNull(d.subheadline) ?? null,
      primaryCtaText: emptyToNull(d.primaryCtaText) ?? null,
      primaryCtaLink: emptyToNull(d.primaryCtaLink) || "/shop",
      secondaryCtaText: emptyToNull(d.secondaryCtaText) ?? null,
      secondaryCtaLink: emptyToNull(d.secondaryCtaLink) || "/offers",
      overlayOpacity: d.overlayOpacity,
      animation: d.animation,
      enabled: d.enabled,
      updatedAt: new Date(),
    };
    const existing = await db.select().from(heroSettings).limit(1);
    if (existing.length === 0) {
      await db.insert(heroSettings).values({ id: 1, ...values });
    } else {
      const { eq } = await import("drizzle-orm");
      await db.update(heroSettings).set(values).where(eq(heroSettings.id, 1));
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("hero update failed", e);
    return NextResponse.json({ error: "Could not save hero settings" }, { status: 500 });
  }
}

export async function DELETE() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { eq } = await import("drizzle-orm");
    await db
      .update(heroSettings)
      .set({ videoUrl: null, mobileVideoUrl: null, updatedAt: new Date(), heroType: "image" })
      .where(eq(heroSettings.id, 1));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("hero video delete failed", e);
    return NextResponse.json({ error: "Could not delete video" }, { status: 500 });
  }
}
