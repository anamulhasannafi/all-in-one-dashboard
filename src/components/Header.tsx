"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/store/cart-store";
import {
  Search,
  Heart,
  ShoppingBag,
  Menu,
  X,
  UserRound,
  Home,
  Store,
  LayoutGrid,
  BadgePercent,
  Package,
  Phone,
} from "./icons";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/shop", label: "Shop", icon: Store },
  { href: "/categories", label: "Categories", icon: LayoutGrid },
  { href: "/offers", label: "Offers", icon: BadgePercent },
  { href: "/track-order", label: "Track Order", icon: Package },
];

export default function Header({
  announcement,
  user,
}: {
  announcement?: string | null;
  user?: { name: string; role: string } | null;
}) {
  const { count, setDrawerOpen } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [wishCount, setWishCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("sushre_wishlist_v1");
      if (raw) setWishCount(JSON.parse(raw).length);
    } catch {}
    const onStorage = () => {
      try {
        const raw = localStorage.getItem("sushre_wishlist_v1");
        setWishCount(raw ? JSON.parse(raw).length : 0);
      } catch {}
    };
    window.addEventListener("storage", onStorage);
    const t = setInterval(onStorage, 1500);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(t);
    };
  }, []);

  // lock body when menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      {announcement ? (
        <div className="bg-rosewood-950 text-cream-50 text-center text-[12px] sm:text-[13px] tracking-wide px-4 py-2">
          <span className="inline-flex items-center gap-2 justify-center">
            <BadgePercent size={14} strokeWidth={1.75} aria-hidden />
            <span className="line-clamp-1">{announcement}</span>
          </span>
        </div>
      ) : null}

      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled
            ? "bg-cream-50/90 backdrop-blur-xl shadow-[0_8px_30px_rgba(46,11,29,0.10)]"
            : "bg-cream-50/70 backdrop-blur-md"
        } border-b border-rosewood-100/70`}
      >
        <div className="mx-auto max-w-7xl px-3 sm:px-6">
          <div className="flex h-16 sm:h-[72px] items-center gap-2 sm:gap-4">
            {/* Mobile menu btn */}
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
              className="lg:hidden inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-rosewood-50 active:scale-95 transition"
            >
              <Menu size={22} strokeWidth={1.75} />
            </button>

            {/* Logo */}
            <Link href="/" aria-label="Sushre home" className="flex items-center gap-2.5 shrink-0">
              <span className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-full bg-rosewood-800 text-cream-50 font-display text-xl sm:text-2xl leading-none pt-0.5">
                S
              </span>
              <span className="leading-none">
                <span className="font-display block text-[24px] sm:text-[28px] tracking-[0.08em] text-rosewood-950">
                  SUSHRE
                </span>
                <span className="hidden sm:block text-[10px] tracking-[0.32em] uppercase text-ink-500">
                  Elegance Daily
                </span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav aria-label="Primary" className="hidden lg:flex items-center gap-1 ml-6">
              {NAV.map((n) => {
                const active = pathname === n.href;
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={`px-4 py-2.5 rounded-full text-[15px] font-medium transition hover:bg-rosewood-50 ${
                      active ? "text-rosewood-800 bg-rosewood-50" : "text-ink-700"
                    }`}
                  >
                    {n.label}
                  </Link>
                );
              })}
            </nav>

            <div className="ml-auto flex items-center gap-0.5 sm:gap-1.5">
              <button
                type="button"
                aria-label="Search"
                onClick={() => setSearchOpen((v) => !v)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-rosewood-50 active:scale-95 transition"
              >
                <Search size={21} strokeWidth={1.75} />
              </button>
              <Link
                href="/wishlist"
                aria-label={`Wishlist, ${wishCount} items`}
                className="relative hidden sm:inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-rosewood-50 active:scale-95 transition"
              >
                <Heart size={21} strokeWidth={1.75} />
                {wishCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-5 h-5 px-1 grid place-items-center rounded-full bg-rosewood-600 text-white text-[11px] font-semibold">
                    {wishCount}
                  </span>
                )}
              </Link>
              <Link
                href={user ? "/account" : "/login"}
                aria-label={user ? `Account, ${user.name}` : "Account, sign in"}
                className="hidden sm:inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-rosewood-50 active:scale-95 transition"
              >
                <UserRound size={21} strokeWidth={1.75} />
              </Link>
              <button
                type="button"
                aria-label={`Cart, ${count} items`}
                onClick={() => setDrawerOpen(true)}
                className="relative inline-flex h-11 min-w-11 px-1 items-center justify-center gap-1.5 rounded-full bg-rosewood-800 text-cream-50 hover:bg-rosewood-900 active:scale-95 transition shadow-[0_10px_24px_rgba(79,21,48,0.3)]"
              >
                <ShoppingBag size={20} strokeWidth={1.75} />
                <span className="text-sm font-semibold pr-1 tabular-nums">{count}</span>
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-gold-400 ring-2 ring-cream-50" />
                )}
              </button>
            </div>
          </div>

          {/* Expanding search */}
          {searchOpen && (
            <form
              role="search"
              className="pb-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
              }}
            >
              <div className="flex items-center gap-2 rounded-2xl border border-rosewood-100 bg-white p-1.5 pl-4 shadow-sm focus-within:border-rosewood-400">
                <Search size={18} strokeWidth={1.75} className="text-ink-500 shrink-0" aria-hidden />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search saree, kurti, hijab, three-piece…"
                  aria-label="Search products"
                  inputMode="search"
                  className="w-full bg-transparent text-[15px] outline-none placeholder:text-ink-500/60 min-h-11"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-xl bg-rosewood-800 text-white text-sm font-medium px-5 min-h-11 hover:bg-rosewood-900 transition"
                >
                  Search
                </button>
              </div>
            </form>
          )}
        </div>
      </header>

      {/* Mobile drawer menu */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${menuOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!menuOpen}
      >
        <div
          onClick={() => setMenuOpen(false)}
          className={`absolute inset-0 bg-ink-900/45 backdrop-blur-[2px] transition-opacity duration-300 ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <aside
          role="dialog"
          aria-label="Menu"
          className={`absolute left-0 top-0 h-full w-[86%] max-w-[340px] bg-cream-50 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between p-4 border-b border-rosewood-100">
            <span className="font-display text-2xl tracking-[0.1em] text-rosewood-950">SUSHRE</span>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              className="h-11 w-11 grid place-items-center rounded-full hover:bg-rosewood-50"
            >
              <X size={22} strokeWidth={1.75} />
            </button>
          </div>
          <nav aria-label="Mobile" className="p-3 space-y-1 overflow-y-auto">
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-[16px] font-medium transition active:scale-[0.99] ${
                    active ? "bg-rosewood-800 text-white" : "hover:bg-rosewood-50 text-ink-900"
                  }`}
                >
                  <Icon size={20} strokeWidth={1.75} aria-hidden />
                  {n.label}
                  <span className="ml-auto opacity-40">›</span>
                </Link>
              );
            })}
            <div className="pt-2 grid grid-cols-2 gap-2">
              <Link
                href="/wishlist"
                className="flex items-center justify-center gap-2 rounded-2xl border border-rosewood-100 bg-white px-3 py-3 text-sm font-medium min-h-12"
              >
                <Heart size={18} strokeWidth={1.75} aria-hidden /> Wishlist
              </Link>
              <Link
                href={user ? "/account" : "/login"}
                className="flex items-center justify-center gap-2 rounded-2xl border border-rosewood-100 bg-white px-3 py-3 text-sm font-medium min-h-12"
              >
                <UserRound size={18} strokeWidth={1.75} aria-hidden />
                {user ? "Account" : "Sign in"}
              </Link>
            </div>
          </nav>
          <div className="mt-auto p-4 border-t border-rosewood-100 bg-white/60">
            <a
              href="tel:09638010101"
              className="flex items-center gap-2 text-sm text-ink-700 font-medium"
            >
              <Phone size={16} strokeWidth={1.75} aria-hidden /> Hotline: 09638-010101
            </a>
            <p className="text-xs text-ink-500 mt-1">Sat–Thu, 10am–8pm • Cash on Delivery</p>
          </div>
        </aside>
      </div>

      {/* Mobile bottom nav */}
      <nav
        aria-label="Mobile quick nav"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-rosewood-100 bg-cream-50/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-5 max-w-lg mx-auto">
          {[
            { href: "/", label: "Home", icon: Home },
            { href: "/shop", label: "Shop", icon: Store },
            { href: "/search", label: "Search", icon: Search },
            { href: "/wishlist", label: "Saved", icon: Heart },
            { href: user ? "/account" : "/login", label: "Account", icon: UserRound },
          ].map((n) => {
            const Icon = n.icon;
            const active = pathname === n.href;
            return (
              <Link
                key={n.label}
                href={n.href}
                aria-label={n.label}
                className={`flex flex-col items-center gap-0.5 py-2.5 min-h-[60px] justify-center text-[11px] font-medium transition ${
                  active ? "text-rosewood-700" : "text-ink-500"
                }`}
              >
                <Icon size={21} strokeWidth={active ? 2 : 1.75} aria-hidden />
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>
      <div className="lg:hidden h-[60px]" aria-hidden />
    </>
  );
}
