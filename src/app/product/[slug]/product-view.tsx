"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/store/cart-store";
import { formatTaka, discountPercent } from "@/lib/format";
import { trackEcommerceEvent } from "@/lib/gtm";
import WishlistButton from "@/components/WishlistButton";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import {
  ShoppingBag,
  Minus,
  Plus,
  Check,
  Truck,
  ShieldCheck,
  RotateCcw,
  Star,
  ChevronRight,
  AlertCircle,
  Ruler,
} from "@/components/icons";

type Variant = {
  id: string;
  size: string;
  color: string;
  colorHex: string | null;
  sku: string | null;
  price: number | null;
  stock: number;
  imageUrl: string | null;
};

export default function ProductView({ data }: { data: {
  p: { id: string; name: string; slug: string; description: string | null; basePrice: number; comparePrice: number | null; fabric: string | null; imageUrl: string | null; totalSold: number; ratingAvg: number };
  catName: string | null;
  catSlug: string | null;
  variants: Variant[];
  images: { url: string; alt: string | null }[];
  revs: { authorName: string; rating: number; comment: string; createdAt: string }[];
  rel: { id: string; name: string; slug: string; basePrice: number; comparePrice: number | null; imageUrl: string | null }[];
} }) {
  const { p, variants, images } = data;
  const { addLine, setDrawerOpen } = useCart();
  const router = useRouter();

  const sizes = useMemo(() => [...new Set(variants.map((v) => v.size))], [variants]);
  const colorsForSize = (s: string) => variants.filter((v) => v.size === s);

  const [size, setSize] = useState<string | null>(sizes[0] ?? null);
  const [color, setColor] = useState<string | null>(() => {
    const first = variants[0];
    return first ? first.color : null;
  });
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [imgIdx, setImgIdx] = useState(0);
  const [buying, setBuying] = useState(false);

  const selected: Variant | null = useMemo(() => {
    if (!size) return variants[0] ?? null;
    const list = colorsForSize(size);
    return list.find((v) => v.color === color) ?? list[0] ?? null;
  }, [size, color, variants]);

  const unitPrice = selected?.price ?? p.basePrice;
  const pct = discountPercent(unitPrice, p.comparePrice);
  const outOfStock = selected ? selected.stock <= 0 : false;

  const gallery = images.length > 0 ? images.map((i) => i.url) : p.imageUrl ? [p.imageUrl] : [];
  const mainImg = selected?.imageUrl || gallery[imgIdx] || p.imageUrl;

  // 🔴 GTM: view_item Event
  useEffect(() => {
    if (p?.id) {
      trackEcommerceEvent({
        eventName: "view_item",
        ecommerce: {
          currency: "BDT",
          value: unitPrice,
          items: [
            {
              item_id: p.id,
              item_name: p.name,
              price: unitPrice,
              item_category: data.catName || "General",
            },
          ],
        },
      });
    }
  }, [p.id, unitPrice, data.catName]);

  const handleAdd = (openDrawer: boolean) => {
    setMsg(null);
    if (!selected) {
      setMsg({ ok: false, text: "Please select a size" });
      return;
    }
    if (selected.stock <= 0) {
      setMsg({ ok: false, text: "This size is out of stock" });
      return;
    }
    const res = addLine({
      productId: p.id,
      productSlug: p.slug,
      productName: p.name,
      imageUrl: selected.imageUrl || p.imageUrl,
      basePrice: p.basePrice,
      variant: {
        variantId: selected.id,
        size: selected.size,
        color: selected.color,
        colorHex: selected.colorHex,
        price: selected.price ?? p.basePrice,
        stock: selected.stock,
        sku: selected.sku,
        imageUrl: selected.imageUrl,
      },
      quantity: qty,
    });
    if (!res.ok) {
      setMsg({ ok: false, text: res.message || "Could not add to bag" });
      return;
    }

    // 🔴 GTM: add_to_cart Event
    trackEcommerceEvent({
      eventName: "add_to_cart",
      ecommerce: {
        currency: "BDT",
        value: unitPrice * qty,
        items: [
          {
            item_id: p.id,
            item_name: p.name,
            price: unitPrice,
            item_category: data.catName || "General",
            item_variant: selected ? `${selected.size}${selected.color ? ` - ${selected.color}` : ""}` : undefined,
            quantity: qty,
          },
        ],
      },
    });

    setMsg({ ok: true, text: res.message || "Added to your bag" });
    if (openDrawer) setDrawerOpen(true);
  };

  const handleBuyNow = () => {
    if (buying) return;
    setBuying(true);
    handleAdd(false);
    router.push("/checkout");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5 sm:py-10">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-ink-500 overflow-x-auto whitespace-nowrap">
        <Link href="/" className="hover:text-rosewood-700">Home</Link>
        <ChevronRight size={13} aria-hidden />
        <Link href="/shop" className="hover:text-rosewood-700">Shop</Link>
        {data.catName && (
          <>
            <ChevronRight size={13} aria-hidden />
            <Link href={`/shop?category=${data.catSlug}`} className="hover:text-rosewood-700">{data.catName}</Link>
          </>
        )}
        <ChevronRight size={13} aria-hidden />
        <span className="text-ink-900 font-medium truncate max-w-[40vw]">{p.name}</span>
      </nav>

      <div className="mt-4 grid gap-6 lg:grid-cols-2 lg:gap-12">
        {/* Gallery */}
        <div>
          <div className="relative overflow-hidden rounded-[22px] bg-cream-100 ring-1 ring-rosewood-100/70 aspect-[3/4]">
            {mainImg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mainImg} alt={p.name} className="h-full w-full object-cover" fetchPriority="high" sizes="(max-width:1024px) 100vw, 50vw" />
            ) : (
              <span className="grid h-full w-full place-items-center font-display text-6xl text-rosewood-200">S</span>
            )}
            {pct > 0 && (
              <span className="absolute left-3 top-3 rounded-full bg-rosewood-700 px-3 py-1.5 text-xs font-bold text-white shadow">-{pct}%</span>
            )}
            <span className="absolute right-3 top-3"><WishlistButton productId={p.id} /></span>
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 flex gap-2.5 overflow-x-auto no-scrollbar" role="listbox" aria-label="Product images">
              {gallery.map((g, i) => (
                <button
                  key={i}
                  type="button"
                  role="option"
                  aria-selected={imgIdx === i}
                  aria-label={`View image ${i + 1}`}
                  onClick={() => setImgIdx(i)}
                  className={`h-20 w-16 shrink-0 overflow-hidden rounded-xl ring-2 transition ${imgIdx === i ? "ring-rosewood-600" : "ring-transparent opacity-70"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {data.catName && <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rosewood-600">{data.catName}</p>}
          <h1 className="font-display mt-1.5 text-3xl sm:text-[42px] leading-[1.08] text-rosewood-950">{p.name}</h1>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="text-gold-600 tracking-wider" aria-label={`Rated ${(p.ratingAvg / 10).toFixed(1)} out of 5`}>★★★★★</span>
            <span className="font-semibold">{(p.ratingAvg / 10).toFixed(1)}</span>
            <span className="text-ink-500">· {p.totalSold} sold</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-bold text-rosewood-800 tabular-nums">{formatTaka(unitPrice)}</span>
            {p.comparePrice && p.comparePrice > unitPrice && (
              <span className="text-lg text-ink-500 line-through tabular-nums">{formatTaka(p.comparePrice)}</span>
            )}
          </div>
          <p className="mt-1 text-xs text-emerald-700 font-medium">Inclusive of VAT · Cash on Delivery available</p>

          {/* Size */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold">Select size {size && <span className="font-normal text-ink-500">— {size}</span>}</p>
              <span className="flex items-center gap-1 text-xs text-ink-500"><Ruler size={14} aria-hidden /> True to size</span>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-2" role="radiogroup" aria-label="Size">
              {sizes.map((s) => {
                const stockSum = colorsForSize(s).reduce((a, v) => a + v.stock, 0);
                const active = size === s;
                const empty = stockSum <= 0;
                return (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={empty}
                    onClick={() => {
                      setSize(s);
                      const first = colorsForSize(s).find((v) => v.stock > 0) ?? colorsForSize(s)[0];
                      if (first) setColor(first.color);
                      setMsg(null);
                    }}
                    className={`min-h-[48px] min-w-[56px] rounded-2xl border px-4 text-[15px] font-semibold transition active:scale-95 ${
                      active ? "border-rosewood-700 bg-rosewood-800 text-white shadow" : "border-rosewood-200 bg-white hover:border-rosewood-500"
                    } ${empty ? "opacity-40 line-through" : ""}`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color */}
          {size && colorsForSize(size).length > 1 && (
            <div className="mt-4">
              <p className="text-sm font-bold">Colour {color && <span className="font-normal text-ink-500">— {color}</span>}</p>
              <div className="mt-2.5 flex flex-wrap gap-2" role="radiogroup" aria-label="Colour">
                {colorsForSize(size).map((v) => {
                  const active = color === v.color;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      disabled={v.stock <= 0}
                      onClick={() => { setColor(v.color); setMsg(null); }}
                      title={`${v.color}${v.stock <= 0 ? " (out of stock)" : ""}`}
                      className={`flex items-center gap-2 rounded-full border py-2 pl-2.5 pr-4 text-sm font-medium min-h-[48px] transition active:scale-95 ${
                        active ? "border-rosewood-700 bg-rosewood-50" : "border-rosewood-200 bg-white"
                      } ${v.stock <= 0 ? "opacity-45" : ""}`}
                    >
                      <span
                        className="h-7 w-7 rounded-full ring-1 ring-black/15 grid place-items-center"
                        style={{ background: v.colorHex || "#e8d9c8" }}
                        aria-hidden
                      >
                        {active && <Check size={14} className="text-white drop-shadow" strokeWidth={3} />}
                      </span>
                      {v.color}
                      {v.stock <= 0 && <span className="text-[11px] text-red-600 font-bold">· Sold out</span>}
                      {v.stock > 0 && v.stock <= 5 && <span className="text-[11px] text-amber-700 font-bold">· Only {v.stock}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {selected && (
            <p className={`mt-3 flex items-center gap-1.5 text-sm font-medium ${outOfStock ? "text-red-600" : selected.stock <= 5 ? "text-amber-700" : "text-emerald-700"}`} role="status">
              {outOfStock ? (
                <><AlertCircle size={16} aria-hidden /> Out of stock in this size — try another</>
              ) : (
                <><Check size={16} aria-hidden /> {selected.stock <= 5 ? `Hurry — only ${selected.stock} left` : "In stock, ready to ship"}</>
              )}
            </p>
          )}

          {/* Qty + CTA */}
          <div className="mt-5 flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-full border border-rosewood-200 bg-white p-1.5" aria-label="Quantity">
              <button type="button" aria-label="Decrease quantity" onClick={() => setQty((x) => Math.max(1, x - 1))} className="grid h-11 w-11 place-items-center rounded-full hover:bg-rosewood-50 active:scale-90">
                <Minus size={17} strokeWidth={2} />
              </button>
              <span className="w-8 text-center font-bold tabular-nums" aria-live="polite">{qty}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQty((x) => Math.min(selected?.stock || 99, 10, x + 1))}
                className="grid h-11 w-11 place-items-center rounded-full hover:bg-rosewood-50 active:scale-90"
              >
                <Plus size={17} strokeWidth={2} />
              </button>
            </div>
            <p className="text-sm text-ink-500">SKU: <span className="font-mono text-ink-700">{selected?.sku || "—"}</span></p>
          </div>

          {msg && (
            <p role="alert" className={`mt-3 rounded-2xl px-4 py-3 text-sm font-medium ${msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
              {msg.text}
            </p>
          )}

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={outOfStock}
              onClick={() => handleAdd(true)}
              className="btn-sheen inline-flex min-h-[56px] items-center justify-center gap-2 rounded-full border-2 border-rosewood-800 text-[15px] font-bold text-rosewood-900 hover:bg-rosewood-50 active:scale-[0.98] transition disabled:opacity-40"
            >
              <ShoppingBag size={19} strokeWidth={1.75} aria-hidden /> Add to Bag
            </button>
            <button
              type="button"
              disabled={outOfStock || buying}
              onClick={handleBuyNow}
              className="btn-sheen inline-flex min-h-[56px] items-center justify-center gap-2 rounded-full bg-rosewood-800 text-[15px] font-bold text-white hover:bg-rosewood-900 active:scale-[0.98] transition disabled:opacity-50 shadow-[0_16px_32px_rgba(79,21,48,0.32)]"
            >
              {buying ? "Please wait…" : "Buy Now — COD"}
            </button>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            {[
              { icon: Truck, t: "Fast delivery" },
              { icon: ShieldCheck, t: "COD available" },
              { icon: RotateCcw, t: "7-day exchange" },
            ].map((f) => (
              <div key={f.t} className="rounded-2xl bg-white ring-1 ring-rosewood-100/70 px-2 py-3">
                <f.icon size={19} strokeWidth={1.75} className="mx-auto text-rosewood-700" aria-hidden />
                <p className="mt-1.5 text-[12px] font-semibold">{f.t}</p>
              </div>
            ))}
          </div>

          {p.description && (
            <div className="mt-6 rounded-[20px] bg-white ring-1 ring-rosewood-100/70 p-5">
              <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-rosewood-700">Details</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-700">{p.description}</p>
              {p.fabric && <p className="mt-2 text-sm text-ink-500">Fabric: <span className="font-medium text-ink-700">{p.fabric}</span></p>}
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <section aria-label="Reviews" className="mt-12">
        <Reveal>
          <h2 className="font-display text-2xl sm:text-3xl text-rosewood-950">Reviews {data.revs.length > 0 && <span className="text-base text-ink-500">({data.revs.length})</span>}</h2>
        </Reveal>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {data.revs.length === 0 ? (
            <p className="rounded-2xl bg-white p-5 text-sm text-ink-500 ring-1 ring-rosewood-100/70">No reviews yet — be the first to share your look.</p>
          ) : (
            data.revs.map((r, i) => (
              <figure key={i} className="rounded-2xl bg-white p-5 ring-1 ring-rosewood-100/70">
                <div className="flex items-center gap-1 text-gold-500" aria-label={`${r.rating} stars`}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
                <blockquote className="mt-2 text-[15px] text-ink-700">{r.comment}</blockquote>
                <figcaption className="mt-2 text-xs text-ink-500 font-medium">{r.authorName} · Verified buyer</figcaption>
              </figure>
            ))
          )}
        </div>
        <ReviewForm productId={p.id} />
      </section>

      {/* Related */}
      {data.rel.length > 0 && (
        <section aria-label="You may also like" className="mt-12">
          <h2 className="font-display text-2xl sm:text-3xl text-rosewood-950">You may also like</h2>
          <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {data.rel.map((r) => (
              <ProductCard key={r.id} p={{ id: r.id, name: r.name, slug: r.slug, basePrice: r.basePrice, comparePrice: r.comparePrice, imageUrl: r.imageUrl }} />
            ))}
          </div>
        </section>
      )}

      {/* Sticky mobile CTA */}
      <div className="lg:hidden fixed bottom-[60px] inset-x-0 z-30 px-4 pb-[env(safe-area-inset-bottom)] pointer-events-none">
        <div className="pointer-events-auto flex gap-2 rounded-full bg-ink-900/92 backdrop-blur-xl p-2 shadow-2xl ring-1 ring-white/10">
          <div className="flex items-center pl-3 pr-1 text-white">
            <span className="text-base font-bold tabular-nums">{formatTaka(unitPrice * qty)}</span>
          </div>
          <button
            type="button"
            disabled={outOfStock}
            onClick={() => handleAdd(true)}
            className="flex-1 min-h-[52px] rounded-full border border-white/30 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-40"
          >
            Add to Bag
          </button>
          <button
            type="button"
            disabled={outOfStock || buying}
            onClick={handleBuyNow}
            className="flex-1 min-h-[52px] rounded-full bg-cream-50 text-sm font-bold text-rosewood-950 active:scale-[0.98] disabled:opacity-50"
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewForm({ productId }: { productId: string }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  return (
    <form
      className="mt-4 rounded-[20px] bg-white p-5 ring-1 ring-rosewood-100/70"
      onSubmit={async (e) => {
        e.preventDefault();
        if (sending) return;
        setSending(true);
        try {
          const res = await fetch("/api/reviews", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId, rating, comment }),
          });
          const d = await res.json();
          setDone(d.ok ? d.message : d.error || "Failed");
          if (d.ok) setComment("");
        } catch {
          setDone("Could not submit. Try again.");
        } finally {
          setSending(false);
        }
      }}
    >
      <p className="text-sm font-bold">Write a review</p>
      <div className="mt-2 flex gap-1.5" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} type="button" role="radio" aria-checked={rating === s} aria-label={`${s} star`} onClick={() => setRating(s)} className={`text-2xl min-h-11 min-w-11 ${s <= rating ? "text-gold-500" : "text-cream-200"}`}>
            <Star size={26} fill="currentColor" strokeWidth={0} aria-hidden />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        required
        minLength={3}
        placeholder="How was the fabric, fit and delivery?"
        aria-label="Your review"
        rows={3}
        className="input-elegant mt-3"
      />
      <button disabled={sending} className="mt-3 rounded-full bg-rosewood-800 px-6 py-3 text-sm font-semibold text-white min-h-12 disabled:opacity-50">
        {sending ? "Submitting…" : "Submit Review"}
      </button>
      {done && <p role="status" className="mt-2 text-sm text-ink-700">{done}</p>}
    </form>
  );
}