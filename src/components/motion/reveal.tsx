"use client";

import { motion, type Variants } from "motion/react";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Fade + slide-up saat elemen masuk viewport (sekali saja).
 * Bisa dipakai di Server Component sebagai pembungkus.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: "div" | "section" | "li";
}) {
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </Comp>
  );
}

const containerVariants: Variants = {
  hidden: {},
  show: (stagger: number) => ({
    transition: { staggerChildren: stagger },
  }),
};

export const revealItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE },
  },
};

/**
 * Container yang menampilkan anak-anaknya bergiliran.
 * Setiap anak harus dibungkus <RevealItem>.
 */
export function RevealStagger({
  children,
  className,
  stagger = 0.08,
  inView = true,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  /** false = animasikan saat mount (untuk konten di atas lipatan / dashboard) */
  inView?: boolean;
}) {
  return (
    <motion.div
      className={className}
      variants={containerVariants}
      custom={stagger}
      initial="hidden"
      {...(inView
        ? { whileInView: "show", viewport: { once: true, margin: "-60px" } }
        : { animate: "show" })}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={cn(className)} variants={revealItemVariants}>
      {children}
    </motion.div>
  );
}
