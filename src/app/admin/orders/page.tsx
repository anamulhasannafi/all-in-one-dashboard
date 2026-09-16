"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Trash2, RefreshCw } from "lucide-react";

type Order = {
  id: string;
  orderNumber?: string;
  customerName?: string;
  phone?: string;
  totalAmount?: number;
  status?: string;
  paymentMethod?: string;
  createdAt?: string;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      
      // ব্যাকএন্ড থেকে Array বা Object যাই আসুক সব হ্যান্ডেল করবে
      const orderList = Array.isArray(data)
        ? data
        : data.orders || data.items || data.data || [];
        
      setOrders(orderList);
    } catch (e) {
      console.error("Failed to load orders", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this order?")) return;

    try {
      const res = await fetch(`/api/admin/orders/${id}`, { method: "DELETE" });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== id));
      } else {
        alert("Failed to delete order");
      }
    } catch {
      alert("Error deleting order");
    }
  };

  const filteredOrders = orders.filter(
    (o) =>
      o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      o.phone?.includes(search)
  );

  return (
    <div className="max-w-4xl mx-auto pb-16 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-rosewood-950">
            Orders ({orders.length})
          </h1>
          <p className="text-xs text-ink-500">
            New orders appear here instantly after checkout
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white ring-1 ring-rosewood-100 text-xs font-bold text-rosewood-900 hover:bg-cream-50 transition"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search code, phone, name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl bg-white px-4 py-3 text-sm ring-1 ring-rosewood-100 outline-none focus:ring-2 focus:ring-rosewood-800"
        />
      </div>

      {loading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="animate-spin text-rosewood-800" size={30} />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl ring-1 ring-rosewood-100/70 text-ink-500 text-sm">
          No orders found
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <Link
              key={order.id}
              href={`/admin/orders/${order.id}`}
              className="flex items-center justify-between p-4 bg-white rounded-2xl ring-1 ring-rosewood-100/80 hover:ring-rosewood-300 hover:shadow-sm transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cream-100 text-rosewood-900 flex items-center justify-center shrink-0">
                  📦
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-rosewood-950">
                      {order.orderNumber || order.id.slice(0, 8)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                      {order.status || "pending"}
                    </span>
                  </div>
                  <p className="text-xs text-ink-500 mt-0.5">
                    {order.customerName || "Customer"} ({order.phone || "N/A"})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="font-bold text-sm text-rosewood-950 block">
                    ৳{order.totalAmount ?? 0}
                  </span>
                  <span className="text-[10px] text-ink-400 font-bold uppercase">
                    {order.paymentMethod || "COD"}
                  </span>
                </div>

                <button
                  onClick={(e) => handleDelete(e, order.id)}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition"
                  title="Delete Order"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}