"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Loader2, Plus, Trash2, Upload } from "@/components/icons";

type Cat = { id: string; name: string };
type V = { size: string; color: string; colorHex: string; price: string; stock: string };

export default function NewProductPage() {
  const router = useRouter();
  const [cats, setCats] = useState<Cat[]>([]);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [comparePrice, setComparePrice] = useState("");
  const [fabric, setFabric] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [images, setImages] = useState<string[]>([]); // একাধিক ছবির জন্য স্টেট
  const [uploading, setUploading] = useState(false);
  const [uploadingExtra, setUploadingExtra] = useState(false);
  
  const [variants, setVariants] = useState<V[]>([
    { size: "S", color: "Ivory", colorHex: "#F5EFE2", price: "", stock: "20" },
    { size: "M", color: "Ivory", colorHex: "#F5EFE2", price: "", stock: "20" },
    { size: "L", color: "Ivory", colorHex: "#F5EFE2", price: "", stock: "15" },
  ]);
  const [featured, setFeatured] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [bestseller, setBestseller] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/misc?resource=categories")
      .then((r) => r.json())
      .then((d) => setCats(d.items || []))
      .catch(() => {});
  }, []);

  const upload = async (f: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("kind", "image");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await res.json();
      if (d.ok) setImageUrl(d.url);
      else setError(d.error || "Upload failed");
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const uploadExtra = async (f: File) => {
    setUploadingExtra(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("kind", "image");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await res.json();
      if (d.ok && d.url) {
        setImages((prev) => [...prev, d.url]);
      } else {
        setError(d.error || "Upload failed");
      }
    } catch {
      setError("Upload failed");
    } finally {
      setUploadingExtra(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <Link href="/admin/products" className="inline-flex items-center gap-1 text-sm text-ink-500 min-h-11">
        <ChevronLeft size={16} aria-hidden /> Products
      </Link>
      <h1 className="font-display text-3xl text-rosewood-950">Add Product</h1>
      
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setBusy(true);
          setError(null);
          try {
            const res = await fetch("/api/admin/products", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name,
                categoryId: categoryId || null,
                basePrice: Number(basePrice),
                comparePrice: comparePrice ? Number(comparePrice) : null,
                fabric: fabric || null,
                description: description || null,
                imageUrl: imageUrl || null,
                images: images.filter(Boolean), // অতিরিক্ত ছবিগুলোর অ্যারে পাঠানো হচ্ছে
                featured,
                isNew,
                bestseller,
                variants: variants.map((v) => ({
                  size: v.size,
                  color: v.color,
                  colorHex: v.colorHex || null,
                  price: v.price ? Number(v.price) : null,
                  stock: Number(v.stock) || 0,
                })),
              }),
            });
            const d = await res.json();
            if (!res.ok) setError(d.error || "Could not create product");
            else router.push("/admin/products");
          } catch {
            setError("Network error");
          } finally {
            setBusy(false);
          }
        }}
        className="mt-4 space-y-4 rounded-[20px] bg-white p-5 ring-1 ring-rosewood-100/70"
      >
        <div className="grid sm:grid-cols-2 gap-3.5">
          <label className="sm:col-span-2 text-sm font-semibold">Product name *</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Noor Embroidered Three-Piece" className="input-elegant sm:col-span-2" />

          <label className="text-sm font-semibold">Category</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input-elegant mt-1.5 min-h-12">
            <option value="">— Select —</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <label className="text-sm font-semibold">Fabric</label>
          <input value={fabric} onChange={(e) => setFabric(e.target.value)} placeholder="e.g. Swiss cotton" className="input-elegant mt-1.5 min-h-12" />

          <label className="text-sm font-semibold">Price (৳) *</label>
          <input required inputMode="numeric" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="1980" className="input-elegant mt-1.5 min-h-12" />

          <label className="text-sm font-semibold">Compare price (৳, optional)</label>
          <input inputMode="numeric" value={comparePrice} onChange={(e) => setComparePrice(e.target.value)} placeholder="2450" className="input-elegant mt-1.5 min-h-12" />

          <label className="sm:col-span-2 text-sm font-semibold">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input-elegant mt-1.5 sm:col-span-2" />

          {/* Main Image Section */}
          <div className="sm:col-span-2">
            <span className="text-sm font-semibold">Main image</span>
            <div className="mt-1.5 flex gap-2">
              <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Paste URL or upload" className="input-elegant min-h-11 flex-1 text-sm" />
              <label className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-2xl bg-ink-900 px-4 text-xs font-bold text-white">
                {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} Upload
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
              </label>
            </div>
            {imageUrl && (
              <div className="mt-2 relative w-20 h-20 rounded-xl overflow-hidden border">
                <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Additional Images Section (Multi-image) */}
          <div className="sm:col-span-2">
            <span className="text-sm font-semibold">Additional Images (Gallery)</span>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {images.map((img, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-rose-200">
                  <img src={img} alt={`gallery ${idx}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full text-xs"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <label className="inline-flex min-h-[80px] w-20 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-rose-300 bg-rose-50/50 hover:bg-rose-50 text-rose-800">
                {uploadingExtra ? <Loader2 size={16} className="animate-spin" /> : <Plus size={18} />}
                <span className="text-[10px] mt-1">Add Image</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadExtra(f); e.target.value = ""; }} />
              </label>
            </div>
          </div>
        </div>

        {/* Variants Section */}
        <div>
          <p className="text-sm font-semibold">Variants (size × colour + stock)</p>
          <div className="mt-2 space-y-2">
            {variants.map((v, x) => (
              <div key={x} className="grid grid-cols-2 sm:grid-cols-6 gap-2 rounded-2xl bg-cream-50 p-2.5">
                <input value={v.size} onChange={(e) => setVariants(variants.map((item, i) => i === x ? { ...item, size: e.target.value } : item))} placeholder="Size" className="input-elegant min-h-11 text-sm" />
                <input value={v.color} onChange={(e) => setVariants(variants.map((item, i) => i === x ? { ...item, color: e.target.value } : item))} placeholder="Colour" className="input-elegant min-h-11 text-sm" />
                <input value={v.colorHex} onChange={(e) => setVariants(variants.map((item, i) => i === x ? { ...item, colorHex: e.target.value } : item))} placeholder="Hex" className="input-elegant min-h-11 text-sm" />
                <input value={v.price} onChange={(e) => setVariants(variants.map((item, i) => i === x ? { ...item, price: e.target.value } : item))} placeholder="Price (opt)" className="input-elegant min-h-11 text-sm" />
                <input value={v.stock} onChange={(e) => setVariants(variants.map((item, i) => i === x ? { ...item, stock: e.target.value } : item))} placeholder="Stock" className="input-elegant min-h-11 text-sm" />
                <button type="button" onClick={() => setVariants(variants.filter((_, i) => i !== x))} className="grid min-h-11 place-items-center rounded text-red-600 hover:bg-red-50">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setVariants([...variants, { size: "XL", color: "Ivory", colorHex: "#F5EFE2", price: "", stock: "10" }])} className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-rosewood-200 px-4 text-sm font-medium text-rosewood-900">
            <Plus size={16} /> Add variant
          </button>
        </div>

        <div className="flex flex-wrap gap-4 text-sm font-medium">
          {[["Featured", featured, setFeatured], ["New arrival", isNew, setIsNew], ["Bestseller", bestseller, setBestseller]].map(([label, val, fn]: any) => (
            <label key={label} className="flex items-center gap-2 min-h-11 cursor-pointer">
              <input type="checkbox" checked={val} onChange={(e) => fn(e.target.checked)} className="h-5 w-5 accent-rose-800" /> {label}
            </label>
          ))}
        </div>

        {error && <p role="alert" className="text-sm text-red-700 bg-red-50 rounded-xl px-3.5 py-2.5">{error}</p>}
        <button disabled={busy} className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-full bg-rosewood-800 font-bold text-white disabled:opacity-60">
          {busy && <Loader2 size={18} className="animate-spin" />} {busy ? "Creating..." : "Create Product"}
        </button>
      </form>
    </div>
  );
}