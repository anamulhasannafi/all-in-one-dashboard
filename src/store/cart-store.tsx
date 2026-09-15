"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  cartCount,
  cartSubtotal,
  makeLineKey,
  type CartLine,
} from "@/lib/cart";

type AddInput = Omit<CartLine, "key" | "quantity"> & { quantity?: number };

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  drawerOpen: boolean;
  setDrawerOpen: (v: boolean) => void;
  addLine: (input: AddInput) => { ok: boolean; message?: string };
  updateQty: (key: string, qty: number) => void;
  removeLine: (key: string) => void;
  clear: () => void;
  lastAddedAt: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "sushre_cart_v1";

function load(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((l) => l && l.productId && typeof l.quantity === "number");
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lastAddedAt, setLastAddedAt] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLines(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {}
  }, [lines, hydrated]);

  const addLine = useCallback((input: AddInput) => {
    const qty = Math.max(1, Math.min(99, input.quantity ?? 1));
    const stock = input.variant ? input.variant.stock : 99;
    // Block out-of-stock reliably
    if (input.variant && (stock <= 0 || !input.variant)) {
      return { ok: false, message: "This size is out of stock" };
    }
    const key = makeLineKey(input.productId, input.variant?.variantId ?? null);
    let result: { ok: boolean; message?: string } = { ok: true };
    setLines((prev) => {
      const existing = prev.find((l) => l.key === key);
      const currentQty = existing?.quantity ?? 0;
      const maxAllowed = input.variant ? Math.max(0, input.variant.stock) : 99;
      if (currentQty + qty > maxAllowed) {
        result =
          maxAllowed <= currentQty
            ? { ok: false, message: `Only ${maxAllowed} available in this size` }
            : {
                ok: true,
                message: `Only ${maxAllowed} available — quantity adjusted`,
              };
        const allowed = Math.max(0, maxAllowed - currentQty);
        if (allowed <= 0) return prev;
        if (existing) {
          return prev.map((l) =>
            l.key === key ? { ...l, quantity: l.quantity + allowed } : l
          );
        }
        return [...prev, { ...input, key, quantity: allowed }];
      }
      if (existing) {
        return prev.map((l) =>
          l.key === key ? { ...l, quantity: l.quantity + qty } : l
        );
      }
      return [...prev, { ...input, key, quantity: qty }];
    });
    setLastAddedAt(Date.now());
    return result;
  }, []);

  const updateQty = useCallback((key: string, qty: number) => {
    setLines((prev) =>
      prev
        .map((l) => {
          if (l.key !== key) return l;
          const max = l.variant ? l.variant.stock : 99;
          const next = Math.max(0, Math.min(qty, Math.max(max, 0), 99));
          return { ...l, quantity: next };
        })
        .filter((l) => l.quantity > 0)
    );
  }, []);

  const removeLine = useCallback((key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: cartCount(lines),
      subtotal: cartSubtotal(lines),
      drawerOpen,
      setDrawerOpen,
      addLine,
      updateQty,
      removeLine,
      clear,
      lastAddedAt,
    }),
    [lines, drawerOpen, addLine, updateQty, removeLine, clear, lastAddedAt]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
