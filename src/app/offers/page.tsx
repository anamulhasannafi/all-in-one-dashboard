import { db } from "@/db";
import { coupons } from "@/db/schema";
import { formatTaka } from "@/lib/format";
import CopyButton from "./copy-coupon";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OffersPage() {
  let list: any[] = [];
  try {
    list = await db.select().from(coupons);
  } catch (error) {
    console.error("Error loading coupons from DB:", error);
  }

  // শুধুমাত্র active এবং non-hidden কুপনগুলো ফিল্টার করা
  const visibleCoupons = list.filter((c) => {
    const activeVal = c.active ?? c.is_active;
    const isActive = activeVal !== false && activeVal !== "false" && activeVal !== 0;

    const rawHidden = c.isHidden ?? c.is_hidden;
    const isHidden = rawHidden === true || rawHidden === "true" || rawHidden === 1;

    return isActive && !isHidden;
  });

  return (
    <div className="min-h-[70vh] bg-stone-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-rosewood-700 font-semibold mb-2">
          Save More
        </p>
        <h1 className="font-display text-4xl sm:text-5xl text-rosewood-950 mb-3">
          Offers & Coupons
        </h1>
        <p className="text-stone-600 text-sm sm:text-base max-w-md mx-auto mb-10">
          Apply codes at checkout. One coupon per order.
        </p>

        {visibleCoupons.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-rosewood-100 max-w-md mx-auto shadow-sm">
            <p className="text-stone-500 font-medium text-sm">
              No public coupons available at the moment.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 max-w-2xl mx-auto">
            {visibleCoupons.map((c) => (
              <div
                key={c.id || c.code}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rosewood-900 to-rosewood-950 text-white p-6 shadow-xl text-left border border-white/10"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-gold-400/20 text-gold-300 border border-gold-400/30">
                    {c.type === "percent" ? `${c.value}% OFF` : `${formatTaka(c.value)} OFF`}
                  </span>
                </div>

                <h3 className="font-mono text-2xl font-bold tracking-wider mb-2">
                  {c.code}
                </h3>

                <p className="text-xs text-stone-300 mb-5">
                  Min order {formatTaka(c.minSubtotal || 0)}
                  {c.maxDiscount ? ` · Max discount ${formatTaka(c.maxDiscount)}` : ""}
                </p>

                <CopyButton code={c.code} />
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 bg-white rounded-2xl p-6 border border-rosewood-100 max-w-2xl mx-auto text-left shadow-sm">
          <h4 className="font-display text-base font-semibold text-rosewood-950 mb-3">
            How to use
          </h4>
          <ol className="space-y-2 text-xs sm:text-sm text-stone-600 list-decimal list-inside">
            <li>Add your favourite pieces to the bag.</li>
            <li>Go to checkout and enter the code in the coupon box.</li>
            <li>Tap Apply — your discount appears instantly in the summary.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}