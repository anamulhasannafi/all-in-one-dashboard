"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/store/cart-store";
import { bdPhoneError } from "@/lib/cart";
import { formatTaka } from "@/lib/format";
import {
  ArrowRight,
  Loader2,
  AlertCircle,
  Check,
  TicketPercent,
  Truck,
  ChevronLeft,
} from "@/components/icons";

// Global Window interface for GTM & Meta Pixel
declare global {
  interface Window {
    dataLayer?: Record<string, any>[];
    fbq?: (...args: any[]) => void;
  }
}

type Zone = {
  id: string;
  name: string;
  charge: number;
  freeAbove: number | null;
  estimatedText: string | null;
};

const PAYMENTS = [
  { id: "cod", label: "Cash on Delivery", sub: "Pay at your doorstep", icon: "৳" },
  { id: "bkash", label: "bKash", sub: "Pay now via bKash", icon: "B" },
  { id: "nagad", label: "Nagad", sub: "Pay now via Nagad", icon: "N" },
  { id: "rocket", label: "Rocket", sub: "Pay now via Rocket", icon: "R" },
];

export default function CheckoutPage() {
  const { lines, subtotal, clear, updateQty, removeLine } = useCart();
  const router = useRouter();

  const [zones, setZones] = useState<Zone[]>([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [validating, setValidating] = useState(true);
  const [stockNotes, setStockNotes] = useState<string[]>([]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Dhaka");
  const [area, setArea] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [payment, setPayment] = useState("cod");
  const [notes, setNotes] = useState("");

  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState<{ code: string; discount: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  // Idempotency key — created once per page load, reused across retries (prevents duplicates)
  const idemKey = useRef<string>("");
  if (!idemKey.current) {
    idemKey.current =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  // Ref to prevent duplicate begin_checkout events
  const hasTrackedBeginCheckout = useRef(false);

  // Prefill saved info + user
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("sushre_checkout_v1") || "{}");
      if (saved.name) setName(saved.name);
      if (saved.phone) setPhone(saved.phone);
      if (saved.email) setEmail(saved.email);
      if (saved.address) setAddress(saved.address);
      if (saved.city) setCity(saved.city);
      if (saved.area) setArea(saved.area);
      if (saved.zoneId) setZoneId(saved.zoneId);
    } catch {}
    fetch("/api/auth/me").then(async (r) => {
      try {
        const d = await r.json();
        if (d.user) {
          setName((v) => v || d.user.name || "");
          setEmail((v) => v || d.user.email || "");
          if (d.user.phone) setPhone((v) => v || d.user.phone);
        }
      } catch {}
    });
  }, []);

  // Zones
  useEffect(() => {
    fetch("/api/delivery-zones")
      .then((r) => r.json())
      .then((d) => {
        setZones(d.items || []);
        if (d.items?.length && !zoneId) {
          try {
            const saved = JSON.parse(localStorage.getItem("sushre_checkout_v1") || "{}");
            setZoneId(saved.zoneId || d.items[0].id);
          } catch {
            setZoneId(d.items[0].id);
          }
        }
      })
      .catch(() => setZones([]))
      .finally(() => setZonesLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Server-side cart validation on mount (price/stock truth)
  useEffect(() => {
    if (lines.length === 0) {
      setValidating(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/cart/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: lines.map((l) => ({
              productId: l.productId,
              variantId: l.variant?.variantId ?? null,
              quantity: l.quantity,
            })),
          }),
        });
        const data = await res.json();
        if (cancelled) return;
        const notes: string[] = [];
        for (const v of data.items || []) {
          const key = `${v.productId}__${v.variantId ?? "base"}`;
          if (!v.available) {
            removeLine(key);
            notes.push(`${v.name} is unavailable and was removed`);
          } else if (v.stock < (lines.find((l) => l.key === key)?.quantity ?? 0)) {
            updateQty(key, Math.max(0, v.stock));
            notes.push(`Only ${v.stock} left for ${v.name} — quantity adjusted`);
          }
        }
        setStockNotes(notes);
      } catch {
        // never block checkout on validation network failure; server revalidates at order time
      } finally {
        if (!cancelled) setValidating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const zone = useMemo(() => zones.find((z) => z.id === zoneId) ?? null, [zones, zoneId]);
  const discount = couponApplied?.discount ?? 0;
  const deliveryCharge = useMemo(() => {
    if (!zone) return 0;
    if (zone.freeAbove != null && subtotal - discount >= zone.freeAbove) return 0;
    return zone.charge;
  }, [zone, subtotal, discount]);
  const total = Math.max(0, subtotal - discount + deliveryCharge);

  // ==========================================
  // TRACKING: begin_checkout / InitiateCheckout
  // ==========================================
  useEffect(() => {
    if (lines.length > 0 && !hasTrackedBeginCheckout.current) {
      hasTrackedBeginCheckout.current = true;

      const itemsData = lines.map((l, index) => ({
        item_id: l.productId,
        item_name: l.productName,
        price: l.variant?.price ?? l.basePrice,
        quantity: l.quantity,
        item_variant: l.variant ? `${l.variant.color} / ${l.variant.size}` : "Standard",
        index: index + 1,
      }));

      // 1. GA4 / GTM DataLayer
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "begin_checkout",
        ecommerce: {
          currency: "BDT",
          value: subtotal,
          coupon: couponApplied?.code || "",
          items: itemsData,
        },
      });

      // 2. Meta Pixel
      if (typeof window.fbq === "function") {
        window.fbq("track", "InitiateCheckout", {
          content_type: "product",
          contents: lines.map((l) => ({
            id: l.productId,
            quantity: l.quantity,
            item_price: l.variant?.price ?? l.basePrice,
          })),
          value: subtotal,
          currency: "BDT",
          num_items: lines.reduce((acc, item) => acc + item.quantity, 0),
        });
      }
    }
  }, [lines, subtotal, couponApplied]);

  const applyCoupon = async () => {
    const code = coupon.trim().toUpperCase();
    if (!code) {
      setCouponMsg("Enter a coupon code");
      return;
    }
    if (couponBusy) return;
    setCouponBusy(true);
    setCouponMsg(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });
      const d = await res.json();
      if (!res.ok) {
        setCouponApplied(null);
        setCouponMsg(d.error || "Invalid coupon");
      } else {
        setCouponApplied({ code: d.code, discount: d.discount });
        setCouponMsg(`Coupon applied — you save ${formatTaka(d.discount)}`);
      }
    } catch {
      setCouponMsg("Could not validate coupon. Try again.");
    } finally {
      setCouponBusy(false);
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = "Please enter your full name";
    const pe = bdPhoneError(phone);
    if (pe) e.phone = pe;
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "Enter a valid email or leave blank";
    if (address.trim().length < 5) e.address = "Please enter your full delivery address (house, road, area)";
    if (!city.trim()) e.city = "City is required";
    if (!zoneId) e.zoneId = "Select your delivery area";
    if (lines.length === 0) e.bag = "Your bag is empty";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const placeOrder = async () => {
    if (placing) return; // double-click guard
    setSubmitError(null);
    if (!validate()) {
      document.getElementById(Object.keys(errors)[0] || "co-name")?.scrollIntoView({ behavior: "smooth", block: "center" });
      const first = document.querySelector('[aria-invalid="true"]') as HTMLElement | null;
      first?.focus?.();
      return;
    }
    setPlacing(true);
    try {
      // remember info (never card data)
      localStorage.setItem("sushre_checkout_v1", JSON.stringify({ name, phone, email, address, city, area, zoneId }));

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name.trim(),
          phone: phone.trim(),
          email: email.trim() || "",
          address: address.trim(),
          city: city.trim(),
          area: area.trim() || "",
          deliveryZoneId: zoneId,
          paymentMethod: payment,
          couponCode: couponApplied?.code || "",
          notes: notes.trim() || "",
          items: lines.map((l) => ({
            productId: l.productId,
            variantId: l.variant?.variantId ?? null,
            quantity: l.quantity,
          })),
          idempotencyKey: idemKey.current,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        const msg = data.error || "Could not place your order. Please check your connection and try again.";
        setSubmitError(msg);
        if (data.field) {
          setErrors((prev) => ({ ...prev, [data.field]: msg }));
          document.getElementById(`co-${data.field}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          document.getElementById("place-order-error")?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }

      // ==========================================
      // TRACKING: purchase / Purchase Event
      // ==========================================
      const orderCode = data.order?.orderCode || `ORD-${Date.now()}`;
      const itemsData = lines.map((l, index) => ({
        item_id: l.productId,
        item_name: l.productName,
        price: l.variant?.price ?? l.basePrice,
        quantity: l.quantity,
        item_variant: l.variant ? `${l.variant.color} / ${l.variant.size}` : "Standard",
        index: index + 1,
      }));

      // 1. GA4 / GTM DataLayer Purchase Event
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "purchase",
        ecommerce: {
          transaction_id: orderCode,
          value: total,
          tax: 0,
          shipping: deliveryCharge,
          currency: "BDT",
          coupon: couponApplied?.code || "",
          items: itemsData,
        },
        user_data: {
          email: email.trim() || undefined,
          phone_number: phone.trim(),
          first_name: name.trim().split(" ")[0] || "",
          last_name: name.trim().split(" ").slice(1).join(" ") || "",
          address: {
            city: city.trim(),
            street: address.trim(),
            country: "BD",
          },
        },
      });

      // 2. Meta Pixel Purchase Event
      if (typeof window.fbq === "function") {
        window.fbq("track", "Purchase", {
          value: total,
          currency: "BDT",
          content_type: "product",
          contents: lines.map((l) => ({
            id: l.productId,
            quantity: l.quantity,
            item_price: l.variant?.price ?? l.basePrice,
          })),
          order_id: orderCode,
        });
      }

      clear();
      // fresh key for any future order
      idemKey.current =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      router.push(`/order-success?code=${encodeURIComponent(orderCode)}`);
    } catch {
      setSubmitError("Network error. Your order was NOT placed — please check your connection and tap Place Order again (you won't be double-charged).");
    } finally {
      setPlacing(false);
    }
  };

  const inputCls = (bad?: string) =>
    `input-elegant min-h-[52px] ${bad ? "border-red-500" : ""}`;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10 pb-32 lg:pb-10">
      <Link href="/cart" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-rosewood-700 min-h-11">
        <ChevronLeft size={17} aria-hidden /> Back to bag
      </Link>
      <h1 className="font-display mt-1 text-3xl sm:text-4xl text-rosewood-950">Checkout</h1>
      <p className="mt-1 text-sm text-ink-500">Cash on Delivery · No advance needed</p>

      {validating && (
        <p className="mt-4 flex items-center gap-2 text-sm text-ink-500" role="status">
          <Loader2 size={16} className="animate-spin" aria-hidden /> Checking live stock & prices…
        </p>
      )}
      {stockNotes.length > 0 && (
        <div role="alert" className="mt-4 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900 space-y-1">
          {stockNotes.map((n, i) => <p key={i}>• {n}</p>)}
        </div>
      )}

      {lines.length === 0 && !validating ? (
        <div className="mt-8 rounded-[20px] bg-white p-10 text-center ring-1 ring-rosewood-100/70">
          <p className="font-display text-2xl text-rosewood-950">Your bag is empty</p>
          <Link href="/shop" className="mt-4 inline-flex min-h-12 items-center rounded-full bg-rosewood-800 px-7 text-sm font-semibold text-white">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_380px] items-start">
          <div className="space-y-4">
            {/* 1 — Customer info */}
            <section aria-labelledby="co-info-h" className="rounded-[22px] bg-white p-5 sm:p-6 ring-1 ring-rosewood-100/70">
              <h2 id="co-info-h" className="flex items-center gap-2 font-display text-xl sm:text-2xl text-rosewood-950">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-rosewood-800 text-white text-sm font-bold">1</span>
                Customer Information
              </h2>
              <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <label htmlFor="co-name" className="text-sm font-semibold">Full name *</label>
                  <input id="co-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Nusrat Jahan" autoComplete="name" aria-invalid={!!errors.name} aria-describedby={errors.name ? "co-name-err" : undefined} className={`${inputCls(errors.name)} mt-1.5`} />
                  {errors.name && <p id="co-name-err" role="alert" className="mt-1 text-[13px] text-red-600">{errors.name}</p>}
                </div>
                <div>
                  <label htmlFor="co-phone" className="text-sm font-semibold">Mobile number *</label>
                  <input id="co-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" inputMode="tel" autoComplete="tel" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "co-phone-err" : undefined} className={`${inputCls(errors.phone)} mt-1.5`} />
                  {errors.phone ? <p id="co-phone-err" role="alert" className="mt-1 text-[13px] text-red-600">{errors.phone}</p> : <p className="mt-1 text-xs text-ink-500">Bangladeshi mobile — needed for delivery confirmation</p>}
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="co-email" className="text-sm font-semibold">Email <span className="font-normal text-ink-500">(optional)</span></label>
                  <input id="co-email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" inputMode="email" autoComplete="email" aria-invalid={!!errors.email} className={`${inputCls(errors.email)} mt-1.5`} />
                  {errors.email && <p role="alert" className="mt-1 text-[13px] text-red-600">{errors.email}</p>}
                </div>
              </div>
            </section>

            {/* 2 — Delivery */}
            <section aria-labelledby="co-del-h" className="rounded-[22px] bg-white p-5 sm:p-6 ring-1 ring-rosewood-100/70">
              <h2 id="co-del-h" className="flex items-center gap-2 font-display text-xl sm:text-2xl text-rosewood-950">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-rosewood-800 text-white text-sm font-bold">2</span>
                Delivery Location
              </h2>
              <div className="mt-4 grid gap-3.5">
                <div>
                  <span id="zone-label" className="text-sm font-semibold">Delivery area *</span>
                  {zonesLoading ? (
                    <div className="mt-1.5 space-y-2" aria-label="Loading delivery areas">
                      {[0, 1].map((i) => <div key={i} className="h-[52px] rounded-2xl bg-cream-100 animate-pulse" />)}
                    </div>
                  ) : (
                    <div className="mt-1.5 grid gap-2" role="radiogroup" aria-labelledby="zone-label">
                      {zones.map((z) => {
                        const active = zoneId === z.id;
                        const free = z.freeAbove != null && subtotal - discount >= z.freeAbove;
                        return (
                          <button
                            key={z.id}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => setZoneId(z.id)}
                            className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left min-h-[60px] transition active:scale-[0.99] ${active ? "border-rosewood-700 bg-rosewood-50 ring-1 ring-rosewood-600" : "border-rosewood-100 bg-cream-50/50"}`}
                          >
                            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${active ? "bg-rosewood-800 text-white" : "bg-white text-rosewood-700 ring-1 ring-rosewood-100"}`}>
                              <Truck size={19} strokeWidth={1.75} aria-hidden />
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className="block text-[15px] font-bold">{z.name}</span>
                              <span className="block text-xs text-ink-500">{z.estimatedText || "2-4 days"}{z.freeAbove ? ` · Free over ${formatTaka(z.freeAbove)}` : ""}</span>
                            </span>
                            <span className="text-sm font-bold tabular-nums shrink-0">{free ? <span className="text-emerald-700">FREE</span> : formatTaka(z.charge)}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {errors.zoneId && <p role="alert" className="text-[13px] text-red-600">{errors.zoneId}</p>}
                </div>
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="co-city" className="text-sm font-semibold">City *</label>
                    <input id="co-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Dhaka" autoComplete="address-level2" aria-invalid={!!errors.city} className={`${inputCls(errors.city)} mt-1.5`} />
                    {errors.city && <p role="alert" className="mt-1 text-[13px] text-red-600">{errors.city}</p>}
                  </div>
                  <div>
                    <label htmlFor="co-area" className="text-sm font-semibold">Area <span className="font-normal text-ink-500">(optional)</span></label>
                    <input id="co-area" value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Banani, Mirpur 10" autoComplete="address-level3" className="input-elegant min-h-[52px] mt-1.5" />
                  </div>
                </div>
                <div>
                  <label htmlFor="co-address" className="text-sm font-semibold">Full address *</label>
                  <textarea id="co-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House, road, area — e.g. House 12, Road 5, Banani DOHS" rows={2} autoComplete="street-address" aria-invalid={!!errors.address} aria-describedby={errors.address ? "co-address-err" : undefined} className={`${inputCls(errors.address)} mt-1.5`} />
                  {errors.address && <p id="co-address-err" role="alert" className="mt-1 text-[13px] text-red-600">{errors.address}</p>}
                </div>
                <div>
                  <label htmlFor="co-notes" className="text-sm font-semibold">Order notes <span className="font-normal text-ink-500">(optional)</span></label>
                  <input id="co-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Call before delivery" className="input-elegant min-h-[52px] mt-1.5" />
                </div>
              </div>
            </section>

            {/* 3 — Payment */}
            <section aria-labelledby="co-pay-h" className="rounded-[22px] bg-white p-5 sm:p-6 ring-1 ring-rosewood-100/70">
              <h2 id="co-pay-h" className="flex items-center gap-2 font-display text-xl sm:text-2xl text-rosewood-950">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-rosewood-800 text-white text-sm font-bold">3</span>
                Payment Method
              </h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Payment method">
                {PAYMENTS.map((m) => {
                  const active = payment === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setPayment(m.id)}
                      className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left min-h-[60px] transition active:scale-[0.99] ${active ? "border-rosewood-700 bg-rosewood-50 ring-1 ring-rosewood-600" : "border-rosewood-100"}`}
                    >
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl font-display text-lg ${active ? "bg-rosewood-800 text-white" : "bg-cream-100 text-rosewood-800"}`} aria-hidden>{m.icon}</span>
                      <span>
                        <span className="flex items-center gap-1.5 text-[15px] font-bold">{m.label}{active && <Check size={15} className="text-emerald-600" strokeWidth={3} aria-hidden />}</span>
                        <span className="block text-xs text-ink-500">{m.sub}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {payment !== "cod" && (
                <p className="mt-3 rounded-2xl bg-cream-100 px-4 py-3 text-[13px] text-ink-700">
                  You&apos;ll confirm {PAYMENTS.find((x) => x.id === payment)?.label} payment with our team on call after ordering. No advance is taken on the website.
                </p>
              )}
            </section>

            {/* Mobile summary collapsible */}
            <section aria-label="Order items" className="rounded-[22px] bg-white p-5 sm:p-6 ring-1 ring-rosewood-100/70 lg:hidden">
              <h2 className="font-display text-xl text-rosewood-950">Items ({lines.length})</h2>
              <ul className="mt-3 space-y-2.5">
                {lines.map((l) => (
                  <li key={l.key} className="flex items-center gap-3">
                    <span className="relative h-14 w-12 shrink-0 overflow-hidden rounded-xl bg-cream-100">
                      {l.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={l.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                      ) : null}
                      <span className="absolute -top-0 -right-0 grid h-5 min-w-5 place-items-center rounded-full bg-ink-900 px-1 text-[10px] font-bold text-white">{l.quantity}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{l.productName}</span>
                      <span className="block text-xs text-ink-500">{l.variant ? `${l.variant.color} · ${l.variant.size}` : "Standard"}</span>
                    </span>
                    <span className="text-sm font-bold tabular-nums shrink-0">{formatTaka((l.variant?.price ?? l.basePrice) * l.quantity)}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Summary — desktop sticky / mobile static above CTA */}
          <aside aria-label="Order summary" className="lg:sticky lg:top-24 rounded-[22px] bg-white p-5 sm:p-6 ring-1 ring-rosewood-100/70">
            <h2 className="font-display text-2xl text-rosewood-950">Order Summary</h2>
            <ul className="mt-3 space-y-2.5 max-h-64 overflow-y-auto pr-1 hidden lg:block">
              {lines.map((l) => (
                <li key={l.key} className="flex items-center gap-3">
                  <span className="relative h-14 w-12 shrink-0 overflow-hidden rounded-xl bg-cream-100">
                    {l.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={l.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : null}
                    <span className="absolute top-0 right-0 grid h-5 min-w-5 place-items-center rounded-full bg-ink-900 px-1 text-[10px] font-bold text-white">{l.quantity}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{l.productName}</span>
                    <span className="block text-xs text-ink-500">{l.variant ? `${l.variant.color} · ${l.variant.size}` : "Standard"}</span>
                  </span>
                  <span className="text-sm font-bold tabular-nums shrink-0">{formatTaka((l.variant?.price ?? l.basePrice) * l.quantity)}</span>
                </li>
              ))}
            </ul>

            {/* Coupon */}
            <div className="mt-4">
              {couponApplied ? (
                <div className="flex items-center justify-between rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-bold text-emerald-800">
                    <TicketPercent size={17} aria-hidden /> {couponApplied.code} · −{formatTaka(couponApplied.discount)}
                  </span>
                  <button type="button" onClick={() => { setCouponApplied(null); setCoupon(""); setCouponMsg(null); }} className="text-xs font-semibold text-emerald-700 underline underline-offset-2 min-h-9 px-2">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <label htmlFor="co-coupon" className="sr-only">Coupon code</label>
                  <input id="co-coupon" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="Coupon (e.g. WELCOME10)" className="input-elegant min-h-[52px] uppercase" autoComplete="off" />
                  <button type="button" onClick={applyCoupon} disabled={couponBusy} className="shrink-0 rounded-2xl bg-ink-900 px-5 text-sm font-bold text-white min-h-[52px] disabled:opacity-50 min-w-[84px]">
                    {couponBusy ? <Loader2 size={17} className="animate-spin mx-auto" aria-hidden /> : "Apply"}
                  </button>
                </div>
              )}
              {couponMsg && <p role="status" className={`mt-1.5 text-[13px] font-medium ${couponApplied ? "text-emerald-700" : "text-red-600"}`}>{couponMsg}</p>}
            </div>

            <dl className="mt-4 space-y-2 border-t border-dashed border-rosewood-100 pt-4 text-[15px]">
              <div className="flex justify-between"><dt className="text-ink-700">Subtotal</dt><dd className="font-semibold tabular-nums">{formatTaka(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-700">Discount</dt><dd className={`font-semibold tabular-nums ${discount ? "text-emerald-700" : ""}`}>{discount ? `−${formatTaka(discount)}` : "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-700">Delivery {zone ? `(${zone.name})` : ""}</dt><dd className="font-semibold tabular-nums">{deliveryCharge === 0 && zone ? <span className="text-emerald-700">FREE</span> : formatTaka(deliveryCharge)}</dd></div>
              <div className="flex justify-between border-t border-rosewood-100 pt-3 text-lg"><dt className="font-bold">Total</dt><dd className="font-bold text-rosewood-800 tabular-nums">{formatTaka(total)}</dd></div>
            </dl>
            {zone?.estimatedText && <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-500"><Truck size={14} aria-hidden /> Estimated delivery: {zone.estimatedText}</p>}

            {submitError && (
              <div id="place-order-error" role="alert" className="mt-4 flex items-start gap-2 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-medium text-red-800">
                <AlertCircle size={17} className="mt-0.5 shrink-0" aria-hidden />
                <span>{submitError}</span>
              </div>
            )}
            {errors.bag && <p role="alert" className="mt-2 text-sm text-red-600">{errors.bag}</p>}

            {/* Desktop Place Order Button */}
            <button
              type="button"
              onClick={placeOrder}
              disabled={placing || lines.length === 0}
              aria-busy={placing}
              className="btn-sheen mt-4 hidden lg:flex min-h-[58px] w-full items-center justify-center gap-2 rounded-full bg-rosewood-800 text-base font-bold text-white hover:bg-rosewood-900 active:scale-[0.99] transition disabled:opacity-60 shadow-[0_16px_32px_rgba(79,21,48,0.32)]"
            >
              {placing ? (
                <><Loader2 size={19} className="animate-spin" aria-hidden /> Placing your order…</>
              ) : (
                <>Place Order · {formatTaka(total)} <ArrowRight size={18} strokeWidth={2.5} aria-hidden /></>
              )}
            </button>
          </aside>
        </div>
      )}

      {/* Mobile Sticky Bottom CTA */}
      {lines.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-rosewood-100 bg-white/95 p-4 backdrop-blur-md lg:hidden">
          <div className="mx-auto flex max-w-md items-center justify-between gap-3">
            <div>
              <span className="block text-xs text-ink-500">Total payable</span>
              <span className="block font-bold text-lg text-rosewood-900 tabular-nums">{formatTaka(total)}</span>
            </div>
            <button
              type="button"
              onClick={placeOrder}
              disabled={placing}
              aria-busy={placing}
              className="btn-sheen flex min-h-[50px] flex-1 items-center justify-center gap-2 rounded-full bg-rosewood-800 px-6 text-sm font-bold text-white active:scale-[0.98] transition disabled:opacity-60 shadow-lg"
            >
              {placing ? (
                <><Loader2 size={18} className="animate-spin" aria-hidden /> Placing…</>
              ) : (
                <>Place Order <ArrowRight size={16} strokeWidth={2.5} aria-hidden /></>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}