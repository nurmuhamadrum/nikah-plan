import Link from "next/link";
import {
  CalendarClock,
  Gift,
  HeartHandshake,
  MailOpen,
  Plane,
  WifiOff,
  Tag,
} from "lucide-react";
import {
  getDynamicPricingPlans,
  getDynamicSiteContents,
} from "@/lib/dynamic-config";
import { formatIDR } from "@/lib/utils";
import { NikahPlanLogo } from "@/components/brand/logo";
import { FloatingBotanicals } from "@/components/brand/floating-botanicals";
import { HeroSection } from "@/components/landing/hero-section";
import { ScrollHeader } from "@/components/landing/scroll-header";
import { FeatureMarquee } from "@/components/landing/feature-marquee";
import { PricingSection } from "@/components/landing/pricing-section";
import { Reveal, RevealItem, RevealStagger } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const revalidate = 60;

const FEATURES = [
  {
    icon: CalendarClock,
    title: "Pelacak Termin DP & Pelunasan",
    desc: "Bandingkan estimasi awal vs harga deal vendor, pantau Booking Fee, DP 30%, hingga pelunasan H-14 lengkap dengan bukti bayar.",
    accent: "from-sage-100 to-sage-50 text-sage",
  },
  {
    icon: HeartHandshake,
    title: "Split Funding Transparan",
    desc: "Pisahkan sumber dana Tabungan Bersama, Keluarga Pria, dan Keluarga Wanita secara otomatis tanpa ribet di spreadsheet.",
    accent: "from-terracotta-100 to-terracotta-50 text-terracotta",
  },
  {
    icon: Gift,
    title: "Angpao Bridge ke Honeymoon",
    desc: "Catat amplop & hadiah pasca-resepsi lalu alokasikan dalam 1 klik untuk menutup sisa tagihan vendor atau mengisi Dompet Honeymoon.",
    accent: "from-amberwarm-light to-cream-100 text-sage-900",
  },
  {
    icon: Plane,
    title: "Dompet Honeymoon & Uang Jajan",
    desc: "Hitung otomatis jatah uang saku harian, catat belanja multi-mata uang (JPY, EUR, THB, SGD, USD) dengan konversi kurs IDR.",
    accent: "from-sage-100 to-sage-50 text-sage",
  },
  {
    icon: MailOpen,
    title: "Undangan Online Sendiri",
    desc: "Buat website undangan pernikahan ber-8 tema beragam layout lengkap dengan live preview, tautan nama tamu WhatsApp, amplop digital, RSVP & ucapan (eksklusif Complete Pass).",
    accent: "from-terracotta-100 to-terracotta-50 text-terracotta",
  },
  {
    icon: WifiOff,
    title: "Offline-First & 1x Bayar Berdua",
    desc: "Undang pasangan gratis via WhatsApp ke workspace bersama. Tetap lancar input biaya saat sinyal lemah di wedding expo atau traveling ke luar negeri.",
    accent: "from-amberwarm-light to-cream-100 text-sage-900",
  },
];

export default async function LandingPage() {
  const [plans, contents] = await Promise.all([
    getDynamicPricingPlans(),
    getDynamicSiteContents(),
  ]);

  const { hero, announcement } = contents;
  const lowestPrice = Math.min(plans.WEDDING_ONLY.price, plans.COMPLETE_PASS.price);

  return (
    <div className="min-h-screen overflow-x-clip text-foreground">
      {/* Dynamic Announcement Promo Banner (managed from /admin) */}
      {announcement.enabled && announcement.text && (
        <div className="relative overflow-hidden bg-gradient-to-r from-sage-700 via-sage to-sage-700 px-4 py-2 text-center text-xs font-medium text-cream-50">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2">
            <Tag className="h-3.5 w-3.5 shrink-0 text-terracotta-200" />
            <span>{announcement.text}</span>
            {announcement.promoCode && (
              <span className="rounded-full bg-white/15 px-2.5 py-0.5 font-mono text-[11px] font-bold tracking-wider">
                {announcement.promoCode}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Sticky Header */}
      <ScrollHeader>
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" aria-label="NikahPlan Beranda">
            <NikahPlanLogo size="md" />
          </Link>

          <nav className="hidden items-center gap-1 text-sm font-semibold text-sage-700 md:flex">
            {[
              { href: "#simulasi", label: "Simulasi Budget" },
              { href: "#fitur", label: "Fitur Utama" },
              { href: "#harga", label: "Harga Couple Pass" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-full px-4 py-2 transition-colors hover:bg-white/70 hover:text-sage-900"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Masuk</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/login?next=/checkout">Mulai Sekarang</Link>
            </Button>
          </div>
        </div>
      </ScrollHeader>

      {/* Hero Section + Interactive Budget Preview */}
      <HeroSection hero={hero} lowestPriceLabel={formatIDR(lowestPrice)} />

      {/* Marquee fitur */}
      <FeatureMarquee />

      {/* Feature Highlights */}
      <section id="fitur" className="relative scroll-mt-16 px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mx-auto mb-14 max-w-2xl space-y-4 text-center">
            <Badge variant="softSage">Ekosistem Terpadu</Badge>
            <h2 className="font-display text-3xl font-semibold text-sage-900 sm:text-[2.75rem] sm:leading-[1.15]">
              Dirancang Khusus untuk{" "}
              <span className="font-script text-gradient-warm text-[1.25em] font-normal">
                Realita
              </span>{" "}
              Persiapan Nikah di Indonesia
            </h2>
            <p className="text-sm text-sage-700/85 sm:text-base">
              Bukan sekadar tabel Excel di layar kecil. Setiap fitur menjawab
              kebutuhan nyata calon pengantin dari lamaran sampai pulang bulan
              madu.
            </p>
          </Reveal>

          <RevealStagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((item, idx) => {
              const Icon = item.icon;
              return (
                <RevealItem key={item.title} className="h-full">
                  <div className="group relative h-full overflow-hidden rounded-3xl border border-white/70 bg-white/75 p-6 shadow-card backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-2 -top-6 font-display text-[6.5rem] font-semibold leading-none text-sage/[0.06] transition-colors group-hover:text-terracotta/10"
                    >
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div className="relative space-y-3">
                      <div
                        className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br shadow-sm transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 ${item.accent}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-base font-bold text-sage-900">
                        {item.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-sage-700/85">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </RevealItem>
              );
            })}
          </RevealStagger>
        </div>
      </section>

      {/* Dynamic Pricing Section */}
      <PricingSection plans={plans} />

      {/* Closing CTA */}
      <section className="px-4 pb-20 sm:pb-28">
        <Reveal className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-sage-700 via-sage to-sage-800 px-6 py-14 text-center text-cream-50 shadow-lift sm:px-12">
          <div aria-hidden="true" className="pattern-leaves absolute inset-0 opacity-80" />
          <FloatingBotanicals preset="page" className="opacity-50" />
          <div className="relative space-y-5">
            <p className="font-script text-4xl text-amberwarm sm:text-5xl">
              From &ldquo;I Do&rdquo; to Honeymoon
            </p>
            <h2 className="mx-auto max-w-2xl font-display text-2xl font-semibold sm:text-4xl">
              Mulai rencanakan hari bahagia kalian dengan tenang hari ini.
            </h2>
            <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/login?next=/checkout">Aktifkan Couple Pass</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full border-white/30 bg-white/10 text-cream-50 hover:bg-white/20 sm:w-auto"
              >
                <a href="#simulasi">Coba Simulasi Gratis</a>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-sage/10 bg-white/40 px-4 py-10 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <NikahPlanLogo size="sm" />
            <span className="hidden text-sage-400 sm:inline">|</span>
            <p className="text-xs text-sage-700">
              Wedding &amp; Honeymoon Budget Planner untuk Pasangan Indonesia
            </p>
          </div>
          <p className="text-xs text-sage-600">
            &copy; {new Date().getFullYear()} NikahPlan. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
