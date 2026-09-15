"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "@/components/icons";
import { bdPhoneError } from "@/lib/cart";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:py-16">
      <div className="rounded-[24px] bg-white p-6 sm:p-8 ring-1 ring-rosewood-100/70 shadow-[0_24px_60px_rgba(46,11,29,0.10)]">
        <p className="font-display text-center text-4xl text-rosewood-950">Join Sushre</p>
        <p className="mt-1.5 text-center text-sm text-ink-500">Faster checkout, order tracking & member offers</p>
        <form
          className="mt-6 space-y-3.5"
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            if (phone.trim()) {
              const pe = bdPhoneError(phone);
              if (pe) {
                setError(pe);
                return;
              }
            }
            setBusy(true);
            setError(null);
            try {
              const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, phone, password }),
              });
              const d = await res.json();
              if (!res.ok) setError(d.error || "Could not create account");
              else {
                router.push("/account");
                router.refresh();
              }
            } catch {
              setError("Network error. Try again.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <div>
            <label htmlFor="rg-name" className="text-sm font-semibold">Full name *</label>
            <input id="rg-name" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Your name" className="input-elegant mt-1.5 min-h-[52px]" />
          </div>
          <div>
            <label htmlFor="rg-email" className="text-sm font-semibold">Email *</label>
            <input id="rg-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@email.com" className="input-elegant mt-1.5 min-h-[52px]" />
          </div>
          <div>
            <label htmlFor="rg-phone" className="text-sm font-semibold">Mobile <span className="font-normal text-ink-500">(optional)</span></label>
            <input id="rg-phone" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" className="input-elegant mt-1.5 min-h-[52px]" />
          </div>
          <div>
            <label htmlFor="rg-pass" className="text-sm font-semibold">Password * <span className="font-normal text-ink-500">(min 6 chars)</span></label>
            <input id="rg-pass" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder="••••••••" className="input-elegant mt-1.5 min-h-[52px]" />
          </div>
          {error && <p role="alert" className="flex items-center gap-1.5 text-sm text-red-700 bg-red-50 rounded-xl px-3.5 py-2.5"><AlertCircle size={16} aria-hidden /> {error}</p>}
          <button disabled={busy} className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-full bg-rosewood-800 font-bold text-white disabled:opacity-60">
            {busy && <Loader2 size={18} className="animate-spin" aria-hidden />} {busy ? "Creating…" : "Create Account"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-ink-500">
          Already have an account? <Link href="/login" className="font-bold text-rosewood-700 underline underline-offset-4">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
