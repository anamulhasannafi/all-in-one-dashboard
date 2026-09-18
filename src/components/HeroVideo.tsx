"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Play, Pause } from "./icons";

export type HeroItem = {
  heroType?: "image" | "video" | "slideshow" | string | null;
  videoUrl?: string | null;
  mobileVideoUrl?: string | null;
  imageUrl?: string | null;
  mobileImageUrl?: string | null;
  posterUrl?: string | null;
  mobilePosterUrl?: string | null;
  badgeText?: string | null;
  headline?: string | null;
  subheadline?: string | null;
  primaryCtaText?: string | null;
  primaryCtaLink?: string | null;
  secondaryCtaText?: string | null;
  secondaryCtaLink?: string | null;
};

export type HeroData = HeroItem & {
  slides?: HeroItem[];
  overlayOpacity?: number;
  animation?: string;
  enabled?: boolean;
  intervalDuration?: number;
};

export default function HeroVideo({ hero }: { hero: HeroData | null }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [paused, setPaused] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // ১. স্ক্রিন সাইজ ডিটেক্ট করা (Mobile vs Desktop)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // ২. স্লাইডশো / কন্টিনিউয়াস রোটেশন লজিক
  const isSlideshow = hero?.heroType === "slideshow" && Boolean(hero?.slides && hero.slides.length > 0);
  const currentMedia: HeroItem = isSlideshow ? hero!.slides![activeSlideIndex] : hero!;

  useEffect(() => {
    if (!isSlideshow || !hero?.slides?.length) return;
    const duration = hero.intervalDuration || 6000;
    const timer = setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % hero.slides!.length);
    }, duration);
    return () => clearInterval(timer);
  }, [isSlideshow, hero?.slides?.length, hero?.intervalDuration]);

  // ৩. ভিডিও অটো-প্লে হ্যান্ডলার (iOS/Safari Strict autoplay fix)
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.play().catch(() => {
      // Autoplay fallback
    });
  }, [currentMedia?.videoUrl, currentMedia?.mobileVideoUrl, activeSlideIndex]);

  if (!hero || hero.enabled === false) return null;

  // মিডিয়া টাইপ লজিক নির্ধারণ
  const isVideo = currentMedia?.heroType === "video";
  const videoSrc = isMobile
    ? currentMedia?.mobileVideoUrl || currentMedia?.videoUrl
    : currentMedia?.videoUrl || currentMedia?.mobileVideoUrl;

  const imageSrc = isMobile
    ? currentMedia?.mobileImageUrl || currentMedia?.mobilePosterUrl || currentMedia?.imageUrl || currentMedia?.posterUrl
    : currentMedia?.imageUrl || currentMedia?.posterUrl || currentMedia?.mobileImageUrl;

  const posterSrc = isMobile
    ? currentMedia?.mobilePosterUrl || currentMedia?.posterUrl || imageSrc
    : currentMedia?.posterUrl || currentMedia?.mobilePosterUrl || imageSrc;

  const overlay = Math.min(90, Math.max(0, hero.overlayOpacity ?? 45));

  return (
    <section aria-label="Featured collection" className="relative overflow-hidden bg-rosewood-950 w-full">
      <div className="relative mx-auto max-w-[1600px]">
        <div className="relative h-[92svh] min-h-[560px] max-h-[880px] sm:h-[86vh] w-full overflow-hidden">
          
          {/* স্ট্রিক্ট ভিডিও রেন্ডারিং (ভিডিও সিলেক্ট থাকলে) */}
          {isVideo && videoSrc ? (
            <video
              ref={videoRef}
              key={videoSrc}
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              poster={posterSrc ?? undefined}
              aria-hidden
              disablePictureInPicture
            >
              <source src={videoSrc} type={videoSrc.endsWith(".webm") ? "video/webm" : "video/mp4"} />
            </video>
          ) : imageSrc ? (
            /* স্ট্রিক্ট ইমেজ রেন্ডারিং (ফটো সিলেক্ট থাকলে) */
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={imageSrc}
              src={imageSrc}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
              loading="eager"
              fetchPriority="high"
            />
          ) : (
            /* ডিফল্ট ব্যাকগ্রাউন্ড কালার */
            <div className="absolute inset-0 bg-gradient-to-br from-rosewood-800 via-rosewood-950 to-ink-900" />
          )}

          {/* ডার্ক ওভারলে */}
          <div
            className="absolute inset-0 transition-opacity duration-300"
            style={{
              background: `linear-gradient(180deg, rgba(20,8,15,${0.25 + overlay / 220}) 0%, rgba(20,8,15,${overlay / 130}) 45%, rgba(20,8,15,${Math.min(0.85, overlay / 100 + 0.25)}) 100%), linear-gradient(100deg, rgba(46,11,29,${Math.min(0.72, overlay / 100 + 0.15)}) 0%, transparent 62%)`,
            }}
            aria-hidden
          />

          {/* কন্টেন্ট টেক্সট ও বাটন */}
          <div className="absolute inset-0 flex items-end sm:items-center">
            <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 pb-16 sm:pb-0 pt-24">
              <div className="max-w-xl">
                {currentMedia?.badgeText ? (
                  <p className="inline-flex items-center gap-2.5 rounded-full border border-white/25 bg-white/10 backdrop-blur-md px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-cream-50">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold-400" aria-hidden />
                    {currentMedia.badgeText}
                  </p>
                ) : null}
                <h1 className="font-display mt-5 text-cream-50 text-[42px] leading-[1.02] sm:text-6xl lg:text-7xl font-medium">
                  {currentMedia?.headline || "Elegance woven for every day"}
                </h1>
                <p className="mt-4 text-cream-100/90 text-[15px] sm:text-lg leading-relaxed max-w-md">
                  {currentMedia?.subheadline ||
                    "Sarees, three-pieces & modest wear — crafted in Dhaka, delivered across Bangladesh with cash on delivery."}
                </p>
                <div className="mt-7 flex flex-col sm:flex-row gap-3 max-w-md sm:max-w-none">
                  {currentMedia?.primaryCtaText ? (
                    <Link
                      href={currentMedia.primaryCtaLink || "/shop"}
                      className="btn-sheen inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-cream-50 px-8 text-[15px] font-semibold text-rosewood-950 hover:bg-white active:scale-[0.98] transition shadow-[0_18px_40px_rgba(0,0,0,0.35)]"
                    >
                      {currentMedia.primaryCtaText}
                      <ArrowRight size={18} strokeWidth={2} aria-hidden />
                    </Link>
                  ) : null}
                  {currentMedia?.secondaryCtaText ? (
                    <Link
                      href={currentMedia.secondaryCtaLink || "/offers"}
                      className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-white/40 bg-white/10 backdrop-blur-md px-8 text-[15px] font-semibold text-white hover:bg-white/20 active:scale-[0.98] transition"
                    >
                      {currentMedia.secondaryCtaText}
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* স্লাইডশো ইন্ডিকেটর */}
          {isSlideshow && hero.slides && hero.slides.length > 1 ? (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
              {hero.slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveSlideIndex(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    activeSlideIndex === idx ? "w-8 bg-gold-400" : "w-2.5 bg-white/50 hover:bg-white"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          ) : null}

          {/* ভিডিও কন্ট্রোল বাটন */}
          {isVideo && videoSrc ? (
            <div className="absolute bottom-5 right-5 sm:bottom-8 sm:right-8 flex gap-2 z-10">
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

        </div>
      </div>
    </section>
  );
}