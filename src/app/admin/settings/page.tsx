"use client";

import { useEffect, useState } from "react";
import { Loader2, Check } from "@/components/icons";

export default function SettingsPage() {
  const [form, setForm] = useState({ announcementText: "", announcementEnabled: true, freeShippingThreshold: "", supportPhone: "", supportEmail: "", facebook: "", instagram: "", tiktok: "", youtube: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [cats, setCats] = useState<{ id: string; name: string; imageUrl: string | null; active: boolean }[]>([]);
  const [newCat, setNewCat] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/misc?resource=site").then((r) => r.json()),
      fetch("/api/admin/misc?resource=categories").then((r) => r.json()),
    ]).then(([s, c]) => {
      if (s.site) {
        setForm({
          announcementText: s.site.announcementText || "",
          announcementEnabled: s.site.announcementEnabled ?? true,
          freeShippingThreshold: s.site.freeShippingThreshold != null ? String(s.site.freeShippingThreshold) : "",
          supportPhone: s.site.supportPhone || "",
          supportEmail: s.site.supportEmail || "",
          facebook: s.site.facebook || "",
          instagram: s.site.instagram || "",
          tiktok: s.site.tiktok || "",
          youtube: s.site.youtube || "",
        });
      }
      setCats(c.items || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="grid place-items-center py-20"><Loader2 className="animate-spin" size={26} aria-hidden /></div>;

  const set = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="font-display text-3xl sm:text-4xl text-rosewood-950">Website Settings</h1>

      <form
        className="rounded-[20px] bg-white p-5 ring-1 ring-rosewood-100/70 space-y-3.5"
        onSubmit={async (e) => {
          e.preventDefault();
          if (saving) return;
          setSaving(true);
          setMsg(null);
          try {
            const res = await fetch("/api/admin/misc?resource=site", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...form,
                freeShippingThreshold: form.freeShippingThreshold === "" ? null : Number(form.freeShippingThreshold),
              }),
            });
            const d = await res.json();
            setMsg(d.ok ? "Settings saved — storefront updated." : d.error || "Failed");
          } catch {
            setMsg("Network error");
          } finally {
            setSaving(false);
          }
        }}
      >
        <label className="flex items-center gap-2.5 text-sm font-semibold min-h-11 cursor-pointer">
          <input type="checkbox" checked={form.announcementEnabled} onChange={(e) => set("announcementEnabled", e.target.checked)} className="h-5 w-5 accent-rose-800" />
          Show announcement bar
        </label>
        <label className="block text-sm font-semibold">Announcement text
          <input value={form.announcementText} onChange={(e) => set("announcementText", e.target.value)} maxLength={200} placeholder="Eid Sale — up to 40% OFF…" className="input-elegant mt-1.5 min-h-12 text-sm" />
        </label>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block text-sm font-semibold">Free-shipping bar threshold (৳)
            <input inputMode="numeric" value={form.freeShippingThreshold} onChange={(e) => set("freeShippingThreshold", e.target.value)} placeholder="2500" className="input-elegant mt-1.5 min-h-12" />
          </label>
          <label className="block text-sm font-semibold">Support phone
            <input value={form.supportPhone} onChange={(e) => set("supportPhone", e.target.value)} placeholder="09638-010101" className="input-elegant mt-1.5 min-h-12" />
          </label>
          <label className="block text-sm font-semibold">Support email
            <input value={form.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} placeholder="hello@sushre.com" className="input-elegant mt-1.5 min-h-12" />
          </label>
          <label className="block text-sm font-semibold">Facebook URL
            <input value={form.facebook} onChange={(e) => set("facebook", e.target.value)} className="input-elegant mt-1.5 min-h-12 text-sm" />
          </label>
        </div>
        {msg && <p role="status" className="text-sm font-medium text-center">{msg}</p>}
        <button disabled={saving} className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-rosewood-800 font-bold text-white disabled:opacity-50">
          {saving ? <Loader2 size={17} className="animate-spin" aria-hidden /> : <Check size={17} strokeWidth={2.5} aria-hidden />} Save Settings
        </button>
      </form>

      <div className="rounded-[20px] bg-white p-5 ring-1 ring-rosewood-100/70">
        <h2 className="font-display text-xl">Categories</h2>
        <form
          className="mt-3 flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!newCat.trim()) return;
            await fetch("/api/admin/misc?resource=categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newCat.trim() }) });
            setNewCat("");
            const d = await fetch("/api/admin/misc?resource=categories").then((r) => r.json());
            setCats(d.items || []);
          }}
        >
          <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="New category name…" aria-label="New category" className="input-elegant min-h-12 flex-1" />
          <button className="shrink-0 rounded-2xl bg-ink-900 px-5 text-sm font-bold text-white min-h-12">Add</button>
        </form>
        <ul className="mt-3 space-y-2">
          {cats.map((c) => (
            <li key={c.id} className="flex items-center gap-2 rounded-xl bg-cream-50 px-3.5 py-2.5 text-sm font-medium">
              <span className="flex-1">{c.name}</span>
              <button
                onClick={async () => {
                  await fetch("/api/admin/misc?resource=categories", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: c.id, name: c.name, active: !c.active }) });
                  setCats((arr) => arr.map((x) => x.id === c.id ? { ...x, active: !x.active } : x));
                }}
                className="text-xs font-bold underline underline-offset-2 min-h-9 px-2"
              >
                {c.active ? "Hide" : "Show"}
              </button>
              <button
                onClick={async () => {
                  if (!confirm(`Delete ${c.name}? Products stay but lose category.`)) return;
                  await fetch("/api/admin/misc?resource=categories", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: c.id, delete: true }) });
                  setCats((arr) => arr.filter((x) => x.id !== c.id));
                }}
                className="text-xs font-bold text-red-600 min-h-9 px-2"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
