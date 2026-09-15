"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductCard, { type CardProduct } from "@/components/ProductCard";
import { Heart } from "@/components/icons";
import { getWishlist } from "@/components/WishlistButton";

export default function WishlistPage() {
  const [items, setItems] = useState<CardProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const ids: string[] = getWishlist();
      if (ids.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }
      try {
        // fetch each via search? Better: fetch products and filter client-side
        const res = await fetch("/api/products?limit=60");
        const d = await res.json();
        const all = (d.items || []) as Record<string, unknown>[];
        const wanted = new Set(ids);
        setItems(
          all
            .filter((r) => wanted.has(String(r.id ?? r.productId)))
            .map((r) => ({
              id: String(r.id),
              name: String(r.name),
              slug: String(r.slug),
              basePrice: Number(r.basePrice ?? r.base_price),
              comparePrice: (r.comparePrice ?? r.compare_price) != null ? Number(r.comparePrice ?? r.compare_price) : null,
              imageUrl: (r.imageUrl ?? r.image_url) as string | null,
              isNew: Boolean(r.isNew ?? r.is_new),
              bestseller: Boolean(r.bestseller),
              categoryName: (r.categoryName ?? r.category_name) as string | null,
            }))
        );
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="font-display text-3xl sm:text-4xl text-rosewood-950 flex items-center gap-2.5">
        <Heart size={26} strokeWidth={1.75} aria-hidden /> Your Wishlist
      </h1>
      {loading ? (
        <p className="mt-4 text-ink-500">Loading saved pieces…</p>
      ) : items.length === 0 ? (
        <div className="mt-6 rounded-[20px] bg-white p-10 text-center ring-1 ring-rosewood-100/70">
          <p className="font-display text-2xl text-rosewood-950">Nothing saved yet</p>
          <p className="mt-1 text-sm text-ink-500">Tap the heart on any product to save it here.</p>
          <Link href="/shop" className="mt-4 inline-flex min-h-12 items-center rounded-full bg-rosewood-800 px-7 text-sm font-semibold text-white">
            Discover Products
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {items.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
