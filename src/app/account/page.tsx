import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { formatTaka, formatDate } from "@/lib/format";
import LogoutButton from "./logout-button";
import { Package, UserRound, ArrowRight } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let myOrders: typeof orders.$inferSelect[] = [];
  try {
    myOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, user.id))
      .orderBy(sql`${orders.createdAt} DESC`)
      .limit(20);
  } catch {}

  const isAdmin = user.role === "admin" || user.role === "staff";

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
      <div className="rounded-[24px] bg-white p-6 sm:p-8 ring-1 ring-rosewood-100/70">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-rosewood-800 text-cream-50">
              <UserRound size={24} strokeWidth={1.75} aria-hidden />
            </span>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl text-rosewood-950">{user.name}</h1>
              <p className="text-sm text-ink-500">{user.email}{user.phone ? ` · ${user.phone}` : ""}</p>
            </div>
          </div>
          <LogoutButton />
        </div>
        {isAdmin && (
          <Link href="/admin" className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-full bg-ink-900 px-6 text-sm font-bold text-white">
            Open Admin Dashboard <ArrowRight size={16} aria-hidden />
          </Link>
        )}
      </div>

      <h2 className="mt-8 flex items-center gap-2 font-display text-2xl text-rosewood-950">
        <Package size={22} aria-hidden /> My Orders ({myOrders.length})
      </h2>
      {myOrders.length === 0 ? (
        <div className="mt-4 rounded-[20px] bg-white p-8 text-center ring-1 ring-rosewood-100/70">
          <p className="text-ink-500 text-sm">No orders yet with this account.</p>
          <Link href="/shop" className="mt-3 inline-flex min-h-12 items-center rounded-full bg-rosewood-800 px-6 text-sm font-semibold text-white">
            Start Shopping
          </Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {myOrders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/order-success?code=${encodeURIComponent(o.orderCode || "")}`}
                className="flex items-center gap-4 rounded-[18px] bg-white p-4 ring-1 ring-rosewood-100/70 hover:shadow-md transition"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rosewood-50 text-rosewood-700">
                  <Package size={21} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-mono font-bold text-[15px]">{o.orderCode}</span>
                  <span className="block text-xs text-ink-500">{formatDate(o.createdAt)} · <span className="capitalize">{o.status}</span></span>
                </span>
                <span className="font-bold tabular-nums shrink-0">{formatTaka(o.total)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
