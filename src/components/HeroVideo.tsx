"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Play, Pause } from "./icons";

export type HeroData = {
  heroType: "image" | "video";
  videoUrl: string | null;
  mobileVideoUrl: string | null;
  posterUrl: string | null;
  mobilePosterUrl: string | null;
  imageUrl: string | null;
  mobileImageUrl: string | null;
  badgeText: string | null;
  headline: string | null;
  subheadline: string | null;
  primaryCtaText: string | null;
  primaryCtaLink: string | null;
  secondaryCtaText: string | null;
  secondaryCtaLink: string | null;
  overlayOpacity: number;
  animation: string;
  enabled: boolean;
};

export default function HeroVideo({ hero }: { hero: HeroData | null }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    setVideoFailed(false);
    setReady(false);
  }, [hero?.videoUrl, hero?.mobileVideoUrl, isMobile]);

  // Pause when off-screen (perf) + respect reduced motion
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      v.pause();
      setPaused(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!paused) v.play().catch(() => {});
        } else {
          v.pause();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, [paused, isMobile, hero?.videoUrl]);

  if (!hero || hero.enabled === false) return null;

  const showVideo =
    hero.heroType === "video" && !videoFailed && (hero.videoUrl || hero.mobileVideoUrl);
  const src = isMobile ? hero.mobileVideoUrl || hero.videoUrl : hero.videoUrl;
  const poster = isMobile
    ? hero.mobilePosterUrl || hero.posterUrl || hero.imageUrl
    : hero.posterUrl || hero.imageUrl;
  const fallbackImg = isMobile
    ? hero.mobileImageUrl || hero.imageUrl || hero.mobilePosterUrl || hero.posterUrl
    : hero.imageUrl || hero.posterUrl;
  const overlay = Math.min(90, Math.max(0, hero.overlayOpacity ?? 45));

  return (
    <section
      aria-label="Featured collection"
      className={`hero-anim-${hero.animation || "cinematic"} relative overflow-hidden bg-rosewood-950`}
    >
      {/* Fixed aspect container — prevents layout shift */}
      <div className="relative mx-auto max-w-[1600px]">
        <div className="relative h-[92svh] min-h-[560px] max-h-[880px] sm:h-[86vh] w-full overflow-hidden">
          {showVideo && src ? (
            <video
              ref={videoRef}
              key={src}
              className="hero-media absolute inset-0 h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster={poster ?? undefined}
              onCanPlay={() => setReady(true)}
              onError={() => setVideoFailed(true)}
              aria-hidden
              disablePictureInPicture
            >
              <source src={src} type={src.endsWith(".webm") ? "video/webm" : "video/mp4"} />
            </video>
          ) : fallbackImg || poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fallbackImg || poster || ""}
              alt=""
              aria-hidden
              className="hero-media absolute inset-0 h-full w-full object-cover"
              loading="eager"
              fetchPriority="high"
            />
          ) : (
            <div className="hero-media absolute inset-0 bg-gradient-to-br from-rosewood-800 via-rosewood-950 to-ink-900" />
          )}

          {/* Cinematic gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, rgba(20,8,15,${0.25 + overlay / 220}) 0%, rgba(20,8,15,${overlay / 130}) 45%, rgba(20,8,15,${Math.min(0.85, overlay / 100 + 0.25)}) 100%), linear-gradient(100deg, rgba(46,11,29,${Math.min(0.72, overlay / 100 + 0.15)}) 0%, transparent 62%)`,
            }}
            aria-hidden
          />
          {/* Soft gold glow */}
          <div
            className="absolute -left-24 top-1/3 h-96 w-96 rounded-full blur-[120px] opacity-30"
            style={{ background: "#c9a24b" }}
            aria-hidden
          />

          {/* Content */}
          <div className="absolute inset-0 flex items-end sm:items-center">
            <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 pb-16 sm:pb-0 pt-24">
              <div className="max-w-xl">
                {hero.badgeText ? (
                  <p className="hero-kicker inline-flex items-center gap-2.5 rounded-full border border-white/25 bg-white/10 backdrop-blur-md px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-cream-50">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold-400 animate-pulse" aria-hidden />
                    {hero.badgeText}
                  </p>
                ) : null}
                <h1 className="hero-title font-display mt-5 text-cream-50 text-[42px] leading-[1.02] sm:text-6xl lg:text-7xl font-medium">
                  {hero.headline || "Elegance woven for every day"}
                </h1>
                <p className="hero-sub mt-4 text-cream-100/90 text-[15px] sm:text-lg leading-relaxed max-w-md">
                  {hero.subheadline ||
                    "Sarees, three-pieces & modest wear — crafted in Dhaka, delivered across Bangladesh with cash on delivery."}
                </p>
                <div className="hero-cta mt-7 flex flex-col sm:flex-row gap-3 max-w-md sm:max-w-none">
                  {hero.primaryCtaText ? (
                    <Link
                      href={hero.primaryCtaLink || "/shop"}
                      className="btn-sheen inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-cream-50 px-8 text-[15px] font-semibold text-rosewood-950 hover:bg-white active:scale-[0.98] transition shadow-[0_18px_40px_rgba(0,0,0,0.35)]"
                    >
                      {hero.primaryCtaText}
                      <ArrowRight size={18} strokeWidth={2} aria-hidden />
                    </Link>
                  ) : null}
                  {hero.secondaryCtaText ? (
                    <Link
                      href={hero.secondaryCtaLink || "/offers"}
                      className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-white/40 bg-white/10 backdrop-blur-md px-8 text-[15px] font-semibold text-white hover:bg-white/20 active:scale-[0.98] transition"
                    >
                      {hero.secondaryCtaText}
                    </Link>
                  ) : null}
                </div>
                <div className="hero-meta mt-7 flex items-center gap-5 text-cream-100/80 text-xs sm:text-sm">
                  <span className="flex items-center gap-1.5">
                    <span aria-hidden>★★★★★</span> 4.9 · 12k reviews
                  </span>
                  <span className="hidden sm:inline h-4 w-px bg-white/25" aria-hidden />
                  <span className="hidden sm:inline">COD available nationwide</span>
                </div>
              </div>
            </div>
          </div>

          {/* Video controls */}
          {showVideo && src ? (
            <div className="absolute bottom-5 right-5 sm:bottom-8 sm:right-8 flex gap-2">
              <button
                type="button"
                aria-label={paused ? "Play video" : "Pause video"}
                onClick={() => {
                  const v = videoRef.current;
                  if (!v) return;
                  if (v.paused) {
                    v.play().catch(() => {});
                    setPaused(false);
                  } else {
                    v.pause();
                    setPaused(true);
                  }
                }}
                className="grid h-11 w-11 place-items-center rounded-full border border-white/30 bg-black/35 text-white backdrop-blur-md hover:bg-black/55 transition"
              >
                {paused ? <Play size={18} /> : <Pause size={18} />}
              </button>
            </div>
          ) : null}

          {/* Loading shimmer until video ready */}
          {!ready && showVideo ? (
            <div className="absolute inset-0 -z-0 bg-gradient-to-br from-rosewood-900 to-ink-900 animate-pulse" aria-hidden />
          ) : null}
        </div>
      </div>
    </section>
  );
}
