"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const SPLASH_SESSION_KEY = "nikahplan_pwa_splash_shown_v1";

/**
 * Branded Midnight Velvet cold-start splash overlay.
 * Hanya muncul saat aplikasi dijalankan dalam mode PWA standalone
 * (Home Screen iOS / Android) dan maksimal 1x per sesi.
 */
export function PwaSplashScreen() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((window.navigator as { standalone?: boolean }).standalone);

    if (!isStandalone) return;

    try {
      if (window.sessionStorage.getItem(SPLASH_SESSION_KEY)) return;
      window.sessionStorage.setItem(SPLASH_SESSION_KEY, "1");
    } catch {
      // Abaikan jika sessionStorage dibatasi browser
    }

    setVisible(true);
    const timer = window.setTimeout(() => {
      setVisible(false);
    }, 850);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="pwa-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden="true"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-midnight-luxury px-6 text-white select-none"
        >
          {/* Ambient Soft Radial Glow */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#4F6BF6]/25 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#E09F3E]/20 blur-3xl" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex flex-col items-center text-center"
          >
            {/* Intertwined Rings Emblem */}
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-[#E09F3E]/35 bg-white/[0.06] shadow-2xl backdrop-blur-md">
              <svg
                width="48"
                height="48"
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="25"
                  cy="34"
                  r="14"
                  stroke="#E09F3E"
                  strokeWidth="3.2"
                />
                <circle
                  cx="39"
                  cy="34"
                  r="14"
                  stroke="#8BA2FF"
                  strokeWidth="3.2"
                />
                <path
                  d="M32 14L35.2 20L32 23.5L28.8 20L32 14Z"
                  fill="#F6D38C"
                />
              </svg>
            </div>

            <h1 className="font-display text-3xl font-extrabold tracking-tight text-white">
              Nikah<span className="text-[#E09F3E]">Plan</span>
            </h1>
            <p className="mt-1 font-script text-2xl text-[#F6D38C]/90">
              From &ldquo;I Do&rdquo; to Honeymoon
            </p>

            {/* Golden Shimmer Progress Pill */}
            <div className="mt-8 h-1 w-28 overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 0.9, ease: "easeInOut", repeat: Infinity }}
                className="h-full w-2/3 rounded-full bg-gradient-to-r from-transparent via-[#E09F3E] to-transparent"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
