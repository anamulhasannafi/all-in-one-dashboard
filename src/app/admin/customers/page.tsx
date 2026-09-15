"use client";

import { useEffect, useState } from "react";
import { formatTaka, formatDate } from "@/lib/format";
import { Loader2, UserRound } from "@/components/icons";

type C = { id: string; name: string; email: string; phone: string | null; created_at: string; orders: number; spent: number };

export default function CustomersPage() {
  const [items, setItems] = useState<C[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/admin/misc?resource=customers").then((r) => r.json()).then((d) => setItems(d.items || [])).finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="grid place-items-center py-20"><Loader2 className="animate-spin" size={26} aria-hidden /></div>;
  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-3xl sm:text-4xl text-rosewood-950">Customers ({items.length})</h1>
      <ul className="mt-4 space-y-2.5">
        {items.map((c) => (
          <li key={c.id} className="flex items-center gap-3.5 rounded-[18px] bg-white p-4 ring-1 ring-rosewood-100/70">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-rosewood-50 text-rosewood-700">
              <UserRound size={20} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold truncate">{c.name}</span>
              <span className="block text-xs text-ink-500 truncate">{c.email}{c.phone ? ` · ${c.phone}` : ""} · joined {formatDate(c.created_at)}</span>
            </span>
            <span className="text-right shrink-0 text-sm">
              <span className="block font-bold tabular-nums">{formatTaka(c.spent)}</span>
              <span className="block text-[11px] text-ink-500">{c.orders} orders</span>
            </span>
          </li>
        ))}
        {items.length === 0 && <li className="rounded-2xl bg-white p-8 text-center text-ink-500">No customers yet.</li>}
      </ul>
    </div>
  );
}
