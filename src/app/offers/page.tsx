"use client";

import { useEffect, useState } from "react";
import { formatTaka } from "@/lib/format";
import { Loader2 } from "@/components/icons";

type Coupon = {
  id: string;
  code: string;
  type: string;
  value: number;
  minSubtotal: number;
  maxDiscount: number | null;
  active?: boolean | string | number;
  is_active?: boolean | string | number;
  isHidden?: boolean | string | number;
  is_hidden?: boolean | string | number;
};

export default function OffersPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCoupons() {
      try {
        const res = await fetch(`/api/coupons?t=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Pragma": "no-cache",
            "Cache-Control": "no-cache",
          },
        });
        const data = await res.json();
        
        // কনসোলে ডাটা দেখার জন্য
        console.log("Fetched Coupons:", data);

        let list: Coupon[] = [];
        if (Array.isArray(data)) {
          list = data;
        } else if (Array.isArray(data.coupons)) {
          list = data.coupons;
        } else if (Array.isArray(data.items)) {
          list = data.items;
        } else if (Array.isArray(data.data)) {
          list = data.data;
        }

        setCoupons(list);
      } catch (error) {
        console.error("Error loading coupons:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCoupons();
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // শুধুমাত্র নিশ্চিতভাবে Hidden হওয়া কুপনগুলো বাদ যাবে
  const visibleCoupons = coupons.filter((c) => {
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

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-rosewood-800" size={32} />
          </div>
        ) : visibleCoupons.length === 0 ? (
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

                <button
                  onClick={() => handleCopy(c.code)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition backdrop-blur-md text-xs font-semibold text-white border border-white/20"
                >
                  {copiedCode === c.code ? "Copied!" : "Copy Code"}
                </button>
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