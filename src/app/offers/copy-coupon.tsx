"use client";

import { useState } from "react";
import { Check } from "@/components/icons";

export default function CopyCoupon({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = code;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className="mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-5 text-sm font-bold hover:bg-white/20 transition"
      aria-live="polite"
    >
      {copied ? <><Check size={15} strokeWidth={3} aria-hidden /> Copied!</> : "Copy Code"}
    </button>
  );
}
