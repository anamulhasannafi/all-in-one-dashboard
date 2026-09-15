export const metadata = { title: "FAQ" };

const FAQS = [
  { q: "How do I place an order?", a: "Add pieces to your bag, go to checkout, fill in your name, mobile number and address, choose your delivery area and tap Place Order. You'll get an Order ID like SUS-10001 instantly." },
  { q: "What payment methods do you accept?", a: "Cash on Delivery nationwide, plus bKash, Nagad and Rocket (confirmed by phone after ordering). No advance is taken on the website." },
  { q: "How much is delivery?", a: "Inside Dhaka ৳70, Outside Dhaka ৳130. Orders above the free-shipping threshold (shown at checkout) get FREE delivery." },
  { q: "How do I use a coupon?", a: "Enter the code (e.g. WELCOME10) in the coupon box at checkout and tap Apply. Discount is verified on our server before your total is confirmed." },
  { q: "What if my size doesn't fit?", a: "We offer 7-day size exchange for unworn pieces with tags. Call 09638-010101 and we'll arrange it." },
  { q: "How can I track my order?", a: "Open Track Order and enter your Order ID. You'll see live status from Pending → Confirmed → Shipped → Delivered." },
  { q: "My order failed — was I charged? Will it duplicate?", a: "No. Online payment is confirmed by phone, and our checkout uses a one-time order key — tapping Place Order twice can never create two orders. Just retry safely." },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="font-display text-3xl sm:text-5xl text-rosewood-950 text-center">FAQ</h1>
      <div className="mt-7 space-y-3">
        {FAQS.map((f) => (
          <details key={f.q} className="group rounded-[18px] bg-white ring-1 ring-rosewood-100/70 p-5 open:shadow-md transition">
            <summary className="cursor-pointer font-semibold text-[15px] list-none flex justify-between gap-3 min-h-11 items-center">
              {f.q}<span className="text-rosewood-600 group-open:rotate-45 transition text-xl leading-none">+</span>
            </summary>
            <p className="mt-2 text-[15px] text-ink-700 leading-relaxed">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
