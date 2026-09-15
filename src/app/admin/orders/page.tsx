"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Package, Search } from "lucide-react";
import { Suspense } from "react";

function formatTaka(amount: number) {
  return `৳${amount.toLocaleString()}`;
}

function pill(status: string) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    confirmed: "bg-blue-100 text-blue-800",
    processing: "bg-violet-100 text-violet-800",
    shipped: "bg-sky-100 text-sky-800",
    delivered: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-red-100 text-red-700",
    returned: "bg-stone-200 text-stone-700",
  };
  return map[status] || "bg-cream-100 text-ink-700";
}

function OrdersInner() {
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/orders`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setItems(data);
      } else {
        console.error("API did not return an array:", data);
        setItems([]);
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDeleteOrder = async (e: React.MouseEvent, orderId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("আপনি কি নিশ্চিত যে এই অর্ডারটি পার্মানেন্টলি ডিলিট করতে চান?")) return;

    try {
      const res = await fetch(`/api/admin/orders?id=${orderId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== orderId));
      } else {
        alert("অর্ডার ডিলিট করতে সমস্যা হয়েছে!");
      }
    } catch (err) {
      console.error(err);
      alert("একটি সমস্যা দেখা দিয়েছে!");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl text-rosewood-950">Orders ({items.length})</h1>
          <p className="text-sm text-ink-500">New orders appear here instantly after checkout</p>
        </div>
        <button onClick={load} className="min-h-11 rounded-full border border-rosewood-200 px-5 text-sm font-semibold hover:bg-rosewood-50">
          Refresh
        </button>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
        <div className="flex items-center gap-2 rounded-2xl bg-white ring-1 ring-rosewood-100 px-3.5 py-2 flex-1">
          <Search size={17} className="text-ink-500 shrink-0" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search code, phone, name..." className="w-full bg-transparent text-sm outline-none" />
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-ink-500">Loading orders...</div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center text-ink-500 bg-white rounded-2xl mt-4 ring-1 ring-rosewood-100">
          No orders found.
        </div>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {items
            .filter((o) => {
              if (!q) return true;
              const query = q.toLowerCase();
              return (
                o.orderCode?.toLowerCase().includes(query) ||
                o.customerName?.toLowerCase().includes(query) ||
                o.customerPhone?.toLowerCase().includes(query)
              );
            })
            .map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-2 bg-white p-3.5 rounded-2xl ring-1 ring-rosewood-100">
                <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-3.5 min-w-0 flex-1">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cream-100 text-rosewood-900">
                    <Package size={20} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold">{o.orderCode}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${pill(o.status)}`}>
                        {o.status}
                      </span>
                    </span>
                    <span className="block truncate text-[13px] text-ink-500 mt-0.5">
                      {o.customerName || "Customer"} ({o.customerPhone || "N/A"})
                    </span>
                  </span>
                  <span className="text-right shrink-0">
                    <span className="block font-bold tabular-nums">{formatTaka(o.total || 0)}</span>
                    <span className="block text-[11px] uppercase text-ink-500">{o.paymentMethod}</span>
                  </span>
                </Link>

                <button
                  onClick={(e) => handleDeleteOrder(e, o.id)}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold px-3 py-2 rounded-xl text-xs transition"
                >
                  Delete
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center">Loading...</div>}>
      <OrdersInner />
    </Suspense>
  );
}