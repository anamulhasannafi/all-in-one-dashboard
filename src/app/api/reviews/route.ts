import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { getSession } from "@/lib/auth";

const schema = z.object({
  productId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(3).max(1000),
  title: z.string().trim().max(160).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Please add a rating and review" }, { status: 400 });
    const session = await getSession();
    await db.insert(reviews).values({
      productId: parsed.data.productId,
      userId: session?.userId ?? null,
      authorName: session?.name ?? "Verified Customer",
      rating: parsed.data.rating,
      title: parsed.data.title || null,
      comment: parsed.data.comment.trim(),
      status: "pending",
    });
    return NextResponse.json({ ok: true, message: "Thanks! Your review is awaiting moderation." });
  } catch (e) {
    console.error("review failed", e);
    return NextResponse.json({ error: "Could not submit review" }, { status: 500 });
  }
}
