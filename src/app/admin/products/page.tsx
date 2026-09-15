"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatTaka } from "@/lib/format";
import { Search, Loader2, Plus, Pencil, Trash2 } from "@/components/icons";

type P = {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  compare_price: number | null;
  image_url: string | null;
  imageUrl?: string | null;
  active: boolean;
  featured: boolean;
  stock: number;
  category_name: string | null;
};

export default function AdminProductsPage() {
  const [items, setItems] = useState<P[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async (query = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products?q=${encodeURIComponent(query)}&limit=80`);
      const d = await res.json();
      setItems(d.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => load(q), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      const d = await res.json();
      if (res.ok) {
        setItems((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert(d.error || "Failed to delete product");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl text-rosewood-950">Products</h1>
          <p className="text-sm text-ink-500">{items.length} products · stock shown live</p>
        </div>
        <Link href="/admin/products/new" className="inline-flex min-h-12 items-center gap-1.5 rounded-full bg-rosewood-800 px-5 text-sm font-bold text-white">
          <Plus size={17} strokeWidth={2.5} aria-hidden /> Add Product
        </Link>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white px-4 ring-1 ring-rosewood-100">
        <Search size={17} className="text-ink-500 shrink-0" aria-hidden />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products..." aria-label="Search products" className="w-full bg-transparent py-3.5 outline-none min-h-12 text-[15px]" />
      </div>

      {loading ? (
        <div className="grid place-items-center py-16 text-ink-500"><Loader2 className="animate-spin" size={24} /></div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center text-sm text-ink-500">No products found.</div>
      ) : (
        <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {items.map((p) => {
            const img = p.image_url || p.imageUrl;
            const isDeleting = deletingId === p.id;
            return (
              <li key={p.id}>
                <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3.5 rounded-[18px] bg-white p-3.5 ring-1 ring-rosewood-100/70 hover:shadow-md transition">
                  <span className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cream-100 flex items-center justify-center">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs text-ink-400 font-bold">{p.name.charAt(0)}</span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{p.name}</span>
                    <span className="block text-xs text-ink-500">{p.category_name || "Uncategorised"} · {formatTaka(p.base_price)}</span>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${p.stock <= 0 ? "bg-red-100 text-red-700" : p.stock <= 8 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                      {p.stock <= 0 ? "OUT OF STOCK" : `${p.stock} in stock`}
                    </span>
                    {!p.active && <span className="ml-1.5 rounded-full bg-stone-200 px-2 py-0.5 text-[11px] font-bold">HIDDEN</span>}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      title="Delete Product"
                      onClick={(e) => handleDelete(e, p.id, p.name)}
                      disabled={isDeleting}
                      className="p-2 rounded-xl text-red-600 hover:bg-red-50 transition"
                    >
                      {isDeleting ? <Loader2 size={17} className="animate-spin" /> : <Trash2 size={17} />}
                    </button>
                    <span className="p-2 text-ink-500">
                      <Pencil size={17} aria-hidden />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}