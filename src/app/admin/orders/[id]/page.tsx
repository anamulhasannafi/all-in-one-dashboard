"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Phone, MapPin, User, Package, CreditCard, Calendar, Mail } from "lucide-react";

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<any | null>(null);
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
        setOrder((prev: any) => (prev ? { ...prev, status: newStatus } : null));
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

  // Fallback variables for all field variations
  const orderNum = order.orderNumber || order.order_number || order.id?.slice(0, 8);
  const customerName = order.customerName || order.customer_name || order.name || "Customer";
  const phone = order.phone || order.customerPhone || order.customer_phone || "N/A";
  const email = order.email || order.customerEmail || order.customer_email || "Not Provided";
  const address = order.address || order.fullAddress || order.shippingAddress || order.shipping_address || "No address provided";
  const city = order.city || order.district || "";
  const area = order.area || order.upazila || "";
  const note = order.note || order.orderNote || order.customer_note || "";
  
  const totalAmount = order.totalAmount ?? order.total_amount ?? order.total ?? order.amount ?? 0;
  const shippingFee = order.shippingFee ?? order.shipping_fee ?? order.deliveryFee ?? order.delivery_charge ?? 0;
  const paymentMethod = order.paymentMethod || order.payment_method || "COD";
  const paymentStatus = order.paymentStatus || order.payment_status || "Pending";
  const createdAt = order.createdAt || order.created_at;

  const items = order.items || order.orderItems || order.order_items || [];

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
            Order #{orderNum}
          </h1>
          {createdAt && (
            <p className="text-xs text-ink-500 flex items-center gap-1 mt-1">
              <Calendar size={13} /> {new Date(createdAt).toLocaleString()}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-ink-500">Status:</span>
          <select
            value={order.status || "pending"}
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
            <p className="text-sm font-semibold text-rosewood-900">{customerName}</p>
            <p className="text-xs text-ink-600 flex items-center gap-1.5 mt-2">
              <Phone size={13} /> {phone}
            </p>
            <p className="text-xs text-ink-600 flex items-center gap-1.5 mt-1">
              <Mail size={13} /> {email}
            </p>
          </div>

          <div className="bg-white p-5 rounded-3xl ring-1 ring-rosewood-100 shadow-sm">
            <h2 className="text-sm font-bold text-rosewood-950 mb-3 flex items-center gap-2">
              <MapPin size={16} /> Delivery Location
            </h2>
            <p className="text-xs text-ink-700 leading-relaxed font-medium">
              {address}
            </p>
            {(city || area) && (
              <p className="text-xs font-bold text-rosewood-800 mt-2">
                {[area, city].filter(Boolean).join(", ")}
              </p>
            )}
            {note && (
              <div className="mt-3 p-2.5 bg-amber-50 rounded-xl ring-1 ring-amber-200 text-[11px] text-amber-900">
                <span className="font-bold">Note:</span> {note}
              </div>
            )}
          </div>

          <div className="bg-white p-5 rounded-3xl ring-1 ring-rosewood-100 shadow-sm">
            <h2 className="text-sm font-bold text-rosewood-950 mb-2 flex items-center gap-2">
              <CreditCard size={16} /> Payment Info
            </h2>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-ink-500">Method:</span>
              <span className="font-bold uppercase text-rosewood-900">{paymentMethod}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-ink-500">Payment Status:</span>
              <span className="font-bold uppercase text-emerald-700">{paymentStatus}</span>
            </div>
          </div>
        </div>

        {/* Product Items & Calculations */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-3xl ring-1 ring-rosewood-100 shadow-sm">
            <h2 className="text-sm font-bold text-rosewood-950 mb-4 flex items-center gap-2">
              <Package size={16} /> Ordered Items ({items.length})
            </h2>

            <div className="divide-y divide-rosewood-50">
              {items && items.length > 0 ? (
                items.map((item: any, idx: number) => {
                  const pName = item.productName || item.product_name || item.name || item.title || "Product";
                  const pPrice = item.price ?? item.unitPrice ?? item.unit_price ?? 0;
                  const pQty = item.quantity ?? item.qty ?? 1;
                  const pImg = item.imageUrl || item.image_url || item.image || item.thumbnail;
                  const pVariant = item.variantInfo || item.variant || item.color || item.size;

                  return (
                    <div key={item.id || idx} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {pImg ? (
                          <img src={pImg} alt="" className="w-12 h-12 object-cover rounded-xl bg-cream-50" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-cream-100 text-rosewood-900 flex items-center justify-center text-xs">🛍️</div>
                        )}
                        <div>
                          <p className="text-xs font-bold text-rosewood-950">{pName}</p>
                          {pVariant && (
                            <p className="text-[11px] text-ink-400">{typeof pVariant === 'string' ? pVariant : JSON.stringify(pVariant)}</p>
                          )}
                          <p className="text-xs text-ink-500 mt-0.5">
                            ৳{pPrice} × {pQty}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-rosewood-950">
                        ৳{pPrice * pQty}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-ink-400 py-4">No item details found</p>
              )}
            </div>

            <div className="border-t border-rosewood-100 mt-4 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-ink-600">
                <span>Shipping Fee</span>
                <span>৳{shippingFee}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-rosewood-950 pt-2 border-t border-rosewood-50">
                <span>Total Amount</span>
                <span>৳{totalAmount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}