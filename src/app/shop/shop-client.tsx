"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProductCard, { type CardProduct } from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import { Search, SlidersHorizontal, X } from "@/components/icons";

type Cat = { slug: string; name: string };

export default function ShopClient({ categories }: { categories: Cat[] }) {
  const sp = useSearchParams();
  const router = useRouter();
  const [items, setItems] = useState<CardProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const q = sp.get("q") || "";
  const category = sp.get("category") || "";
  const sort = sp.get("sort") || "newest";
  const [localQ, setLocalQ] = useState(q);

  useEffect(() => setLocalQ(q), [q]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (category) params.set("category", category);
      if (sort) params.set("sort", sort);
      params.set("limit", "24");
      const res = await fetch(`/api/products?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      const mapped: CardProduct[] = (data.items || []).map((r: Record<string, unknown>) => ({
        id: String(r.id),
        name: String(r.name),
        slug: String(r.slug),
        basePrice: Number(r.basePrice ?? r.base_price),
        comparePrice: (r.comparePrice ?? r.compare_price) != null ? Number(r.comparePrice ?? r.compare_price) : null,
        imageUrl: (r.imageUrl ?? r.image_url) as string | null,
        isNew: Boolean(r.isNew ?? r.is_new),
        bestseller: Boolean(r.bestseller),
        ratingAvg: Number(r.ratingAvg ?? r.rating_avg ?? 48),
        totalSold: Number(r.totalSold ?? r.total_sold ?? 0),
        categoryName: (r.categoryName ?? r.category_name) as string | null,
        minVariantPrice: (r.minVariantPrice ?? r.min_variant_price) != null ? Number(r.minVariantPrice ?? r.min_variant_price) : null,
        stockOut: Boolean(r.stockOut ?? (Number(r.variant_stock ?? 1) <= 0)),
      }));
      setItems(mapped);
      setTotal(data.total ?? mapped.length);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [q, category, sort]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const setParam = (k: string, v: string) => {
    const params = new URLSearchParams(sp.toString());
    if (v) params.set(k, v);
    else params.delete(k);
    router.push(`/shop?${params.toString()}`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rosewood-600">Sushre Collection</p>
          <h1 className="font-display text-3xl sm:text-5xl text-rosewood-950 mt-1">
            {category ? categories.find((c) => c.slug === category)?.name || "Shop" : "Shop All"}
          </h1>
          <p className="mt-1 text-sm text-ink-500" aria-live="polite">{loading ? "Loading…" : `${total} pieces`}</p>
        </div>
        <form
          role="search"
          className="flex items-center gap-2 rounded-2xl border border-rosewood-100 bg-white p-1.5 pl-4 w-full sm:w-80"
          onSubmit={(e) => {
            e.preventDefault();
            setParam("q", localQ.trim());
          }}
        >
          <Search size={17} strokeWidth={1.75} className="text-ink-500 shrink-0" aria-hidden />
          <input
            value={localQ}
            onChange={(e) => setLocalQ(e.target.value)}
            placeholder="Search products…"
            aria-label="Search products"
            className="w-full bg-transparent text-[15px] outline-none min-h-10"
          />
          {localQ && (
            <button type="button" aria-label="Clear search" onClick={() => { setLocalQ(""); setParam("q", ""); }} className="p-2">
              <X size={16} />
            </button>
          )}
        </form>
      </div>

      {/* Filter bar — sticky on mobile */}
      <div className="sticky top-16 sm:top-[72px] z-30 -mx-4 px-4 sm:mx-0 sm:px-0 py-2.5 bg-cream-50/95 backdrop-blur">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            className="sm:hidden inline-flex shrink-0 items-center gap-1.5 rounded-full border border-rosewood-200 bg-white px-4 py-2.5 text-sm font-semibold min-h-11"
          >
            <SlidersHorizontal size={16} strokeWidth={1.75} aria-hidden /> Filters
          </button>
          <button
            type="button"
            onClick={() => setParam("category", "")}
            className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-medium min-h-11 transition ${!category ? "bg-rosewood-800 text-white" : "bg-white border border-rosewood-100"}`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => setParam("category", category === c.slug ? "" : c.slug)}
              aria-pressed={category === c.slug}
              className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-medium min-h-11 transition ${category === c.slug ? "bg-rosewood-800 text-white" : "bg-white border border-rosewood-100"}`}
            >
              {c.name}
            </button>
          ))}
          <label className="ml-auto hidden sm:flex items-center gap-2 text-sm shrink-0">
            <span className="text-ink-500">Sort</span>
            <select
              value={sort}
              onChange={(e) => setParam("sort", e.target.value)}
              aria-label="Sort products"
              className="rounded-full border border-rosewood-100 bg-white px-4 py-2.5 text-sm font-medium min-h-11"
            >
              <option value="newest">Newest</option>
              <option value="popular">Most popular</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </label>
        </div>
        {filtersOpen && (
          <div className="sm:hidden mt-2 rounded-2xl border border-rosewood-100 bg-white p-3">
            <label className="flex items-center justify-between gap-3 text-sm font-medium">
              Sort by
              <select
                value={sort}
                onChange={(e) => setParam("sort", e.target.value)}
                aria-label="Sort products"
                className="rounded-xl border border-rosewood-100 px-3 py-2.5 min-h-11"
              >
                <option value="newest">Newest</option>
                <option value="popular">Most popular</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
              </select>
            </label>
          </div>
        )}
      </div>

      {loading ? (
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5" aria-label="Loading products">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-[20px] bg-white ring-1 ring-rosewood-100/70 overflow-hidden animate-pulse">
              <div className="aspect-[3/4] bg-cream-200" />
              <div className="p-4 space-y-2">
                <div className="h-3 rounded bg-cream-200" />
                <div className="h-3 w-2/3 rounded bg-cream-200" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-10 rounded-[20px] bg-white p-10 text-center ring-1 ring-rosewood-100/70">
          <p className="font-display text-2xl text-rosewood-950">No pieces found</p>
          <p className="mt-1 text-sm text-ink-500">Try a different search or category.</p>
          <button onClick={() => router.push("/shop")} className="mt-4 rounded-full bg-rosewood-800 px-6 py-3 text-sm font-semibold text-white min-h-12">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {items.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 60}>
              <ProductCard p={p} priority={i < 2} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
