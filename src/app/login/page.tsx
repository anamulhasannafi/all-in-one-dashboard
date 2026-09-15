"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, AlertCircle } from "@/components/icons";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:py-16">
      <div className="rounded-[24px] bg-white p-6 sm:p-8 ring-1 ring-rosewood-100/70 shadow-[0_24px_60px_rgba(46,11,29,0.10)]">
        <p className="font-display text-center text-4xl text-rosewood-950">Welcome back</p>
        <p className="mt-1.5 text-center text-sm text-ink-500">Sign in for faster checkout & order history</p>
        <form
          className="mt-6 space-y-3.5"
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            setBusy(true);
            setError(null);
            try {
              const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
              });
              const d = await res.json();
              if (!res.ok) {
                setError(d.error || "Login failed");
              } else {
                router.push(d.user?.role === "admin" || d.user?.role === "staff" ? "/admin" : "/account");
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
            <label htmlFor="li-email" className="text-sm font-semibold">Email</label>
            <input id="li-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@email.com" className="input-elegant mt-1.5 min-h-[52px]" />
          </div>
          <div>
            <label htmlFor="li-pass" className="text-sm font-semibold">Password</label>
            <div className="relative mt-1.5">
              <input id="li-pass" type={show ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" placeholder="••••••••" className="input-elegant min-h-[52px] pr-12" />
              <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow((v) => !v)} className="absolute right-1 top-1 grid h-11 w-11 place-items-center rounded-xl hover:bg-cream-100">
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          {error && <p role="alert" className="flex items-center gap-1.5 text-sm text-red-700 bg-red-50 rounded-xl px-3.5 py-2.5"><AlertCircle size={16} aria-hidden /> {error}</p>}
          <button disabled={busy} className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-full bg-rosewood-800 font-bold text-white disabled:opacity-60">
            {busy && <Loader2 size={18} className="animate-spin" aria-hidden />} {busy ? "Signing in…" : "Sign In"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-ink-500">
          New to Sushre? <Link href="/register" className="font-bold text-rosewood-700 underline underline-offset-4">Create account</Link>
        </p>
        <div className="mt-5 rounded-2xl bg-cream-50 p-3.5 text-xs text-ink-500 leading-relaxed">
          Demo — Admin: <strong className="font-mono">admin@sushre.com / Sushre@123</strong><br />
          Customer: <strong className="font-mono">customer@test.com / test1234</strong>
        </div>
      </div>
    </div>
  );
}
