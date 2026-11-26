"use client";

import { motion } from "motion/react";

/**
 * Transisi halaman global: setiap navigasi route memicu fade halus.
 * Sengaja hanya opacity (tanpa transform) agar elemen `position: fixed`
 * seperti sidebar & bottom nav tidak ikut bergeser selama animasi.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
