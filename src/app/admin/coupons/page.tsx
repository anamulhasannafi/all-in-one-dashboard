"use client";

import { useEffect, useState } from "react";
import { formatTaka } from "@/lib/format";
import { Loader2, Plus, Trash2, Power, Eye, EyeOff } from "@/components/icons";

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
    } catch (err) {
      console.error("Failed to load coupons", err);
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
    setIsHidden(Boolean(c.isHidden));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);

    const payload = {
      id: editingId || undefined,
      code: code.trim().toUpperCase(),
      type,
      value: Number(value) || 0,
      minSubtotal: Number(min) || 0,
      maxDiscount: max ? Number(max) : null,
      isHidden: Boolean(isHidden),
    };

    try {
      if (editingId) {
        await fetch("/api/admin/misc?resource=coupons", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/admin/misc?resource=coupons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      resetForm();
      load();
    } catch (err) {
      console.error("Error saving coupon:", err);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (c: C) => {
    if (!confirm(`Delete coupon "${c.code}"?`)) return;
    try {
      const res = await fetch(`/api/admin/misc?resource=coupons&id=${c.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        await fetch("/api/admin/misc?resource=coupons", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: c.id, delete: true }),
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

  // কুইক হিডেন/পাবলিক টগল বাটন
  const handleToggleHidden = async (c: C) => {
    try {
      await fetch("/api/admin/misc?resource=coupons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: c.id, isHidden: !c.isHidden }),
      });
      load();
    } catch (err) {
      console.error("Failed to toggle visibility", err);
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
          <span>
            Hidden Coupon?{" "}
            <span className="text-xs text-stone-500 font-normal">
              (ওয়েবসাইটে পাবলিকলি দেখাবে না, শুধু কোড দিলে কাস্টমার ব্যবহার করতে পারবে)
            </span>
          </span>
        </label>

        <button disabled={busy} className="sm:col-span-2 flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-rosewood-800 font-bold text-white disabled:opacity-50 hover:bg-rosewood-900 transition">
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
                  {c.isHidden ? (
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
                      🔒 Hidden
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                      👁️ Public
                    </span>
                  )}
                </span>
                <span className="block text-xs text-ink-500 mt-0.5">
                  {c.type === "percent" ? `${c.value}%` : formatTaka(c.value)} off · min {formatTaka(c.minSubtotal)}
                  {c.maxDiscount ? ` · cap ${formatTaka(c.maxDiscount)}` : ""} · used {c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ""}
                </span>
              </span>

              {/* Quick Toggle Visibility (Public/Hidden) */}
              <button
                type="button"
                aria-label={c.isHidden ? "Make Public" : "Make Hidden"}
                onClick={() => handleToggleHidden(c)}
                title={c.isHidden ? "Click to make Public" : "Click to Hide from website"}
                className={`grid h-10 w-10 place-items-center rounded-full transition ${
                  c.isHidden ? "bg-amber-100 text-amber-800 hover:bg-amber-200" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {c.isHidden ? <EyeOff size={17} aria-hidden /> : <Eye size={17} aria-hidden />}
              </button>

              {/* Edit Button */}
              <button
                type="button"
                aria-label={`Edit ${c.code}`}
                onClick={() => handleEditClick(c)}
                title="Edit Coupon"
                className="grid h-10 w-10 place-items-center rounded-full text-stone-600 hover:bg-stone-100 font-bold"
              >
                ✏️
              </button>

              {/* Active Toggle Button */}
              <button
                type="button"
                aria-label={c.active ? `Disable ${c.code}` : `Enable ${c.code}`}
                onClick={() => handleToggleActive(c)}
                title={c.active ? "Disable Coupon" : "Enable Coupon"}
                className={`grid h-10 w-10 place-items-center rounded-full ${c.active ? "bg-emerald-100 text-emerald-700" : "bg-stone-200 text-stone-500"}`}
              >
                <Power size={17} aria-hidden />
              </button>

              {/* Delete Button */}
              <button
                type="button"
                aria-label={`Delete ${c.code}`}
                onClick={() => handleDelete(c)}
                title="Delete Coupon"
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