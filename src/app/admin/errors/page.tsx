"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "@/components/icons";
import { formatDateTime } from "@/lib/format";

type E = { id: string; context: string; message: string; details: unknown; created_at: string };

export default function ErrorsPage() {
  const [items, setItems] = useState<E[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/admin/misc?resource=errors").then((r) => r.json()).then((d) => setItems(d.items || [])).finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="grid place-items-center py-20"><Loader2 className="animate-spin" size={26} aria-hidden /></div>;
  return (
    <div className="max-w-4xl">
      <h1 className="flex items-center gap-2 font-display text-3xl sm:text-4xl text-rosewood-950">
        <AlertCircle size={28} aria-hidden /> Failed-Order Logs
      </h1>
      <p className="mt-1 text-sm text-ink-500">Every failed checkout is logged here with the exact reason — use this to diagnose customer complaints.</p>
      <ul className="mt-4 space-y-2.5">
        {items.map((e) => (
          <li key={e.id} className="rounded-[18px] bg-white p-4 ring-1 ring-red-100">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 font-mono text-[11px] font-bold text-red-700">{e.context}</span>
              <span className="text-[11px] text-ink-500">{formatDateTime(e.created_at)}</span>
            </div>
            <p className="mt-1.5 text-sm font-semibold">{e.message}</p>
            {e.details ? (
              <details className="mt-1.5">
                <summary className="cursor-pointer text-xs font-semibold text-ink-500">Technical details</summary>
                <pre className="mt-1.5 max-h-48 overflow-auto rounded-xl bg-ink-900 p-3 text-[11px] text-emerald-200 whitespace-pre-wrap">{JSON.stringify(e.details, null, 2).slice(0, 3000)}</pre>
              </details>
            ) : null}
          </li>
        ))}
        {items.length === 0 && <li className="rounded-2xl bg-white p-8 text-center text-emerald-700 font-medium">No failures logged — checkout is healthy. ✓</li>}
      </ul>
    </div>
  );
}
