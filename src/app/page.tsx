import Link from "next/link";
import {
  CalendarClock,
  Gift,
  HeartHandshake,
  Plane,
  ShieldCheck,
  WifiOff,
  Wallet,
  ArrowRight,
  Sparkles,
  Tag,
} from "lucide-react";
import {
  getDynamicPricingPlans,
  getDynamicSiteContents,
} from "@/lib/dynamic-config";
import { formatIDR } from "@/lib/utils";
import { NikahPlanLogo } from "@/components/brand/logo";
import { BotanicalCorner } from "@/components/brand/botanical-accent";
import { InteractiveBudgetPreview } from "@/components/landing/interactive-budget-preview";
import { PricingSection } from "@/components/landing/pricing-section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const revalidate = 60;

const FEATURES = [
  {
    icon: CalendarClock,
    title: "Pelacak Termin DP & Pelunasan",
    desc: "Bandingkan estimasi awal vs harga deal vendor, pantau Booking Fee, DP 30%, hingga pelunasan H-14 lengkap dengan bukti bayar.",
    accent: "bg-sage-50 text-sage",
  },
  {
    icon: HeartHandshake,
    title: "Split Funding Transparan",
    desc: "Pisahkan sumber dana Tabungan Bersama, Keluarga Pria, dan Keluarga Wanita secara otomatis tanpa ribet di spreadsheet.",
    accent: "bg-terracotta-50 text-terracotta",
  },
  {
    icon: Gift,
    title: "Angpao Bridge ke Honeymoon",
    desc: "Catat amplop & hadiah pasca-resepsi lalu alokasikan dalam 1 klik untuk menutup sisa tagihan vendor atau mengisi Dompet Honeymoon.",
    accent: "bg-amberwarm-light text-sage-900",
  },
  {
    icon: Plane,
    title: "Dompet Honeymoon & Uang Jajan",
    desc: "Hitung otomatis jatah uang saku harian, catat belanja multi-mata uang (JPY, EUR, THB, SGD, USD) dengan konversi kurs IDR.",
    accent: "bg-sage-50 text-sage",
  },
  {
    icon: WifiOff,
    title: "PWA Offline-First",
    desc: "Tetap lancar input biaya saat sinyal lemah di wedding expo atau saat traveling di luar negeri. Sinkron otomatis saat kembali online.",
    accent: "bg-terracotta-50 text-terracotta",
  },
  {
    icon: Wallet,
    title: "1x Bayar untuk Berdua",
    desc: "Undang pasangan lewat tautan WhatsApp. Pasangan langsung masuk ke workspace bersama tanpa perlu membayar ulang.",
    accent: "bg-amberwarm-light text-sage-900",
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
    <div className="min-h-screen bg-cream text-foreground overflow-x-hidden">
      {/* Dynamic Announcement Promo Banner (managed from /admin) */}
      {announcement.enabled && announcement.text && (
        <div className="bg-sage text-cream-50 px-4 py-2 text-center text-xs font-medium">
          <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-center gap-2">
            <Tag className="h-3.5 w-3.5 text-terracotta-200 shrink-0" />
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
      <header className="sticky top-0 z-40 border-b border-sage/10 bg-cream/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" aria-label="NikahPlan Beranda">
            <NikahPlanLogo size="md" />
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-sage-700">
            <a href="#simulasi" className="hover:text-sage-900 transition-colors">
              Simulasi Budget
            </a>
            <a href="#fitur" className="hover:text-sage-900 transition-colors">
              Fitur Utama
            </a>
            <a href="#harga" className="hover:text-sage-900 transition-colors">
              Harga Couple Pass
            </a>
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
      </header>

      {/* Hero Section + Interactive Budget Preview */}
      <section className="relative pt-10 pb-16 sm:pt-16 sm:pb-24 px-4">
        <BotanicalCorner
          className="hidden lg:block absolute top-0 right-0 h-56 w-56 opacity-30"
          variant="sage"
        />

        <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <Badge variant="softSage" className="mx-auto lg:mx-0">
              <Sparkles className="h-3.5 w-3.5 text-terracotta" />
              {hero.badge}
            </Badge>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.35rem] font-bold leading-[1.12] tracking-tight text-sage-900">
              {hero.headline}{" "}
              <span className="text-terracotta">{hero.headlineAccent}</span>{" "}
              {hero.headlineSuffix}
            </h1>

            <p className="text-base sm:text-lg text-sage-700/90 leading-relaxed max-w-xl mx-auto lg:mx-0">
              {hero.subheadline}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-1">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/login?next=/checkout">
                  {hero.primaryCta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
              >
                <a href="#harga">
                  {hero.secondaryCta} ({formatIDR(lowestPrice)})
                </a>
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 pt-2 text-xs font-medium text-sage-700">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-sage" />
                Bayar 1x untuk 2 Akun
              </span>
              <span className="inline-flex items-center gap-1.5">
                <WifiOff className="h-4 w-4 text-sage" />
                Bisa Dipakai Offline
              </span>
              <span className="inline-flex items-center gap-1.5">
                <HeartHandshake className="h-4 w-4 text-terracotta" />
                Khusus Pengantin Indonesia
              </span>
            </div>
          </div>

          {/* Interactive Budget Preview Widget */}
          <div id="simulasi" className="lg:col-span-6">
            <InteractiveBudgetPreview />
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section id="fitur" className="py-16 sm:py-24 px-4 bg-white/65 border-y border-sage/10">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <Badge variant="softSage">Ekosistem Terpadu</Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-sage-900">
              Dirancang Khusus untuk Realita Persiapan Nikah di Indonesia
            </h2>
            <p className="text-sm sm:text-base text-sage-700/85">
              Bukan sekadar tabel Excel di layar kecil. Setiap fitur menjawab
              kebutuhan nyata calon pengantin dari lamaran sampai pulang bulan
              madu.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((item) => {
              const Icon = item.icon;
              return (
                <Card
                  key={item.title}
                  className="rounded-2xl border-sage/10 bg-white hover:shadow-soft transition-shadow"
                >
                  <CardContent className="p-6 space-y-3">
                    <div
                      className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${item.accent}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-sage-900">
                      {item.title}
                    </h3>
                    <p className="text-sm text-sage-700/85 leading-relaxed">
                      {item.desc}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Dynamic Pricing Section */}
      <PricingSection plans={plans} />

      {/* Footer */}
      <footer className="border-t border-sage/10 bg-cream-200/50 py-10 px-4">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <NikahPlanLogo size="sm" />
            <span className="hidden sm:inline text-sage-400">|</span>
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
