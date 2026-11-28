"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import type { HeroContent } from "@/lib/dynamic-config";
import { InteractiveBudgetPreview } from "@/components/landing/interactive-budget-preview";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Ilustrasi botani monoline halus: menggambar dirinya sekali (ink-draw)
 * saat halaman dibuka lalu beristirahat tenang di kedua tepi Hero.
 */
function RomanticBotanicalLineArt({
  className,
  delay = 0.1,
}: {
  className?: string;
  delay?: number;
}) {
  const leafPaths = [
    "M214 42C196 20 168 18 150 26C166 44 190 54 214 42Z",
    "M196 68C222 62 242 74 252 92C228 96 206 86 196 68Z",
    "M174 104C148 86 122 90 104 102C124 118 150 122 174 104Z",
    "M158 136C186 134 206 148 216 168C190 168 168 156 158 136Z",
    "M140 174C112 162 88 168 72 184C94 196 120 194 140 174Z",
    "M128 208C152 210 170 224 178 242C154 240 136 228 128 208Z",
  ];

  return (
    <svg
      viewBox="0 0 260 280"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <motion.path
        d="M242 14C198 48 158 106 116 254"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.2, delay, ease: EASE }}
      />
      {leafPaths.map((d, idx) => (
        <motion.path
          key={d}
          d={d}
          stroke="currentColor"
          strokeWidth="1.1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            duration: 0.7,
            delay: delay + 0.22 + idx * 0.08,
            ease: EASE,
          }}
        />
      ))}
    </svg>
  );
}

/**
 * Emblem cincin ganda tipis bergaya fine-jewelry (ink-draw sekali saat buka).
 */
function IntertwinedRingsEmblem() {
  return (
    <div className="inline-flex items-center justify-center gap-3 text-[#C59B5F]">
      <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#E09F3E]/55" />
      <svg
        viewBox="0 0 48 26"
        fill="none"
        aria-hidden="true"
        className="h-6 w-11"
      >
        <motion.circle
          cx="18"
          cy="14"
          r="9"
          stroke="#141618"
          strokeOpacity="0.65"
          strokeWidth="1.4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.85, ease: EASE }}
        />
        <motion.circle
          cx="30"
          cy="14"
          r="9"
          stroke="#E09F3E"
          strokeWidth="1.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.85, delay: 0.14, ease: EASE }}
        />
        <motion.path
          d="M24 3.5L25.4 6L24 8.2L22.6 6L24 3.5Z"
          fill="#E09F3E"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.5, ease: EASE }}
          style={{ transformOrigin: "24px 6px" }}
        />
      </svg>
      <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#E09F3E]/55" />
    </div>
  );
}

export function HeroSection({
  hero,
  lowestPriceLabel,
}: {
  hero: HeroContent;
  lowestPriceLabel: string;
}) {
  const rotatingPhrases = useMemo(() => {
    const first = hero.headlineAccent?.trim() || "Tanpa Drama";
    const extras = ["Penuh Bahagia", "Lebih Tenang", "Sepenuh Hati"].filter(
      (p) => p.toLowerCase() !== first.toLowerCase()
    );
    return [first, ...extras];
  }, [hero.headlineAccent]);

  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPhraseIdx((prev) => (prev + 1) % rotatingPhrases.length);
    }, 3400);
    return () => window.clearInterval(timer);
  }, [rotatingPhrases.length]);

  const activePhrase = rotatingPhrases[phraseIdx] ?? rotatingPhrases[0];

  return (
    <section className="relative overflow-hidden px-4 pt-10 pb-14 sm:pt-14 sm:pb-20">
      {/* Ornamen botani statis tipis di kedua tepi Hero (ink-draw sekali lalu diam tenang) */}
      <RomanticBotanicalLineArt
        delay={0.12}
        className="pointer-events-none absolute -top-4 -right-10 h-60 w-60 text-[#4F6BF6]/[0.14] sm:h-80 sm:w-80"
      />
      <RomanticBotanicalLineArt
        delay={0.26}
        className="pointer-events-none absolute top-32 -left-14 h-52 w-52 rotate-180 text-[#141618]/[0.08] sm:h-72 sm:w-72"
      />

      <div className="relative z-10 mx-auto max-w-5xl">
        {/* Blok Judul Terpusat dengan Emblem Cincin & Teks Aksen Berganti Halus */}
        <div className="mx-auto max-w-2xl text-center space-y-4">
          <div className="flex flex-col items-center gap-2">
            <IntertwinedRingsEmblem />
            <motion.p
              className="font-script text-3xl sm:text-4xl text-[#4F6BF6] leading-none"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              Untuk Hari Bahagia Kalian
            </motion.p>
          </div>

          <motion.h1
            className="font-display text-[2.15rem] font-bold leading-[1.18] tracking-tight text-[#141618] sm:text-[3rem] lg:text-[3.3rem]"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08, ease: EASE }}
          >
            <span className="block">{hero.headline}</span>
            <span className="relative mt-1 inline-flex min-h-[1.25em] items-center justify-center text-[#4F6BF6]">
              <AnimatePresence mode="wait">
                <motion.span
                  key={activePhrase}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.42, ease: EASE }}
                  className="relative inline-block"
                >
                  {activePhrase}
                  <svg
                    viewBox="0 0 220 14"
                    fill="none"
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-1.5 left-0 w-full h-3"
                  >
                    <motion.path
                      d="M4 10 C 65 2, 155 2, 216 9"
                      stroke="#E09F3E"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 0.9 }}
                      transition={{ duration: 0.65, delay: 0.12, ease: EASE }}
                    />
                  </svg>
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.h1>

          <motion.p
            className="mx-auto max-w-lg text-sm leading-relaxed text-[#5F6978] sm:text-[15.5px]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16, ease: EASE }}
          >
            {hero.subheadline}
          </motion.p>

          <motion.div
            className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24, ease: EASE }}
          >
            <Link
              href="/login?next=/checkout"
              className="group inline-flex items-center gap-3 rounded-full bg-midnight-btn py-2 pl-6 pr-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              <span>{hero.primaryCta}</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </Link>

            <a
              href="#harga"
              className="text-xs font-semibold text-[#5F6978] underline decoration-black/15 underline-offset-4 transition-colors hover:text-[#141618]"
            >
              Mulai {lowestPriceLabel} · 1x bayar untuk berdua
            </a>
          </motion.div>
        </div>

        {/* Lembar Simulasi Anggaran Bersih (Nuansa Bridal Stationery) */}
        <motion.div
          id="simulasi"
          className="scroll-mt-20 mt-10 sm:mt-12"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.28, ease: EASE }}
        >
          <div className="mx-auto max-w-3xl space-y-3">
            <div className="flex items-center justify-center gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#727B88]">
              <span className="h-px w-8 bg-black/10" />
              <span>Lembar Rencana Berdua &middot; Simulasi Interaktif</span>
              <span className="h-px w-8 bg-black/10" />
            </div>
            <InteractiveBudgetPreview />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
