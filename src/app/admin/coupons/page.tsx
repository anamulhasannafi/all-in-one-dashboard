"use client";

import { useEffect, useState } from "react";
import { formatTaka } from "@/lib/format";
import { Loader2, Plus, Trash2, Power } from "@/components/icons";

type C = { id: string; code: string; type: string; value: number; minSubtotal: number; maxDiscount: number | null; usageLimit: number | null; usedCount: number; active: boolean };

export default function CouponsPage() {
  const [items, setItems] = useState<C[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("10");
  const [min, setMin] = useState("1000");
  const [max, setMax] = useState("300");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const d = await fetch("/api/admin/misc?resource=coupons").then((r) => r.json());
      setItems(d.items || []);
    } catch {} finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl sm:text-4xl text-rosewood-950">Coupons</h1>
      <p className="text-sm text-ink-500">Validated on the server at checkout — frontend values are never trusted.</p>

      <form
        className="mt-4 rounded-[20px] bg-white p-5 ring-1 ring-rosewood-100/70 grid sm:grid-cols-2 gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setBusy(true);
          try {
            await fetch("/api/admin/misc?resource=coupons", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                code,
                type,
                value: Number(value),
                minSubtotal: Number(min) || 0,
                maxDiscount: max ? Number(max) : null,
              }),
            });
            setCode(""); setValue("10");
            load();
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="text-sm font-semibold">Code *
          <input required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="EID20" className="input-elegant mt-1.5 min-h-12 uppercase font-mono" />
        </label>
        <label className="text-sm font-semibold">Type
          <select value={type} onChange={(e) => setType(e.target.value as "percent" | "fixed")} className="input-elegant mt-1.5 min-h-12">
            <option value="percent">Percent %</option>
            <option value="fixed">Fixed ৳</option>
          </select>
        </label>
        <label className="text-sm font-semibold">Value * ({type === "percent" ? "%" : "৳"})
          <input required inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value)} className="input-elegant mt-1.5 min-h-12" />
        </label>
        <label className="text-sm font-semibold">Min subtotal (৳)
          <input inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value)} className="input-elegant mt-1.5 min-h-12" />
        </label>
        <button disabled={busy} className="sm:col-span-2 flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-rosewood-800 font-bold text-white disabled:opacity-50">
          {busy ? <Loader2 size={17} className="animate-spin" aria-hidden /> : <Plus size={17} strokeWidth={2.5} aria-hidden />} Create Coupon
        </button>
      </form>

      {loading ? <div className="grid place-items-center py-10"><Loader2 className="animate-spin" size={24} aria-hidden /></div> : (
        <ul className="mt-4 space-y-2.5">
          {items.map((c) => (
            <li key={c.id} className="flex items-center gap-3 rounded-[18px] bg-white p-4 ring-1 ring-rosewood-100/70">
              <span className="min-w-0 flex-1">
                <span className="font-mono font-bold">{c.code}</span>
                <span className="block text-xs text-ink-500">
                  {c.type === "percent" ? `${c.value}%` : formatTaka(c.value)} off · min {formatTaka(c.minSubtotal)}
                  {c.maxDiscount ? ` · cap ${formatTaka(c.maxDiscount)}` : ""} · used {c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ""}
                </span>
              </span>
              <button
                aria-label={c.active ? `Disable ${c.code}` : `Enable ${c.code}`}
                onClick={async () => {
                  await fetch("/api/admin/misc?resource=coupons", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: c.id, active: !c.active }) });
                  load();
                }}
                className={`grid h-11 w-11 place-items-center rounded-full ${c.active ? "bg-emerald-100 text-emerald-700" : "bg-stone-200 text-stone-500"}`}
              >
                <Power size={17} aria-hidden />
              </button>
              <button
                aria-label={`Delete ${c.code}`}
                onClick={async () => {
                  if (!confirm(`Delete ${c.code}?`)) return;
                  await fetch("/api/admin/misc?resource=coupons", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: c.id, delete: true }) });
                  load();
                }}
                className="grid h-11 w-11 place-items-center rounded-full text-red-600 hover:bg-red-50"
              >
                <Trash2 size={17} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
