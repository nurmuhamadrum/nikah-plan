"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calculator,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Compass,
  Copy,
  HelpCircle,
  Loader2,
  MessageCircle,
  MessageSquareQuote,
  ShieldAlert,
  Sparkles,
  Square,
  XCircle,
} from "lucide-react";
import type { WorkspaceBundle } from "@/lib/workspace-data";
import { formatIDR, formatNumberID } from "@/lib/utils";
import {
  BUDGET_SCENARIOS,
  STANDARD_WEDDING_CATEGORIES,
  buildScaledScenarioAllocations,
  type ScenarioId,
} from "@/lib/wedding-templates";
import {
  APP_QUICK_STEPS,
  DIGITAL_FIRST_CHECKLIST,
  FATAL_MISTAKES,
  GUIDE_FAQS,
  NEGOTIATION_ADDONS,
  NEGOTIATION_DOS_DONTS,
  NEGOTIATION_SCRIPTS,
  PRIORITY_PYRAMID,
  PRIORITY_STEPS,
  STATUS_COLOR_LEGEND,
  UNDER_50M_TIPS,
  WIFE_FRAMEWORK,
} from "@/lib/guide-content";
import { BotanicalCorner } from "@/components/brand/botanical-accent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

type GuideTab = "prioritas" | "skenario" | "negosiasi" | "checklist";

const GUIDE_TABS: { id: GuideTab; label: string; icon: typeof Compass }[] = [
  { id: "prioritas", label: "Prioritas", icon: Compass },
  { id: "skenario", label: "Skenario", icon: Calculator },
  { id: "negosiasi", label: "Negosiasi", icon: MessageSquareQuote },
  { id: "checklist", label: "10 Kesalahan", icon: ShieldAlert },
];

interface LocalGuideState {
  wife: Record<string, string>;
  digitalChecked: string[];
  mistakesChecked: string[];
}

const EMPTY_STATE: LocalGuideState = {
  wife: {},
  digitalChecked: [],
  mistakesChecked: [],
};

function formatDateID(dateStr: string | null | undefined): string {
  if (!dateStr) return "[tanggal pernikahan]";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "[tanggal pernikahan]";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function PanduanClient({
  initialBundle,
}: {
  initialBundle: WorkspaceBundle;
}) {
  const queryClient = useQueryClient();
  const { workspace } = initialBundle;
  const storageKey = `nikahplan:guide:${workspace.id}`;

  const [activeTab, setActiveTab] = useState<GuideTab>("prioritas");
  const [guideState, setGuideState] = useState<LocalGuideState>(EMPTY_STATE);
  const [hydrated, setHydrated] = useState(false);

  // Scenario Planner state
  const [selectedScenario, setSelectedScenario] = useState<
    ScenarioId | "CUSTOM"
  >("MID_50M");
  const [customBudget, setCustomBudget] = useState<number>(
    Number(workspace.wedding_budget_target) || 50_000_000
  );
  const [applyingScenario, setApplyingScenario] = useState(false);
  const [scenarioFeedback, setScenarioFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Negotiation script overrides
  const [scriptDate, setScriptDate] = useState<string>(
    formatDateID(workspace.wedding_date)
  );
  const [scriptGuests, setScriptGuests] = useState<number>(
    workspace.guest_estimate || 200
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Accordions
  const [openMistakeId, setOpenMistakeId] = useState<string | null>("m01");
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  // Load persisted WIFE & Checklists from localStorage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<LocalGuideState>;
        setGuideState({
          wife: parsed.wife ?? {},
          digitalChecked: Array.isArray(parsed.digitalChecked)
            ? parsed.digitalChecked
            : [],
          mistakesChecked: Array.isArray(parsed.mistakesChecked)
            ? parsed.mistakesChecked
            : [],
        });
      }
    } catch {
      // Abaikan bila localStorage tidak tersedia
    } finally {
      setHydrated(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(guideState));
    } catch {
      // Abaikan quota error
    }
  }, [guideState, hydrated, storageKey]);

  const updateWife = (letter: string, value: string) => {
    setGuideState((prev) => ({
      ...prev,
      wife: { ...prev.wife, [letter]: value },
    }));
  };

  const toggleDigitalItem = (id: string) => {
    setGuideState((prev) => {
      const exists = prev.digitalChecked.includes(id);
      return {
        ...prev,
        digitalChecked: exists
          ? prev.digitalChecked.filter((x) => x !== id)
          : [...prev.digitalChecked, id],
      };
    });
  };

  const toggleMistakeItem = (id: string) => {
    setGuideState((prev) => {
      const exists = prev.mistakesChecked.includes(id);
      return {
        ...prev,
        mistakesChecked: exists
          ? prev.mistakesChecked.filter((x) => x !== id)
          : [...prev.mistakesChecked, id],
      };
    });
  };

  // Active Scenario Breakdown
  const activeScenarioData = useMemo(() => {
    if (selectedScenario === "CUSTOM") {
      const rows = buildScaledScenarioAllocations(customBudget);
      return {
        label: "Skenario Custom",
        totalBudget: customBudget,
        guestRecommendation: Math.max(50, Math.round(customBudget / 250_000 / 25) * 25),
        rows,
      };
    }

    const sc =
      BUDGET_SCENARIOS.find((s) => s.id === selectedScenario) ??
      BUDGET_SCENARIOS[1];
    const rows = STANDARD_WEDDING_CATEGORIES.map((cat) => {
      const allocatedAmount = sc.allocations[cat.key] ?? 0;
      return {
        key: cat.key,
        name: cat.name,
        icon: cat.icon,
        allocatedAmount,
        percentage: Math.round((allocatedAmount / sc.totalBudget) * 100),
        recommendation: cat.recommendation,
      };
    });

    return {
      label: sc.name,
      totalBudget: sc.totalBudget,
      guestRecommendation: sc.guestRecommendation,
      rows,
    };
  }, [selectedScenario, customBudget]);

  const totalDigitalSavings = useMemo(() => {
    return DIGITAL_FIRST_CHECKLIST.filter((i) =>
      guideState.digitalChecked.includes(i.id)
    ).reduce((sum, i) => sum + i.savingAvg, 0);
  }, [guideState.digitalChecked]);

  const mistakesProgressPct = Math.round(
    (guideState.mistakesChecked.length / FATAL_MISTAKES.length) * 100
  );

  const handleApplyScenario = async () => {
    setApplyingScenario(true);
    setScenarioFeedback(null);
    try {
      const res = await fetch("/api/workspace/apply-scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalBudget: activeScenarioData.totalBudget,
          guestEstimate: activeScenarioData.guestRecommendation,
          allocations: activeScenarioData.rows.map((r) => ({
            name: r.name,
            icon: r.icon,
            allocatedAmount: r.allocatedAmount,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setScenarioFeedback({
          type: "error",
          text: data.error || "Gagal menerapkan skenario ke workspace.",
        });
      } else {
        await queryClient.invalidateQueries({
          queryKey: ["workspace-data", workspace.id],
        });
        setScenarioFeedback({
          type: "success",
          text: `Skenario ${activeScenarioData.label} (${formatIDR(activeScenarioData.totalBudget)}) berhasil diterapkan! ${data.insertedCount} kategori baru ditambahkan & ${data.updatedCount} kategori diperbarui tanpa menghapus vendor Anda.`,
        });
      }
    } catch {
      setScenarioFeedback({
        type: "error",
        text: "Kendala jaringan. Pastikan perangkat online untuk menerapkan skenario.",
      });
    } finally {
      setApplyingScenario(false);
    }
  };

  const handleCopyScript = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="relative space-y-5 pb-8">
      {/* Hero Banner Panduan Eksklusif */}
      <Card className="relative overflow-hidden rounded-3xl border-0 bg-gradient-to-br from-sage-700 via-sage to-sage-900 text-cream-50 shadow-lift">
        <div
          aria-hidden="true"
          className="pattern-leaves absolute inset-0 opacity-80"
        />
        <BotanicalCorner
          className="pointer-events-none absolute -bottom-5 -right-4 h-36 w-36 opacity-25"
          variant="terracotta"
        />
        <CardContent className="relative z-10 p-5 sm:p-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge
              variant="outline"
              className="border-white/25 bg-white/10 text-cream-50 text-[11px]"
            >
              <BookOpen className="h-3 w-3 text-amberwarm" />
              Panduan Eksklusif Couple Pass
            </Badge>
            <span className="font-script text-2xl text-amberwarm leading-none">
              Tanpa Stres &amp; Tanpa Boros
            </span>
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-cream-50">
              Pusat Panduan &amp; Strategi Pernikahan
            </h1>
            <p className="text-xs sm:text-sm text-cream-200/90 mt-1 leading-relaxed max-w-xl">
              Framework prioritas WIFE, komparasi skenario 30/50/80 Juta, script
              negosiasi vendor siap kirim ke WhatsApp, hingga checklist 10
              kesalahan fatal — semua langsung terhubung ke data workspace Anda.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Segmented Tab Switcher (4 Tab) */}
      <div
        role="tablist"
        aria-label="Navigasi Panduan"
        className="grid grid-cols-2 sm:grid-cols-4 gap-1 rounded-2xl sm:rounded-full glass p-1 shadow-sm"
      >
        {GUIDE_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center justify-center gap-1.5 rounded-xl sm:rounded-full py-2.5 px-2 text-xs font-semibold transition-colors ${
                active ? "text-cream-50" : "text-sage-700 hover:text-sage-900"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="guide-tab-pill"
                  className="absolute inset-0 rounded-xl sm:rounded-full bg-gradient-to-r from-sage-600 to-sage shadow-sm"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              )}
              <Icon className="relative h-3.5 w-3.5" />
              <span className="relative truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ================================================================= */}
      {/* TAB 1: PRIORITAS & METODE WIFE (BAB 1)                            */}
      {/* ================================================================= */}
      {activeTab === "prioritas" && (
        <div className="space-y-5">
          {/* Quote */}
          <div className="rounded-2xl border border-amberwarm/35 bg-amberwarm-light/55 px-4 py-3 text-center">
            <p className="font-display italic text-sm sm:text-base text-sage-900">
              &ldquo;Pernikahan yang indah bukan tentang seberapa besar
              anggarannya, tapi seberapa cermat kamu merencanakannya.&rdquo;
            </p>
          </div>

          {/* Interactive WIFE Worksheet */}
          <Card className="glass-strong rounded-3xl shadow-card">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Badge variant="softTerracotta" className="mb-1.5">
                    BAB 1 &bull; Worksheet Interaktif
                  </Badge>
                  <h2 className="font-display text-xl font-semibold text-sage-900">
                    Metode WIFE — Kompas Prioritas Pasangan
                  </h2>
                  <p className="text-xs text-sage-600 mt-0.5">
                    Catat jawaban berdua di bawah ini (tersimpan otomatis di
                    perangkat Anda).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3.5">
                {WIFE_FRAMEWORK.map((item) => (
                  <div
                    key={item.letter}
                    className="rounded-2xl border border-sage/12 bg-white/95 p-4 space-y-2"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sage-600 to-sage text-cream-50 font-display text-lg font-bold shadow-sm">
                        {item.letter}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-sage-900">
                          {item.title}
                        </p>
                        <p className="text-xs text-sage-700 mt-0.5">
                          {item.question}
                        </p>
                      </div>
                    </div>
                    <Input
                      value={guideState.wife[item.letter] ?? ""}
                      onChange={(e) => updateWife(item.letter, e.target.value)}
                      placeholder={item.placeholder}
                      className="bg-cream-50/70 text-xs sm:text-sm"
                    />
                    <p className="text-[11px] text-sage-500">{item.hint}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Piramida Prioritas 3 Lapisan */}
          <Card className="glass-strong rounded-3xl shadow-card">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-sage-900">
                  Piramida Prioritas Pernikahan
                </h2>
                <p className="text-xs text-sage-600 mt-0.5">
                  Alokasikan anggaran mulai dari Lapisan 1 lebih dulu agar pos
                  paling penting tidak kekurangan dana.
                </p>
              </div>

              <div className="space-y-3">
                {PRIORITY_PYRAMID.map((tier) => (
                  <div
                    key={tier.layer}
                    className={`rounded-2xl border p-4 space-y-2.5 ${tier.barClass}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-bold text-sage-900">
                        {tier.name}
                      </p>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${tier.badgeClass}`}
                      >
                        {tier.share}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {tier.items.map((sub) => (
                        <div
                          key={sub.title}
                          className="rounded-xl bg-white/90 border border-white px-3 py-2"
                        >
                          <p className="text-xs font-bold text-sage-900">
                            {sub.title}
                          </p>
                          <p className="text-[11px] text-sage-600 mt-0.5 leading-snug">
                            {sub.note}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 5 Langkah Menentukan Prioritas */}
          <Card className="glass-strong rounded-3xl shadow-card">
            <CardContent className="p-5 sm:p-6 space-y-3">
              <h2 className="font-display text-lg font-semibold text-sage-900">
                5 Langkah Menentukan Prioritas (Step-by-Step)
              </h2>
              <ol className="space-y-2">
                {PRIORITY_STEPS.map((step, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 rounded-xl bg-white/85 border border-sage/10 px-3.5 py-2.5 text-xs sm:text-sm text-sage-800"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage-100 text-xs font-bold text-sage-800">
                      {idx + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
              <p className="text-xs italic text-terracotta-700 pt-1 text-center">
                &ldquo;Lebih baik 200 tamu dengan katering enak, daripada 500
                tamu dengan katering mengecewakan.&rdquo;
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 2: SKENARIO 30/50/80 JT & STRATEGI HEMAT < 50 JT              */}
      {/* ================================================================= */}
      {activeTab === "skenario" && (
        <div className="space-y-5">
          {/* Scenario Selector Cards */}
          <Card className="glass-strong rounded-3xl shadow-card">
            <CardContent className="p-5 sm:p-6 space-y-5">
              <div>
                <Badge variant="softSage" className="mb-1.5">
                  Wedding Budget Scenario Planner
                </Badge>
                <h2 className="font-display text-xl font-semibold text-sage-900">
                  Bandingkan &amp; Terapkan Skenario Anggaran
                </h2>
                <p className="text-xs text-sage-600 mt-0.5">
                  Pilih salah satu dari 3 skenario siap pakai (30 Jt, 50 Jt, 80
                  Jt) atau geser nominal custom sesuai rencana Anda.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {BUDGET_SCENARIOS.map((sc) => {
                  const active = selectedScenario === sc.id;
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => {
                        setSelectedScenario(sc.id);
                        setScenarioFeedback(null);
                      }}
                      className={`rounded-2xl border-2 p-3.5 text-left transition-all ${
                        active
                          ? "border-sage bg-white shadow-soft ring-2 ring-sage/10"
                          : "border-sage/12 bg-white/80 hover:border-sage/30"
                      }`}
                    >
                      <span className="inline-block rounded-full bg-cream-200 px-2 py-0.5 text-[10px] font-bold text-sage-800">
                        {sc.badge}
                      </span>
                      <p className="text-sm font-bold text-sage-900 mt-1.5">
                        {sc.name}
                      </p>
                      <p className="font-display text-xl font-semibold tabular-nums text-terracotta-700 mt-0.5">
                        {formatIDR(sc.totalBudget)}
                      </p>
                      <p className="text-[11px] text-sage-600 mt-1 leading-snug">
                        ~{sc.guestRecommendation} tamu &bull; {sc.tagline}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Custom Budget Toggle + Slider */}
              <div
                className={`rounded-2xl border p-3.5 transition-all ${
                  selectedScenario === "CUSTOM"
                    ? "border-terracotta/40 bg-terracotta-50/40"
                    : "border-sage/12 bg-white/80"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setSelectedScenario("CUSTOM")}
                    className="text-xs font-bold text-sage-900 inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-terracotta" />
                    Atau Skala Custom Sesuai Budget Anda
                  </button>
                  <span className="font-display text-base font-semibold tabular-nums text-sage-900">
                    {formatIDR(customBudget)}
                  </span>
                </div>
                <Slider
                  value={[customBudget]}
                  min={20_000_000}
                  max={500_000_000}
                  step={5_000_000}
                  onValueChange={([v]) => {
                    setCustomBudget(v);
                    setSelectedScenario("CUSTOM");
                  }}
                  aria-label="Nominal Budget Custom"
                />
              </div>

              {/* Tabel Rincian 10 Kategori */}
              <div className="rounded-2xl border border-sage/12 bg-white overflow-hidden">
                <div className="flex items-center justify-between bg-sage-50/90 px-4 py-2.5 text-xs font-bold text-sage-900">
                  <span>10 Kategori ({activeScenarioData.label})</span>
                  <span className="tabular-nums">
                    {formatIDR(activeScenarioData.totalBudget)}
                  </span>
                </div>
                <div className="divide-y divide-sage/8">
                  {activeScenarioData.rows.map((row) => (
                    <div
                      key={row.key}
                      className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-sage-900">
                          {row.name}{" "}
                          <span className="font-normal text-sage-500">
                            ({row.percentage}%)
                          </span>
                        </p>
                        <p className="text-[11px] text-sage-600 truncate">
                          {row.recommendation}
                        </p>
                      </div>
                      <span className="font-bold tabular-nums text-sage-900 shrink-0">
                        {formatIDR(row.allocatedAmount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {scenarioFeedback && (
                <div
                  className={`rounded-2xl border px-4 py-3 text-xs leading-relaxed ${
                    scenarioFeedback.type === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                      : "border-red-200 bg-red-50 text-red-800"
                  }`}
                >
                  {scenarioFeedback.text}
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-sage/12 bg-cream-50/90 p-3.5">
                <p className="text-[11px] text-sage-700 leading-relaxed">
                  <strong>Mode Aman:</strong> Memperbarui target budget &amp;
                  menambahkan 10 kategori skenario tanpa menghapus vendor atau
                  termin yang sudah tercatat.
                </p>
                <Button
                  type="button"
                  size="sm"
                  className="shrink-0"
                  disabled={applyingScenario}
                  onClick={handleApplyScenario}
                >
                  {applyingScenario ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Menerapkan...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Terapkan ke Workspace
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Checklist Digital-First Savings Calculator */}
          <Card className="glass-strong rounded-3xl shadow-card">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Badge variant="softTerracotta" className="mb-1">
                    Strategi Digital-First
                  </Badge>
                  <h2 className="font-display text-lg font-semibold text-sage-900">
                    Ganti ke Digital — Hemat Rp 1–3 Juta!
                  </h2>
                </div>
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-3.5 py-2 text-right">
                  <p className="text-[10px] font-semibold text-emerald-700">
                    Estimasi Penghematan Anda
                  </p>
                  <p className="font-display text-lg font-semibold tabular-nums text-emerald-800">
                    {formatIDR(totalDigitalSavings)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {DIGITAL_FIRST_CHECKLIST.map((item) => {
                  const checked = guideState.digitalChecked.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleDigitalItem(item.id)}
                      className={`w-full flex items-start justify-between gap-3 rounded-2xl border p-3.5 text-left transition-all ${
                        checked
                          ? "border-emerald-300 bg-emerald-50/70"
                          : "border-sage/12 bg-white/90 hover:border-sage/30"
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        {checked ? (
                          <CheckSquare className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <Square className="h-4.5 w-4.5 text-sage-400 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="text-xs font-bold text-sage-900">
                            <span className="line-through font-normal text-sage-500">
                              {item.from}
                            </span>{" "}
                            &rarr; {item.to}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-cream-200/90 px-2.5 py-0.5 text-[10.5px] font-bold text-sage-800 shrink-0">
                        {item.savingLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Tips Hemat per Kategori (< 50 Jt) */}
          <Card className="glass-strong rounded-3xl shadow-card">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <h2 className="font-display text-lg font-semibold text-sage-900">
                Tips Hemat Kategori Utama (Budget &lt; 50 Juta)
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {UNDER_50M_TIPS.map((block) => (
                  <div
                    key={block.category}
                    className="rounded-2xl border border-sage/12 bg-white/90 p-4 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-bold text-sage-900">
                        {block.category}
                      </p>
                      <Badge variant="softSage" className="text-[10.5px]">
                        {block.target}
                      </Badge>
                    </div>
                    <ul className="space-y-1.5 text-xs text-sage-700">
                      {block.tips.map((tip) => (
                        <li key={tip} className="flex items-start gap-2">
                          <Check className="h-3.5 w-3.5 text-sage shrink-0 mt-0.5" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 3: SCRIPT NEGOSIASI VENDOR (BAB 3)                            */}
      {/* ================================================================= */}
      {activeTab === "negosiasi" && (
        <div className="space-y-5">
          {/* Personalisasi Otomatis Script */}
          <Card className="glass-strong rounded-3xl shadow-card">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div>
                <Badge variant="softTerracotta" className="mb-1">
                  BAB 3 &bull; Script Siap Kirim
                </Badge>
                <h2 className="font-display text-xl font-semibold text-sage-900">
                  Script Negosiasi Vendor Otomatis
                </h2>
                <p className="text-xs text-sage-600 mt-0.5">
                  Tanggal nikah &amp; jumlah tamu terisi otomatis dari workspace
                  Anda. Ubah bila perlu, lalu klik Salin atau kirim ke WhatsApp.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl border border-sage/12 bg-cream-50/80 p-3.5">
                <div className="space-y-1">
                  <Label className="text-[11px]">Tanggal Pernikahan di Script</Label>
                  <Input
                    value={scriptDate}
                    onChange={(e) => setScriptDate(e.target.value)}
                    className="h-9 bg-white text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Estimasi Tamu (Pax)</Label>
                  <Input
                    type="number"
                    min={20}
                    max={3000}
                    value={scriptGuests}
                    onChange={(e) =>
                      setScriptGuests(Math.max(20, Number(e.target.value) || 200))
                    }
                    className="h-9 bg-white text-xs"
                  />
                </div>
              </div>

              <div className="space-y-3.5">
                {NEGOTIATION_SCRIPTS.map((sc) => {
                  const targetCatering =
                    scriptGuests > 0
                      ? formatIDR(
                          Math.round(
                            ((Number(workspace.wedding_budget_target) || 50_000_000) *
                              0.28) /
                              scriptGuests /
                              5000
                          ) * 5000
                        )
                      : "Rp 65.000";

                  const generated = sc.buildScript({
                    weddingDateLabel: scriptDate,
                    guestCount: scriptGuests,
                    targetCateringPerPax: targetCatering,
                  });

                  const waHref = `https://wa.me/?text=${encodeURIComponent(
                    generated
                  )}`;
                  const isCopied = copiedId === sc.id;

                  return (
                    <div
                      key={sc.id}
                      className="rounded-2xl border border-sage/15 bg-white p-4 space-y-3 shadow-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <Badge variant="softSage" className="text-[10.5px]">
                            {sc.vendorType}
                          </Badge>
                          <h3 className="text-sm font-bold text-sage-900 mt-1">
                            {sc.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-xs"
                            onClick={() => handleCopyScript(sc.id, generated)}
                          >
                            {isCopied ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                Tersalin
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                Salin
                              </>
                            )}
                          </Button>
                          <Button
                            asChild
                            size="sm"
                            variant="sage"
                            className="h-8 px-3 text-xs"
                          >
                            <a
                              href={waHref}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              WhatsApp
                            </a>
                          </Button>
                        </div>
                      </div>

                      <div className="rounded-xl bg-cream-50 border border-sage/10 p-3 text-xs sm:text-[13px] text-sage-800 leading-relaxed whitespace-pre-line">
                        {generated}
                      </div>

                      <p className="text-[11px] text-terracotta-700 font-medium">
                        💡 Taktik: {sc.tactic}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Hal yang Bisa Dinegosiasikan Selain Harga */}
          <Card className="glass-strong rounded-3xl shadow-card">
            <CardContent className="p-5 sm:p-6 space-y-3">
              <h2 className="font-display text-lg font-semibold text-sage-900">
                7 Nilai Tambah yang Bisa Diminta (Selain Diskon)
              </h2>
              <div className="divide-y divide-sage/8 rounded-2xl border border-sage/12 bg-white overflow-hidden">
                {NEGOTIATION_ADDONS.map((row) => (
                  <div
                    key={row.item}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs"
                  >
                    <span className="font-medium text-sage-800">{row.item}</span>
                    <span className="font-bold text-sage-900 shrink-0">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Do's & Don'ts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Card className="rounded-3xl border-emerald-200/80 bg-emerald-50/70 shadow-sm">
              <CardContent className="p-4 sm:p-5 space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Lakukan Ini (Do&apos;s)
                </p>
                <ul className="space-y-2 text-xs text-emerald-950/90">
                  {NEGOTIATION_DOS_DONTS.dos.map((d) => (
                    <li key={d} className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-red-200/80 bg-red-50/70 shadow-sm">
              <CardContent className="p-4 sm:p-5 space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-red-800 inline-flex items-center gap-1.5">
                  <XCircle className="h-4 w-4 text-red-600" />
                  Hindari Ini (Don&apos;ts)
                </p>
                <ul className="space-y-2 text-xs text-red-950/90">
                  {NEGOTIATION_DOS_DONTS.donts.map((d) => (
                    <li key={d} className="flex items-start gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 4: 10 KESALAHAN FATAL & PANDUAN APLIKASI (BAB 4 + XLSX)       */}
      {/* ================================================================= */}
      {activeTab === "checklist" && (
        <div className="space-y-5">
          {/* 10 Kesalahan Fatal Interactive Checklist */}
          <Card className="glass-strong rounded-3xl shadow-card">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Badge variant="softTerracotta" className="mb-1">
                    BAB 4 &bull; Audit Kesiapan
                  </Badge>
                  <h2 className="font-display text-xl font-semibold text-sage-900">
                    10 Kesalahan Fatal yang Wajib Dihindari
                  </h2>
                  <p className="text-xs text-sage-600 mt-0.5">
                    Centang setiap poin setelah kalian mengantisipasinya.
                  </p>
                </div>
                <div className="rounded-2xl border border-sage/15 bg-white px-3.5 py-2 text-right">
                  <p className="text-[10px] font-medium text-sage-600">
                    Skor Kesiapan
                  </p>
                  <p className="font-display text-lg font-semibold tabular-nums text-sage-900">
                    {guideState.mistakesChecked.length} / {FATAL_MISTAKES.length}
                  </p>
                </div>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-cream-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sage to-terracotta transition-all duration-500"
                  style={{ width: `${mistakesProgressPct}%` }}
                />
              </div>

              <div className="space-y-2">
                {FATAL_MISTAKES.map((item) => {
                  const checked = guideState.mistakesChecked.includes(item.id);
                  const isOpen = openMistakeId === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl border transition-all overflow-hidden ${
                        checked
                          ? "border-emerald-200 bg-emerald-50/50"
                          : "border-sage/12 bg-white/95"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 px-3.5 py-3">
                        <button
                          type="button"
                          onClick={() => toggleMistakeItem(item.id)}
                          aria-label={`Tandai ${item.title} sudah diantisipasi`}
                          className="shrink-0 text-sage-600 hover:text-sage-900"
                        >
                          {checked ? (
                            <CheckSquare className="h-4.5 w-4.5 text-emerald-600" />
                          ) : (
                            <Square className="h-4.5 w-4.5 text-sage-400" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setOpenMistakeId(isOpen ? null : item.id)
                          }
                          className="flex flex-1 items-center justify-between gap-2 text-left min-w-0"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono text-[11px] font-bold text-terracotta shrink-0">
                              #{item.number}
                            </span>
                            <span
                              className={`text-xs sm:text-sm font-bold truncate ${
                                checked
                                  ? "line-through text-sage-500"
                                  : "text-sage-900"
                              }`}
                            >
                              {item.title}
                            </span>
                          </div>
                          {isOpen ? (
                            <ChevronUp className="h-4 w-4 text-sage-400 shrink-0" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-sage-400 shrink-0" />
                          )}
                        </button>
                      </div>

                      {isOpen && (
                        <div className="border-t border-sage/8 bg-cream-50/70 px-4 py-3 space-y-2 text-xs leading-relaxed">
                          <p className="text-red-800/90">
                            <strong>Masalah: </strong>
                            {item.problem}
                          </p>
                          <p className="text-emerald-900">
                            <strong>Solusi: </strong>
                            {item.solution}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Panduan Cepat Penggunaan Aplikasi & Arti Warna */}
          <Card className="glass-strong rounded-3xl shadow-card">
            <CardContent className="p-5 sm:p-6 space-y-5">
              <div>
                <h2 className="font-display text-lg font-semibold text-sage-900">
                  Panduan Cepat Menggunakan NikahPlan
                </h2>
                <p className="text-xs text-sage-600 mt-0.5">
                  5 langkah sederhana menjaga anggaran tetap sehat dari lamaran
                  hingga pulang bulan madu.
                </p>
              </div>

              <div className="space-y-2">
                {APP_QUICK_STEPS.map((s) => (
                  <div
                    key={s.step}
                    className="flex items-start gap-3 rounded-2xl border border-sage/10 bg-white/90 px-3.5 py-2.5"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage text-cream-50 text-xs font-bold">
                      {s.step}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-sage-900">
                        {s.title}
                      </p>
                      <p className="text-[11px] text-sage-600 mt-0.5 leading-snug">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Arti Warna Status */}
              <div className="space-y-2 pt-1">
                <p className="text-xs font-bold text-sage-800">
                  Arti Warna Indikator Status
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {STATUS_COLOR_LEGEND.map((item) => (
                    <div
                      key={item.label}
                      className={`rounded-2xl border p-3 space-y-1 ${item.pillClass}`}
                    >
                      <p className="text-xs font-bold inline-flex items-center gap-1.5">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${item.dotClass}`}
                        />
                        {item.label}
                      </p>
                      <p className="text-[11px] opacity-85 leading-snug">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQ Accordion */}
              <div className="space-y-2 pt-1">
                <p className="text-xs font-bold text-sage-800 inline-flex items-center gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5 text-sage" />
                  Pertanyaan yang Sering Diajukan (FAQ)
                </p>
                <div className="space-y-2">
                  {GUIDE_FAQS.map((faq, idx) => {
                    const open = openFaqIdx === idx;
                    return (
                      <div
                        key={faq.q}
                        className="rounded-2xl border border-sage/12 bg-white/95 overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenFaqIdx(open ? null : idx)}
                          className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left text-xs font-bold text-sage-900"
                        >
                          <span>{faq.q}</span>
                          {open ? (
                            <ChevronUp className="h-4 w-4 text-sage-400 shrink-0" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-sage-400 shrink-0" />
                          )}
                        </button>
                        {open && (
                          <div className="border-t border-sage/8 bg-cream-50/60 px-4 py-3 text-xs text-sage-700 leading-relaxed">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-2">
                <Button asChild size="sm" variant="sage">
                  <Link href="/vendors">
                    Buka Daftar Vendor ({formatNumberID(initialBundle.items.length)}{" "}
                    item)
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard">Kembali ke Dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
