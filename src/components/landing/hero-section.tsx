"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import type { HeroContent } from "@/lib/dynamic-config";
import { InteractiveBudgetPreview } from "@/components/landing/interactive-budget-preview";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Ilustrasi botani monoline halus yang menggambar dirinya sendiri seperti tinta
 * di atas kertas (ink-draw), lalu beristirahat tenang di sisi Hero.
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
        transition={{ duration: 1.25, delay, ease: EASE }}
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
            duration: 0.75,
            delay: delay + 0.25 + idx * 0.09,
            ease: EASE,
          }}
        />
      ))}
    </svg>
  );
}

const DRIFTING_PETALS = [
  { id: 1, left: "10%", top: "14%", size: 9, duration: 9.5, delay: 0, dx: 18, dy: -22, rot: 45, tone: "bg-[#4F6BF6]/20" },
  { id: 2, left: "86%", top: "18%", size: 10, duration: 11, delay: 1.1, dx: -16, dy: -20, rot: -40, tone: "bg-[#E09F3E]/25" },
  { id: 3, left: "20%", top: "48%", size: 8, duration: 10, delay: 0.5, dx: 14, dy: -18, rot: 55, tone: "bg-[#818CF8]/22" },
  { id: 4, left: "80%", top: "52%", size: 9, duration: 10.5, delay: 1.8, dx: -14, dy: -24, rot: -35, tone: "bg-[#4F6BF6]/18" },
  { id: 5, left: "32%", top: "24%", size: 7, duration: 9, delay: 2.2, dx: 12, dy: -16, rot: 30, tone: "bg-[#E09F3E]/20" },
  { id: 6, left: "68%", top: "28%", size: 8, duration: 11.5, delay: 0.8, dx: -12, dy: -18, rot: -50, tone: "bg-[#818CF8]/20" },
];

export function HeroSection({
  hero,
  lowestPriceLabel,
}: {
  hero: HeroContent;
  lowestPriceLabel: string;
}) {
  return (
    <section className="relative overflow-hidden px-4 pt-10 pb-14 sm:pt-14 sm:pb-20">
      {/* Sapuan warna pastel lavender-mist lembut di bagian atas Hero */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-20 h-[520px] -z-10 bg-gradient-to-b from-[#E5EAF8] via-[#EFF2FA] to-transparent"
      />

      {/* Ornamen botani ink-draw halus di kedua tepi Hero */}
      <RomanticBotanicalLineArt
        delay={0.12}
        className="pointer-events-none absolute -top-4 -right-10 h-60 w-60 text-[#4F6BF6]/[0.18] sm:h-80 sm:w-80"
      />
      <RomanticBotanicalLineArt
        delay={0.28}
        className="pointer-events-none absolute top-32 -left-14 h-52 w-52 rotate-180 text-[#141618]/[0.1] sm:h-72 sm:w-72"
      />

      {/* Kelopak mikro romantis melayang perlahan */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px] -z-10 overflow-hidden"
      >
        {DRIFTING_PETALS.map((p) => (
          <motion.span
            key={p.id}
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size * 0.65,
            }}
            className={`absolute block rounded-tl-full rounded-br-full ${p.tone}`}
            initial={{ opacity: 0.15, x: 0, y: 0, rotate: 0 }}
            animate={{
              opacity: [0.15, 0.75, 0.2],
              x: [0, p.dx, -p.dx * 0.4, 0],
              y: [0, p.dy, p.dy * 0.35, 0],
              rotate: [0, p.rot, -p.rot * 0.5, 0],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-5xl">
        {/* Blok Judul Terpusat dengan Aksen Kaligrafi Romantis */}
        <div className="mx-auto max-w-2xl text-center space-y-4">
          <motion.p
            className="font-script text-3xl sm:text-4xl text-[#4F6BF6] leading-none"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            Untuk Hari Bahagia Kalian
          </motion.p>

          <motion.h1
            className="font-display text-[2.15rem] font-bold leading-[1.12] tracking-tight text-[#141618] sm:text-[3rem] lg:text-[3.3rem]"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.08, ease: EASE }}
          >
            {hero.headline}{" "}
            <span className="text-[#4F6BF6]">
              {hero.headlineAccent || "Tanpa Drama"}
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

        {/* Lembar Simulasi Anggaran Bersih (Tanpa Bezel Gadget) */}
        <motion.div
          id="simulasi"
          className="scroll-mt-20 mt-10 sm:mt-12"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.28, ease: EASE }}
        >
          <div className="mx-auto max-w-3xl">
            <InteractiveBudgetPreview />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
