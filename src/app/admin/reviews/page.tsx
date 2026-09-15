"use client";

import { useEffect, useState } from "react";
import { Loader2, Check, Trash2, Star } from "@/components/icons";

type R = { id: string; product_name: string | null; authorName: string; author_name: string; rating: number; comment: string; status: string; created_at: string };

export default function ReviewsPage() {
  const [items, setItems] = useState<R[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    try {
      const d = await fetch("/api/admin/misc?resource=reviews").then((r) => r.json());
      setItems(d.items || []);
    } catch {} finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
  if (loading) return <div className="grid place-items-center py-20"><Loader2 className="animate-spin" size={26} aria-hidden /></div>;
  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl sm:text-4xl text-rosewood-950">Reviews</h1>
      <p className="text-sm text-ink-500">Approve genuine reviews to show them on product pages.</p>
      <ul className="mt-4 space-y-2.5">
        {items.map((r) => (
          <li key={r.id} className="rounded-[18px] bg-white p-4 ring-1 ring-rosewood-100/70">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold truncate">{r.product_name || "Product"}</span>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${r.status === "approved" ? "bg-emerald-100 text-emerald-800" : r.status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}>{r.status}</span>
            </div>
            <p className="mt-1 flex items-center gap-1 text-gold-500 text-sm" aria-label={`${r.rating} stars`}>
              <Star size={14} fill="currentColor" strokeWidth={0} aria-hidden /> {r.rating} · <span className="text-ink-500">{r.authorName || r.author_name}</span>
            </p>
            <p className="mt-1.5 text-sm text-ink-700">{r.comment}</p>
            <div className="mt-2.5 flex gap-2">
              {r.status !== "approved" && (
                <button onClick={async () => { await fetch("/api/admin/misc?resource=reviews", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: r.id, status: "approved" }) }); load(); }} className="inline-flex min-h-10 items-center gap-1 rounded-full bg-emerald-600 px-4 text-[13px] font-bold text-white">
                  <Check size={14} strokeWidth={3} aria-hidden /> Approve
                </button>
              )}
              {r.status !== "rejected" && (
                <button onClick={async () => { await fetch("/api/admin/misc?resource=reviews", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: r.id, status: "rejected" }) }); load(); }} className="inline-flex min-h-10 items-center rounded-full border px-4 text-[13px] font-semibold">
                  Reject
                </button>
              )}
              <button aria-label="Delete review" onClick={async () => { if (!confirm("Delete this review?")) return; await fetch("/api/admin/misc?resource=reviews", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: r.id, delete: true }) }); load(); }} className="grid h-10 w-10 place-items-center rounded-full text-red-600 hover:bg-red-50">
                <Trash2 size={16} aria-hidden />
              </button>
            </div>
          </li>
        ))}
        {items.length === 0 && <li className="rounded-2xl bg-white p-8 text-center text-ink-500">No reviews yet.</li>}
      </ul>
    </div>
  );
}
