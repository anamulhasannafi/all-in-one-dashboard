export function formatTaka(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "৳0";
  return "৳" + Number(n).toLocaleString("en-IN");
}

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function discountPercent(base: number, compare?: number | null) {
  if (!compare || compare <= base) return 0;
  return Math.round(((compare - base) / compare) * 100);
}
