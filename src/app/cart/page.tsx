"use client";

import Link from "next/link";
import { useCart } from "@/store/cart-store";
import { lineUnitPrice, lineTotal } from "@/lib/cart";
import { formatTaka } from "@/lib/format";
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag, ShieldCheck } from "@/components/icons";

export default function CartPage() {
  const { lines, updateQty, removeLine, subtotal, clear } = useCart();

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-rosewood-50 text-rosewood-400">
          <ShoppingBag size={32} strokeWidth={1.5} aria-hidden />
        </span>
        <h1 className="font-display mt-5 text-4xl text-rosewood-950">Your bag is empty</h1>
        <p className="mt-2 text-ink-500">Beautiful pieces are waiting for you.</p>
        <Link href="/shop" className="mt-6 inline-flex min-h-[52px] items-center gap-2 rounded-full bg-rosewood-800 px-8 font-semibold text-white">
          Continue Shopping <ArrowRight size={17} strokeWidth={2} aria-hidden />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl sm:text-4xl text-rosewood-950">Your Bag ({lines.length})</h1>
        <button onClick={clear} className="text-sm text-ink-500 hover:text-red-600 underline underline-offset-4">
          Clear all
        </button>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <ul className="space-y-3">
          {lines.map((l) => (
            <li key={l.key} className="flex gap-3 sm:gap-4 rounded-[20px] bg-white p-3 sm:p-4 ring-1 ring-rosewood-100/70">
              <Link href={`/product/${l.productSlug}`} className="h-28 w-24 sm:h-36 sm:w-28 shrink-0 overflow-hidden rounded-2xl bg-cream-100">
                {l.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <span className="grid h-full w-full place-items-center font-display text-3xl text-rosewood-200">S</span>
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/product/${l.productSlug}`} className="font-semibold text-[15px] sm:text-base leading-snug line-clamp-2 hover:text-rosewood-700">
                  {l.productName}
                </Link>
                <p className="mt-0.5 text-[13px] text-ink-500">{l.variant ? `${l.variant.color} · Size ${l.variant.size}` : "Standard"}</p>
                <p className="mt-1 text-sm font-bold text-rosewood-800 tabular-nums">{formatTaka(lineUnitPrice(l))} each</p>
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 rounded-full border border-rosewood-100 p-1">
                    <button type="button" aria-label="Decrease quantity" onClick={() => updateQty(l.key, l.quantity - 1)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-rosewood-50 active:scale-90">
                      <Minus size={16} strokeWidth={2} />
                    </button>
                    <span className="w-8 text-center font-bold tabular-nums" aria-live="polite">{l.quantity}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => updateQty(l.key, l.quantity + 1)}
                      disabled={!!l.variant && l.quantity >= l.variant.stock}
                      className="grid h-10 w-10 place-items-center rounded-full hover:bg-rosewood-50 active:scale-90 disabled:opacity-30"
                    >
                      <Plus size={16} strokeWidth={2} />
                    </button>
                  </div>
                  <span className="font-bold tabular-nums">{formatTaka(lineTotal(l))}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[11px] text-ink-500">{l.variant && l.quantity >= l.variant.stock ? "Max stock reached" : ""}</span>
                  <button type="button" onClick={() => removeLine(l.key)} aria-label={`Remove ${l.productName}`} className="inline-flex items-center gap-1 text-[13px] font-medium text-ink-500 hover:text-red-600 min-h-9 px-2">
                    <Trash2 size={15} strokeWidth={1.75} aria-hidden /> Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <aside className="lg:sticky lg:top-24 h-fit rounded-[22px] bg-white p-5 sm:p-6 ring-1 ring-rosewood-100/70">
          <h2 className="font-display text-2xl text-rosewood-950">Summary</h2>
          <dl className="mt-4 space-y-2 text-[15px]">
            <div className="flex justify-between"><dt className="text-ink-700">Subtotal</dt><dd className="font-bold tabular-nums">{formatTaka(subtotal)}</dd></div>
            <div className="flex justify-between text-sm"><dt className="text-ink-500">Delivery</dt><dd className="text-ink-500">at checkout</dd></div>
          </dl>
          <Link href="/checkout" className="btn-sheen mt-5 flex min-h-[56px] items-center justify-center gap-2 rounded-full bg-rosewood-800 font-bold text-white hover:bg-rosewood-900 transition">
            Proceed to Checkout <ArrowRight size={18} strokeWidth={2} aria-hidden />
          </Link>
          <Link href="/shop" className="mt-2.5 flex min-h-[52px] items-center justify-center rounded-full border border-rosewood-200 font-semibold text-[15px] hover:bg-rosewood-50 transition">
            Continue Shopping
          </Link>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-ink-500">
            <ShieldCheck size={15} strokeWidth={1.75} aria-hidden /> Secure checkout · COD available
          </p>
        </aside>
      </div>
    </div>
  );
}
