import { Truck, ShieldCheck, Phone } from "@/components/icons";

export const metadata = { title: "Delivery Info" };

export default function DeliveryPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="font-display text-3xl sm:text-5xl text-rosewood-950 text-center">Delivery Info</h1>
      <div className="mt-7 rounded-[22px] bg-white ring-1 ring-rosewood-100/70 overflow-hidden">
        <table className="w-full text-[15px]">
          <thead>
            <tr className="bg-cream-100 text-left text-sm">
              <th className="p-4">Area</th><th className="p-4">Charge</th><th className="p-4">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rosewood-100/60">
            <tr><td className="p-4 font-semibold">Inside Dhaka</td><td className="p-4">৳70</td><td className="p-4">24–48 hours</td></tr>
            <tr><td className="p-4 font-semibold">Outside Dhaka</td><td className="p-4">৳130</td><td className="p-4">3–5 days</td></tr>
            <tr><td className="p-4 font-semibold">Express (Dhaka)</td><td className="p-4">৳180</td><td className="p-4">Same / next day</td></tr>
          </tbody>
        </table>
      </div>
      <div className="mt-4 grid sm:grid-cols-3 gap-3 text-sm">
        {[
          { icon: Truck, t: "Live tracking", s: "Track with your SUS Order ID anytime." },
          { icon: ShieldCheck, t: "COD everywhere", s: "Check your parcel before paying." },
          { icon: Phone, t: "Delivery support", s: "Call 09638-010101 for help." },
        ].map((f) => (
          <div key={f.t} className="rounded-2xl bg-white p-4 ring-1 ring-rosewood-100/70">
            <f.icon size={19} className="text-rosewood-700" aria-hidden />
            <p className="mt-1.5 font-bold">{f.t}</p>
            <p className="text-ink-500">{f.s}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
