"use client";

import { useEffect, useState } from "react";
import { formatTaka } from "@/lib/format";
import { Loader2, Plus, Trash2, Power } from "@/components/icons";

type C = {
  id: string;
  code: string;
  type: string;
  value: number;
  minSubtotal: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  active: boolean;
  isHidden?: boolean;
};

export default function CouponsPage() {
  const [items, setItems] = useState<C[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("10");
  const [min, setMin] = useState("1000");
  const [max, setMax] = useState("300");
  const [isHidden, setIsHidden] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const d = await fetch("/api/admin/misc?resource=coupons").then((r) => r.json());
      setItems(d.items || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setCode("");
    setType("percent");
    setValue("10");
    setMin("1000");
    setMax("300");
    setIsHidden(false);
  };

  const handleEditClick = (c: C) => {
    setEditingId(c.id);
    setCode(c.code);
    setType((c.type as "percent" | "fixed") || "percent");
    setValue(String(c.value));
    setMin(String(c.minSubtotal || 0));
    setMax(c.maxDiscount ? String(c.maxDiscount) : "");
    setIsHidden(!!c.isHidden);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);

    const payload = {
      id: editingId || undefined,
      code,
      type,
      value: Number(value),
      minSubtotal: Number(min) || 0,
      maxDiscount: max ? Number(max) : null,
      isHidden,
    };

    try {
      if (editingId) {
        // Update existing coupon
        await fetch("/api/admin/misc?resource=coupons", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new coupon
        await fetch("/api/admin/misc?resource=coupons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      resetForm();
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (c: C) => {
    if (!confirm(`Delete coupon "${c.code}"?`)) return;
    try {
      // API Attempt 1: DELETE with query param
      const res = await fetch(`/api/admin/misc?resource=coupons&id=${c.id}`, {
        method: "DELETE",
      });
      
      // API Attempt 2: Fallback to PUT payload delete flag
      if (!res.ok) {
        await fetch("/api/admin/misc?resource=coupons", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: c.id, delete: true, action: "delete" }),
        });
      }
      load();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleToggleActive = async (c: C) => {
    try {
      await fetch("/api/admin/misc?resource=coupons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: c.id, active: !c.active }),
      });
      load();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl sm:text-4xl text-rosewood-950">Coupons</h1>
      <p className="text-sm text-ink-500">Validated on the server at checkout — frontend values are never trusted.</p>

      {/* Form for Create / Edit */}
      <form
        className="mt-4 rounded-[20px] bg-white p-5 ring-1 ring-rosewood-100/70 grid sm:grid-cols-2 gap-3 relative"
        onSubmit={handleSubmit}
      >
        {editingId && (
          <div className="sm:col-span-2 flex items-center justify-between bg-amber-50 p-2.5 rounded-xl text-amber-800 text-xs font-semibold">
            <span>Editing Coupon: <strong>{code}</strong></span>
            <button
              type="button"
              onClick={resetForm}
              className="text-amber-900 hover:underline text-xs"
            >
              Cancel Edit
            </button>
          </div>
        )}

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

        {/* Hidden Coupon Option */}
        <label className="text-sm font-semibold sm:col-span-2 flex items-center gap-2 cursor-pointer mt-1">
          <input
            type="checkbox"
            checked={isHidden}
            onChange={(e) => setIsHidden(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-rosewood-800 focus:ring-rosewood-800"
          />
          <span>Hidden Coupon? <span className="text-xs text-stone-500 font-normal">(ওয়েবসাইটে পাবলিকলি দেখাবে না, শুধু কোড দিলে কাস্টমার ব্যবহার করতে পারবে)</span></span>
        </label>

        <button disabled={busy} className="sm:col-span-2 flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-rosewood-800 font-bold text-white disabled:opacity-50">
          {busy ? (
            <Loader2 size={17} className="animate-spin" aria-hidden />
          ) : editingId ? (
            "Update Coupon"
          ) : (
            <>
              <Plus size={17} strokeWidth={2.5} aria-hidden /> Create Coupon
            </>
          )}
        </button>
      </form>

      {/* Coupon List */}
      {loading ? (
        <div className="grid place-items-center py-10"><Loader2 className="animate-spin" size={24} aria-hidden /></div>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {items.map((c) => (
            <li key={c.id} className="flex items-center gap-2.5 rounded-[18px] bg-white p-4 ring-1 ring-rosewood-100/70">
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="font-mono font-bold">{c.code}</span>
                  {c.isHidden && (
                    <span className="inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600">
                      Hidden
                    </span>
                  )}
                </span>
                <span className="block text-xs text-ink-500">
                  {c.type === "percent" ? `${c.value}%` : formatTaka(c.value)} off · min {formatTaka(c.minSubtotal)}
                  {c.maxDiscount ? ` · cap ${formatTaka(c.maxDiscount)}` : ""} · used {c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ""}
                </span>
              </span>

              {/* Edit Button */}
              <button
                aria-label={`Edit ${c.code}`}
                onClick={() => handleEditClick(c)}
                title="Edit Coupon"
                className="grid h-10 w-10 place-items-center rounded-full text-stone-600 hover:bg-stone-100 font-bold"
              >
                ✏️
              </button>

              {/* Active Toggle Button */}
              <button
                aria-label={c.active ? `Disable ${c.code}` : `Enable ${c.code}`}
                onClick={() => handleToggleActive(c)}
                className={`grid h-10 w-10 place-items-center rounded-full ${c.active ? "bg-emerald-100 text-emerald-700" : "bg-stone-200 text-stone-500"}`}
              >
                <Power size={17} aria-hidden />
              </button>

              {/* Delete Button */}
              <button
                aria-label={`Delete ${c.code}`}
                onClick={() => handleDelete(c)}
                className="grid h-10 w-10 place-items-center rounded-full text-red-600 hover:bg-red-50"
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