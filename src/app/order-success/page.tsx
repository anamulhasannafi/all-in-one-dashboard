import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { formatTaka, formatDate } from "@/lib/format";
import { CheckCircle2, Package, ArrowRight, Phone, MapPin, CreditCard } from "@/components/icons";

export const dynamic = "force-dynamic";

async function getOrder(code: string) {
  try {
    const rows = await db.select().from(orders).where(eq(orders.orderCode, code.toUpperCase())).limit(1);
    if (!rows[0]) return null;
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, rows[0].id));
    return { order: rows[0], items };
  } catch {
    return null;
  }
}

const STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"];

export default async function OrderSuccessPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  if (!code) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="font-display text-3xl text-rosewood-950">No order found</p>
        <Link href="/shop" className="mt-4 inline-flex min-h-12 items-center rounded-full bg-rosewood-800 px-7 text-sm font-semibold text-white">Continue Shopping</Link>
      </div>
    );
  }
  const data = await getOrder(code);
  if (!data) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="font-display text-3xl text-rosewood-950">Order not found</p>
        <p className="mt-2 text-ink-500 text-sm">Check your Order ID or track below.</p>
        <div className="mt-5 flex justify-center gap-2.5">
          <Link href="/track-order" className="inline-flex min-h-12 items-center rounded-full border border-rosewood-200 px-6 text-sm font-semibold">Track Order</Link>
          <Link href="/shop" className="inline-flex min-h-12 items-center rounded-full bg-rosewood-800 px-6 text-sm font-semibold text-white">Continue Shopping</Link>
        </div>
      </div>
    );
  }
  const { order, items } = data;
  const stepIdx = STEPS.indexOf(order.status);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      <div className="rounded-[26px] bg-white ring-1 ring-rosewood-100/70 overflow-hidden">
        <div className="bg-gradient-to-br from-rosewood-800 via-rosewood-900 to-rosewood-950 px-6 sm:px-10 py-8 sm:py-10 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-400 text-rosewood-950">
            <CheckCircle2 size={32} strokeWidth={2} aria-hidden />
          </span>
          <h1 className="font-display mt-4 text-3xl sm:text-4xl text-cream-50">Order Placed Successfully</h1>
          <p className="mt-2 text-cream-100/85 text-[15px]">Thank you, {order.customerName}! We&apos;ll call {order.phone} to confirm.</p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/12 border border-white/25 px-5 py-2.5 text-cream-50 backdrop-blur">
            <Package size={17} aria-hidden />
            <span className="text-sm">Order ID</span>
            <span className="font-mono font-bold tracking-wider text-gold-300">{order.orderCode}</span>
          </p>
        </div>

        <div className="px-5 sm:px-8 py-6">
          {/* Progress */}
          <ol aria-label="Order progress" className="flex items-center">
            {STEPS.map((s, i) => {
              const done = stepIdx >= 0 && i <= stepIdx;
              const current = i === stepIdx;
              return (
                <li key={s} className="flex-1 flex flex-col items-center gap-1.5 last:flex-none">
                  <span className={`h-2.5 flex-1 w-full rounded-full ${done ? "bg-rosewood-600" : "bg-cream-200"}`} aria-hidden />
                  <span className={`text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide ${current ? "text-rosewood-700" : done ? "text-ink-700" : "text-ink-500/60"}`}>
                    {s}
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="mt-6 grid sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-cream-50 p-4">
              <p className="flex items-center gap-1.5 font-bold text-[13px] uppercase tracking-wider text-ink-500"><MapPin size={14} aria-hidden /> Delivery to</p>
              <p className="mt-1.5 font-semibold">{order.customerName}</p>
              <p className="text-ink-700">{order.address}, {order.city}</p>
              <p className="text-ink-500 flex items-center gap-1 mt-1"><Phone size={13} aria-hidden /> {order.phone}</p>
              {order.estimatedDelivery && <p className="mt-1.5 text-xs font-semibold text-rosewood-700">Estimated: {order.estimatedDelivery}</p>}
            </div>
            <div className="rounded-2xl bg-cream-50 p-4">
              <p className="flex items-center gap-1.5 font-bold text-[13px] uppercase tracking-wider text-ink-500"><CreditCard size={14} aria-hidden /> Payment & status</p>
              <p className="mt-1.5">Method: <strong className="uppercase">{order.paymentMethod}</strong></p>
              <p>Status: <strong className="capitalize">{order.status}</strong> · Placed {formatDate(order.createdAt)}</p>
              {order.couponCode && <p>Coupon: <strong>{order.couponCode}</strong></p>}
            </div>
          </div>

          <h2 className="mt-6 font-display text-xl text-rosewood-950">Items ({items.length})</h2>
          <ul className="mt-3 divide-y divide-rosewood-100/70 rounded-2xl ring-1 ring-rosewood-100/70 overflow-hidden">
            {items.map((it) => (
              <li key={it.id} className="flex items-center gap-3 bg-white p-3.5">
                <span className="h-16 w-14 shrink-0 overflow-hidden rounded-xl bg-cream-100">
                  {it.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{it.productName}</span>
                  {it.variantLabel && <span className="block text-xs text-ink-500">{it.variantLabel} × {it.quantity}</span>}
                  {!it.variantLabel && <span className="block text-xs text-ink-500">Qty {it.quantity}</span>}
                </span>
                <span className="text-sm font-bold tabular-nums shrink-0">{formatTaka(it.total)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-1.5 text-[15px] rounded-2xl bg-cream-50 p-4">
            <div className="flex justify-between"><dt className="text-ink-700">Subtotal</dt><dd className="font-semibold tabular-nums">{formatTaka(order.subtotal)}</dd></div>
            {order.discount > 0 && <div className="flex justify-between"><dt className="text-ink-700">Discount {order.couponCode ? `(${order.couponCode})` : ""}</dt><dd className="font-semibold text-emerald-700 tabular-nums">−{formatTaka(order.discount)}</dd></div>}
            <div className="flex justify-between"><dt className="text-ink-700">Delivery charge</dt><dd className="font-semibold tabular-nums">{order.deliveryCharge === 0 ? <span className="text-emerald-700">FREE</span> : formatTaka(order.deliveryCharge)}</dd></div>
            <div className="flex justify-between border-t border-rosewood-100 pt-2 text-lg"><dt className="font-bold">Total</dt><dd className="font-bold text-rosewood-800 tabular-nums">{formatTaka(order.total)}</dd></div>
          </dl>

          <div className="mt-6 grid sm:grid-cols-2 gap-2.5 pb-2">
            <Link href={`/track-order?code=${encodeURIComponent(order.orderCode || "")}`} className="btn-sheen inline-flex min-h-[54px] items-center justify-center gap-2 rounded-full bg-rosewood-800 font-bold text-white">
              <Package size={18} aria-hidden /> Track Order
            </Link>
            <Link href="/shop" className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-full border border-rosewood-200 font-bold">
              Continue Shopping <ArrowRight size={17} strokeWidth={2.5} aria-hidden />
            </Link>
          </div>
          <p className="mt-3 text-center text-xs text-ink-500">Screenshot your Order ID <strong className="font-mono">{order.orderCode}</strong> for easy tracking.</p>
        </div>
      </div>
    </div>
  );
}
