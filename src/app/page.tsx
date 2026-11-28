import Link from "next/link";
import { ArrowUpRight, Heart, Tag } from "lucide-react";
import {
  getDynamicPricingPlans,
  getDynamicSiteContents,
} from "@/lib/dynamic-config";
import { formatIDR } from "@/lib/utils";
import { NikahPlanLogo } from "@/components/brand/logo";
import { HeroSection } from "@/components/landing/hero-section";
import { BentoShowcase } from "@/components/landing/bento-showcase";
import { RomanticStorySection } from "@/components/landing/romantic-story-section";
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

        {/* 2. Bento Showcase 3-Kolom + 3 Metrik */}
        <BentoShowcase />

        {/* 3. 4 Babak Perjalanan Cinta & Kutipan Puitis */}
        <RomanticStorySection />

        {/* 4. Harga Couple Pass */}
        <PricingSection plans={plans} />

        {/* 5. Pertanyaan Umum (FAQ) */}
        <FaqSection />

        {/* 6. Kartu Penutup Romantis (Final CTA Band) */}
        <section className="px-4 pb-16 sm:pb-24">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.25rem] border border-[#E09F3E]/25 bg-midnight-luxury px-6 py-12 text-center text-white shadow-lift sm:px-12 sm:py-16">
            {/* Ornamen Botani Monoline Halus di Kedua Sudut */}
            <svg
              viewBox="0 0 180 180"
              fill="none"
              aria-hidden="true"
              className="pointer-events-none absolute -top-6 -right-6 h-44 w-44 text-white/[0.08]"
            >
              <path
                d="M168 12C136 38 106 82 78 164"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <path
                d="M142 34C128 18 108 16 96 22C108 36 126 42 142 34Z"
                stroke="currentColor"
                strokeWidth="1.1"
              />
              <path
                d="M124 62C142 58 158 66 164 80C146 82 132 74 124 62Z"
                stroke="currentColor"
                strokeWidth="1.1"
              />
            </svg>
            <svg
              viewBox="0 0 180 180"
              fill="none"
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-8 -left-6 h-44 w-44 rotate-180 text-[#E09F3E]/[0.12]"
            >
              <path
                d="M168 12C136 38 106 82 78 164"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <path
                d="M142 34C128 18 108 16 96 22C108 36 126 42 142 34Z"
                stroke="currentColor"
                strokeWidth="1.1"
              />
            </svg>

            <div className="relative z-10 mx-auto max-w-xl space-y-4">
              <p className="font-script text-3xl sm:text-4xl text-[#E09F3E] leading-none">
                From &ldquo;I Do&rdquo; to Honeymoon
              </p>
              <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight leading-tight">
                Siap merangkai hari bahagia kalian?
              </h2>
              <p className="text-xs sm:text-sm text-white/75 leading-relaxed">
                Mulai susun anggaran nikah, undangan online, dan rencana bulan
                madu dalam satu ruang pribadi berdua. Cukup 1× bayar untuk
                selamanya.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/login?next=/checkout"
                  className="group inline-flex items-center gap-3 rounded-full bg-white py-2 pl-6 pr-2 text-sm font-semibold text-[#141618] shadow-sm transition-colors hover:bg-[#F4F5F7]"
                >
                  <span>Mulai Rencana Berdua</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/10 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer 1 Baris Minimal */}
      <footer className="border-t border-black/[0.06] bg-white px-4 py-7">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-3 text-xs text-[#6B746F] sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-2.5">
            <NikahPlanLogo size="sm" />
            <span className="text-black/20">&middot;</span>
            <span>&copy; {new Date().getFullYear()} NikahPlan</span>
            <span className="hidden sm:inline text-black/20">&middot;</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[#727B88]">
              Dibuat dengan <Heart className="h-3 w-3 text-[#E09F3E]" /> untuk
              pasangan Indonesia
            </span>
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
