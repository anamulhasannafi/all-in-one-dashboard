import Link from "next/link";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import Reveal from "@/components/Reveal";
import { ArrowRight } from "@/components/icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  let cats: typeof categories.$inferSelect[] = [];
  let counts = new Map<string, number>();
  try {
    cats = await db.select().from(categories).where(eq(categories.active, true)).orderBy(categories.sortOrder);
    const c = await db.execute(sql`SELECT category_id, COUNT(*)::int as n FROM products WHERE active=true GROUP BY category_id`);
    for (const r of c.rows as { category_id: string; n: number }[]) counts.set(r.category_id, r.n);
  } catch {}
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rosewood-600">Browse</p>
      <h1 className="font-display text-3xl sm:text-5xl text-rosewood-950 mt-1">All Categories</h1>
      <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cats.map((c, i) => (
          <Reveal key={c.id} delay={(i % 3) * 70}>
            <Link href={`/shop?category=${c.slug}`} className="img-zoom card-lift group relative block overflow-hidden rounded-[22px] ring-1 ring-rosewood-100/70 bg-white">
              <span className="block aspect-[16/10] overflow-hidden bg-cream-100">
                {c.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.imageUrl} alt={c.name} loading="lazy" className="h-full w-full object-cover" />
                ) : null}
              </span>
              <span className="flex items-center justify-between p-5">
                <span>
                  <span className="block font-display text-2xl text-rosewood-950">{c.name}</span>
                  <span className="block text-sm text-ink-500 mt-0.5">{counts.get(c.id) ?? 0} pieces · {c.description || "Curated picks"}</span>
                </span>
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-rosewood-800 text-white group-hover:gap-3 transition-all">
                  <ArrowRight size={19} aria-hidden />
                </span>
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
