"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  Gift,
  HelpCircle,
  LayoutDashboard,
  Lightbulb,
  Mail,
  Plane,
  ReceiptText,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  WifiOff,
  X,
} from "lucide-react";
import {
  QUICK_START_JOURNEY,
  USER_GUIDE_CATEGORIES,
  USER_GUIDE_FAQS,
  USER_GUIDE_SECTIONS,
  type UserGuideCategory,
  type UserGuideIconKey,
} from "@/lib/user-guide-content";
import { NikahPlanLogo } from "@/components/brand/logo";
import { BotanicalCorner } from "@/components/brand/botanical-accent";
import { FloatingBotanicals } from "@/components/brand/floating-botanicals";
import { ScrollHeader } from "@/components/landing/scroll-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const SECTION_ICONS: Record<UserGuideIconKey, typeof Rocket> = {
  rocket: Rocket,
  dashboard: LayoutDashboard,
  vendors: ReceiptText,
  angpao: Gift,
  honeymoon: Plane,
  undangan: Mail,
  panduan: Compass,
  offline: WifiOff,
  shield: ShieldCheck,
};

const ICON_ACCENTS: Record<UserGuideIconKey, string> = {
  rocket: "from-sage-100 to-sage-50 text-sage",
  dashboard: "from-terracotta-100 to-terracotta-50 text-terracotta",
  vendors: "from-sage-100 to-sage-50 text-sage",
  angpao: "from-amberwarm-light to-cream-100 text-sage-900",
  honeymoon: "from-terracotta-100 to-terracotta-50 text-terracotta",
  undangan: "from-amberwarm-light to-cream-100 text-sage-900",
  panduan: "from-sage-100 to-sage-50 text-sage",
  offline: "from-terracotta-100 to-terracotta-50 text-terracotta",
  shield: "from-sage-100 to-sage-50 text-sage",
};

export function UserGuideClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] =
    useState<UserGuideCategory>("ALL");
  const [openFaqId, setOpenFaqId] = useState<string | null>(
    USER_GUIDE_FAQS[0]?.id ?? null
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredSections = useMemo(() => {
    return USER_GUIDE_SECTIONS.filter((sec) => {
      if (activeCategory !== "ALL" && sec.category !== activeCategory) {
        return false;
      }
      if (!normalizedQuery) return true;
      const haystack = [
        sec.title,
        sec.subtitle,
        sec.overview,
        sec.proTip,
        ...sec.keywords,
        ...sec.highlights,
        ...sec.steps.flatMap((s) => [s.title, s.detail]),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [activeCategory, normalizedQuery]);

  const filteredFaqs = useMemo(() => {
    if (!normalizedQuery) return USER_GUIDE_FAQS;
    return USER_GUIDE_FAQS.filter((faq) => {
      const haystack = [faq.question, faq.answer, ...faq.keywords]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery]);

  return (
    <div className="min-h-screen overflow-x-clip text-foreground">
      {/* Sticky Header */}
      <ScrollHeader>
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href={isLoggedIn ? "/dashboard" : "/"} aria-label="NikahPlan">
              <NikahPlanLogo size="md" />
            </Link>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-sage/15 bg-white/80 px-2.5 py-0.5 text-[11px] font-semibold text-sage-700">
              <BookOpen className="h-3 w-3 text-terracotta" />
              User Guide
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/settings">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Pengaturan
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/dashboard">Buka Dashboard</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/">Beranda</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/login">Masuk</Link>
                </Button>
                <Button asChild size="sm" className="hidden sm:inline-flex">
                  <Link href="/login?next=/checkout">Mulai Sekarang</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </ScrollHeader>

      {/* Hero Banner */}
      <section className="relative px-4 pt-8 pb-8 sm:pt-12 sm:pb-10">
        <div className="mx-auto max-w-6xl">
          <div className="relative overflow-hidden rounded-[2.25rem] bg-gradient-to-br from-sage-700 via-sage to-sage-900 px-6 py-10 text-cream-50 shadow-lift sm:px-10 sm:py-12">
            <div
              aria-hidden="true"
              className="pattern-leaves absolute inset-0 opacity-75"
            />
            <BotanicalCorner
              className="pointer-events-none absolute -bottom-6 -right-4 h-44 w-44 opacity-25"
              variant="terracotta"
            />

            <div className="relative z-10 max-w-3xl space-y-4">
              <Badge
                variant="outline"
                className="border-white/25 bg-white/10 text-cream-50 text-xs"
              >
                <BookOpen className="h-3.5 w-3.5 text-amberwarm" />
                Buku Panduan Resmi Penggunaan Aplikasi
              </Badge>

              <h1 className="font-display text-3xl font-semibold leading-tight sm:text-4xl lg:text-[2.75rem]">
                Panduan Lengkap Menggunakan{" "}
                <span className="font-script text-[1.25em] font-normal text-amberwarm">
                  NikahPlan
                </span>
              </h1>

              <p className="text-sm leading-relaxed text-cream-200/90 sm:text-base">
                Pelajari cara memaksimalkan seluruh 9 modul fitur — mulai dari
                aktivasi 1x bayar berdua, pelacakan termin DP &amp; bukti bayar,
                Angpao Bridge, Dompet Honeymoon, hingga membuat Undangan Online
                8 tema sendiri.
              </p>

              {/* Live Search Bar */}
              <div className="pt-2 max-w-xl">
                <div className="relative flex items-center">
                  <Search className="pointer-events-none absolute left-4 h-4 w-4 text-sage-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari fitur atau cara pakai... (cth: undangan, DP, angpao, offline, PDF)"
                    aria-label="Cari panduan fitur"
                    className="h-12 w-full rounded-2xl border border-white/20 bg-white/95 pl-11 pr-10 text-sm text-sage-900 placeholder:text-sage-500 shadow-soft focus:outline-none focus:ring-2 focus:ring-amberwarm"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label="Hapus pencarian"
                      className="absolute right-3 rounded-full p-1 text-sage-500 hover:bg-sage-100 hover:text-sage-900"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                {USER_GUIDE_CATEGORIES.map((cat) => {
                  const active = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                        active
                          ? "bg-amberwarm text-sage-950 shadow-sm"
                          : "border border-white/20 bg-white/10 text-cream-100 hover:bg-white/20"
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start 4-Step Strip (sembunyikan saat sedang mengetik query pencarian) */}
      {!normalizedQuery && activeCategory === "ALL" && (
        <section className="px-4 pb-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {QUICK_START_JOURNEY.map((item) => (
                <a
                  key={item.step}
                  href={`#${item.targetId}`}
                  className="group rounded-2xl border border-sage/12 bg-white/85 p-4 shadow-card backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-sage/30 hover:shadow-soft"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-terracotta">
                      LANGKAH {item.step}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-sage-400 transition-transform group-hover:translate-x-0.5 group-hover:text-sage" />
                  </div>
                  <p className="mt-1.5 font-display text-base font-semibold text-sage-900">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-sage-600">
                    {item.desc}
                  </p>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Content: Sticky TOC (Desktop) + Detailed Feature Cards */}
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start lg:gap-8">
          {/* Desktop Sticky Sidebar TOC */}
          <aside className="hidden lg:block lg:sticky lg:top-20 space-y-4">
            <Card className="glass-strong rounded-3xl shadow-card">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-sage-700">
                    Daftar Isi Fitur
                  </p>
                  <span className="rounded-full bg-sage-50 px-2 py-0.5 text-[10px] font-bold text-sage-700">
                    {filteredSections.length} Bab
                  </span>
                </div>

                <nav aria-label="Daftar Isi User Guide" className="space-y-1">
                  {filteredSections.map((sec) => (
                    <a
                      key={sec.id}
                      href={`#${sec.id}`}
                      className="flex items-start gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-sage-700 transition-colors hover:bg-sage-50 hover:text-sage-900"
                    >
                      <span className="font-mono text-[11px] font-bold text-terracotta shrink-0">
                        {sec.number}
                      </span>
                      <span className="line-clamp-2 leading-snug">
                        {sec.title}
                      </span>
                    </a>
                  ))}
                  <a
                    href="#faq-user-guide"
                    className="flex items-start gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-sage-700 transition-colors hover:bg-sage-50 hover:text-sage-900 border-t border-sage/10 mt-1 pt-2.5"
                  >
                    <HelpCircle className="h-3.5 w-3.5 text-terracotta shrink-0 mt-0.5" />
                    <span>FAQ &amp; Solusi Cepat</span>
                  </a>
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* Feature Sections */}
          <div className="space-y-6 min-w-0">
            {/* Mobile Horizontal Quick-Jump Pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {filteredSections.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-sage/15 bg-white/90 px-3 py-1.5 text-xs font-semibold text-sage-800 shadow-sm"
                >
                  <span className="font-mono text-[10px] text-terracotta">
                    {sec.number}
                  </span>
                  {sec.title.split(",")[0]}
                </a>
              ))}
            </div>

            {filteredSections.length === 0 ? (
              <Card className="glass-strong rounded-3xl shadow-card">
                <CardContent className="p-8 text-center space-y-3">
                  <Search className="mx-auto h-8 w-8 text-sage-400" />
                  <h2 className="font-display text-lg font-semibold text-sage-900">
                    Panduan tidak ditemukan
                  </h2>
                  <p className="text-xs sm:text-sm text-sage-600 max-w-md mx-auto">
                    Tidak ada bab yang cocok dengan kata kunci &ldquo;
                    {searchQuery}&rdquo;. Coba kata kunci lain seperti{" "}
                    <strong>vendor</strong>, <strong>angpao</strong>,{" "}
                    <strong>undangan</strong>, atau <strong>offline</strong>.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setActiveCategory("ALL");
                    }}
                  >
                    Tampilkan Semua Fitur
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredSections.map((sec) => {
                const Icon = SECTION_ICONS[sec.iconKey];
                const isCompleteOnly =
                  sec.planBadge === "Eksklusif Complete Pass";

                return (
                  <article
                    key={sec.id}
                    id={sec.id}
                    className="scroll-mt-20 rounded-3xl border border-sage/12 bg-white/90 p-5 shadow-card backdrop-blur-sm sm:p-7 space-y-5"
                  >
                    {/* Header Bab */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-sage/10 pb-4">
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-sm ${ICON_ACCENTS[sec.iconKey]}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-terracotta">
                              BAB {sec.number}
                            </span>
                            <Badge
                              variant={
                                isCompleteOnly ? "softTerracotta" : "softSage"
                              }
                              className="text-[10.5px]"
                            >
                              {isCompleteOnly && (
                                <Sparkles className="h-3 w-3" />
                              )}
                              {sec.planBadge}
                            </Badge>
                          </div>
                          <h2 className="mt-1 font-display text-xl font-semibold text-sage-900 sm:text-2xl">
                            {sec.title}
                          </h2>
                          <p className="mt-0.5 text-xs text-sage-600 sm:text-sm">
                            {sec.subtitle}
                          </p>
                        </div>
                      </div>

                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="shrink-0 self-start"
                      >
                        <Link
                          href={
                            isLoggedIn
                              ? sec.routeHref
                              : `/login?next=${encodeURIComponent(sec.routeHref)}`
                          }
                        >
                          {sec.routeLabel}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>

                    {/* Ringkasan */}
                    <p className="text-sm leading-relaxed text-sage-700">
                      {sec.overview}
                    </p>

                    {/* Langkah-Langkah Penggunaan */}
                    <div className="space-y-2.5">
                      <p className="text-xs font-bold uppercase tracking-wider text-sage-800">
                        Langkah Penggunaan
                      </p>
                      <ol className="space-y-3">
                        {sec.steps.map((st, idx) => (
                          <li
                            key={st.title}
                            className="flex items-start gap-3 rounded-2xl border border-sage/10 bg-cream-50/75 p-3.5"
                          >
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage text-xs font-bold text-cream-50">
                              {idx + 1}
                            </span>
                            <div className="min-w-0 space-y-0.5">
                              <p className="text-xs font-bold text-sage-900 sm:text-sm">
                                {st.title}
                              </p>
                              <p className="text-xs leading-relaxed text-sage-700">
                                {st.detail}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Kemampuan Utama */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-sage-800">
                        Kemampuan Utama
                      </p>
                      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {sec.highlights.map((hl) => (
                          <li
                            key={hl}
                            className="flex items-start gap-2 rounded-2xl border border-sage/10 bg-white p-3 text-xs leading-relaxed text-sage-700"
                          >
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                            <span>{hl}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Tips Pro */}
                    <div className="flex items-start gap-2.5 rounded-2xl border border-amberwarm/35 bg-amberwarm-light/45 px-4 py-3 text-xs leading-relaxed text-sage-900">
                      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
                      <div>
                        <strong className="text-terracotta-800">
                          Tips Pro:{" "}
                        </strong>
                        {sec.proTip}
                      </div>
                    </div>
                  </article>
                );
              })
            )}

            {/* Bagian FAQ & Pemecahan Masalah */}
            <section
              id="faq-user-guide"
              className="scroll-mt-20 rounded-3xl border border-sage/12 bg-white/90 p-5 shadow-card backdrop-blur-sm sm:p-7 space-y-4"
            >
              <div className="space-y-1">
                <Badge variant="softSage" className="text-[11px]">
                  <HelpCircle className="h-3 w-3" />
                  Tanya Jawab &amp; Solusi Cepat
                </Badge>
                <h2 className="font-display text-xl font-semibold text-sage-900 sm:text-2xl">
                  Pertanyaan yang Sering Diajukan (FAQ)
                </h2>
              </div>

              {filteredFaqs.length === 0 ? (
                <p className="text-xs text-sage-600">
                  Tidak ada FAQ yang cocok dengan pencarian Anda.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {filteredFaqs.map((faq) => {
                    const isOpen = openFaqId === faq.id;
                    return (
                      <div
                        key={faq.id}
                        className="overflow-hidden rounded-2xl border border-sage/12 bg-cream-50/70"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenFaqId(isOpen ? null : faq.id)
                          }
                          aria-expanded={isOpen}
                          className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-xs font-bold text-sage-900 hover:bg-sage-50/60 transition-colors sm:text-sm"
                        >
                          <span>{faq.question}</span>
                          {isOpen ? (
                            <ChevronUp className="h-4 w-4 shrink-0 text-sage-600" />
                          ) : (
                            <ChevronDown className="h-4 w-4 shrink-0 text-sage-600" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="border-t border-sage/10 bg-white px-4 py-3.5 text-xs leading-relaxed text-sage-700 sm:text-sm">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Closing CTA */}
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-sage-700 via-sage to-sage-800 px-6 py-9 text-center text-cream-50 shadow-lift sm:px-10">
              <div
                aria-hidden="true"
                className="pattern-leaves absolute inset-0 opacity-75"
              />
              <FloatingBotanicals preset="page" className="opacity-40" />
              <div className="relative z-10 space-y-3">
                <p className="font-script text-3xl text-amberwarm sm:text-4xl">
                  Siap Merencanakan Tanpa Drama?
                </p>
                <h3 className="mx-auto max-w-xl font-display text-xl font-semibold sm:text-2xl">
                  {isLoggedIn
                    ? "Lanjutkan pengelolaan anggaran & undangan pernikahan kalian sekarang."
                    : "Aktifkan Couple Pass 1x bayar untuk berdua dan coba seluruh fiturnya hari ini."}
                </h3>
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                  {isLoggedIn ? (
                    <>
                      <Button asChild size="lg">
                        <Link href="/dashboard">Buka Dashboard</Link>
                      </Button>
                      <Button
                        asChild
                        size="lg"
                        variant="outline"
                        className="border-white/30 bg-white/10 text-cream-50 hover:bg-white/20"
                      >
                        <Link href="/undangan">Buka Builder Undangan</Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button asChild size="lg">
                        <Link href="/login?next=/checkout">
                          Aktifkan Couple Pass
                        </Link>
                      </Button>
                      <Button
                        asChild
                        size="lg"
                        variant="outline"
                        className="border-white/30 bg-white/10 text-cream-50 hover:bg-white/20"
                      >
                        <Link href="/">Lihat Simulasi &amp; Harga</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-sage/10 bg-white/40 px-4 py-8 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex flex-col items-center gap-2.5 sm:flex-row">
            <NikahPlanLogo size="sm" />
            <span className="hidden text-sage-400 sm:inline">|</span>
            <p className="text-xs text-sage-700">
              User Guide &amp; Dokumentasi Penggunaan NikahPlan
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
