"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useTransform,
} from "motion/react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Heart,
  Lock,
  Minus,
  Plane,
  Plus,
  RotateCcw,
  ShieldAlert,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { calculateWeddingPreview } from "@/lib/plans";
import { formatIDR, formatNumberID } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";

const BUDGET_PRESETS = [75000000, 150000000, 250000000, 400000000];
const BAR_COLORS = ["#141618", "#4F6BF6", "#818CF8", "#E09F3E", "#94A3B8"];

interface HiddenCostItem {
  id: string;
  label: string;
  shortLabel: string;
  amount: number;
}

const HIDDEN_COSTS: HiddenCostItem[] = [
  {
    id: "kua",
    label: "Biaya KUA / Catatan Sipil",
    shortLabel: "KUA / Catatan Sipil",
    amount: 600000,
  },
  {
    id: "panitia",
    label: "Konsumsi Panitia & Akad",
    shortLabel: "Konsumsi Panitia",
    amount: 2500000,
  },
  {
    id: "seragam",
    label: "Seragam Keluarga Inti",
    shortLabel: "Seragam Keluarga",
    amount: 4500000,
  },
  {
    id: "charge",
    label: "Charge Gedung / Corkage",
    shortLabel: "Charge Gedung",
    amount: 3000000,
  },
];

interface HoneymoonPreset {
  id: string;
  name: string;
  currency: string;
  symbol: string;
  rateToIdr: number;
  preTripRatio: number;
  highlight: string;
}

const HONEYMOON_PRESETS: HoneymoonPreset[] = [
  {
    id: "bali",
    name: "Bali",
    currency: "IDR",
    symbol: "Rp",
    rateToIdr: 1,
    preTripRatio: 0.5,
    highlight: "Villa privat Ubud + sunset Seminyak",
  },
  {
    id: "jepang",
    name: "Jepang",
    currency: "JPY",
    symbol: "¥",
    rateToIdr: 105,
    preTripRatio: 0.58,
    highlight: "Tokyo · Kyoto + JR Pass & kuliner",
  },
  {
    id: "singapura",
    name: "Singapura",
    currency: "SGD",
    symbol: "S$",
    rateToIdr: 12000,
    preTripRatio: 0.55,
    highlight: "Marina Bay · Sentosa & city stroll",
  },
  {
    id: "korea",
    name: "Korea",
    currency: "KRW",
    symbol: "₩",
    rateToIdr: 11.5,
    preTripRatio: 0.56,
    highlight: "Seoul · Nami Island & kafe estetik",
  },
];

function AnimatedIDR({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) =>
    formatIDR(Math.round(v / 100000) * 100000)
  );

  useEffect(() => {
    const controls = animate(mv, value, {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [mv, value]);

  return (
    <motion.span className={`tabular-nums ${className ?? ""}`}>
      {text}
    </motion.span>
  );
}

export function InteractiveBudgetPreview() {
  const [activeTab, setActiveTab] = useState<"wedding" | "honeymoon">(
    "wedding"
  );

  // Tab 1: Wedding Simulator + Sandbox + Hidden Costs
  const [targetBudget, setTargetBudget] = useState<number>(150000000);
  const [guestCount, setGuestCount] = useState<number>(300);
  const [selectedHiddenIds, setSelectedHiddenIds] = useState<string[]>([
    "kua",
    "panitia",
  ]);
  const [sandboxCateringDelta, setSandboxCateringDelta] = useState<number>(0);
  const [sandboxDpPaid, setSandboxDpPaid] = useState<boolean>(false);
  const [editingSandbox, setEditingSandbox] = useState<boolean>(false);

  // Tab 2: Honeymoon Wallet Preview
  const [honeymoonFund, setHoneymoonFund] = useState<number>(15000000);
  const [honeymoonDays, setHoneymoonDays] = useState<number>(5);
  const [destId, setDestId] = useState<string>("bali");

  const preview = useMemo(
    () => calculateWeddingPreview(targetBudget, guestCount),
    [targetBudget, guestCount]
  );

  const hiddenCostTotal = useMemo(
    () =>
      HIDDEN_COSTS.filter((h) => selectedHiddenIds.includes(h.id)).reduce(
        (sum, h) => sum + h.amount,
        0
      ),
    [selectedHiddenIds]
  );

  const baseCateringAmount = preview.slices[0]?.amount ?? 0;
  const effectiveCateringAmount = Math.max(
    10000000,
    baseCateringAmount + sandboxCateringDelta
  );
  const simulatedDpAmount = sandboxDpPaid
    ? Math.round(effectiveCateringAmount * 0.3)
    : 0;
  const effectiveRemainingBudget = Math.max(
    0,
    targetBudget - simulatedDpAmount - hiddenCostTotal
  );
  const cateringOverBudget = effectiveCateringAmount > baseCateringAmount;

  const toggleHiddenCost = (id: string) => {
    setSelectedHiddenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Honeymoon calculations
  const activeDest =
    HONEYMOON_PRESETS.find((d) => d.id === destId) || HONEYMOON_PRESETS[0];
  const preTripEstimate = Math.round(honeymoonFund * activeDest.preTripRatio);
  const onTripPocketTotal = Math.max(0, honeymoonFund - preTripEstimate);
  const dailyPocketIdr = Math.round(
    onTripPocketTotal / Math.max(1, honeymoonDays)
  );
  const dailyPocketForeign =
    activeDest.currency === "IDR"
      ? null
      : Math.round(dailyPocketIdr / activeDest.rateToIdr);

  return (
    <div className="rounded-[2rem] border border-black/[0.06] bg-white p-5 sm:p-7 shadow-[0_18px_50px_-24px_rgba(17,19,23,0.14)] text-left">
      {/* Header Lembar Simulasi + Switcher 2 Tab */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/[0.06] pb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EEF2FF] text-[#4F6BF6]">
            {activeTab === "wedding" ? (
              <Heart className="h-4 w-4" />
            ) : (
              <Plane className="h-4 w-4" />
            )}
          </span>
          <div>
            <p className="font-display text-sm sm:text-base font-bold text-[#141618]">
              {activeTab === "wedding"
                ? "Simulasi & Sandbox Anggaran Nikah"
                : "Simulasi Dompet Bulan Madu"}
            </p>
            <p className="text-[11px] text-[#5F6978]">
              {activeTab === "wedding"
                ? "Coba ubah harga vendor, catat DP & cek biaya tanpa login"
                : "Lihat konversi sisa angpao resepsi jadi uang saku harian honeymoon"}
            </p>
          </div>
        </div>

        {/* 2-Tab Pill Switcher */}
        <div className="grid grid-cols-2 sm:inline-flex w-full sm:w-auto rounded-full bg-[#F4F5F7] p-1 border border-black/[0.05]">
          <button
            type="button"
            onClick={() => setActiveTab("wedding")}
            className={`relative flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${activeTab === "wedding"
              ? "text-white"
              : "text-[#5F6978] hover:text-[#141618]"
              }`}
          >
            {activeTab === "wedding" && (
              <motion.span
                layoutId="landing-sim-tab"
                className="absolute inset-0 rounded-full bg-midnight-btn shadow-sm"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            <span className="relative inline-flex items-center gap-1.5">
              <Heart className="h-3 w-3" />
              Simulasi Nikah
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("honeymoon")}
            className={`relative flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${activeTab === "honeymoon"
              ? "text-white"
              : "text-[#5F6978] hover:text-[#141618]"
              }`}
          >
            {activeTab === "honeymoon" && (
              <motion.span
                layoutId="landing-sim-tab"
                className="absolute inset-0 rounded-full bg-midnight-btn shadow-sm"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            <span className="relative inline-flex items-center gap-1.5">
              <Plane className="h-3 w-3" />
              Dompet Honeymoon
            </span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "wedding" ? (
          <motion.div
            key="tab-wedding"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.24 }}
            className="mt-5 space-y-5"
          >
            {/* Grid 2 Kolom: Kontrol Kiri & Sandbox Alokasi Kanan */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:items-start">
              {/* Kiri: Sliders, Presets & Hidden Cost Calculator */}
              <div className="space-y-5 md:col-span-6">
                <div className="space-y-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-medium text-[#5F6978]">
                      Target Anggaran
                    </span>
                    <AnimatedIDR
                      value={targetBudget}
                      className="font-display text-2xl font-bold tracking-tight text-[#141618]"
                    />
                  </div>

                  <Slider
                    value={[targetBudget]}
                    min={30000000}
                    max={500000000}
                    step={5000000}
                    onValueChange={([val]) => {
                      setTargetBudget(val);
                      setSandboxCateringDelta(0);
                    }}
                    aria-label="Target Budget Pernikahan"
                  />

                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {BUDGET_PRESETS.map((preset) => {
                      const active = targetBudget === preset;
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setTargetBudget(preset);
                            setSandboxCateringDelta(0);
                          }}
                          className={`relative rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${active
                            ? "text-white"
                            : "bg-[#F4F5F7] text-[#5F6978] hover:bg-[#EBEEF3] hover:text-[#141618]"
                            }`}
                        >
                          {active && (
                            <motion.span
                              layoutId="romantic-budget-preset"
                              className="absolute inset-0 rounded-full bg-[#141618]"
                              transition={{
                                type: "spring",
                                stiffness: 420,
                                damping: 32,
                              }}
                            />
                          )}
                          <span className="relative">
                            Rp {preset / 1000000} Jt
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Jumlah Tamu */}
                <div className="space-y-2 border-t border-black/[0.06] pt-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 font-medium text-[#5F6978]">
                      <Users className="h-3.5 w-3.5 text-[#4F6BF6]" />
                      Jumlah Tamu
                    </span>
                    <span className="font-bold text-[#141618] tabular-nums">
                      {formatNumberID(guestCount)} pax &middot; ~
                      {formatIDR(preview.costPerGuest)}/tamu
                    </span>
                  </div>
                  <Slider
                    value={[guestCount]}
                    min={50}
                    max={1000}
                    step={25}
                    onValueChange={([val]) => setGuestCount(val)}
                    aria-label="Jumlah Tamu"
                  />
                </div>

                {/* Kalkulator Hidden Cost & Buffer Khas Pernikahan Indonesia */}
                <div className="space-y-2.5 border-t border-black/[0.06] pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#141618]">
                      <ShieldAlert className="h-3.5 w-3.5 text-[#E09F3E]" />
                      Cek &ldquo;Biaya Tersembunyi&rdquo; Non-Vendor
                    </span>
                    <span className="text-[11px] font-bold text-[#141618] tabular-nums">
                      +{formatIDR(hiddenCostTotal)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {HIDDEN_COSTS.map((hc) => {
                      const checked = selectedHiddenIds.includes(hc.id);
                      return (
                        <button
                          key={hc.id}
                          type="button"
                          onClick={() => toggleHiddenCost(hc.id)}
                          aria-pressed={checked}
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10.5px] font-semibold transition-all ${checked
                            ? "border-[#141618] bg-[#141618] text-white"
                            : "border-black/10 bg-[#F7F8FA] text-[#5F6978] hover:border-black/25 hover:text-[#141618]"
                            }`}
                        >
                          {checked ? (
                            <Check className="h-3 w-3 text-[#E09F3E]" />
                          ) : (
                            <Plus className="h-3 w-3" />
                          )}
                          <span>{hc.shortLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                  {hiddenCostTotal > 0 && (
                    <p className="text-[11px] text-[#5F6978] leading-snug">
                      Terhindar dari biaya kaget{" "}
                      <strong className="text-[#141618]">
                        {formatIDR(hiddenCostTotal)}
                      </strong>{" "}
                      yang sering terlewat calon pengantin Indonesia.
                    </p>
                  )}
                </div>
              </div>

              {/* Kanan: Interactive Sandbox Alokasi + Coba Edit Harga & Catat DP */}
              <div className="space-y-3.5 rounded-2xl bg-[#F7F8FA] p-4 sm:p-5 md:col-span-6">
                <div className="flex items-center justify-between gap-2 pb-1 border-b border-black/[0.06]">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#4F6BF6]">
                    Coba Skenario Nyata
                  </span>
                  {(sandboxCateringDelta !== 0 || sandboxDpPaid) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSandboxCateringDelta(0);
                        setSandboxDpPaid(false);
                        setEditingSandbox(false);
                      }}
                      className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-[#5F6978] hover:text-[#141618]"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reset
                    </button>
                  )}
                </div>

                {preview.slices.map((slice, idx) => {
                  const isCatering = idx === 0;
                  const shownAmount = isCatering
                    ? effectiveCateringAmount
                    : slice.amount;
                  const shownPct = isCatering
                    ? Math.min(
                      100,
                      Math.round((shownAmount / Math.max(1, targetBudget)) * 100)
                    )
                    : slice.percentage;

                  return (
                    <div key={slice.key} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-[#141618] truncate">
                          {slice.name}{" "}
                          <span className="font-mono text-[10.5px] font-normal text-[#5F6978]">
                            {shownPct}%
                          </span>
                        </span>
                        {slice.locked ? (
                          <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-[#5F6978] shrink-0">
                            <Lock className="h-3 w-3" />
                            Di aplikasi
                          </span>
                        ) : (
                          <span
                            className={`font-bold tabular-nums shrink-0 ${isCatering && cateringOverBudget
                              ? "text-amber-700"
                              : "text-[#141618]"
                              }`}
                          >
                            {formatIDR(shownAmount)}
                          </span>
                        )}
                      </div>

                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E5E9F0]">
                        <motion.div
                          className="h-full rounded-full"
                          initial={false}
                          animate={{ width: `${shownPct}%` }}
                          transition={{
                            duration: 0.45,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          style={{
                            backgroundColor:
                              isCatering && cateringOverBudget
                                ? "#E09F3E"
                                : BAR_COLORS[idx % BAR_COLORS.length],
                          }}
                        />
                      </div>

                      {/* Interactive Sandbox Controls khusus pos Katering & Venue */}
                      {isCatering && (
                        <div className="pt-1.5 space-y-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingSandbox((prev) => !prev)}
                              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10.5px] font-semibold transition-colors ${editingSandbox
                                ? "border-[#4F6BF6] bg-[#EEF2FF] text-[#4F6BF6]"
                                : "border-black/10 bg-white text-[#141618] hover:border-black/25"
                                }`}
                            >
                              <SlidersHorizontal className="h-3 w-3" />
                              Ubah Harga
                            </button>
                            <button
                              type="button"
                              onClick={() => setSandboxDpPaid((prev) => !prev)}
                              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10.5px] font-semibold transition-colors ${sandboxDpPaid
                                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                : "border-black/10 bg-white text-[#141618] hover:border-[#4F6BF6] hover:text-[#4F6BF6]"
                                }`}
                            >
                              {sandboxDpPaid ? (
                                <>
                                  <CheckCircle2 className="h-3 w-3" />
                                  DP 30% Lunas
                                </>
                              ) : (
                                <>
                                  <Plus className="h-3 w-3" />
                                  Simulasi DP 30%
                                </>
                              )}
                            </button>
                          </div>

                          {editingSandbox && (
                            <div className="flex items-center justify-between gap-2 rounded-xl border border-[#4F6BF6]/20 bg-white px-3 py-2 text-[11px]">
                              <span className="text-[#5F6978] font-medium">
                                Geser deal katering:
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSandboxCateringDelta((d) => d - 5000000)
                                  }
                                  className="flex h-6 w-6 items-center justify-center rounded-full border border-black/10 bg-[#F4F5F7] text-[#141618] hover:bg-[#E5E9F0]"
                                  aria-label="Kurangi 5 juta"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="font-bold tabular-nums text-[#141618] min-w-[78px] text-center">
                                  {sandboxCateringDelta === 0
                                    ? "Standar"
                                    : `${sandboxCateringDelta > 0 ? "+" : ""}${sandboxCateringDelta / 1000000} Jt`}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSandboxCateringDelta((d) => d + 5000000)
                                  }
                                  className="flex h-6 w-6 items-center justify-center rounded-full border border-black/10 bg-[#F4F5F7] text-[#141618] hover:bg-[#E5E9F0]"
                                  aria-label="Tambah 5 juta"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Mini Cashflow Summary hasil simulasi */}
                <div className="rounded-xl border border-black/[0.06] bg-white p-3 space-y-1.5 text-[11.5px]">
                  <div className="flex items-center justify-between text-[#5F6978]">
                    <span>DP Terbayar + Buffer Non-Vendor</span>
                    <span className="font-bold text-[#141618] tabular-nums">
                      {formatIDR(simulatedDpAmount + hiddenCostTotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#141618]">
                      Sisa Ruang Anggaran
                    </span>
                    <span className="font-bold text-[#4F6BF6] tabular-nums">
                      {formatIDR(effectiveRemainingBudget)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ================================================================= */
          /* TAB 2: PREVIEW DOMPET HONEYMOON (WEDDING-TO-HONEYMOON BRIDGE)     */
          /* ================================================================= */
          <motion.div
            key="tab-honeymoon"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.24 }}
            className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-12 md:items-center"
          >
            {/* Kiri: Kontrol Sisa Angpao, Destinasi & Durasi */}
            <div className="space-y-5 md:col-span-6">
              <div className="space-y-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-medium text-[#5F6978]">
                    Estimasi Sisa Angpao / Dana Honeymoon
                  </span>
                  <AnimatedIDR
                    value={honeymoonFund}
                    className="font-display text-2xl font-bold tracking-tight text-[#141618]"
                  />
                </div>
                <Slider
                  value={[honeymoonFund]}
                  min={5000000}
                  max={60000000}
                  step={1000000}
                  onValueChange={([val]) => setHoneymoonFund(val)}
                  aria-label="Dana Honeymoon"
                />
              </div>

              <div className="space-y-2 border-t border-black/[0.06] pt-4">
                <span className="text-xs font-medium text-[#5F6978]">
                  Pilih Destinasi Impian
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {HONEYMOON_PRESETS.map((dest) => {
                    const active = destId === dest.id;
                    return (
                      <button
                        key={dest.id}
                        type="button"
                        onClick={() => setDestId(dest.id)}
                        className={`rounded-xl border px-3 py-2 text-left transition-all ${active
                          ? "border-[#141618] bg-midnight-btn text-white shadow-sm"
                          : "border-black/[0.08] bg-[#F7F8FA] text-[#141618] hover:border-black/20"
                          }`}
                      >
                        <p className="text-xs font-bold">{dest.name}</p>
                        <p
                          className={`text-[10px] ${active ? "text-[#E09F3E]" : "text-[#5F6978]"
                            }`}
                        >
                          {dest.currency}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 border-t border-black/[0.06] pt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#5F6978]">
                    Durasi Perjalanan
                  </span>
                  <span className="font-bold text-[#141618] tabular-nums">
                    {honeymoonDays} Hari {Math.max(1, honeymoonDays - 1)} Malam
                  </span>
                </div>
                <Slider
                  value={[honeymoonDays]}
                  min={3}
                  max={10}
                  step={1}
                  onValueChange={([val]) => setHoneymoonDays(val)}
                  aria-label="Durasi Hari Honeymoon"
                />
              </div>
            </div>

            {/* Kanan: Kartu Dompet Honeymoon Midnight Velvet */}
            <div className="md:col-span-6">
              <div className="rounded-3xl bg-midnight-luxury p-5 sm:p-6 text-white space-y-4 shadow-lift">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#E09F3E]">
                      Dompet Honeymoon &middot; {activeDest.currency}
                    </p>
                    <p className="font-display text-xl font-bold mt-1">
                      {honeymoonDays} Hari di {activeDest.name}
                    </p>
                    <p className="text-[11px] text-white/65 mt-0.5">
                      {activeDest.highlight}
                    </p>
                  </div>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#E09F3E]">
                    <Plane className="h-4.5 w-4.5" />
                  </span>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 space-y-1">
                  <p className="text-[11px] text-white/70">
                    Estimasi Uang Jajan Harian (On-Trip)
                  </p>
                  <p className="font-display text-2xl sm:text-3xl font-bold tabular-nums text-white">
                    {formatIDR(dailyPocketIdr)}
                    <span className="text-xs font-normal text-white/60">
                      {" "}
                      / hari
                    </span>
                  </p>
                  {dailyPocketForeign !== null && (
                    <p className="text-xs font-semibold text-[#93A8FF] tabular-nums">
                      &approx; {activeDest.symbol}
                      {formatNumberID(dailyPocketForeign)} {activeDest.currency}{" "}
                      / hari
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="rounded-xl bg-white/[0.06] px-3 py-2.5">
                    <p className="text-[10.5px] text-white/60">
                      Pre-Trip (Tiket &amp; Hotel)
                    </p>
                    <p className="font-bold tabular-nums mt-0.5">
                      {formatIDR(preTripEstimate)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/[0.06] px-3 py-2.5">
                    <p className="text-[10.5px] text-white/60">
                      On-Trip (Makan &amp; Wisata)
                    </p>
                    <p className="font-bold tabular-nums mt-0.5 text-[#E09F3E]">
                      {formatIDR(onTripPocketTotal)}
                    </p>
                  </div>
                </div>

                <Link
                  href="/login?next=/checkout?plan=COMPLETE_PASS"
                  className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-white/85 hover:text-white transition-colors"
                >
                  <span>
                    Buka Angpao Bridge &amp; 8 Mata Uang di Complete Pass
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#E09F3E]" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
