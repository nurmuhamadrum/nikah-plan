"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import type { HeroContent } from "@/lib/dynamic-config";
import { InteractiveBudgetPreview } from "@/components/landing/interactive-budget-preview";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Ilustrasi botani monoline halus yang menggambar dirinya sendiri (ink-draw)
 * lalu berayun pelan seperti tertiup angin sepoi-sepoi.
 */
function RomanticBotanicalLineArt({
  className,
  delay = 0.1,
  swayDirection = 1,
}: {
  className?: string;
  delay?: number;
  swayDirection?: 1 | -1;
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
    <motion.div
      aria-hidden="true"
      className={className}
      style={{ transformOrigin: "85% 10%" }}
      animate={{
        rotate: [0, 2.2 * swayDirection, 0, -1.6 * swayDirection, 0],
        y: [0, -4, 0, 3, 0],
      }}
      transition={{
        duration: swayDirection === 1 ? 10.5 : 12,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <svg viewBox="0 0 260 280" fill="none" className="h-full w-full">
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
    </motion.div>
  );
}

/**
 * Dua pita lengkung tipis (flowing silk ribbons) yang tergambar halus
 * di belakang Hero tanpa warna gradient pink.
 */
function FlowingSilkRibbons() {
  return (
    <svg
      viewBox="0 0 1200 440"
      fill="none"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-[440px] w-full -z-10"
    >
      <motion.path
        d="M-60 270 C 210 110, 460 360, 740 165 C 940 30, 1110 155, 1260 90"
        stroke="#4F6BF6"
        strokeOpacity="0.16"
        strokeWidth="1.4"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.8, ease: EASE }}
      />
      <motion.path
        d="M-40 315 C 260 190, 520 390, 820 210 C 1000 105, 1130 215, 1260 155"
        stroke="#E09F3E"
        strokeOpacity="0.24"
        strokeWidth="1.2"
        strokeDasharray="5 7"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 2.1, delay: 0.2, ease: EASE }}
      />
    </svg>
  );
}

const STARLIGHT_SPARKLES = [
  { id: 1, left: "11%", top: "16%", size: 13, duration: 4.8, delay: 0, color: "#E09F3E" },
  { id: 2, left: "86%", top: "14%", size: 15, duration: 5.4, delay: 0.9, color: "#4F6BF6" },
  { id: 3, left: "19%", top: "40%", size: 10, duration: 5.1, delay: 1.6, color: "#818CF8" },
  { id: 4, left: "81%", top: "38%", size: 12, duration: 4.6, delay: 0.5, color: "#E09F3E" },
  { id: 5, left: "30%", top: "14%", size: 9, duration: 5.8, delay: 2.1, color: "#4F6BF6" },
  { id: 6, left: "70%", top: "18%", size: 11, duration: 5.0, delay: 1.2, color: "#E09F3E" },
  { id: 7, left: "13%", top: "29%", size: 8, duration: 6.2, delay: 2.5, color: "#E09F3E" },
  { id: 8, left: "89%", top: "27%", size: 9, duration: 5.6, delay: 1.8, color: "#818CF8" },
];

const DRIFTING_PETALS = [
  { id: 1, left: "9%", top: "20%", size: 8, duration: 10, delay: 0, dx: 16, dy: -20, rot: 45, tone: "bg-[#4F6BF6]/20" },
  { id: 2, left: "87%", top: "22%", size: 9, duration: 11.5, delay: 1.1, dx: -16, dy: -22, rot: -40, tone: "bg-[#E09F3E]/28" },
  { id: 3, left: "22%", top: "46%", size: 7, duration: 10.5, delay: 0.6, dx: 14, dy: -18, rot: 55, tone: "bg-[#818CF8]/22" },
  { id: 4, left: "78%", top: "46%", size: 8, duration: 11, delay: 1.7, dx: -14, dy: -20, rot: -35, tone: "bg-[#4F6BF6]/18" },
  { id: 5, left: "34%", top: "22%", size: 6, duration: 9.5, delay: 2.0, dx: 12, dy: -16, rot: 30, tone: "bg-[#E09F3E]/24" },
  { id: 6, left: "66%", top: "25%", size: 7, duration: 11.8, delay: 0.9, dx: -12, dy: -18, rot: -48, tone: "bg-[#818CF8]/20" },
];

/**
 * Emblem cincin ganda tipis bergaya fine-jewelry dengan kilau berlian berkala.
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
          transition={{ duration: 0.9, ease: EASE }}
        />
        <motion.circle
          cx="30"
          cy="14"
          r="9"
          stroke="#E09F3E"
          strokeWidth="1.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
        />
        <motion.path
          d="M24 3.5L25.4 6L24 8.2L22.6 6L24 3.5Z"
          fill="#E09F3E"
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.75, 1, 0.75],
          }}
          transition={{
            duration: 2.8,
            delay: 0.6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
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
  return (
    <section className="relative overflow-hidden px-4 pt-10 pb-14 sm:pt-14 sm:pb-20">
      {/* Pita lengkung ink-draw halus di latar (tanpa gradient pink) */}
      <FlowingSilkRibbons />

      {/* Ornamen botani ink-draw + ayunan angin lembut di kedua tepi Hero */}
      <RomanticBotanicalLineArt
        delay={0.12}
        swayDirection={1}
        className="pointer-events-none absolute -top-4 -right-10 h-60 w-60 text-[#4F6BF6]/[0.18] sm:h-80 sm:w-80"
      />
      <RomanticBotanicalLineArt
        delay={0.28}
        swayDirection={-1}
        className="pointer-events-none absolute top-32 -left-14 h-52 w-52 rotate-180 text-[#141618]/[0.1] sm:h-72 sm:w-72"
      />

      {/* Bintang 4-sudut berkilau (emas & indigo) + kelopak mikro melayang pelan */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px] -z-10 overflow-hidden"
      >
        {STARLIGHT_SPARKLES.map((s) => (
          <motion.svg
            key={s.id}
            viewBox="0 0 24 24"
            fill="none"
            style={{
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
            }}
            className="absolute"
            initial={{ opacity: 0.1, scale: 0.6, rotate: 0 }}
            animate={{
              opacity: [0.12, 0.85, 0.12],
              scale: [0.7, 1.15, 0.7],
              rotate: [0, 45, 90],
            }}
            transition={{
              duration: s.duration,
              delay: s.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <path
              d="M12 1.5L14.2 9.8L22.5 12L14.2 14.2L12 22.5L9.8 14.2L1.5 12L9.8 9.8L12 1.5Z"
              fill={s.color}
            />
          </motion.svg>
        ))}

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
        {/* Blok Judul Terpusat dengan Emblem Cincin & Aksen Kaligrafi Romantis */}
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
            className="font-display text-[2.15rem] font-bold leading-[1.14] tracking-tight text-[#141618] sm:text-[3rem] lg:text-[3.3rem]"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.08, ease: EASE }}
          >
            {hero.headline}{" "}
            <span className="relative inline-block text-[#4F6BF6]">
              <span>{hero.headlineAccent || "Tanpa Drama"}</span>
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
                  transition={{ duration: 0.9, delay: 0.45, ease: EASE }}
                />
              </svg>
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
