import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import {
  orders,
  orderItems,
  products,
  productVariants,
  deliveryZones,
  coupons,
  orderStatusHistory,
  inventoryLogs,
  errorLogs,
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getSession, normalizeBdPhone, isBdPhone } from "@/lib/auth";

const itemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullable().optional(),
  quantity: z.number().int().min(1).max(20),
});

const orderSchema = z.object({
  customerName: z.string().trim().min(2, "Name is required").max(120),
  phone: z.string().trim().min(1, "Phone number is required"),
  email: z.string().trim().email("Enter a valid email").max(180).optional().or(z.literal("")),
  address: z.string().trim().min(5, "Full address is required").max(500),
  city: z.string().trim().min(2, "City is required").max(80),
  area: z.string().trim().max(120).optional().or(z.literal("")),
  deliveryZoneId: z.string().uuid("Select a delivery zone"),
  paymentMethod: z.enum(["cod", "bkash", "nagad", "rocket", "card"]).default("cod"),
  couponCode: z.string().trim().max(40).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  items: z.array(itemSchema).min(1, "Your bag is empty").max(30),
  idempotencyKey: z.string().trim().min(8).max(80),
});

async function logError(context: string, message: string, details: unknown) {
  try {
    await db.insert(errorLogs).values({
      context,
      message: message.slice(0, 1000),
      details: details ? (JSON.parse(JSON.stringify(details)) as object) : null,
    });
  } catch {}
}

export async function POST(req: Request) {
  const requestId = Math.random().toString(36).slice(2, 8);
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request. Please try again." }, { status: 400 });
  }

  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message || "Please check your information";
    await logError("order_validation", msg, { issues: parsed.error.issues, requestId });
    return NextResponse.json({ error: msg, field: parsed.error.issues[0]?.path?.[0] }, { status: 400 });
  }
  const d = parsed.data;

  // BD phone validation (server-side, strict)
  if (!isBdPhone(d.phone)) {
    await logError("order_validation", "Invalid BD phone", { phone: d.phone, requestId });
    return NextResponse.json(
      { error: "Enter a valid Bangladeshi mobile number (e.g. 017XXXXXXXX)", field: "phone" },
      { status: 400 }
    );
  }
  const phone = normalizeBdPhone(d.phone);

  // Idempotency: return existing order if same key already succeeded (duplicate-click safety)
  try {
    const dup = await db.select().from(orders).where(eq(orders.idempotencyKey, d.idempotencyKey)).limit(1);
    if (dup.length > 0) {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, dup[0].id));
      return NextResponse.json({ ok: true, order: dup[0], items, duplicate: true });
    }
  } catch (e) {
    console.error(`[${requestId}] idempotency check failed`, e);
  }

  const session = await getSession().catch(() => null);
  const couponCode = d.couponCode?.trim().toUpperCase() || null;

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Lock + validate delivery zone (server truth)
      const zoneRows = await tx
        .select()
        .from(deliveryZones)
        .where(eq(deliveryZones.id, d.deliveryZoneId))
        .limit(1);
      const zone = zoneRows[0];
      if (!zone || !zone.active) throw Object.assign(new Error("Selected delivery area is unavailable. Please choose again."), { status: 400, field: "deliveryZoneId" });

      // 2. Validate each item against live DB, lock variant rows FOR UPDATE
      let subtotal = 0;
      const lines: {
        productId: string;
        variantId: string | null;
        productName: string;
        variantLabel: string | null;
        sku: string | null;
        price: number;
        quantity: number;
        total: number;
        imageUrl: string | null;
      }[] = [];

      for (const it of d.items) {
        const prodRows = await tx.select().from(products).where(eq(products.id, it.productId)).limit(1);
        const prod = prodRows[0];
        if (!prod || !prod.active) {
          throw Object.assign(new Error(`"${it.productId.slice(0, 8)}…" is no longer available`), { status: 400 });
        }
        let unitPrice = prod.basePrice;
        let variantLabel: string | null = null;
        let sku: string | null = null;
        let imageUrl: string | null = prod.imageUrl;

        if (it.variantId) {
          // Lock variant row to prevent race / oversell
          const locked = await tx.execute(
            sql`SELECT * FROM product_variants WHERE id = ${it.variantId} FOR UPDATE`
          );
          const v = (locked.rows[0] as Record<string, unknown> | undefined);
          if (!v) throw Object.assign(new Error(`A selected size for "${prod.name}" is unavailable`), { status: 400 });
          if (v.product_id !== prod.id) throw Object.assign(new Error(`Invalid variant for "${prod.name}"`), { status: 400 });
          if (v.active === false) throw Object.assign(new Error(`"${prod.name}" (${v.size}/${v.color}) is unavailable`), { status: 400 });
          const stock = Number(v.stock ?? 0);
          if (stock < it.quantity) {
            throw Object.assign(
              new Error(
                stock <= 0
                  ? `"${prod.name}" (${v.size} · ${v.color}) is out of stock`
                  : `Only ${stock} left for "${prod.name}" (${v.size} · ${v.color})`
              ),
              { status: 400 }
            );
          }
          if (v.price != null) unitPrice = Number(v.price);
          variantLabel = `${v.color} · ${v.size}`;
          sku = (v.sku as string) ?? null;
          if (v.image_url) imageUrl = v.image_url as string;
        } else {
          // product without variant: ensure it has no required variants? check stock via any variant sum
          const stockRes = await tx.execute(
            sql`SELECT COALESCE(SUM(stock),0) as s FROM product_variants WHERE product_id = ${prod.id} AND active = true`
          );
          const s = Number((stockRes.rows[0] as { s: number })?.s ?? 0);
          const hasVariants = await tx
            .select({ id: productVariants.id })
            .from(productVariants)
            .where(eq(productVariants.productId, prod.id))
            .limit(1);
          if (hasVariants.length > 0 && s < it.quantity) {
            throw Object.assign(new Error(`Please select a size for "${prod.name}"`), { status: 400 });
          }
        }

        if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
          throw Object.assign(new Error(`Invalid price for "${prod.name}"`), { status: 400 });
        }
        const total = unitPrice * it.quantity;
        subtotal += total;
        lines.push({
          productId: prod.id,
          variantId: it.variantId ?? null,
          productName: prod.name,
          variantLabel,
          sku,
          price: unitPrice,
          quantity: it.quantity,
          total,
          imageUrl,
        });
      }

      if (subtotal <= 0) throw Object.assign(new Error("Order total is invalid"), { status: 400 });

      // 3. Coupon validation (server truth, never trust frontend)
      let discount = 0;
      let appliedCoupon: string | null = null;
      if (couponCode) {
        const cRows = await tx.select().from(coupons).where(eq(coupons.code, couponCode)).limit(1);
        const c = cRows[0];
        if (!c || !c.active) throw Object.assign(new Error("Coupon code is invalid or expired"), { status: 400, field: "couponCode" });
        if (c.expiresAt && new Date(c.expiresAt) < new Date()) throw Object.assign(new Error("This coupon has expired"), { status: 400, field: "couponCode" });
        if (subtotal < (c.minSubtotal ?? 0)) throw Object.assign(new Error(`This coupon needs a minimum order of ৳${c.minSubtotal}`), { status: 400, field: "couponCode" });
        if (c.usageLimit != null && (c.usedCount ?? 0) >= c.usageLimit) throw Object.assign(new Error("This coupon has reached its usage limit"), { status: 400, field: "couponCode" });
        discount = c.type === "percent" ? Math.round((subtotal * c.value) / 100) : c.value;
        if (c.maxDiscount != null) discount = Math.min(discount, c.maxDiscount);
        discount = Math.min(discount, subtotal);
        appliedCoupon = c.code;
        // increment usage inside tx
        await tx
          .update(coupons)
          .set({ usedCount: (c.usedCount ?? 0) + 1 })
          .where(eq(coupons.id, c.id));
      }

      // 4. Delivery charge (server truth, free-shipping threshold honored)
      let deliveryCharge = zone.charge;
      if (zone.freeAbove != null && subtotal - discount >= zone.freeAbove) deliveryCharge = 0;

      const total = subtotal - discount + deliveryCharge;
      if (total <= 0) throw Object.assign(new Error("Order total is invalid"), { status: 400 });

      // 5. Insert order (orderCode generated from seq after insert for guaranteed uniqueness)
      const inserted = await tx
        .insert(orders)
        .values({
          idempotencyKey: d.idempotencyKey,
          userId: session?.userId ?? null,
          customerName: d.customerName.trim(),
          phone,
          email: d.email?.trim() || null,
          address: d.address.trim(),
          city: d.city.trim(),
          area: d.area?.trim() || null,
          deliveryZoneId: zone.id,
          deliveryCharge,
          subtotal,
          discount,
          couponCode: appliedCoupon,
          total,
          paymentMethod: d.paymentMethod as "cod" | "bkash" | "nagad" | "rocket" | "card",
          paymentStatus: "pending",
          status: "pending",
          notes: d.notes?.trim() || null,
          estimatedDelivery: zone.estimatedText || "2-4 days",
        })
        .returning();
      const order = inserted[0];
      const code = `SUS-${10000 + (order.seq ?? 0)}`;
      await tx.update(orders).set({ orderCode: code }).where(eq(orders.id, order.id));

      // 6. Insert items + decrement inventory atomically (guard negative stock)
      for (const ln of lines) {
        await tx.insert(orderItems).values({ orderId: order.id, ...ln });
        if (ln.variantId) {
          const upd = await tx.execute(
            sql`UPDATE product_variants SET stock = stock - ${ln.quantity} WHERE id = ${ln.variantId} AND stock >= ${ln.quantity}`
          );
          if ((upd.rowCount ?? 0) === 0) {
            throw Object.assign(new Error(`"${ln.productName}" just went out of stock. Please adjust your bag.`), { status: 409 });
          }
          await tx.insert(inventoryLogs).values({
            productId: ln.productId,
            variantId: ln.variantId,
            changeQty: -ln.quantity,
            reason: "order",
            orderId: order.id,
          });
        }
        // bump sold count
        await tx.execute(sql`UPDATE products SET total_sold = total_sold + ${ln.quantity} WHERE id = ${ln.productId}`);
      }

      await tx.insert(orderStatusHistory).values({
        orderId: order.id,
        fromStatus: null,
        toStatus: "pending",
        note: "Order placed",
        createdBy: "customer",
      });

      const finalRows = await tx.select().from(orders).where(eq(orders.id, order.id)).limit(1);
      const finalItems = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      return { order: { ...finalRows[0], orderCode: code }, items: finalItems };
    });

    return NextResponse.json({ ok: true, order: result.order, items: result.items });
  } catch (e: unknown) {
    const err = e as { message?: string; status?: number; field?: string; code?: string };
    // Unique violation on idempotency → fetch existing (concurrent double-submit)
    if (err?.code === "23505" || String(err?.message || "").includes("orders_idempotency")) {
      try {
        const dup = await db.select().from(orders).where(eq(orders.idempotencyKey, d.idempotencyKey)).limit(1);
        if (dup.length > 0) {
          const items = await db.select().from(orderItems).where(eq(orderItems.orderId, dup[0].id));
          return NextResponse.json({ ok: true, order: dup[0], items, duplicate: true });
        }
      } catch {}
    }
    const message = err?.message || "Could not place your order. Please try again.";
    const status = err?.status || 500;
    await logError("order_creation", message, { body: d, requestId, stack: String((e as Error)?.stack || "").slice(0, 2000) });
    console.error(`[${requestId}] order creation failed:`, e);
    return NextResponse.json(
      { error: message, ...(err?.field ? { field: err.field } : {}) },
      { status: status >= 400 && status < 600 ? status : 500 }
    );
  }
}

// GET /api/orders?phone= (customer history, guarded) — admin uses /api/admin/orders
export async function GET(req: Request) {
  try {
    const session = await getSession();
    const url = new URL(req.url);
    const phone = url.searchParams.get("phone")?.trim();
    if (session?.userId) {
      const rows = await db
        .select()
        .from(orders)
        .where(eq(orders.userId, session.userId))
        .orderBy(sql`${orders.createdAt} DESC`)
        .limit(30);
      return NextResponse.json({ items: rows });
    }
    if (phone && isBdPhone(phone)) {
      const rows = await db
        .select()
        .from(orders)
        .where(eq(orders.phone, normalizeBdPhone(phone)))
        .orderBy(sql`${orders.createdAt} DESC`)
        .limit(10);
      return NextResponse.json({ items: rows.map((o) => ({ ...o, address: undefined })) });
    }
    return NextResponse.json({ error: "Sign in to view orders" }, { status: 401 });
  } catch (e) {
    console.error("orders list failed", e);
    return NextResponse.json({ error: "Could not load orders" }, { status: 500 });
  }
}
