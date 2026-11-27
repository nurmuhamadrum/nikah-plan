"use client";

import { motion } from "motion/react";
import type { InvitationLayoutStyle } from "@/lib/invitation-themes";

interface ParticleSeed {
  id: number;
  leftPct: number;
  topPct: number;
  size: number;
  duration: number;
  delay: number;
  driftX: number;
  driftY: number;
  rotate: number;
}

const PARTICLE_SEEDS: ParticleSeed[] = [
  { id: 1, leftPct: 8, topPct: 12, size: 10, duration: 9.5, delay: 0, driftX: 16, driftY: -28, rotate: 40 },
  { id: 2, leftPct: 86, topPct: 18, size: 12, duration: 11.0, delay: 1.2, driftX: -18, driftY: -24, rotate: -55 },
  { id: 3, leftPct: 22, topPct: 36, size: 8, duration: 8.5, delay: 0.6, driftX: 14, driftY: -20, rotate: 65 },
  { id: 4, leftPct: 76, topPct: 44, size: 11, duration: 10.5, delay: 2.0, driftX: -14, driftY: -30, rotate: -35 },
  { id: 5, leftPct: 12, topPct: 62, size: 9, duration: 9.0, delay: 1.5, driftX: 20, driftY: -22, rotate: 50 },
  { id: 6, leftPct: 90, topPct: 68, size: 10, duration: 12.0, delay: 0.4, driftX: -16, driftY: -26, rotate: -45 },
  { id: 7, leftPct: 35, topPct: 78, size: 8, duration: 10.0, delay: 2.6, driftX: 12, driftY: -18, rotate: 30 },
  { id: 8, leftPct: 64, topPct: 84, size: 11, duration: 11.5, delay: 1.0, driftX: -12, driftY: -25, rotate: -60 },
  { id: 9, leftPct: 48, topPct: 24, size: 7, duration: 9.8, delay: 3.0, driftX: 10, driftY: -20, rotate: 25 },
  { id: 10, leftPct: 82, topPct: 92, size: 9, duration: 10.2, delay: 1.8, driftX: -15, driftY: -24, rotate: 45 },
];

/**
 * Lapisan partikel melayang ringan yang menyesuaikan nuansa masing-masing tema undangan:
 * - floral: kelopak sakura merah muda lembut
 * - starlight / royal / javanese: serbuk emas / kilau bintang
 * - botanical / boho: siluet daun & percikan hangat
 * - editorial / polaroid: bokeh minimalis halus
 */
export function InvitationAmbientParticles({
  layout,
  embedded = false,
}: {
  layout: InvitationLayoutStyle;
  embedded?: boolean;
}) {
  const seeds = embedded ? PARTICLE_SEEDS.slice(0, 6) : PARTICLE_SEEDS;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none ${
        embedded ? "absolute" : "fixed"
      } inset-0 z-0 overflow-hidden`}
    >
      {seeds.map((p) => {
        const shape = (() => {
          if (layout === "floral") {
            return (
              <span
                style={{ width: p.size, height: p.size * 0.72 }}
                className="block rounded-tl-full rounded-br-full bg-[#E598AE]/45 shadow-[0_0_8px_rgba(229,152,174,0.3)]"
              />
            );
          }
          if (
            layout === "starlight" ||
            layout === "royal" ||
            layout === "javanese"
          ) {
            return (
              <span
                style={{ width: p.size * 0.65, height: p.size * 0.65 }}
                className={`block rotate-45 ${
                  layout === "starlight"
                    ? "bg-[#E2BD78]/55 shadow-[0_0_10px_rgba(226,189,120,0.5)]"
                    : "bg-[#C69C4D]/35"
                }`}
              />
            );
          }
          if (layout === "botanical" || layout === "boho") {
            return (
              <span
                style={{ width: p.size, height: p.size * 0.62 }}
                className={`block rounded-tl-full rounded-br-full ${
                  layout === "boho" ? "bg-[#C87D55]/30" : "bg-[#537662]/28"
                }`}
              />
            );
          }
          return (
            <span
              style={{ width: p.size * 0.8, height: p.size * 0.8 }}
              className="block rounded-full bg-[#8A7968]/20"
            />
          );
        })();

        return (
          <motion.div
            key={p.id}
            style={{ left: `${p.leftPct}%`, top: `${p.topPct}%` }}
            className="absolute"
            initial={{ opacity: 0.15, x: 0, y: 0, rotate: 0 }}
            animate={{
              opacity: [0.15, 0.7, 0.2],
              x: [0, p.driftX, -p.driftX * 0.4, 0],
              y: [0, p.driftY, p.driftY * 0.35, 0],
              rotate: [0, p.rotate, -p.rotate * 0.5, 0],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {shape}
          </motion.div>
        );
      })}
    </div>
  );
}
