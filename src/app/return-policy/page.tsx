export const metadata = { title: "Exchange & Returns" };

export default function ReturnPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="font-display text-3xl sm:text-5xl text-rosewood-950 text-center">Exchange & Returns</h1>
      <div className="mt-7 rounded-[22px] bg-white p-6 sm:p-8 ring-1 ring-rosewood-100/70 text-[15px] leading-relaxed text-ink-700 space-y-4">
        <p><strong>7-day size exchange.</strong> Unworn pieces with tags can be exchanged for a different size within 7 days of delivery.</p>
        <p><strong>How to request:</strong> Call 09638-010101 or email hello@sushre.com with your Order ID (e.g. SUS-10001) and the size you need.</p>
        <p><strong>Damaged or wrong item?</strong> Send an unboxing photo within 48 hours — we&apos;ll reship or refund, including delivery.</p>
        <p><strong>Non-exchangeable:</strong> Intimate items and final-sale pieces marked at checkout.</p>
        <p><strong>Refunds:</strong> COD orders are refunded via bKash/Nagad within 3–5 working days after we receive the return.</p>
      </div>
    </div>
  );
}
