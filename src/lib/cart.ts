export type CartVariant = {
  variantId: string | null;
  size: string | null;
  color: string | null;
  colorHex?: string | null;
  price: number;
  stock: number;
  sku?: string | null;
  imageUrl?: string | null;
};

export type CartLine = {
  key: string;
  productId: string;
  productSlug: string;
  productName: string;
  imageUrl: string | null;
  basePrice: number;
  variant: CartVariant | null;
  quantity: number;
};

export function lineUnitPrice(line: CartLine): number {
  if (line.variant?.price) return line.variant.price;
  return line.basePrice;
}

export function lineTotal(line: CartLine): number {
  return lineUnitPrice(line) * line.quantity;
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((s, l) => s + lineTotal(l), 0);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((s, l) => s + l.quantity, 0);
}

export function makeLineKey(productId: string, variantId: string | null) {
  return `${productId}__${variantId ?? "base"}`;
}

export function bdPhoneError(phone: string): string | null {
  const cleaned = phone.trim().replace(/[\s-]/g, "");
  if (!cleaned) return "Phone number is required";
  if (!/^(?:\+?880|0)1[3-9]\d{8}$/.test(cleaned))
    return "Enter a valid Bangladeshi mobile number (e.g. 017XXXXXXXX)";
  return null;
}
