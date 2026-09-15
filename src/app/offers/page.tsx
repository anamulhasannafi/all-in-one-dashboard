import { db } from "@/db";
import { coupons } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import Reveal from "@/components/Reveal";
import CopyCoupon from "./copy-coupon";
import { TicketPercent } from "@/components/icons";
import { formatTaka } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Offers & Coupons" };

export default async function OffersPage() {
  let list: typeof coupons.$inferSelect[] = [];
  try {
    list = await db.select().from(coupons).where(eq(coupons.active, true)).orderBy(coupons.createdAt);
  } catch {}
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rosewood-600 text-center">Save more</p>
      <h1 className="font-display text-3xl sm:text-5xl text-rosewood-950 mt-1 text-center">Offers & Coupons</h1>
      <p className="mt-2 text-center text-sm text-ink-500">Apply codes at checkout. One coupon per order.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {list.map((c, i) => (
          <Reveal key={c.id} delay={(i % 2) * 80}>
            <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-rosewood-800 to-rosewood-950 p-6 text-cream-50">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gold-500/25 blur-2xl" aria-hidden />
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold-300">
                <TicketPercent size={16} aria-hidden /> {c.type === "percent" ? `${c.value}% OFF` : `${formatTaka(c.value)} OFF`}
              </p>
              <p className="font-mono mt-2 text-3xl font-bold tracking-widest">{c.code}</p>
              <p className="mt-1.5 text-sm text-cream-100/80">
                Min order {formatTaka(c.minSubtotal)}{c.maxDiscount ? ` · Max discount ${formatTaka(c.maxDiscount)}` : ""}
              </p>
              <CopyCoupon code={c.code} />
            </div>
          </Reveal>
        ))}
        {list.length === 0 && (
          <p className="col-span-2 rounded-2xl bg-white p-8 text-center text-ink-500 ring-1 ring-rosewood-100/70">No active coupons right now — check back during festive sales.</p>
        )}
      </div>
      <div className="mt-8 rounded-[22px] bg-white p-6 ring-1 ring-rosewood-100/70 text-sm text-ink-700 leading-relaxed">
        <h2 className="font-display text-xl text-rosewood-950">How to use</h2>
        <ol className="mt-2 list-decimal pl-5 space-y-1.5">
          <li>Add your favourite pieces to the bag.</li>
          <li>Go to checkout and enter the code in the coupon box.</li>
          <li>Tap Apply — your discount appears instantly in the summary.</li>
        </ol>
      </div>
    </div>
  );
}
