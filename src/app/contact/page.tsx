import { Phone, Mail, MapPin, MessageCircle } from "@/components/icons";

export const metadata = { title: "Contact Us" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="font-display text-3xl sm:text-5xl text-rosewood-950 text-center">Contact Us</h1>
      <p className="mt-2 text-center text-sm text-ink-500">Sat–Thu, 10am–8pm · We reply within a few hours</p>
      <div className="mt-7 grid sm:grid-cols-3 gap-3">
        {[
          { icon: Phone, t: "Hotline", s: "09638-010101", href: "tel:09638010101" },
          { icon: MessageCircle, t: "WhatsApp", s: "01700-000000", href: "https://wa.me/8801700000000" },
          { icon: Mail, t: "Email", s: "hello@sushre.com", href: "mailto:hello@sushre.com" },
        ].map((c) => (
          <a key={c.t} href={c.href} className="card-lift rounded-[20px] bg-white p-5 text-center ring-1 ring-rosewood-100/70">
            <c.icon size={22} strokeWidth={1.75} className="mx-auto text-rosewood-700" aria-hidden />
            <p className="mt-2 text-sm font-bold">{c.t}</p>
            <p className="text-sm text-ink-500">{c.s}</p>
          </a>
        ))}
      </div>
      <div className="mt-4 rounded-[20px] bg-white p-6 ring-1 ring-rosewood-100/70 flex items-start gap-3">
        <MapPin size={20} strokeWidth={1.75} className="text-rosewood-700 shrink-0 mt-0.5" aria-hidden />
        <p className="text-[15px] text-ink-700">House 12, Road 11, Banani, Dhaka 1213, Bangladesh<br /><span className="text-sm text-ink-500">Visit by appointment for bridal & festive consultations.</span></p>
      </div>
    </div>
  );
}
