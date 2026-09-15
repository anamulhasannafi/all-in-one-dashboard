"use client";

import { useEffect, useState } from "react";
import HeroVideo, { type HeroData } from "@/components/HeroVideo";
import { Upload, Loader2, Check, AlertCircle, Video, ImageIcon, Trash2, Power } from "@/components/icons";

type Form = {
  heroType: "image" | "video";
  videoUrl: string;
  mobileVideoUrl: string;
  posterUrl: string;
  mobilePosterUrl: string;
  imageUrl: string;
  mobileImageUrl: string;
  badgeText: string;
  headline: string;
  subheadline: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
  overlayOpacity: number;
  animation: "fade" | "slide-up" | "zoom" | "cinematic" | "none";
  enabled: boolean;
};

const EMPTY: Form = {
  heroType: "video",
  videoUrl: "",
  mobileVideoUrl: "",
  posterUrl: "",
  mobilePosterUrl: "",
  imageUrl: "",
  mobileImageUrl: "",
  badgeText: "",
  headline: "",
  subheadline: "",
  primaryCtaText: "",
  primaryCtaLink: "/shop",
  secondaryCtaText: "",
  secondaryCtaLink: "/offers",
  overlayOpacity: 45,
  animation: "cinematic",
  enabled: true,
};

function UploadField({
  label,
  hint,
  accept,
  kind,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  accept: string;
  kind: "image" | "video";
  value: string;
  onChange: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="rounded-2xl border border-rosewood-100 bg-cream-50/60 p-3.5">
      <p className="text-sm font-bold">{label}</p>
      <p className="text-xs text-ink-500 mt-0.5">{hint}</p>
      <div className="mt-2.5 flex flex-col sm:flex-row gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste URL or upload…"
          aria-label={label}
          className="input-elegant min-h-12 text-sm flex-1"
        />
        <label className={`inline-flex min-h-12 cursor-pointer items-center justify-center gap-1.5 rounded-2xl bg-ink-900 px-4 text-sm font-bold text-white hover:opacity-90 ${busy ? "opacity-60 pointer-events-none" : ""}`}>
          {busy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Upload size={16} aria-hidden />}
          {busy ? "Uploading…" : "Upload"}
          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setBusy(true);
              setErr(null);
              try {
                const fd = new FormData();
                fd.append("file", f);
                fd.append("kind", kind);
                const res = await fetch("/api/upload", { method: "POST", body: fd });
                const d = await res.json();
                if (!res.ok) setErr(d.error || "Upload failed");
                else onChange(d.url);
              } catch {
                setErr("Upload failed. Try again.");
              } finally {
                setBusy(false);
                e.target.value = "";
              }
            }}
          />
        </label>
      </div>
      {err && <p role="alert" className="mt-1.5 text-xs text-red-600">{err}</p>}
      {value && kind === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt={`${label} preview`} className="mt-2.5 h-28 w-full rounded-xl object-cover" loading="lazy" />
      )}
      {value && kind === "video" && (
        <video src={value} poster={undefined} muted playsInline preload="metadata" className="mt-2.5 h-28 w-full rounded-xl bg-black object-cover" controls={false} />
      )}
      {value && (
        <button type="button" onClick={() => onChange("")} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-red-600 min-h-9">
          <Trash2 size={13} aria-hidden /> Remove
        </button>
      )}
    </div>
  );
}

export default function AdminHeroPage() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/hero")
      .then((r) => r.json())
      .then((d) => {
        const h = d.hero;
        if (h) {
          setForm({
            heroType: h.heroType || "video",
            videoUrl: h.videoUrl || "",
            mobileVideoUrl: h.mobileVideoUrl || "",
            posterUrl: h.posterUrl || "",
            mobilePosterUrl: h.mobilePosterUrl || "",
            imageUrl: h.imageUrl || "",
            mobileImageUrl: h.mobileImageUrl || "",
            badgeText: h.badgeText || "",
            headline: h.headline || "",
            subheadline: h.subheadline || "",
            primaryCtaText: h.primaryCtaText || "",
            primaryCtaLink: h.primaryCtaLink || "/shop",
            secondaryCtaText: h.secondaryCtaText || "",
            secondaryCtaLink: h.secondaryCtaLink || "/offers",
            overlayOpacity: h.overlayOpacity ?? 45,
            animation: h.animation || "cinematic",
            enabled: h.enabled ?? true,
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const preview: HeroData = {
    heroType: form.heroType,
    videoUrl: form.videoUrl || null,
    mobileVideoUrl: form.mobileVideoUrl || null,
    posterUrl: form.posterUrl || null,
    mobilePosterUrl: form.mobilePosterUrl || null,
    imageUrl: form.imageUrl || form.posterUrl || null,
    mobileImageUrl: form.mobileImageUrl || null,
    badgeText: form.badgeText || null,
    headline: form.headline || null,
    subheadline: form.subheadline || null,
    primaryCtaText: form.primaryCtaText || null,
    primaryCtaLink: form.primaryCtaLink || null,
    secondaryCtaText: form.secondaryCtaText || null,
    secondaryCtaLink: form.secondaryCtaLink || null,
    overlayOpacity: form.overlayOpacity,
    animation: form.animation,
    enabled: form.enabled,
  };

  if (loading) return <div className="grid place-items-center py-20 text-ink-500"><Loader2 className="animate-spin" size={26} aria-hidden /></div>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rosewood-600">Admin · Website · Homepage</p>
          <h1 className="font-display text-3xl sm:text-4xl text-rosewood-950">Hero Banner</h1>
        </div>
        <button
          type="button"
          onClick={() => set("enabled", !form.enabled)}
          aria-pressed={form.enabled}
          className={`inline-flex min-h-12 items-center gap-2 rounded-full px-5 text-sm font-bold transition ${form.enabled ? "bg-emerald-600 text-white" : "bg-stone-300 text-stone-700"}`}
        >
          <Power size={16} aria-hidden /> {form.enabled ? "ON — Live" : "OFF — Hidden"}
        </button>
      </div>

      {/* Live preview */}
      <div className="mt-4 overflow-hidden rounded-[22px] ring-1 ring-rosewood-200">
        <p className="bg-ink-900 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gold-300">Live preview — exactly as shoppers see it</p>
        <div className="[&_section]:!mt-0 scale-[1] origin-top">
          <HeroVideo hero={preview} />
        </div>
      </div>

      <form
        className="mt-4 grid gap-4 lg:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (saving) return;
          setSaving(true);
          setMsg(null);
          try {
            const res = await fetch("/api/admin/hero", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...form,
                videoUrl: form.videoUrl || null,
                mobileVideoUrl: form.mobileVideoUrl || null,
                posterUrl: form.posterUrl || null,
                mobilePosterUrl: form.mobilePosterUrl || null,
                imageUrl: form.imageUrl || null,
                mobileImageUrl: form.mobileImageUrl || null,
              }),
            });
            const d = await res.json();
            setMsg(d.ok ? { ok: true, text: "Hero banner saved & live." } : { ok: false, text: d.error || "Save failed" });
          } catch {
            setMsg({ ok: false, text: "Network error. Try again." });
          } finally {
            setSaving(false);
          }
        }}
      >
        <div className="rounded-[20px] bg-white p-5 ring-1 ring-rosewood-100/70 space-y-3.5">
          <h2 className="font-display text-xl">Hero Type & Media</h2>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Hero type">
            {(
              [
                { id: "video", label: "Video Hero", icon: Video },
                { id: "image", label: "Image Hero", icon: ImageIcon },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={form.heroType === t.id}
                onClick={() => set("heroType", t.id)}
                className={`flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border font-bold text-sm transition ${form.heroType === t.id ? "border-rosewood-700 bg-rosewood-800 text-white" : "border-rosewood-200"}`}
              >
                <t.icon size={17} aria-hidden /> {t.label}
              </button>
            ))}
          </div>
          {form.heroType === "video" ? (
            <>
              <UploadField label="Desktop video" hint="MP4/WebM, landscape 1920×1080, under 80MB. Muted autoplay + loop." accept="video/mp4,video/webm" kind="video" value={form.videoUrl} onChange={(v) => set("videoUrl", v)} />
              <UploadField label="Mobile video (optional)" hint="Vertical 1080×1920 performs best on phones. Falls back to desktop video." accept="video/mp4,video/webm" kind="video" value={form.mobileVideoUrl} onChange={(v) => set("mobileVideoUrl", v)} />
              <UploadField label="Poster / fallback image" hint="Shown while video loads + if video fails. 1920×1080 JPG/WebP." accept="image/*" kind="image" value={form.posterUrl} onChange={(v) => set("posterUrl", v)} />
              <UploadField label="Mobile poster (optional)" hint="Vertical fallback for small screens." accept="image/*" kind="image" value={form.mobilePosterUrl} onChange={(v) => set("mobilePosterUrl", v)} />
              <button
                type="button"
                onClick={async () => {
                  if (!confirm("Delete both hero videos? Poster image will be used instead.")) return;
                  await fetch("/api/admin/hero", { method: "DELETE" });
                  set("videoUrl", "");
                  set("mobileVideoUrl", "");
                  set("heroType", "image");
                }}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-red-200 px-4 text-sm font-semibold text-red-700"
              >
                <Trash2 size={15} aria-hidden /> Delete videos
              </button>
            </>
          ) : (
            <>
              <UploadField label="Desktop image" hint="Landscape 1920×1080, WebP/JPG." accept="image/*" kind="image" value={form.imageUrl} onChange={(v) => set("imageUrl", v)} />
              <UploadField label="Mobile image (optional)" hint="Vertical 1080×1350 for phones." accept="image/*" kind="image" value={form.mobileImageUrl} onChange={(v) => set("mobileImageUrl", v)} />
            </>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-[20px] bg-white p-5 ring-1 ring-rosewood-100/70 space-y-3.5">
            <h2 className="font-display text-xl">Headline & CTAs</h2>
            <div>
              <label className="text-sm font-semibold">Badge <span className="font-normal text-ink-500">(small pill above headline)</span></label>
              <input value={form.badgeText} onChange={(e) => set("badgeText", e.target.value)} maxLength={160} placeholder="New · Eid Festive Edit 2026" className="input-elegant mt-1.5 min-h-12 text-sm" />
            </div>
            <div>
              <label className="text-sm font-semibold">Headline</label>
              <textarea value={form.headline} onChange={(e) => set("headline", e.target.value)} maxLength={300} rows={2} placeholder="Elegance woven for every day" className="input-elegant mt-1.5 text-sm" />
            </div>
            <div>
              <label className="text-sm font-semibold">Subheadline</label>
              <textarea value={form.subheadline} onChange={(e) => set("subheadline", e.target.value)} maxLength={600} rows={2} className="input-elegant mt-1.5 text-sm" />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold">Primary CTA text</label>
                <input value={form.primaryCtaText} onChange={(e) => set("primaryCtaText", e.target.value)} maxLength={80} placeholder="Shop New Arrivals" className="input-elegant mt-1.5 min-h-12 text-sm" />
              </div>
              <div>
                <label className="text-sm font-semibold">Primary destination</label>
                <input value={form.primaryCtaLink} onChange={(e) => set("primaryCtaLink", e.target.value)} maxLength={300} placeholder="/shop" className="input-elegant mt-1.5 min-h-12 text-sm" />
              </div>
              <div>
                <label className="text-sm font-semibold">Secondary CTA text</label>
                <input value={form.secondaryCtaText} onChange={(e) => set("secondaryCtaText", e.target.value)} maxLength={80} placeholder="Explore Offers" className="input-elegant mt-1.5 min-h-12 text-sm" />
              </div>
              <div>
                <label className="text-sm font-semibold">Secondary destination</label>
                <input value={form.secondaryCtaLink} onChange={(e) => set("secondaryCtaLink", e.target.value)} maxLength={300} placeholder="/offers" className="input-elegant mt-1.5 min-h-12 text-sm" />
              </div>
            </div>
          </div>

          <div className="rounded-[20px] bg-white p-5 ring-1 ring-rosewood-100/70 space-y-4">
            <h2 className="font-display text-xl">Overlay & Animation</h2>
            <div>
              <label htmlFor="overlay" className="text-sm font-semibold">Overlay darkness: {form.overlayOpacity}%</label>
              <input id="overlay" type="range" min={0} max={90} step={1} value={form.overlayOpacity} onChange={(e) => set("overlayOpacity", Number(e.target.value))} className="mt-2 w-full accent-rose-800 min-h-11" />
            </div>
            <div>
              <label htmlFor="anim" className="text-sm font-semibold">Entrance animation</label>
              <select id="anim" value={form.animation} onChange={(e) => set("animation", e.target.value as Form["animation"])} className="input-elegant mt-1.5 min-h-12 text-sm">
                <option value="cinematic">Cinematic (slow zoom + staggered text)</option>
                <option value="fade">Fade</option>
                <option value="slide-up">Slide up</option>
                <option value="zoom">Zoom</option>
                <option value="none">None (instant)</option>
              </select>
            </div>
            {msg && (
              <p role="status" className={`flex items-center gap-1.5 rounded-2xl px-4 py-3 text-sm font-medium ${msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
                {msg.ok ? <Check size={16} strokeWidth={2.5} aria-hidden /> : <AlertCircle size={16} aria-hidden />} {msg.text}
              </p>
            )}
            <button disabled={saving} className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-full bg-rosewood-800 font-bold text-white disabled:opacity-60">
              {saving ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <Check size={18} strokeWidth={2.5} aria-hidden />}
              {saving ? "Publishing…" : "Publish Hero Banner"}
            </button>
            <p className="text-xs text-ink-500">No code needed — changes go live on the homepage immediately.</p>
          </div>
        </div>
      </form>
    </div>
  );
}
