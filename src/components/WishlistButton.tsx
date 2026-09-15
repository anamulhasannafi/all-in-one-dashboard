"use client";

import { useEffect, useState } from "react";
import { Heart } from "./icons";

export function getWishlist(): string[] {
  try {
    const raw = localStorage.getItem("sushre_wishlist_v1");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function WishlistButton({
  productId,
  compact,
}: {
  productId: string;
  compact?: boolean;
}) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(getWishlist().includes(productId));
  }, [productId]);

  const toggle = async () => {
    const list = getWishlist();
    const next = list.includes(productId)
      ? list.filter((id) => id !== productId)
      : [...list, productId];
    localStorage.setItem("sushre_wishlist_v1", JSON.stringify(next));
    setActive(next.includes(productId));
    // sync to server if logged in (best-effort, never blocks)
    try {
      await fetch("/api/wishlist", {
        method: next.includes(productId) ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={active}
      title={active ? "Saved" : "Save"}
      className={`grid place-items-center rounded-full backdrop-blur transition active:scale-90 ${
        compact ? "h-10 w-10" : "h-12 w-12"
      } ${
        active
          ? "bg-rosewood-700 text-white shadow-lg"
          : "bg-white/90 text-ink-900 hover:bg-white shadow"
      }`}
    >
      <Heart size={compact ? 18 : 20} strokeWidth={1.75} fill={active ? "currentColor" : "none"} aria-hidden />
    </button>
  );
}
