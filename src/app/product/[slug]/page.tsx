import Link from "next/link";
import { db } from "@/db";
import { products } from "@/db/schema";
import { Plus, Edit, Trash2, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminProductsPage() {
  let allProducts: any[] = [];

  try {
    allProducts = await db.select().from(products);
  } catch (error) {
    console.error("Error fetching products on admin page:", error);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-gray-500">
            {allProducts.length} products · stock shown live
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      {allProducts.length === 0 ? (
        <div className="text-center py-20 bg-stone-50 rounded-lg border border-dashed border-stone-200">
          <p className="text-stone-500">No products found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border border-stone-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-stone-50 text-xs font-semibold text-stone-600 uppercase">
                <th className="p-4">Image</th>
                <th className="p-4">Name</th>
                <th className="p-4">Price</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {allProducts.map((p) => (
                <tr key={p.id} className="hover:bg-stone-50/50">
                  <td className="p-4">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-12 h-12 object-cover rounded border"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-stone-100 rounded border flex items-center justify-center text-xs text-stone-400">
                        No img
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-medium text-stone-900">{p.name}</td>
                  <td className="p-4 font-semibold text-stone-700">
                    ৳{p.basePrice}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                        p.active !== false
                          ? "bg-green-100 text-green-700"
                          : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {p.active !== false ? "Active" : "Draft"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}