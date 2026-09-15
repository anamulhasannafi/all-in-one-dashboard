"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatTaka } from "@/lib/format";
import { Package, Wallet, AlertCircle, Boxes, ArrowRight, Loader2 } from "@/components/icons";

type Stats = {
  total: { t: number; c: number };
  today: { t: number; c: number };
  pending: number;
  lowStock: number;
  topProducts: { product_name: string; qty: number; rev: number }[];
  daily: { d: string; c: number; t: number }[];
  recentErrors: { id: string; context: string; message: string; created_at: string }[];
};

export default function AdminDashboard() {
  const [s, setS] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setS)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid place-items-center py-24 text-ink-500">
        <Loader2 size={26} className="animate-spin" aria-hidden />
        <p className="mt-2 text-sm">Loading dashboard…</p>
      </div>
    );
  }
  if (!s) return <p className="py-16 text-center text-ink-500">Could not load stats.</p>;

  const cards = [
    { label: "Total Revenue", value: formatTaka(s.total.t), sub: `${s.total.c} orders`, icon: Wallet, href: "/admin/orders" },
    { label: "Today", value: formatTaka(s.today.t), sub: `${s.today.c} orders today`, icon: Package, href: "/admin/orders" },
    { label: "Pending Orders", value: String(s.pending), sub: "Needs confirmation", icon: Package, href: "/admin/orders?status=pending" },
    { label: "Low Stock Variants", value: String(s.lowStock), sub: "≤ 5 units left", icon: Boxes, href: "/admin/products" },
  ];

  const maxDaily = Math.max(1, ...s.daily.map((d) => d.t));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl text-rosewood-950">Dashboard</h1>
          <p className="text-sm text-ink-500">Live store performance · {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long" })}</p>
        </div>
        <Link href="/admin/orders" className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-rosewood-800 px-5 text-sm font-bold text-white">
          View Orders <ArrowRight size={15} aria-hidden />
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="card-lift rounded-[20px] bg-white p-4 sm:p-5 ring-1 ring-rosewood-100/70">
            <c.icon size={20} strokeWidth={1.75} className="text-rosewood-600" aria-hidden />
            <p className="mt-2 text-[22px] sm:text-[26px] font-bold tabular-nums leading-none">{c.value}</p>
            <p className="mt-1 text-xs font-semibold">{c.label}</p>
            <p className="text-[11px] text-ink-500">{c.sub}</p>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[20px] bg-white p-5 ring-1 ring-rosewood-100/70">
          <h2 className="font-display text-xl text-rosewood-950">Last 14 days revenue</h2>
          <div className="mt-4 flex items-end gap-1.5 h-36" role="img" aria-label="Revenue chart">
            {s.daily.map((d) => (
              <div key={d.d} className="flex-1 flex flex-col items-center gap-1" title={`${d.d}: ${formatTaka(d.t)} (${d.c} orders)`}>
                <span className="text-[10px] font-bold tabular-nums">{d.t > 0 ? `${Math.round(d.t / 1000)}k` : ""}</span>
                <div className="w-full rounded-t-lg bg-gradient-to-t from-rosewood-800 to-rosewood-400 min-h-[4px]" style={{ height: `${Math.max(4, (d.t / maxDaily) * 100)}px` }} />
                <span className="text-[9px] text-ink-500">{d.d.split(" ")[0]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[20px] bg-white p-5 ring-1 ring-rosewood-100/70">
          <h2 className="font-display text-xl text-rosewood-950">Top products</h2>
          <ul className="mt-3 space-y-2.5">
            {s.topProducts.length === 0 && <li className="text-sm text-ink-500">No sales yet.</li>}
            {s.topProducts.map((t) => (
              <li key={t.product_name} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-medium">{t.product_name}</span>
                <span className="shrink-0 text-xs text-ink-500 tabular-nums">{t.qty} sold · {formatTaka(t.rev)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {s.recentErrors.length > 0 && (
        <div className="mt-4 rounded-[20px] bg-white p-5 ring-1 ring-red-100">
          <h2 className="flex items-center gap-2 font-display text-xl text-red-800">
            <AlertCircle size={19} aria-hidden /> Recent order failures ({s.recentErrors.length})
          </h2>
          <ul className="mt-3 space-y-2 max-h-64 overflow-y-auto">
            {s.recentErrors.map((e) => (
              <li key={e.id} className="rounded-xl bg-red-50/60 px-3.5 py-2.5 text-[13px]">
                <span className="font-mono text-[11px] text-red-600 font-bold">{e.context}</span>
                <span className="block text-ink-700">{e.message}</span>
                <span className="text-[11px] text-ink-500">{new Date(e.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
          <Link href="/admin/errors" className="mt-3 inline-flex min-h-10 items-center text-sm font-bold text-red-700">
            View all error logs <ArrowRight size={15} aria-hidden />
          </Link>
        </div>
      )}
    </div>
  );
}
