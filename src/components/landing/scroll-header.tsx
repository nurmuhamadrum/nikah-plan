"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Header sticky berefek kaca yang menebal & mendapat bayangan saat halaman discroll.
 */
export function ScrollHeader({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-sage/12 bg-cream-50/85 shadow-soft backdrop-blur-xl"
          : "border-b border-transparent bg-cream-50/40 backdrop-blur-sm"
      )}
    >
      {children}
    </header>
  );
}
