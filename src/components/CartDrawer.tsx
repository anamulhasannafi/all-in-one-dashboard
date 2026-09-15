"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/store/cart-store";
import { lineUnitPrice, lineTotal } from "@/lib/cart";
import { formatTaka } from "@/lib/format";
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight, Truck } from "./icons";

export default function CartDrawer({ freeThreshold }: { freeThreshold?: number | null }) {
  const { lines, drawerOpen, setDrawerOpen, updateQty, removeLine, subtotal } = useCart();

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const remaining = freeThreshold ? Math.max(0, freeThreshold - subtotal) : null;

  return (
    <div className={`fixed inset-0 z-50 ${drawerOpen ? "" : "pointer-events-none"}`} aria-hidden={!drawerOpen}>
      <div
        onClick={() => setDrawerOpen(false)}
        className={`absolute inset-0 bg-ink-900/45 transition-opacity duration-300 ${drawerOpen ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        role="dialog"
        aria-label="Shopping bag"
        className={`absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col bg-cream-50 shadow-2xl transition-transform duration-300 ease-out ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-rosewood-100 px-5 py-4">
          <h2 className="flex items-center gap-2 font-display text-2xl text-rosewood-950">
            <ShoppingBag size={21} strokeWidth={1.75} aria-hidden />
            Your Bag {lines.length > 0 && <span className="text-base text-ink-500">({lines.length})</span>}
          </h2>
          <button
            type="button"
            aria-label="Close bag"
            onClick={() => setDrawerOpen(false)}
            className="grid h-11 w-11 place-items-center rounded-full hover:bg-rosewood-50"
          >
            <X size={21} strokeWidth={1.75} />
          </button>
        </div>

        {remaining !== null && remaining > 0 && lines.length > 0 ? (
          <div className="border-b border-rosewood-100 bg-white px-5 py-3">
            <p className="flex items-center gap-2 text-[13px] font-medium text-ink-700">
              <Truck size={16} strokeWidth={1.75} aria-hidden />
              Add {formatTaka(remaining)} more for FREE delivery
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cream-200">
              <div
                className="h-full rounded-full bg-rosewood-600 transition-all"
                style={{ width: `${Math.min(100, (subtotal / (freeThreshold || 1)) * 100)}%` }}
              />
            </div>
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {lines.length === 0 ? (
            <div className="grid h-full place-items-center text-center">
              <div>
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rosewood-50 text-rosewood-400">
                  <ShoppingBag size={26} strokeWidth={1.5} aria-hidden />
                </span>
                <p className="mt-4 font-display text-2xl text-rosewood-950">Your bag is empty</p>
                <p className="mt-1 text-sm text-ink-500">Discover sarees, kurtis & festive picks.</p>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-rosewood-800 px-7 text-sm font-semibold text-white"
                >
                  <Link href="/shop">Start Shopping <ArrowRight size={16} className="inline" aria-hidden /></Link>
                </button>
              </div>
            </div>
          ) : (
            lines.map((l) => (
              <div key={l.key} className="flex gap-3 rounded-2xl bg-white p-3 ring-1 ring-rosewood-100/70">
                <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-cream-100">
                  {l.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <span className="grid h-full w-full place-items-center font-display text-2xl text-rosewood-200">S</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold">{l.productName}</p>
                  <p className="mt-0.5 text-xs text-ink-500">
                    {l.variant ? `${l.variant.color} · ${l.variant.size}` : "Standard"}
                  </p>
                  <p className="mt-1 text-sm font-bold text-rosewood-800">{formatTaka(lineUnitPrice(l))}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1 rounded-full border border-rosewood-100 p-1">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => updateQty(l.key, l.quantity - 1)}
                        className="grid h-8 w-8 place-items-center rounded-full hover:bg-rosewood-50 active:scale-90"
                      >
                        <Minus size={15} strokeWidth={2} />
                      </button>
                      <span className="w-7 text-center text-sm font-bold tabular-nums" aria-live="polite">{l.quantity}</span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => updateQty(l.key, l.quantity + 1)}
                        disabled={!!l.variant && l.quantity >= l.variant.stock}
                        className="grid h-8 w-8 place-items-center rounded-full hover:bg-rosewood-50 active:scale-90 disabled:opacity-30"
                      >
                        <Plus size={15} strokeWidth={2} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold tabular-nums">{formatTaka(lineTotal(l))}</span>
                      <button
                        type="button"
                        aria-label={`Remove ${l.productName}`}
                        onClick={() => removeLine(l.key)}
                        className="grid h-9 w-9 place-items-center rounded-full text-ink-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={17} strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>
                  {!!l.variant && l.quantity >= l.variant.stock && (
                    <p className="mt-1 text-[11px] text-amber-700">Max available stock reached</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-rosewood-100 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between text-[15px]">
              <span className="text-ink-700">Subtotal</span>
              <span className="font-bold text-rosewood-900 tabular-nums">{formatTaka(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-ink-500">Delivery charge calculated at checkout.</p>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <Link
                href="/cart"
                onClick={() => setDrawerOpen(false)}
                className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-rosewood-200 text-[15px] font-semibold hover:bg-rosewood-50 transition"
              >
                View Bag
              </Link>
              <Link
                href="/checkout"
                onClick={() => setDrawerOpen(false)}
                className="btn-sheen inline-flex min-h-[52px] items-center justify-center gap-1.5 rounded-full bg-rosewood-800 text-[15px] font-semibold text-white hover:bg-rosewood-900 transition"
              >
                Checkout <ArrowRight size={17} strokeWidth={2} aria-hidden />
              </Link>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
