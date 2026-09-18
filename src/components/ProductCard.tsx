import Link from "next/link";
import { Heart } from "./icons";
import { formatTaka, discountPercent } from "@/lib/format";
import WishlistButton from "./WishlistButton";

export type CardProduct = {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  comparePrice: number | null;
  imageUrl: string | null;
  isNew?: boolean | null;
  bestseller?: boolean | null;
  ratingAvg?: number | null;
  totalSold?: number | null;
  categoryName?: string | null;
  minVariantPrice?: number | null;
  stockOut?: boolean;
};

export default function ProductCard({ p, priority }: { p: CardProduct; priority?: boolean }) {
  const price = p.minVariantPrice ?? p.basePrice;
  const pct = discountPercent(price, p.comparePrice);
  return (
    <article className="card-lift group relative flex flex-col overflow-hidden rounded-[20px] bg-white ring-1 ring-rosewood-100/70">
      <Link
        href={`/product/${p.slug}`}
        aria-label={p.name}
        className="img-zoom relative block aspect-[3/4] overflow-hidden bg-cream-100"
      >
        {p.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.imageUrl}
            alt={p.name}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            className="h-full w-full object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <span className="grid h-full w-full place-items-center font-display text-4xl text-rosewood-200">
            S
          </span>
        )}
        <span className="absolute left-2.5 top-2.5 z-20 flex flex-col gap-1.5">
          {pct > 0 && (
            <span className="rounded-full bg-rosewood-700 px-2.5 py-1 text-[11px] font-bold text-white shadow">
              -{pct}%
            </span>
          )}
          {p.isNew ? (
            <span className="rounded-full bg-gold-500 px-2.5 py-1 text-[11px] font-bold text-rosewood-950 shadow">
              NEW
            </span>
          ) : null}
          {p.bestseller ? (
            <span className="rounded-full bg-ink-900 px-2.5 py-1 text-[11px] font-bold text-cream-50 shadow">
              BESTSELLER
            </span>
          ) : null}
        </span>

        {/* স্টক আউট ওভারলে (ফুল ইমেজ ডার্ক গ্রেডিয়েন্ট ও মাঝখানে প্রফেশনাল ব্যাজ) */}
        {p.stockOut ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-t from-black/80 via-black/40 to-black/20 backdrop-blur-[1px]">
            <span className="rounded-full border border-white/40 bg-black/80 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white shadow-2xl backdrop-blur-md">
              Sold out
            </span>
          </div>
        ) : null}
      </Link>
      <div className="absolute right-2.5 top-2.5 z-20">
        <WishlistButton productId={p.id} compact />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
        {p.categoryName ? (
          <p className="text-[11px] uppercase tracking-[0.16em] text-ink-500">{p.categoryName}</p>
        ) : null}
        <Link href={`/product/${p.slug}`} className="line-clamp-2 text-[14px] sm:text-[15px] font-medium leading-snug hover:text-rosewood-700 transition">
          {p.name}
        </Link>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-[15px] sm:text-base font-bold text-rosewood-800">{formatTaka(price)}</span>
          {p.comparePrice && p.comparePrice > price ? (
            <span className="text-[13px] text-ink-500 line-through">{formatTaka(p.comparePrice)}</span>
          ) : null}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-500">
          <Heart size={12} className="hidden" aria-hidden />
          <span aria-label="rating">★ {(p.ratingAvg ?? 48) / 10}</span>
          <span aria-hidden>·</span>
          <span>{(p.totalSold ?? 0) > 0 ? `${p.totalSold} sold` : "New arrival"}</span>
        </div>
      </div>
    </article>
  );
}