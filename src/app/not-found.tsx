import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <p className="font-display text-7xl text-rosewood-200">404</p>
      <h1 className="font-display mt-2 text-3xl text-rosewood-950">This page wandered off</h1>
      <p className="mt-2 text-sm text-ink-500">The look you wanted may have moved — let&apos;s find you something beautiful.</p>
      <div className="mt-6 flex justify-center gap-2.5">
        <Link href="/" className="inline-flex min-h-12 items-center rounded-full bg-rosewood-800 px-7 text-sm font-semibold text-white">Home</Link>
        <Link href="/shop" className="inline-flex min-h-12 items-center rounded-full border border-rosewood-200 px-7 text-sm font-semibold">Shop</Link>
      </div>
    </div>
  );
}
