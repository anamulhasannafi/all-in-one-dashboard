"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatTaka, formatDateTime } from "@/lib/format";
import { Package, Search, Phone, Loader2, AlertCircle } from "@/components/icons";

type Tracked = {
  order: {
    orderCode: string;
    customerName: string;
    phone: string;
    status: string;
    total: number;
    subtotal: number;
    discount: number;
    deliveryCharge: number;
    paymentMethod: string;
    estimatedDelivery: string | null;
    createdAt: string;
    city: string;
  };
  items: { id: string; productName: string; variantLabel: string | null; quantity: number; price: number; total: number; imageUrl: string | null }[];
};

const STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"];

function TrackInner() {
  const sp = useSearchParams();
  const [code, setCode] = useState(sp.get("code") || "");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Tracked | null>(null);

  const track = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const c = code.trim().toUpperCase();
    if (!c) {
      setError("Enter your Order ID (e.g. SUS-10001)");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ code: c });
      if (phone.trim()) params.set("phone", phone.trim());
      const res = await fetch(`/api/track?${params.toString()}`);
      const d = await res.json();
      if (!res.ok) {
        setData(null);
        setError(d.error || "Order not found");
      } else {
        setData(d);
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const stepIdx = data ? STEPS.indexOf(data.order.status) : -1;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="font-display text-3xl sm:text-4xl text-rosewood-950 text-center">Track Your Order</h1>
      <p className="mt-1.5 text-center text-sm text-ink-500">Enter the Order ID from your confirmation screen.</p>

      <form onSubmit={track} className="mt-6 rounded-[22px] bg-white p-4 sm:p-5 ring-1 ring-rosewood-100/70 space-y-3">
        <div>
          <label htmlFor="tr-code" className="text-sm font-semibold">Order ID *</label>
          <input id="tr-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="SUS-10001" autoComplete="off" className="input-elegant mt-1.5 font-mono uppercase" />
        </div>
        <div>
          <label htmlFor="tr-phone" className="text-sm font-semibold">Phone <span className="font-normal text-ink-500">(for verification)</span></label>
          <input id="tr-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" inputMode="tel" className="input-elegant mt-1.5" />
        </div>
        {error && <p role="alert" className="flex items-start gap-1.5 text-sm text-red-700 bg-red-50 rounded-xl px-3.5 py-2.5"><AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden /> {error}</p>}
        <button disabled={loading} className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-full bg-rosewood-800 font-bold text-white disabled:opacity-60">
          {loading ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <Search size={18} strokeWidth={2} aria-hidden />}
          {loading ? "Tracking…" : "Track Order"}
        </button>
      </form>

      {data && (
        <div className="mt-5 rounded-[22px] bg-white ring-1 ring-rosewood-100/70 overflow-hidden" role="status">
          <div className="bg-rosewood-950 px-5 py-5 text-cream-50">
            <p className="flex items-center gap-2 text-sm text-cream-100/80"><Package size={16} aria-hidden /> {data.order.orderCode} · {formatDateTime(data.order.createdAt)}</p>
            <p className="font-display mt-1 text-2xl">Hi {data.order.customerName}!</p>
            <p className="text-sm text-cream-100/85 capitalize">Status: <strong>{data.order.status}</strong>{data.order.estimatedDelivery ? ` · Est. ${data.order.estimatedDelivery}` : ""}</p>
          </div>
          <div className="p-5">
            <ol aria-label="Progress" className="flex">
              {STEPS.map((s, i) => (
                <li key={s} className="flex-1">
                  <span className={`block h-2 rounded-full ${stepIdx >= 0 && i <= stepIdx ? "bg-rosewood-600" : "bg-cream-200"}`} aria-hidden />
                  <span className="mt-1 block text-[10px] font-semibold uppercase text-ink-500">{s.slice(0, 4)}</span>
                </li>
              ))}
            </ol>
            {data.order.status === "cancelled" && <p className="mt-2 text-sm font-semibold text-red-700">This order was cancelled. Contact support for help.</p>}
            <ul className="mt-4 space-y-2.5">
              {data.items.map((it) => (
                <li key={it.id} className="flex items-center gap-3 rounded-2xl bg-cream-50 p-3">
                  <span className="h-14 w-12 shrink-0 overflow-hidden rounded-xl bg-white">
                    {it.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{it.productName}</span>
                    <span className="block text-xs text-ink-500">{it.variantLabel || ""} × {it.quantity}</span>
                  </span>
                  <span className="text-sm font-bold tabular-nums">{formatTaka(it.total)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular-nums">{formatTaka(data.order.subtotal)}</dd></div>
              {data.order.discount > 0 && <div className="flex justify-between"><dt>Discount</dt><dd className="tabular-nums text-emerald-700">−{formatTaka(data.order.discount)}</dd></div>}
              <div className="flex justify-between"><dt>Delivery</dt><dd className="tabular-nums">{formatTaka(data.order.deliveryCharge)}</dd></div>
              <div className="flex justify-between font-bold text-base"><dt>Total</dt><dd className="tabular-nums text-rosewood-800">{formatTaka(data.order.total)}</dd></div>
            </dl>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-500"><Phone size={13} aria-hidden /> Questions? Call 09638-010101</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-ink-500">Loading…</div>}>
      <TrackInner />
    </Suspense>
  );
}
