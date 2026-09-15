import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { orders, orderItems, orderStatusHistory, productVariants } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const rows = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!rows[0]) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
  const history = await db.select().from(orderStatusHistory).where(eq(orderStatusHistory.orderId, id)).orderBy(orderStatusHistory.createdAt);
  return NextResponse.json({ order: rows[0], items, history });
}

const patchSchema = z.object({
  status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"]),
  adminNote: z.string().max(500).optional(),
});

// PATCH — status update with inventory restore on cancel
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    const result = await db.transaction(async (tx) => {
      const rows = await tx.select().from(orders).where(eq(orders.id, id)).limit(1);
      const order = rows[0];
      if (!order) throw new Error("Order not found");
      const from = order.status;
      const to = parsed.data.status;
      if (from === to) return order;
      // restore stock if cancelling a non-cancelled order
      if (to === "cancelled" && from !== "cancelled") {
        const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, id));
        for (const it of items) {
          if (it.variantId) {
            await tx.execute(sql`UPDATE product_variants SET stock = stock + ${it.quantity} WHERE id = ${it.variantId}`);
          }
        }
      }
      await tx
        .update(orders)
        .set({ status: to, adminNote: parsed.data.adminNote ?? order.adminNote, updatedAt: new Date() })
        .where(eq(orders.id, id));
      await tx.insert(orderStatusHistory).values({
        orderId: id,
        fromStatus: from,
        toStatus: to,
        note: parsed.data.adminNote || `Status changed to ${to}`,
        createdBy: admin.email,
      });
      return { ...order, status: to };
    });
    return NextResponse.json({ ok: true, order: result });
  } catch (e) {
    console.error("order status update failed", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Update failed" }, { status: 500 });
  }
}
