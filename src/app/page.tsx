import Link from "next/link";
import { db } from "@/db";
import { heroSettings, products, categories, siteSettings } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import HeroVideo from "@/components/HeroVideo";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import { ArrowRight, Truck, ShieldCheck, RotateCcw, BadgePercent, Sparkles, Star } from "@/components/icons";
import { formatTaka } from "@/lib/format";

export const dynamic = "force-dynamic";
export const revalidate = 60;

async function getData() {
  try {
    const [hero] = await db.select().from(heroSettings).limit(1);
    const [site] = await db.select().from(siteSettings).limit(1);
    const cats = await db.select().from(categories).where(eq(categories.active, true)).orderBy(categories.sortOrder).limit(8);
    const feat = await db.execute(sql`
      SELECT p.*, c.name as category_name,
        (SELECT MIN(v.price) FROM product_variants v WHERE v.product_id=p.id AND v.active=true AND v.price IS NOT NULL) as min_variant_price,
        (SELECT COALESCE(SUM(v.stock),0) FROM product_variants v WHERE v.product_id=p.id AND v.active=true) as variant_stock
      FROM products p LEFT JOIN categories c ON c.id=p.category_id
      WHERE p.active=true AND p.featured=true ORDER BY p.created_at DESC LIMIT 8`);
    const fresh = await db.execute(sql`
      SELECT p.*, c.name as category_name,
        (SELECT MIN(v.price) FROM product_variants v WHERE v.product_id=p.id AND v.active=true AND v.price IS NOT NULL) as min_variant_price,
        (SELECT COALESCE(SUM(v.stock),0) FROM product_variants v WHERE v.product_id=p.id AND v.active=true) as variant_stock
      FROM products p LEFT JOIN categories c ON c.id=p.category_id
      WHERE p.active=true ORDER BY p.created_at DESC LIMIT 8`);
    const best = await db.execute(sql`
      SELECT p.*, c.name as category_name,
        (SELECT MIN(v.price) FROM product_variants v WHERE v.product_id=p.id AND v.active=true AND v.price IS NOT NULL) as min_variant_price,
        (SELECT COALESCE(SUM(v.stock),0) FROM product_variants v WHERE v.product_id=p.id AND v.active=true) as variant_stock
      FROM products p LEFT JOIN categories c ON c.id=p.category_id
      WHERE p.active=true AND p.bestseller=true ORDER BY p.total_sold DESC LIMIT 4`);
    return {
      hero: hero ?? null,
      cats,
      feat: feat.rows as Record<string, never>[],
      fresh: fresh.rows as Record<string, never>[],
      best: best.rows as Record<string, never>[],
      freeThreshold: site?.freeShippingThreshold ?? null,
    };
  } catch {
    return { hero: null, cats: [], feat: [], fresh: [], best: [], freeThreshold: null };
  }
}

function toCard(r: Record<string, unknown>) {
  return {
    id: String(r.id),
    name: String(r.name),
    slug: String(r.slug),
    basePrice: Number(r.base_price),
    comparePrice: r.compare_price != null ? Number(r.compare_price) : null,
    imageUrl: (r.image_url as string) ?? null,
    isNew: Boolean(r.is_new),
    bestseller: Boolean(r.bestseller),
    ratingAvg: Number(r.rating_avg ?? 48),
    totalSold: Number(r.total_sold ?? 0),
    categoryName: (r.category_name as string) ?? null,
    minVariantPrice: r.min_variant_price != null ? Number(r.min_variant_price) : null,
    stockOut: Number(r.variant_stock ?? 1) <= 0,
  };
}

export default async function HomePage() {
  const { hero, cats, feat, fresh, best, freeThreshold } = await getData();

  return (
    <div>
      <HeroVideo
        hero={
          hero
            ? {
                heroType: hero.heroType as "image" | "video",
                videoUrl: hero.videoUrl,
                mobileVideoUrl: hero.mobileVideoUrl,
                posterUrl: hero.posterUrl,
                mobilePosterUrl: hero.mobilePosterUrl,
                imageUrl: hero.imageUrl,
                mobileImageUrl: hero.mobileImageUrl,
                badgeText: hero.badgeText,
                headline: hero.headline,
                subheadline: hero.subheadline,
                primaryCtaText: hero.primaryCtaText,
                primaryCtaLink: hero.primaryCtaLink,
                secondaryCtaText: hero.secondaryCtaText,
                secondaryCtaLink: hero.secondaryCtaLink,
                overlayOpacity: hero.overlayOpacity ?? 45,
                animation: hero.animation ?? "cinematic",
                enabled: hero.enabled ?? true,
              }
            : {
                heroType: "image",
                videoUrl: null,
                mobileVideoUrl: null,
                posterUrl: "https://images.pexels.com/photos/35083322/pexels-photo-35083322.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
                mobilePosterUrl: null,
                imageUrl: "https://images.pexels.com/photos/35083322/pexels-photo-35083322.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
                mobileImageUrl: null,
                badgeText: "New · Eid Festive Edit 2026",
                headline: "Elegance woven for every day",
                subheadline: "Sarees, three-pieces & modest wear — crafted in Dhaka, delivered across Bangladesh with cash on delivery.",
                primaryCtaText: "Shop New Arrivals",
                primaryCtaLink: "/shop",
                secondaryCtaText: "Explore Offers",
                secondaryCtaLink: "/offers",
                overlayOpacity: 48,
                animation: "cinematic",
                enabled: true,
              }
        }
      />

      {/* Marquee trust bar */}
      <div className="bg-rosewood-950 text-cream-100 overflow-hidden py-3" aria-hidden>
        <div className="animate-marquee flex gap-10 whitespace-nowrap text-[13px] tracking-[0.18em] uppercase w-max">
          {[0, 1].map((k) => (
            <span key={k} className="flex gap-10">
              <span>Cash on Delivery</span><span className="text-gold-400">✦</span>
              <span>Free delivery over {formatTaka(freeThreshold ?? 2500)}</span><span className="text-gold-400">✦</span>
              <span>7-day size exchange</span><span className="text-gold-400">✦</span>
              <span>100% authentic</span><span className="text-gold-400">✦</span>
              <span>Eid Festive Edit live</span><span className="text-gold-400">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* Categories */}
      <section aria-label="Shop by category" className="mx-auto max-w-7xl px-4 sm:px-6 pt-12 sm:pt-16">
        <Reveal>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.24em] text-rosewood-600">Curated for you</p>
              <h2 className="font-display mt-1 text-3xl sm:text-4xl text-rosewood-950">Shop by Category</h2>
            </div>
            <Link href="/categories" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-rosewood-700 hover:gap-2.5 transition-all">
              View all <ArrowRight size={16} strokeWidth={2} aria-hidden />
            </Link>
          </div>
        </Reveal>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {cats.map((c, i) => (
            <Reveal key={c.id} delay={i * 70}>
              <Link
                href={`/shop?category=${c.slug}`}
                className="img-zoom card-lift group relative block overflow-hidden rounded-[20px] bg-white ring-1 ring-rosewood-100/70"
              >
                <span className="block aspect-[4/5] overflow-hidden bg-cream-100">
                  {c.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.imageUrl} alt={c.name} loading="lazy" className="h-full w-full object-cover" sizes="(max-width:640px) 50vw, 20vw" />
                  ) : (
                    <span className="grid h-full w-full place-items-center font-display text-4xl text-rosewood-200">S</span>
                  )}
                </span>
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/80 to-transparent p-3.5 pt-10">
                  <span className="block font-display text-lg sm:text-xl text-white leading-tight">{c.name}</span>
                  <span className="mt-0.5 flex items-center gap-1 text-xs font-medium text-cream-100/85">
                    Shop now <ArrowRight size={13} strokeWidth={2} aria-hidden />
                  </span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section aria-label="Featured products" className="mx-auto max-w-7xl px-4 sm:px-6 pt-12 sm:pt-16">
        <Reveal>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.24em] text-rosewood-600 flex items-center gap-1.5">
                <Sparkles size={14} strokeWidth={2} aria-hidden /> Most loved
              </p>
              <h2 className="font-display mt-1 text-3xl sm:text-4xl text-rosewood-950">Featured Pieces</h2>
            </div>
            <Link href="/shop" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-rosewood-700 hover:gap-2.5 transition-all">
              Shop all <ArrowRight size={16} strokeWidth={2} aria-hidden />
            </Link>
          </div>
        </Reveal>
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {feat.map((r, i) => (
            <Reveal key={String(r.id)} delay={(i % 4) * 70}>
              <ProductCard p={toCard(r)} priority={i < 2} />
            </Reveal>
          ))}
        </div>
        <div className="mt-6 text-center sm:hidden">
          <Link href="/shop" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-rosewood-200 px-7 text-sm font-semibold">
            Shop all <ArrowRight size={15} strokeWidth={2} aria-hidden />
          </Link>
        </div>
      </section>

      {/* Editorial banner */}
      <section aria-label="Festive edit" className="mx-auto max-w-7xl px-4 sm:px-6 pt-12 sm:pt-16">
        <Reveal variant="img">
          <div className="relative overflow-hidden rounded-[24px] bg-rosewood-950">
            <div className="grid md:grid-cols-2">
              <div className="p-7 sm:p-12 flex flex-col justify-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold-300">The Festive Edit</p>
                <h2 className="font-display mt-3 text-3xl sm:text-5xl text-cream-50 leading-[1.05]">
                  Wedding & Eid looks, up to 40% off
                </h2>
                <p className="mt-3 text-cream-100/80 text-[15px] leading-relaxed max-w-md">
                  Ruby lehengas, mulberry silks & chiffon hijabs. Use code <strong className="text-gold-300">WELCOME10</strong> for an extra 10% off your first order.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <Link href="/shop" className="btn-sheen inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-cream-50 px-8 text-[15px] font-semibold text-rosewood-950">
                    Shop the Sale <ArrowRight size={17} strokeWidth={2} aria-hidden />
                  </Link>
                  <Link href="/offers" className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-white/30 px-8 text-[15px] font-semibold text-white hover:bg-white/10 transition">
                    Get Coupons
                  </Link>
                </div>
              </div>
              <div className="relative min-h-[280px] md:min-h-[420px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.pexels.com/photos/30912301/pexels-photo-30912301.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800"
                  alt="Model wearing festive red traditional wear"
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                  sizes="(max-width:768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-rosewood-950 via-rosewood-950/20 to-transparent" aria-hidden />
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* New arrivals */}
      <section aria-label="New arrivals" className="mx-auto max-w-7xl px-4 sm:px-6 pt-12 sm:pt-16">
        <Reveal>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.24em] text-rosewood-600">Just landed</p>
              <h2 className="font-display mt-1 text-3xl sm:text-4xl text-rosewood-950">New Arrivals</h2>
            </div>
            <Link href="/shop?sort=newest" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-rosewood-700 hover:gap-2.5 transition-all">
              View all <ArrowRight size={16} strokeWidth={2} aria-hidden />
            </Link>
          </div>
        </Reveal>
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {fresh.map((r, i) => (
            <Reveal key={String(r.id)} delay={(i % 4) * 70}>
              <ProductCard p={toCard(r)} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Bestsellers strip */}
      {best.length > 0 && (
        <section aria-label="Bestsellers" className="mt-12 sm:mt-16 bg-white border-y border-rosewood-100/70">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14">
            <Reveal>
              <div className="flex items-center gap-2 text-rosewood-600 text-xs font-semibold uppercase tracking-[0.24em]">
                <Star size={14} strokeWidth={2} aria-hidden /> Customer favourites
              </div>
              <h2 className="font-display mt-1 text-3xl sm:text-4xl text-rosewood-950">Bestsellers restocked</h2>
            </Reveal>
            <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {best.map((r, i) => (
                <Reveal key={String(r.id)} delay={i * 70}>
                  <ProductCard p={toCard(r)} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Reviews / trust */}
      <section aria-label="Customer reviews" className="mx-auto max-w-7xl px-4 sm:px-6 pt-12 sm:pt-16">
        <Reveal>
          <h2 className="font-display text-3xl sm:text-4xl text-rosewood-950 text-center">Loved across Bangladesh</h2>
          <p className="mt-2 text-center text-ink-500 text-[15px]">4.9 average from 12,000+ verified reviews</p>
        </Reveal>
        <div className="mt-7 grid sm:grid-cols-3 gap-3 sm:gap-5">
          {[
            { n: "Nusrat J.", c: "Dhaka", t: "The silk saree exceeded my expectations — fall, finish and packaging all felt premium. Delivery took 2 days!" },
            { n: "Faria R.", c: "Chattogram", t: "Ordered a three-piece with COD. Size chart was accurate and the exchange support replied within an hour." },
            { n: "Sumaiya A.", c: "Sylhet", t: "Chiffon hijabs are truly non-slip and opaque. My third reorder this year. Sushre never disappoints." },
          ].map((r, i) => (
            <Reveal key={r.n} delay={i * 90}>
              <figure className="h-full rounded-[20px] bg-white p-6 ring-1 ring-rosewood-100/70 card-lift">
                <div className="text-gold-500 tracking-widest" aria-label="5 out of 5 stars">★★★★★</div>
                <blockquote className="mt-3 text-[15px] leading-relaxed text-ink-700">“{r.t}”</blockquote>
                <figcaption className="mt-4 text-sm font-semibold">{r.n} <span className="font-normal text-ink-500">· {r.c} · Verified buyer</span></figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Service promises */}
      <section aria-label="Why Sushre" className="mx-auto max-w-7xl px-4 sm:px-6 pt-12 sm:pt-16 pb-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {[
            { icon: Truck, t: "Fast Delivery", s: "24h in Dhaka, 3–5 days nationwide" },
            { icon: ShieldCheck, t: "COD Available", s: "Pay cash at your doorstep" },
            { icon: RotateCcw, t: "Easy Exchange", s: "7-day size exchange support" },
            { icon: BadgePercent, t: "Weekly Offers", s: "Coupons & festive discounts" },
          ].map((f, i) => (
            <Reveal key={f.t} delay={i * 70}>
              <div className="flex items-start gap-3 rounded-[20px] bg-white p-4 sm:p-5 ring-1 ring-rosewood-100/70 h-full">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-rosewood-50 text-rosewood-700">
                  <f.icon size={20} strokeWidth={1.75} aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-bold">{f.t}</span>
                  <span className="block text-xs text-ink-500 mt-0.5 leading-relaxed">{f.s}</span>
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
