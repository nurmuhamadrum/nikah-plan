"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Header sticky bersih yang menyatu di atas Hero dan mendapat garis tipis saat discroll.
 */
export function ScrollHeader({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 14);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-200",
        scrolled
          ? "border-b border-black/[0.06] bg-white/90 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      )}
    >
      {children}
    </header>
  );
}
