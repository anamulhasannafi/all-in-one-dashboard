"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { formatTaka, formatDateTime } from "@/lib/format";
import { ChevronLeft, Loader2, AlertCircle, Check } from "@/components/icons";

const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"];

export default function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<{ order: Record<string, unknown>; items: Record<string, unknown>[]; history: Record<string, unknown>[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    fetch(`/api/admin/orders/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.order) {
          setData(d);
          setStatus(String(d.order.status));
          setNote(String(d.order.adminNote || ""));
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="grid place-items-center py-20 text-ink-500"><Loader2 className="animate-spin" size={26} aria-hidden /></div>;
  if (!data) return <p className="py-16 text-center">Order not found. <Link href="/admin/orders" className="underline">Back</Link></p>;

  const o = data.order as Record<string, string & number>;

  return (
    <div className="max-w-4xl">
      <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm font-medium text-ink-500 min-h-11"><ChevronLeft size={16} aria-hidden /> All orders</Link>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-2xl sm:text-3xl font-bold">{String(o.orderCode)}</h1>
        <span className="rounded-full bg-cream-100 px-3 py-1 text-xs font-bold uppercase">{String(o.status)}</span>
      </div>
      <p className="mt-1 text-sm text-ink-500">{formatDateTime(String(o.createdAt))} · {String(o.paymentMethod).toUpperCase()}</p>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="rounded-[20px] bg-white p-5 ring-1 ring-rosewood-100/70">
            <h2 className="font-display text-xl">Customer</h2>
            <p className="mt-2 text-[15px]"><strong>{String(o.customerName)}</strong> · {String(o.phone)}</p>
            <p className="text-sm text-ink-700">{String(o.address)}, {String(o.city)}{o.area ? `, ${String(o.area)}` : ""}</p>
            {o.email ? <p className="text-sm text-ink-500">{String(o.email)}</p> : null}
            {o.notes ? <p className="mt-2 text-sm bg-cream-50 rounded-xl p-3">Note: {String(o.notes)}</p> : null}
          </div>
          <div className="rounded-[20px] bg-white p-5 ring-1 ring-rosewood-100/70">
            <h2 className="font-display text-xl">Items</h2>
            <ul className="mt-3 space-y-2.5">
              {data.items.map((it, i) => (
                <li key={i} className="flex items-center gap-3 rounded-2xl bg-cream-50 p-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{String(it.productName)}</span>
                    <span className="block text-xs text-ink-500">{it.variantLabel ? `${String(it.variantLabel)} × ${String(it.quantity)}` : `Qty ${String(it.quantity)}`} · {formatTaka(Number(it.price))} each</span>
                  </span>
                  <span className="font-bold tabular-nums text-sm">{formatTaka(Number(it.total))}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 text-sm border-t border-dashed border-rosewood-100 pt-3">
              <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular-nums">{formatTaka(Number(o.subtotal))}</dd></div>
              <div className="flex justify-between"><dt>Discount{o.couponCode ? ` (${String(o.couponCode)})` : ""}</dt><dd className="tabular-nums">−{formatTaka(Number(o.discount))}</dd></div>
              <div className="flex justify-between"><dt>Delivery</dt><dd className="tabular-nums">{formatTaka(Number(o.deliveryCharge))}</dd></div>
              <div className="flex justify-between font-bold text-base"><dt>Total</dt><dd className="tabular-nums text-rosewood-800">{formatTaka(Number(o.total))}</dd></div>
            </dl>
          </div>
          <div className="rounded-[20px] bg-white p-5 ring-1 ring-rosewood-100/70">
            <h2 className="font-display text-xl">History</h2>
            <ol className="mt-3 space-y-2 text-sm">
              {data.history.map((h, i) => (
                <li key={i} className="flex justify-between gap-3 rounded-xl bg-cream-50 px-3.5 py-2.5">
                  <span><strong className="capitalize">{String(h.fromStatus) || "—"} → {String(h.toStatus)}</strong> · {String(h.note || "")}</span>
                  <span className="text-xs text-ink-500 shrink-0">{formatDateTime(String(h.createdAt))}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <aside className="h-fit lg:sticky lg:top-6 rounded-[20px] bg-white p-5 ring-1 ring-rosewood-100/70">
          <h2 className="font-display text-xl">Update Status</h2>
          <label className="mt-3 block text-sm font-semibold">Status
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-elegant mt-1.5 capitalize min-h-[52px]">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="mt-3 block text-sm font-semibold">Admin note
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="e.g. Called customer, confirmed" className="input-elegant mt-1.5" />
          </label>
          {status === "cancelled" && <p className="mt-2 flex gap-1.5 text-xs text-amber-800 bg-amber-50 rounded-xl p-2.5"><AlertCircle size={14} className="shrink-0 mt-0.5" aria-hidden /> Stock will be restored automatically.</p>}
          <button
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              setMsg(null);
              try {
                const res = await fetch(`/api/admin/orders/${id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status, adminNote: note }),
                });
                const d = await res.json();
                setMsg(d.ok ? "Status updated" : d.error || "Failed");
                if (d.ok) {
                  const fresh = await fetch(`/api/admin/orders/${id}`).then((r) => r.json());
                  if (fresh.order) setData(fresh);
                }
              } catch {
                setMsg("Network error");
              } finally {
                setSaving(false);
              }
            }}
            className="mt-3 flex min-h-[52px] w-full items-center justify-center gap-1.5 rounded-full bg-rosewood-800 font-bold text-white disabled:opacity-50"
          >
            {saving ? <Loader2 size={17} className="animate-spin" aria-hidden /> : <Check size={17} strokeWidth={2.5} aria-hidden />}
            {saving ? "Saving…" : "Save Update"}
          </button>
          {msg && <p role="status" className="mt-2 text-sm text-center font-medium">{msg}</p>}
        </aside>
      </div>
    </div>
  );
}

