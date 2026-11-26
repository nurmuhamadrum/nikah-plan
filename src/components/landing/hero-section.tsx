"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { animate, motion, useInView } from "motion/react";
import {
  ArrowRight,
  CheckCircle2,
  Gift,
  HeartHandshake,
  Plane,
  ShieldCheck,
  Sparkles,
  WifiOff,
} from "lucide-react";
import type { HeroContent } from "@/lib/dynamic-config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FloatingBotanicals } from "@/components/brand/floating-botanicals";
import { InteractiveBudgetPreview } from "@/components/landing/interactive-budget-preview";

const EASE = [0.22, 1, 0.36, 1] as const;

function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration: 1.4,
      delay: 1.1,
      ease: EASE,
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, to]);

  return (
    <span ref={ref} className="tabular-nums">
      {value}
      {suffix}
    </span>
  );
}

const STATS = [
  { value: 18, suffix: "+", label: "Pos vendor siap pakai" },
  { value: 8, suffix: "", label: "Mata uang honeymoon" },
  { value: 2, suffix: "", label: "Akun, sekali bayar" },
];

const FLOATING_CARDS = [
  {
    icon: CheckCircle2,
    title: "DP Gedung Lunas",
    sub: "Termin 2 dari 3",
    tone: "bg-sage-50 text-sage",
    ring: "border-sage/20",
    posClass: "top-8 left-4 xl:left-12",
    tiltClass: "-rotate-[1.5deg] hover:rotate-0 hover:scale-[1.03]",
    initialOffset: { x: -18, y: 8 },
    dot: true,
    delay: 0.85,
    floatDelay: "0s",
  },
  {
    icon: Gift,
    title: "Angpao Masuk",
    sub: "+Rp 2,5 Jt",
    tone: "bg-amberwarm-light text-sage-900",
    ring: "border-amberwarm/35",
    posClass: "top-[27%] right-0 xl:right-12",
    tiltClass: "rotate-[1.5deg] hover:rotate-0 hover:scale-[1.03]",
    initialOffset: { x: 18, y: 0 },
    dot: false,
    delay: 1.02,
    floatDelay: "-2s",
  },
  {
    icon: Plane,
    title: "Honeymoon Bali",
    sub: "Rp 750rb/hari",
    tone: "bg-terracotta-50 text-terracotta",
    ring: "border-terracotta/25",
    posClass: "bottom-[23%] left-4 xl:left-12",
    tiltClass: "-rotate-[1deg] hover:rotate-0 hover:scale-[1.03]",
    initialOffset: { x: -18, y: 8 },
    dot: false,
    delay: 1.18,
    floatDelay: "-4s",
  },
];

export function HeroSection({
  hero,
  lowestPriceLabel,
}: {
  hero: HeroContent;
  lowestPriceLabel: string;
}) {
  const words = hero.headline.split(" ").filter(Boolean);
  const accentDelay = 0.15 + words.length * 0.06;

  return (
    <section className="relative isolate overflow-hidden px-4 pt-6 pb-12 sm:pt-9 sm:pb-16 lg:pt-8 lg:pb-14">
      <FloatingBotanicals preset="hero" />

      <div className="relative mx-auto grid max-w-[1240px] grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-6">
        {/* Kolom teks (5 col) */}
        <div className="space-y-4 sm:space-y-5 text-center lg:col-span-5 lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <Badge variant="shimmer" className="mx-auto lg:mx-0 py-0.5 text-[11px] sm:text-xs">
              <Sparkles className="relative h-3 w-3 text-terracotta" />
              <span className="relative">{hero.badge}</span>
            </Badge>
          </motion.div>

          <h1 className="font-display text-[2.05rem] font-semibold leading-[1.12] tracking-tight text-sage-900 sm:text-[2.55rem] lg:text-[2.6rem] xl:text-[2.85rem]">
            <span className="sr-only">
              {hero.headline} {hero.headlineAccent} {hero.headlineSuffix}
            </span>
            <span aria-hidden="true">
              {words.map((word, i) => (
                <motion.span
                  key={`${word}-${i}`}
                  className="inline-block"
                  initial={{ opacity: 0, y: "0.4em", filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.6, ease: EASE, delay: 0.1 + i * 0.06 }}
                >
                  {word}
                  {"\u00A0"}
                </motion.span>
              ))}
              <br className="hidden sm:block" />
              <span className="relative inline-block px-1">
                <motion.span
                  className="inline-block"
                  initial={{ opacity: 0, y: "0.25em" }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: EASE, delay: accentDelay }}
                >
                  <span className="font-script text-gradient-warm inline-block px-1.5 text-[1.3em] leading-[1.12] font-normal">
                    {hero.headlineAccent || "Tanpa Drama"}
                  </span>
                </motion.span>
                <svg
                  viewBox="0 0 300 20"
                  preserveAspectRatio="none"
                  className="absolute -bottom-0.5 left-0 h-2.5 w-full sm:h-3"
                  fill="none"
                >
                  <motion.path
                    d="M4 14C60 4 120 4 170 9C215 13 255 12 296 5"
                    stroke="#D4A359"
                    strokeWidth="4"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.85 }}
                    transition={{ duration: 0.9, ease: "easeInOut", delay: accentDelay + 0.35 }}
                  />
                </svg>
              </span>{" "}
              <motion.span
                className="inline-block"
                initial={{ opacity: 0, y: "0.4em" }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: EASE, delay: accentDelay + 0.2 }}
              >
                {hero.headlineSuffix}
              </motion.span>
            </span>
          </h1>

          <motion.p
            className="mx-auto max-w-lg text-sm leading-relaxed text-sage-700/90 sm:text-[15px] lg:mx-0"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: accentDelay + 0.3 }}
          >
            {hero.subheadline}
          </motion.p>

          <motion.div
            className="flex flex-col flex-wrap items-center justify-center gap-2.5 pt-0.5 sm:flex-row lg:justify-start"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: EASE, delay: accentDelay + 0.45 }}
          >
            <Button asChild size="default" className="group h-10 sm:h-11 w-full sm:w-auto px-4 xl:px-5 text-sm">
              <Link href="/login?next=/checkout">
                {hero.primaryCta}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="default" className="h-10 sm:h-11 w-full sm:w-auto px-4 xl:px-5 text-sm">
              <a href="#harga">
                {hero.secondaryCta} ({lowestPriceLabel})
              </a>
            </Button>
          </motion.div>

          <motion.div
            className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] sm:text-xs font-medium text-sage-700 lg:justify-start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: accentDelay + 0.6 }}
          >
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-sage" />
              Bayar 1x untuk 2 Akun
            </span>
            <span className="inline-flex items-center gap-1.5">
              <WifiOff className="h-3.5 w-3.5 text-sage" />
              Bisa Dipakai Offline
            </span>
            <span className="inline-flex items-center gap-1.5">
              <HeartHandshake className="h-3.5 w-3.5 text-terracotta" />
              Khusus Pengantin Indonesia
            </span>
          </motion.div>

          <motion.dl
            className="mx-auto grid max-w-sm grid-cols-3 divide-x divide-sage/15 rounded-2xl glass px-1.5 py-2 shadow-soft lg:mx-0"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: accentDelay + 0.7 }}
          >
            {STATS.map((stat) => (
              <div key={stat.label} className="px-2 text-center">
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-display text-xl font-semibold text-sage-900 sm:text-2xl">
                  <CountUp to={stat.value} suffix={stat.suffix} />
                </dd>
                <dd className="mt-0.5 text-[10px] leading-tight text-sage-600">
                  {stat.label}
                </dd>
              </div>
            ))}
          </motion.dl>
        </div>

        {/* Kolom widget simulasi + Konstelasi 3 Titik Floating Badges (7 col) */}
        <div id="simulasi" className="relative scroll-mt-20 lg:col-span-7">
          {/* Halo hangat di belakang stage */}
          <div
            aria-hidden="true"
            className="absolute inset-x-10 inset-y-4 -z-10 rounded-[2.5rem] bg-gradient-to-br from-terracotta-200/60 via-amberwarm-light to-sage-200/60 blur-2xl"
          />

          {/* Strip pill ringkas khusus layar tablet (640px–1179px) */}
          <div
            aria-hidden="true"
            className="mb-3 hidden sm:flex min-[1180px]:hidden flex-wrap items-center justify-center gap-2"
          >
            {FLOATING_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className={`glass-strong inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 shadow-sm ${card.ring}`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full ${card.tone}`}
                  >
                    <Icon className="h-3 w-3" />
                  </span>
                  <span className="text-[11px] font-bold text-sage-900">
                    {card.title}
                  </span>
                  <span className="text-[10px] text-sage-600">&bull; {card.sub}</span>
                </div>
              );
            })}
          </div>

          {/* Widget Utama — terpusat dengan ruang tepi kiri & kanan ~125px */}
          <motion.div
            className="relative z-10 mx-auto w-full max-w-[440px]"
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.85, ease: EASE, delay: 0.45 }}
          >
            <div className="lg:[transform:perspective(1600px)_rotateY(-3deg)_rotateX(1.5deg)] lg:transition-transform lg:duration-700 lg:hover:[transform:perspective(1600px)_rotateY(0deg)_rotateX(0deg)]">
              <InteractiveBudgetPreview />
            </div>
          </motion.div>

          {/* Konstelasi 3 Titik Floating Badges (Desktop ≥ 1180px — mengelilingi tanpa menutupi wording) */}
          {FLOATING_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                aria-hidden="true"
                className={`absolute z-20 hidden min-[1180px]:block ${card.posClass}`}
                initial={{ opacity: 0, x: card.initialOffset.x, y: card.initialOffset.y }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.6, ease: EASE, delay: card.delay }}
              >
                <div
                  className="animate-float-soft"
                  style={{ animationDelay: card.floatDelay }}
                >
                  <div
                    className={`glass-strong relative flex items-center gap-2 whitespace-nowrap rounded-2xl border px-2.5 py-2 shadow-lift transition-transform duration-300 ${card.ring} ${card.tiltClass}`}
                  >
                    {card.dot && (
                      <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage-400 opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sage" />
                      </span>
                    )}
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${card.tone}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="leading-tight">
                      <p className="text-[11px] font-bold text-sage-900">
                        {card.title}
                      </p>
                      <p className="text-[10px] text-sage-600 mt-0.5">
                        {card.sub}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
