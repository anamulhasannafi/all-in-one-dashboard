"use client";

import { useEffect, useState } from "react";
import { formatTaka } from "@/lib/format";
import { Loader2, Plus, Trash2, Pencil } from "@/components/icons";

type Z = { id: string; name: string; charge: number; freeAbove: number | null; estimatedText: string | null; active: boolean };

export default function DeliveryPage() {
  const [items, setItems] = useState<Z[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [charge, setCharge] = useState("70");
  const [free, setFree] = useState("2500");
  const [est, setEst] = useState("2-4 days");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Z | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const d = await fetch("/api/admin/misc?resource=zones").then((r) => r.json());
      setItems(d.items || []);
    } catch {} finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl sm:text-4xl text-rosewood-950">Delivery Zones</h1>
      <p className="text-sm text-ink-500">Charges are recalculated on the server for every order — customers can&apos;t manipulate them.</p>

      <form
        className="mt-4 rounded-[20px] bg-white p-5 ring-1 ring-rosewood-100/70 grid sm:grid-cols-2 gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setBusy(true);
          try {
            if (editing) {
              await fetch("/api/admin/misc?resource=zones", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: editing.id, name, charge: Number(charge), freeAbove: free ? Number(free) : null, estimatedText: est }),
              });
              setEditing(null);
            } else {
              await fetch("/api/admin/misc?resource=zones", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, charge: Number(charge), freeAbove: free ? Number(free) : null, estimatedText: est }),
              });
            }
            setName(""); setCharge("70"); setFree("2500"); setEst("2-4 days");
            load();
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="text-sm font-semibold">Zone name *
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Inside Dhaka" className="input-elegant mt-1.5 min-h-12" />
        </label>
        <label className="text-sm font-semibold">Charge (৳) *
          <input required inputMode="numeric" value={charge} onChange={(e) => setCharge(e.target.value)} className="input-elegant mt-1.5 min-h-12" />
        </label>
        <label className="text-sm font-semibold">Free above (৳, blank = never)
          <input inputMode="numeric" value={free} onChange={(e) => setFree(e.target.value)} placeholder="2500" className="input-elegant mt-1.5 min-h-12" />
        </label>
        <label className="text-sm font-semibold">Estimated time
          <input value={est} onChange={(e) => setEst(e.target.value)} placeholder="2-4 days" className="input-elegant mt-1.5 min-h-12" />
        </label>
        <div className="sm:col-span-2 flex gap-2">
          <button disabled={busy} className="flex-1 min-h-[52px] rounded-full bg-rosewood-800 font-bold text-white disabled:opacity-50">
            {editing ? "Save Zone" : "Add Zone"}
          </button>
          {editing && <button type="button" onClick={() => { setEditing(null); setName(""); }} className="min-h-[52px] rounded-full border px-6 font-semibold">Cancel</button>}
        </div>
      </form>

      {loading ? <div className="grid place-items-center py-10"><Loader2 className="animate-spin" size={24} aria-hidden /></div> : (
        <ul className="mt-4 space-y-2.5">
          {items.map((z) => (
            <li key={z.id} className="flex items-center gap-3 rounded-[18px] bg-white p-4 ring-1 ring-rosewood-100/70">
              <span className="min-w-0 flex-1">
                <span className="font-bold">{z.name}</span>
                <span className="block text-xs text-ink-500">{formatTaka(z.charge)} · {z.estimatedText}{z.freeAbove ? ` · Free over ${formatTaka(z.freeAbove)}` : ""}</span>
              </span>
              <button aria-label={`Edit ${z.name}`} onClick={() => { setEditing(z); setName(z.name); setCharge(String(z.charge)); setFree(z.freeAbove != null ? String(z.freeAbove) : ""); setEst(z.estimatedText || ""); }} className="grid h-11 w-11 place-items-center rounded-full hover:bg-cream-100">
                <Pencil size={17} aria-hidden />
              </button>
              <button aria-label={`Delete ${z.name}`} onClick={async () => { if (!confirm(`Delete ${z.name}?`)) return; await fetch("/api/admin/misc?resource=zones", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: z.id, delete: true }) }); load(); }} className="grid h-11 w-11 place-items-center rounded-full text-red-600 hover:bg-red-50">
                <Trash2 size={17} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
