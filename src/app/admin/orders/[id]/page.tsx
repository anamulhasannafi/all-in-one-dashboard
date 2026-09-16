"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Phone, MapPin, User, Package, CreditCard, Calendar } from "lucide-react";

type OrderItem = {
  id: string;
  productName?: string;
  name?: string;
  quantity: number;
  price: number;
  imageUrl?: string;
  variantInfo?: string;
};

type OrderDetail = {
  id: string;
  orderNumber?: string;
  customerName: string;
  phone: string;
  address: string;
  city?: string;
  area?: string;
  note?: string;
  totalAmount: number;
  shippingFee?: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  items?: OrderItem[];
};

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`);
      const data = await res.json();
      if (data.order) {
        setOrder(data.order);
      } else if (data.id) {
        setOrder(data);
      }
    } catch (e) {
      console.error("Failed to load order detail", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      } else {
        alert("Status update failed");
      }
    } catch {
      alert("Error updating status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <Loader2 className="animate-spin text-rosewood-800" size={32} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <p className="text-red-500 mb-4">Order details not found!</p>
        <Link href="/admin/orders" className="text-sm underline text-rosewood-900">
          Back to Orders List
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-16 px-4">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-2 text-xs font-semibold text-rosewood-900 mb-6 hover:underline"
      >
        <ArrowLeft size={16} /> Back to Orders List
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-rosewood-950">
            Order #{order.orderNumber || order.id.slice(0, 8)}
          </h1>
          <p className="text-xs text-ink-500 flex items-center gap-1 mt-1">
            <Calendar size={13} /> {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-ink-500">Status:</span>
          <select
            value={order.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={updating}
            className="px-3 py-1.5 rounded-xl bg-white ring-1 ring-rosewood-200 text-xs font-bold text-rosewood-950 outline-none focus:ring-2 focus:ring-rosewood-800"
          >
            <option value="pending">PENDING</option>
            <option value="processing">PROCESSING</option>
            <option value="shipped">SHIPPED</option>
            <option value="delivered">DELIVERED</option>
            <option value="cancelled">CANCELLED</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer & Address Details */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white p-5 rounded-3xl ring-1 ring-rosewood-100 shadow-sm">
            <h2 className="text-sm font-bold text-rosewood-950 mb-3 flex items-center gap-2">
              <User size={16} /> Customer Details
            </h2>
            <p className="text-sm font-semibold text-rosewood-900">{order.customerName}</p>
            <p className="text-xs text-ink-600 flex items-center gap-1.5 mt-2">
              <Phone size={13} /> {order.phone}
            </p>
          </div>

          <div className="bg-white p-5 rounded-3xl ring-1 ring-rosewood-100 shadow-sm">
            <h2 className="text-sm font-bold text-rosewood-950 mb-3 flex items-center gap-2">
              <MapPin size={16} /> Delivery Location
            </h2>
            <p className="text-xs text-ink-700 leading-relaxed font-medium">
              {order.address || "No address provided"}
            </p>
            {(order.city || order.area) && (
              <p className="text-xs font-bold text-rosewood-800 mt-2">
                {[order.area, order.city].filter(Boolean).join(", ")}
              </p>
            )}
            {order.note && (
              <div className="mt-3 p-2.5 bg-amber-50 rounded-xl ring-1 ring-amber-200 text-[11px] text-amber-900">
                <span className="font-bold">Note:</span> {order.note}
              </div>
            )}
          </div>

          <div className="bg-white p-5 rounded-3xl ring-1 ring-rosewood-100 shadow-sm">
            <h2 className="text-sm font-bold text-rosewood-950 mb-2 flex items-center gap-2">
              <CreditCard size={16} /> Payment Info
            </h2>
            <div className="flex justify-between items-center text-xs">
              <span className="text-ink-500">Method:</span>
              <span className="font-bold uppercase text-rosewood-900">{order.paymentMethod || "COD"}</span>
            </div>
          </div>
        </div>

        {/* Product Items */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-3xl ring-1 ring-rosewood-100 shadow-sm">
            <h2 className="text-sm font-bold text-rosewood-950 mb-4 flex items-center gap-2">
              <Package size={16} /> Ordered Items
            </h2>

            <div className="divide-y divide-rosewood-50">
              {order.items && order.items.length > 0 ? (
                order.items.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" className="w-12 h-12 object-cover rounded-xl bg-cream-50" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-cream-100 text-rosewood-900 flex items-center justify-center text-xs">🛍️</div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-rosewood-950">{item.productName || item.name || "Product"}</p>
                        {item.variantInfo && (
                          <p className="text-[11px] text-ink-400">{item.variantInfo}</p>
                        )}
                        <p className="text-xs text-ink-500 mt-0.5">
                          ৳{item.price} × {item.quantity}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-rosewood-950">
                      ৳{item.price * item.quantity}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-ink-400 py-4">No item details found</p>
              )}
            </div>

            <div className="border-t border-rosewood-100 mt-4 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-ink-600">
                <span>Shipping Fee</span>
                <span>৳{order.shippingFee ?? 0}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-rosewood-950 pt-2 border-t border-rosewood-50">
                <span>Total Amount</span>
                <span>৳{order.totalAmount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}