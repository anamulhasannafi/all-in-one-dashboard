import Link from "next/link";
import { Phone, Mail, MapPin, ShieldCheck, Truck, RotateCcw, BadgePercent } from "./icons";

export default function Footer({ supportPhone }: { supportPhone?: string | null }) {
  return (
    <footer className="mt-16 bg-rosewood-950 text-cream-100">
      {/* Trust strip */}
      <div className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Truck, title: "Nationwide Delivery", sub: "Inside & outside Dhaka" },
            { icon: ShieldCheck, title: "Cash on Delivery", sub: "Pay at your doorstep" },
            { icon: RotateCcw, title: "Easy Exchange", sub: "7-day size exchange" },
            { icon: BadgePercent, title: "Festive Offers", sub: "Coupons every week" },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10">
                <f.icon size={20} strokeWidth={1.75} aria-hidden />
              </span>
              <span>
                <span className="block text-sm font-semibold">{f.title}</span>
                <span className="block text-xs text-cream-100/70 mt-0.5">{f.sub}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 grid gap-10 md:grid-cols-4">
        <div>
          <p className="font-display text-3xl tracking-[0.1em]">SUSHRE</p>
          <p className="mt-3 text-sm leading-relaxed text-cream-100/75 max-w-xs">
            Premium women&apos;s fashion for Bangladesh — saree, three-piece, kurti, hijab &amp;
            festive wear. Designed for elegance, priced with honesty.
          </p>
          <div className="mt-5 flex gap-2">
            {[
              { label: "Facebook", href: "https://facebook.com", glyph: "f" },
              { label: "Instagram", href: "https://instagram.com", glyph: "◍" },
              { label: "TikTok", href: "https://tiktok.com", glyph: "♪" },
              { label: "YouTube", href: "https://youtube.com", glyph: "▶" },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                aria-label={`Sushre on ${s.label}`}
                title={s.label}
                className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-sm font-semibold hover:bg-gold-500 hover:text-rosewood-950 transition"
              >
                {s.glyph}
              </a>
            ))}
          </div>
        </div>
        <nav aria-label="Shop links">
          <p className="text-xs uppercase tracking-[0.22em] text-gold-300 font-semibold">Shop</p>
          <ul className="mt-4 space-y-2.5 text-[15px]">
            <li><Link className="hover:text-gold-300 transition" href="/shop">All Products</Link></li>
            <li><Link className="hover:text-gold-300 transition" href="/categories">Categories</Link></li>
            <li><Link className="hover:text-gold-300 transition" href="/offers">Offers & Coupons</Link></li>
            <li><Link className="hover:text-gold-300 transition" href="/search">Search</Link></li>
            <li><Link className="hover:text-gold-300 transition" href="/wishlist">Wishlist</Link></li>
          </ul>
        </nav>
        <nav aria-label="Help links">
          <p className="text-xs uppercase tracking-[0.22em] text-gold-300 font-semibold">Help</p>
          <ul className="mt-4 space-y-2.5 text-[15px]">
            <li><Link className="hover:text-gold-300 transition" href="/track-order">Track Order</Link></li>
            <li><Link className="hover:text-gold-300 transition" href="/delivery-info">Delivery Info</Link></li>
            <li><Link className="hover:text-gold-300 transition" href="/return-policy">Exchange & Returns</Link></li>
            <li><Link className="hover:text-gold-300 transition" href="/contact">Contact Us</Link></li>
            <li><Link className="hover:text-gold-300 transition" href="/faq">FAQ</Link></li>
          </ul>
        </nav>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-gold-300 font-semibold">Contact</p>
          <ul className="mt-4 space-y-3 text-[15px]">
            <li className="flex items-center gap-2.5">
              <Phone size={17} strokeWidth={1.75} aria-hidden className="shrink-0" />
              <a href={`tel:${(supportPhone || "09638010101").replace(/[^+\d]/g, "")}`}>{supportPhone || "09638-010101"}</a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail size={17} strokeWidth={1.75} aria-hidden className="shrink-0" />
              <a href="mailto:hello@sushre.com">hello@sushre.com</a>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin size={17} strokeWidth={1.75} aria-hidden className="shrink-0 mt-0.5" />
              <span>Banani 11, Dhaka 1213, Bangladesh</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5 flex flex-col sm:flex-row gap-2 items-center justify-between text-xs text-cream-100/60">
          <p>© {new Date().getFullYear()} Sushre. All rights reserved.</p>
          <p>100% authentic • Secure checkout • bKash / Nagad / COD</p>
        </div>
      </div>
    </footer>
  );
}
