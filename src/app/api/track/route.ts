import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, deliveryZones } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/track?code=SUS-10001&phone=017...
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code")?.trim().toUpperCase() || "";
    const phone = url.searchParams.get("phone")?.trim() || "";
    if (!code) return NextResponse.json({ error: "Enter your order ID" }, { status: 400 });
    const rows = await db.select().from(orders).where(eq(orders.orderCode, code)).limit(1);
    const order = rows[0];
    if (!order) return NextResponse.json({ error: "Order not found. Check your Order ID." }, { status: 404 });
    // require phone match for privacy (unless admin session — handled loosely: still require phone)
    if (phone) {
      const norm = phone.replace(/[\s-]/g, "");
      const stored = (order.phone || "").replace(/[\s-]/g, "");
      const match =
        stored === norm ||
        stored === "0" + norm.slice(3) ||
        norm === "0" + stored.slice(3) ||
        stored.endsWith(norm.slice(-8));
      if (!match) return NextResponse.json({ error: "Phone number does not match this order" }, { status: 403 });
    }
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    const zone = order.deliveryZoneId
      ? (await db.select().from(deliveryZones).where(eq(deliveryZones.id, order.deliveryZoneId)).limit(1))[0]
      : null;
    return NextResponse.json({
      order: { ...order, address: order.address },
      items,
      zone: zone ? { name: zone.name, estimatedText: zone.estimatedText } : null,
    });
  } catch (e) {
    console.error("track failed", e);
    return NextResponse.json({ error: "Could not track order" }, { status: 500 });
  }
}
