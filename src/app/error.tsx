"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="font-display text-3xl text-rosewood-950">Something went wrong</h1>
      <p className="mt-2 text-sm text-ink-500">Please refresh — your bag is saved.</p>
      <button onClick={reset} className="mt-5 inline-flex min-h-12 items-center rounded-full bg-rosewood-800 px-7 text-sm font-semibold text-white">
        Try Again
      </button>
    </div>
  );
}
