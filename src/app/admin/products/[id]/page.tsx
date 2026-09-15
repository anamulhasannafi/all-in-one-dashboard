"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, Plus } from "@/components/icons";

type Variant = {
  id?: string;
  size: string;
  color: string;
  colorHex?: string | null;
  sku?: string | null;
  price?: number | null;
  stock: number;
  imageUrl?: string | null;
};

type ProdImage = {
  id?: string;
  imageUrl: string;
  sortOrder?: number;
};

export default function AdminEditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [basePrice, setBasePrice] = useState("");
  const [comparePrice, setComparePrice] = useState("");
  const [fabric, setFabric] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [images, setImages] = useState<ProdImage[]>([]);
  const [active, setActive] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [bestseller, setBestseller] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [categoriesList, setCategoriesList] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    async function init() {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch(`/api/admin/products/${id}`),
          fetch("/api/admin/categories")
        ]);
        
        const prodData = await prodRes.json();
        const catData = await catRes.json();

        if (catData.items) {
          setCategoriesList(catData.items);
        } else if (Array.isArray(catData)) {
          setCategoriesList(catData);
        } else if (catData.categories) {
          setCategoriesList(catData.categories);
        }

        // Support both prodData.product and direct prodData object
        const p = prodData.product || prodData;
        if (p) {
          setName(p.name || "");
          setSlug(p.slug || "");
          setDescription(p.description || "");
          setCategoryId(p.categoryId || p.category_id || null);

          const bp = p.basePrice ?? p.base_price;
          setBasePrice(bp !== undefined && bp !== null ? String(bp) : "");

          const cp = p.comparePrice ?? p.compare_price;
          setComparePrice(cp !== undefined && cp !== null ? String(cp) : "");

          setFabric(p.fabric || "");
          setImageUrl(p.imageUrl || p.image_url || "");
          setActive(p.active ?? true);
          setFeatured(p.featured ?? false);
          setIsNew(p.isNew ?? p.is_new ?? false);
          setBestseller(p.bestseller ?? false);

          setVariants(prodData.variants || p.variants || []);
          setImages(prodData.images || p.images || []);
        }
      } catch (e) {
        console.error("Failed to load product", e);
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      init();
    }
  }, [id]);

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMain(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        setImageUrl(data.url);
      } else {
        alert(data.error || "Image upload failed");
      }
    } catch {
      alert("Image upload error");
    } finally {
      setUploadingMain(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingGallery(true);
    try {
      const newImages = [...images];
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("file", files[i]);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.url) {
          newImages.push({ imageUrl: data.url, sortOrder: newImages.length });
        }
      }
      setImages(newImages);
    } catch {
      alert("Gallery image upload error");
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const finalSlug = slug || name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    try {
      const payload = {
        name,
        slug: finalSlug,
        description,
        categoryId: categoryId || null,
        category_id: categoryId || null,
        basePrice: Number(basePrice) || 0,
        base_price: Number(basePrice) || 0,
        comparePrice: comparePrice ? Number(comparePrice) : null,
        compare_price: comparePrice ? Number(comparePrice) : null,
        fabric,
        imageUrl,
        image_url: imageUrl,
        active,
        featured,
        isNew,
        bestseller,
        variants,
        images,
      };

      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok || data.ok) {
        alert("Product updated successfully!");
        router.push("/admin/products");
      } else {
        alert(data.error || "Failed to update product");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="grid place-items-center py-24"><Loader2 className="animate-spin text-ink-500" size={32} /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto pb-16">
      <h1 className="font-display text-3xl sm:text-4xl text-rosewood-950 mb-6">Edit Product</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 ring-1 ring-rosewood-100/70 space-y-6">
        <div>
          <label className="block text-sm font-bold text-ink-800 mb-2">Product Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-xl bg-cream-50 px-4 py-3 text-sm ring-1 ring-rosewood-100 outline-none focus:ring-2 focus:ring-rosewood-800"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-ink-800 mb-2">Category</label>
            <select
              value={categoryId || ""}
              onChange={(e) => setCategoryId(e.target.value || null)}
              className="w-full rounded-xl bg-cream-50 px-4 py-3 text-sm ring-1 ring-rosewood-100 outline-none focus:ring-2 focus:ring-rosewood-800"
            >
              <option value="">Select Category</option>
              {categoriesList.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-ink-800 mb-2">Fabric / Material</label>
            <input
              type="text"
              value={fabric}
              onChange={(e) => setFabric(e.target.value)}
              className="w-full rounded-xl bg-cream-50 px-4 py-3 text-sm ring-1 ring-rosewood-100 outline-none focus:ring-2 focus:ring-rosewood-800"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-ink-800 mb-2">Base Price (৳)</label>
            <input
              type="number"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              required
              className="w-full rounded-xl bg-cream-50 px-4 py-3 text-sm ring-1 ring-rosewood-100 outline-none focus:ring-2 focus:ring-rosewood-800"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-ink-800 mb-2">Compare Price (৳)</label>
            <input
              type="number"
              value={comparePrice}
              onChange={(e) => setComparePrice(e.target.value)}
              className="w-full rounded-xl bg-cream-50 px-4 py-3 text-sm ring-1 ring-rosewood-100 outline-none focus:ring-2 focus:ring-rosewood-800"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-ink-800 mb-2">Main Product Image</label>
          {imageUrl && (
            <div className="mb-3">
              <img src={imageUrl} alt="Preview" className="h-20 w-20 rounded-xl object-cover ring-1 ring-rosewood-100 bg-cream-100 shrink-0" />
            </div>
          )}
          <div className="flex items-center gap-3">
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rosewood-800 text-white text-xs font-bold hover:bg-rosewood-900 transition">
              {uploadingMain ? <Loader2 size={15} className="animate-spin" /> : null}
              Upload New Image
              <input type="file" accept="image/*" onChange={handleMainImageUpload} className="hidden" />
            </label>
            <span className="text-xs text-ink-500">Select file to replace main image</span>
          </div>
        </div>

        <div className="border-t border-rosewood-100 pt-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-base text-rosewood-950">Additional Images (Gallery)</h3>
              <p className="text-xs text-ink-500">Upload multiple photos for product showcase</p>
            </div>
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cream-50 text-rosewood-900 text-xs font-bold hover:bg-rosewood-200 transition">
              {uploadingGallery ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              Add More Images
              <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" />
            </label>
          </div>

          {images.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative group rounded-xl overflow-hidden ring-1 ring-rosewood-100 bg-cream-50 h-28">
                  <img src={img.imageUrl} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, i) => i !== idx))}
                    className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg opacity-80 group-hover:opacity-100 transition shadow"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-ink-400 italic py-2">No additional images added yet.</div>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-ink-800 mb-2">Description</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl bg-cream-50 px-4 py-3 text-sm ring-1 ring-rosewood-100 outline-none focus:ring-2 focus:ring-rosewood-800"
          />
        </div>

        <div className="flex flex-wrap gap-6 pt-2">
          <label className="flex items-center gap-2 cursor-pointer font-medium text-sm">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="rounded text-rosewood-800 focus:ring-rosewood-800 h-4 w-4" /> Active
          </label>
          <label className="flex items-center gap-2 cursor-pointer font-medium text-sm">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="rounded text-rosewood-800 focus:ring-rosewood-800 h-4 w-4" /> Featured
          </label>
          <label className="flex items-center gap-2 cursor-pointer font-medium text-sm">
            <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} className="rounded text-rosewood-800 focus:ring-rosewood-800 h-4 w-4" /> New Arrival
          </label>
          <label className="flex items-center gap-2 cursor-pointer font-medium text-sm">
            <input type="checkbox" checked={bestseller} onChange={(e) => setBestseller(e.target.checked)} className="rounded text-rosewood-800 focus:ring-rosewood-800 h-4 w-4" /> Bestseller
          </label>
        </div>

        <div className="border-t border-rosewood-100 pt-6">
          <h3 className="font-bold text-base text-rosewood-950 mb-4">Variants & Stock</h3>
          <div className="space-y-3">
            {variants.map((v, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-cream-50 p-3 rounded-2xl ring-1 ring-rosewood-100">
                <input
                  type="text"
                  placeholder="Size (e.g. S, M)"
                  value={v.size}
                  onChange={(e) => {
                    const updated = [...variants];
                    updated[idx].size = e.target.value;
                    setVariants(updated);
                  }}
                  className="w-24 rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-rosewood-100 outline-none"
                />
                <input
                  type="text"
                  placeholder="Color"
                  value={v.color}
                  onChange={(e) => {
                    const updated = [...variants];
                    updated[idx].color = e.target.value;
                    setVariants(updated);
                  }}
                  className="flex-1 rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-rosewood-100 outline-none"
                />
                <input
                  type="number"
                  placeholder="Stock"
                  value={v.stock}
                  onChange={(e) => {
                    const updated = [...variants];
                    updated[idx].stock = Number(e.target.value);
                    setVariants(updated);
                  }}
                  className="w-24 rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-rosewood-100 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setVariants(variants.filter((_, i) => i !== idx))}
                  className="p-2 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition text-xs"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setVariants([...variants, { size: "Free", color: "Default", stock: 10 }])}
            className="mt-3 px-4 py-2 rounded-xl bg-rosewood-100 text-rosewood-900 text-xs font-bold hover:bg-rosewood-200 transition"
          >
            + Add Variant
          </button>
        </div>

        <div className="pt-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="px-6 py-3 rounded-full text-sm font-bold text-ink-600 hover:bg-cream-100 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-rosewood-800 text-white text-sm font-bold hover:bg-rosewood-900 transition"
          >
            {saving ? <Loader2 size={17} className="animate-spin" /> : null}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}