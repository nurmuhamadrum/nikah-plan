import Link from "next/link";
import { Tag } from "lucide-react";
import {
  getDynamicPricingPlans,
  getDynamicSiteContents,
} from "@/lib/dynamic-config";
import { formatIDR } from "@/lib/utils";
import { NikahPlanLogo } from "@/components/brand/logo";
import { HeroSection } from "@/components/landing/hero-section";
import { BentoShowcase } from "@/components/landing/bento-showcase";
import { ScrollHeader } from "@/components/landing/scroll-header";
import { PricingSection } from "@/components/landing/pricing-section";
import { FaqSection } from "@/components/landing/faq-section";

export const revalidate = 60;

export default async function LandingPage() {
  const [plans, contents] = await Promise.all([
    getDynamicPricingPlans(),
    getDynamicSiteContents(),
  ]);

  const { hero, announcement } = contents;
  const lowestPrice = Math.min(
    plans.WEDDING_ONLY.price,
    plans.COMPLETE_PASS.price
  );

  return (
    <div className="min-h-screen overflow-x-clip text-foreground">
      {/* Dynamic Announcement Bar (managed from /admin) */}
      {announcement.enabled && announcement.text && (
        <div className="bg-midnight-luxury px-4 py-2 text-center text-xs font-medium text-white">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-2">
            <Tag className="h-3.5 w-3.5 shrink-0 text-amberwarm" />
            <span>{announcement.text}</span>
            {announcement.promoCode && (
              <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 font-mono text-[11px] font-bold tracking-wider">
                {announcement.promoCode}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Navbar Minimalis Terpusat (Logo kiri · Link tengah · Pill gelap kanan) */}
      <ScrollHeader>
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/" aria-label="NikahPlan Beranda">
            <NikahPlanLogo size="md" />
          </Link>

          <nav className="hidden items-center gap-8 text-xs font-semibold text-[#4E5752] sm:flex">
            <a
              href="#simulasi"
              className="transition-colors hover:text-[#161917]"
            >
              Simulasi
            </a>
            <a
              href="#fitur"
              className="transition-colors hover:text-[#161917]"
            >
              Fitur
            </a>
            <a
              href="#harga"
              className="transition-colors hover:text-[#161917]"
            >
              Harga
            </a>
            <Link
              href="/user-guide"
              className="transition-colors hover:text-[#161917]"
            >
              Panduan
            </Link>
          </nav>

          <Link
            href="/login"
            className="inline-flex h-9 items-center justify-center rounded-full bg-midnight-btn px-5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          >
            Masuk
          </Link>
        </div>
      </ScrollHeader>

      <main>
        {/* 1. Centered Hero + Tablet Dashboard Simulator */}
        <HeroSection hero={hero} lowestPriceLabel={formatIDR(lowestPrice)} />

        {/* 2. Bento Showcase 3-Kolom + 3 Metrik + Highlight Honeymoon */}
        <BentoShowcase />

        {/* 3. Harga Couple Pass */}
        <PricingSection plans={plans} />

        {/* 4. Pertanyaan Umum (FAQ) */}
        <FaqSection />
      </main>

      {/* Footer 1 Baris Minimal */}
      <footer className="border-t border-black/[0.06] bg-white px-4 py-7">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-3 text-xs text-[#6B746F] sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <NikahPlanLogo size="sm" />
            <span className="text-black/20">&middot;</span>
            <span>&copy; {new Date().getFullYear()} NikahPlan</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-medium text-[#161917]">
            <Link href="/user-guide" className="hover:text-sage">
              Panduan
            </Link>
            <Link href="/terms" className="hover:text-sage">
              Syarat &amp; Ketentuan
            </Link>
            <Link href="/privacy" className="hover:text-sage">
              Privasi
            </Link>
            <Link href="/login" className="hover:text-sage">
              Masuk
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
