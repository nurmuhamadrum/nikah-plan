"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  HeartHandshake,
  Loader2,
  MessageCircle,
  Plane,
  Sparkles,
  Users,
  Wallet,
  AlertCircle,
  Lock,
} from "lucide-react";
import type { Workspace } from "@/types/database";
import {
  buildSmartWeddingAllocations,
  calculateTripDays,
  getCurrencyOption,
  HONEYMOON_CURRENCIES,
  type SmartCategoryAllocation,
} from "@/lib/budget-allocator";
import { formatIDR, formatNumberID } from "@/lib/utils";
import { NikahPlanLogo } from "@/components/brand/logo";
import { FloatingBotanicals } from "@/components/brand/floating-botanicals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OnboardingWizardProps {
  workspace: Workspace;
  memberCount: number;
  appUrl: string;
}

const BUDGET_PRESETS = [75000000, 150000000, 250000000, 400000000];
const STEPS = [
  { id: 1, title: "Profil & Pasangan" },
  { id: 2, title: "Alokasi Budget" },
  { id: 3, title: "Honeymoon" },
  { id: 4, title: "Selesai" },
];

export function OnboardingWizard({
  workspace,
  memberCount,
  appUrl,
}: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Step 1: Profil & Undangan
  const [coupleTitle, setCoupleTitle] = useState(
    workspace.couple_title || "Andi & Rina"
  );
  const [weddingDate, setWeddingDate] = useState(workspace.wedding_date || "");
  const [copiedLink, setCopiedLink] = useState(false);

  // Step 2: Smart Wedding Allocator
  const [budgetTarget, setBudgetTarget] = useState<number>(
    workspace.wedding_budget_target > 0
      ? Number(workspace.wedding_budget_target)
      : 150000000
  );
  const [guestEstimate, setGuestEstimate] = useState<number>(
    workspace.guest_estimate || 300
  );
  const [activeFunding, setActiveFunding] = useState<string[]>([
    "JOINT",
    "GROOM_FAMILY",
    "BRIDE_FAMILY",
  ]);
  const [customPercentages, setCustomPercentages] = useState<number[] | null>(
    null
  );

  // Step 3: Honeymoon Setup
  const isCompletePass = workspace.plan === "COMPLETE_PASS";
  const [skipHoneymoon, setSkipHoneymoon] = useState(!isCompletePass);
  const [hmDestination, setHmDestination] = useState(
    workspace.honeymoon_destination || ""
  );
  const [hmStartDate, setHmStartDate] = useState(
    workspace.honeymoon_start_date || ""
  );
  const [hmEndDate, setHmEndDate] = useState(
    workspace.honeymoon_end_date || ""
  );
  const [hmCurrency, setHmCurrency] = useState(
    workspace.honeymoon_currency || "JPY"
  );
  const [hmExchangeRate, setHmExchangeRate] = useState<number>(
    workspace.honeymoon_currency && workspace.honeymoon_currency !== "IDR"
      ? Number(workspace.honeymoon_exchange_rate)
      : getCurrencyOption("JPY").defaultRateToIDR
  );
  const [hmBudget, setHmBudget] = useState<number>(
    Number(workspace.honeymoon_budget_target) || 35000000
  );

  const inviteUrl = `${appUrl}/join/${workspace.invite_code}`;

  // Hitung alokasi pintar + dukungan override persentase
  const allocations: SmartCategoryAllocation[] = useMemo(() => {
    const base = buildSmartWeddingAllocations(budgetTarget, guestEstimate);
    if (!customPercentages || customPercentages.length !== base.length) {
      return base;
    }
    return base.map((item, idx) => {
      const pct = customPercentages[idx];
      return {
        ...item,
        percentage: pct,
        amount: Math.round((budgetTarget * pct) / 100),
      };
    });
  }, [budgetTarget, guestEstimate, customPercentages]);

  const totalPct = allocations.reduce((acc, c) => acc + c.percentage, 0);
  const tripDays = calculateTripDays(hmStartDate, hmEndDate);

  const handleCopyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      setCopiedLink(false);
    }
  };

  const whatsappShareUrl = useMemo(() => {
    const text = `Hai sayang! Aku sudah bikin ruang rencana budget nikah kita di NikahPlan (${coupleTitle}). Gabung gratis pakai tautan ini ya: ${inviteUrl}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }, [coupleTitle, inviteUrl]);

  const toggleFunding = (key: string) => {
    setActiveFunding((prev) =>
      prev.includes(key)
        ? prev.length > 1
          ? prev.filter((item) => item !== key)
          : prev
        : [...prev, key]
    );
  };

  const handlePercentageChange = (index: number, nextPct: number) => {
    const clamped = Math.max(0, Math.min(100, nextPct));
    const current = allocations.map((a) => a.percentage);
    current[index] = clamped;
    setCustomPercentages(current);
  };

  const handleCurrencyChange = (nextCode: string) => {
    setHmCurrency(nextCode);
    const opt = getCurrencyOption(nextCode);
    setHmExchangeRate(opt.defaultRateToIDR);
  };

  const handleFinish = async () => {
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coupleTitle: coupleTitle.trim(),
          weddingDate: weddingDate || null,
          guestEstimate,
          weddingBudgetTarget: budgetTarget,
          allocations: allocations.map((a) => ({
            name: a.name,
            icon: a.icon,
            allocatedAmount: a.amount,
          })),
          honeymoon: {
            skipped: !isCompletePass || skipHoneymoon || !hmDestination.trim(),
            destination: hmDestination.trim() || null,
            startDate: hmStartDate || null,
            endDate: hmEndDate || null,
            currency: hmCurrency,
            exchangeRate: hmExchangeRate,
            budgetTarget: hmBudget,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Gagal menyimpan setup onboarding.");
        setSubmitting(false);
        return;
      }

      router.push(data.redirectTo || "/dashboard");
      router.refresh();
    } catch {
      setErrorMsg("Terjadi kendala jaringan. Silakan coba lagi.");
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen px-4 py-6 sm:py-10 overflow-x-hidden">
      <FloatingBotanicals preset="page" fixed />

      <div className="relative z-10 mx-auto max-w-xl space-y-6">
        {/* Header Logo & Stepper */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <NikahPlanLogo size="md" />
          </div>

          <div className="flex items-center justify-between gap-2 max-w-md mx-auto">
            {STEPS.map((s) => {
              const done = step > s.id;
              const active = step === s.id;
              return (
                <div key={s.id} className="flex-1 space-y-1.5">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-cream-300/80">
                    <motion.div
                      className={`h-full rounded-full ${
                        done ? "bg-sage" : active ? "bg-terracotta" : "bg-transparent"
                      }`}
                      initial={false}
                      animate={{ width: done || active ? "100%" : "0%" }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  <p
                    className={`text-[10px] sm:text-[11px] font-semibold truncate ${
                      active
                        ? "text-terracotta-700"
                        : done
                          ? "text-sage-800"
                          : "text-sage-400"
                    }`}
                  >
                    {s.id}. {s.title}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Card */}
        <Card className="glass-strong rounded-[2rem] shadow-lift overflow-hidden">
          <CardContent className="p-5 sm:p-7 space-y-6">
            {errorMsg && (
              <div className="flex items-start gap-2 rounded-xl border border-terracotta/30 bg-terracotta-50 p-3.5 text-sm text-terracotta-800">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-terracotta" />
                <span>{errorMsg}</span>
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -14 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
            {/* STEP 1: PROFIL & UNDANG PASANGAN */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="text-center space-y-1">
                  <Badge variant="softSage" className="mb-1">
                    Langkah 1 dari 4
                  </Badge>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-sage-900">
                    Profil &amp; Undang Pasangan
                  </h1>
                  <p className="text-xs sm:text-sm text-sage-600">
                    Atur nama panggilan kalian berdua dan undang pasangan agar
                    bisa mengisi budget bersama secara real-time.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="couple-title">Nama Pasangan</Label>
                    <Input
                      id="couple-title"
                      value={coupleTitle}
                      onChange={(e) => setCoupleTitle(e.target.value)}
                      placeholder="Contoh: Andi & Rina"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wedding-date">
                      Rencana Tanggal Pernikahan (Opsional)
                    </Label>
                    <div className="relative">
                      <Calendar className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sage-500" />
                      <Input
                        id="wedding-date"
                        type="date"
                        value={weddingDate}
                        onChange={(e) => setWeddingDate(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Invite Partner Box */}
                <div className="rounded-2xl border border-sage/15 bg-cream-50 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-terracotta-50 text-terracotta">
                        <HeartHandshake className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-sage-900">
                          Undang Pasangan (Gratis)
                        </p>
                        <p className="text-[11px] text-sage-600">
                          {memberCount >= 2
                            ? "Pasangan sudah terhubung!"
                            : "Slot pasangan tersedia (1 / 2 anggota)"}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-lg bg-white border border-sage/15 px-2.5 py-1 font-mono text-xs font-bold tracking-wider text-sage-900">
                      {workspace.invite_code}
                    </span>
                  </div>

                  <div className="rounded-xl bg-white border border-sage/10 px-3 py-2 text-xs font-mono text-sage-700 truncate">
                    {inviteUrl}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={handleCopyInvite}
                    >
                      {copiedLink ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-sage" />
                          Tautan Tersalin!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Salin Tautan
                        </>
                      )}
                    </Button>
                    <Button
                      asChild
                      type="button"
                      variant="sage"
                      size="sm"
                      className="w-full"
                    >
                      <a
                        href={whatsappShareUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        Share via WhatsApp
                      </a>
                    </Button>
                  </div>
                </div>

                <Button
                  type="button"
                  size="lg"
                  className="w-full"
                  disabled={!coupleTitle.trim()}
                  onClick={() => setStep(2)}
                >
                  Lanjut ke Alokasi Budget
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* STEP 2: SMART WEDDING BUDGET ALLOCATOR */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="text-center space-y-1">
                  <Badge variant="softSage" className="mb-1">
                    Langkah 2 dari 4
                  </Badge>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-sage-900">
                    Atur Budget Pernikahanmu
                  </h1>
                  <p className="text-xs sm:text-sm text-sage-600">
                    Sistem menghitung estimasi alokasi ideal berdasarkan total
                    bujet &amp; jumlah tamu Anda.
                  </p>
                </div>

                {/* Target Budget Card */}
                <div className="rounded-2xl border border-sage/12 bg-cream-50 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="budget-input" className="text-xs text-sage-600">
                      Target Budget Pernikahan
                    </Label>
                    <span className="text-xs font-semibold text-terracotta-700">
                      ~{formatIDR(budgetTarget / Math.max(1, guestEstimate))}/pax
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-sage-700">Rp</span>
                    <Input
                      id="budget-input"
                      type="number"
                      min={10000000}
                      step={5000000}
                      value={budgetTarget}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (!Number.isNaN(val) && val >= 0) {
                          setBudgetTarget(val);
                        }
                      }}
                      className="text-lg font-bold text-sage-900 h-11"
                    />
                  </div>

                  <Slider
                    value={[Math.min(500000000, Math.max(30000000, budgetTarget))]}
                    min={30000000}
                    max={500000000}
                    step={5000000}
                    onValueChange={([v]) => setBudgetTarget(v)}
                  />

                  <div className="flex flex-wrap gap-1.5">
                    {BUDGET_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setBudgetTarget(preset)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                          budgetTarget === preset
                            ? "bg-sage text-white"
                            : "bg-white border border-sage/15 text-sage-700 hover:bg-sage-50"
                        }`}
                      >
                        Rp {preset / 1000000} Jt
                      </button>
                    ))}
                  </div>
                </div>

                {/* Guest Estimate Slider */}
                <div className="space-y-2.5 px-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-1.5 font-medium text-sage-800">
                      <Users className="h-4 w-4 text-sage" />
                      Jumlah Tamu (Pax)
                    </span>
                    <span className="font-bold text-sage-900">
                      {formatNumberID(guestEstimate)} pax
                    </span>
                  </div>
                  <Slider
                    value={[guestEstimate]}
                    min={50}
                    max={1500}
                    step={25}
                    onValueChange={([v]) => setGuestEstimate(v)}
                  />
                </div>

                {/* Sumber Dana Aktif */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-sage-700">
                    Sumber Dana yang Terlibat
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "JOINT", label: "Tabungan Bersama" },
                      { id: "GROOM_FAMILY", label: "Pihak Pria" },
                      { id: "BRIDE_FAMILY", label: "Pihak Wanita" },
                    ].map((src) => {
                      const active = activeFunding.includes(src.id);
                      return (
                        <button
                          key={src.id}
                          type="button"
                          onClick={() => toggleFunding(src.id)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-colors ${
                            active
                              ? "border-sage bg-sage text-white"
                              : "border-sage/20 bg-white text-sage-700 hover:bg-sage-50"
                          }`}
                        >
                          {active && <Check className="h-3 w-3" />}
                          {src.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Donut Chart + Editable Percentages */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center pt-1">
                  <div className="sm:col-span-5 relative mx-auto h-44 w-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={allocations}
                          dataKey="percentage"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={76}
                          paddingAngle={2}
                          strokeWidth={0}
                        >
                          {allocations.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-[11px] font-medium text-sage-600">
                        Estimasi
                      </span>
                      <span className="text-sm font-bold text-sage-900">
                        Alokasi
                      </span>
                      <span
                        className={`text-[10px] font-bold ${
                          totalPct === 100
                            ? "text-sage-600"
                            : "text-terracotta-700"
                        }`}
                      >
                        Total {totalPct}%
                      </span>
                    </div>
                  </div>

                  <div className="sm:col-span-7 space-y-2">
                    {allocations.map((item, idx) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between gap-2 rounded-xl border border-sage/10 bg-cream-50/70 px-3 py-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-sage-900 truncate">
                              {item.name}
                            </p>
                            <p className="text-[11px] text-sage-600">
                              {formatIDR(item.amount)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={item.percentage}
                            onChange={(e) =>
                              handlePercentageChange(
                                idx,
                                Number(e.target.value) || 0
                              )
                            }
                            aria-label={`Persentase ${item.name}`}
                            className="w-12 rounded-lg border border-sage/20 bg-white px-1.5 py-1 text-right text-xs font-bold text-sage-900"
                          />
                          <span className="text-xs text-sage-600">%</span>
                        </div>
                      </div>
                    ))}
                    {customPercentages && (
                      <button
                        type="button"
                        onClick={() => setCustomPercentages(null)}
                        className="text-[11px] font-semibold text-terracotta hover:underline"
                      >
                        Reset ke rekomendasi pintar
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="shrink-0"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    className="flex-1"
                    onClick={() => setStep(3)}
                  >
                    Lanjut ke Honeymoon
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: SETUP HONEYMOON */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="text-center space-y-1">
                  <Badge variant="softTerracotta" className="mb-1">
                    Langkah 3 dari 4
                  </Badge>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-sage-900">
                    Rencana Honeymoon
                  </h1>
                  <p className="text-xs sm:text-sm text-sage-600">
                    Siapkan dompet perjalanan &amp; kalkulator uang saku harian
                    bulan madu Anda (dapat diubah kapan saja).
                  </p>
                </div>

                {!isCompletePass ? (
                  <div className="rounded-2xl border border-sage/15 bg-cream-50 p-5 text-center space-y-3">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-terracotta-50 text-terracotta">
                      <Lock className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-sage-900">
                      Khusus Paket Complete Couple Pass
                    </h3>
                    <p className="text-xs text-sage-600 leading-relaxed">
                      Anda saat ini menggunakan <strong>Wedding Only Pass</strong>.
                      Anda bisa langsung menyelesaikan setup anggaran pernikahan
                      terlebih dahulu.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="hm-dest">Destinasi Honeymoon</Label>
                      <div className="relative">
                        <Plane className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sage-500" />
                        <Input
                          id="hm-dest"
                          placeholder="Contoh: Jepang (Tokyo & Kyoto) / Bali / Swiss"
                          value={hmDestination}
                          onChange={(e) => {
                            setHmDestination(e.target.value);
                            if (skipHoneymoon && e.target.value.trim()) {
                              setSkipHoneymoon(false);
                            }
                          }}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="hm-start">Tanggal Berangkat</Label>
                        <Input
                          id="hm-start"
                          type="date"
                          value={hmStartDate}
                          onChange={(e) => setHmStartDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hm-end">Tanggal Pulang</Label>
                        <Input
                          id="hm-end"
                          type="date"
                          value={hmEndDate}
                          min={hmStartDate || undefined}
                          onChange={(e) => setHmEndDate(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Mata Uang Tujuan</Label>
                        <Select
                          value={hmCurrency}
                          onValueChange={handleCurrencyChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih mata uang" />
                          </SelectTrigger>
                          <SelectContent>
                            {HONEYMOON_CURRENCIES.map((cur) => (
                              <SelectItem key={cur.code} value={cur.code}>
                                {cur.code} ({cur.symbol}) — {cur.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="hm-rate">
                          Kurs ke IDR (1 {hmCurrency})
                        </Label>
                        <Input
                          id="hm-rate"
                          type="number"
                          step="0.5"
                          min={1}
                          value={hmExchangeRate}
                          onChange={(e) =>
                            setHmExchangeRate(Number(e.target.value) || 1)
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hm-budget">
                        Target Dana Honeymoon (IDR)
                      </Label>
                      <div className="relative">
                        <Wallet className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sage-500" />
                        <Input
                          id="hm-budget"
                          type="number"
                          step={1000000}
                          min={0}
                          value={hmBudget}
                          onChange={(e) =>
                            setHmBudget(Number(e.target.value) || 0)
                          }
                          className="pl-10 font-bold"
                        />
                      </div>
                      {tripDays > 0 && hmBudget > 0 && (
                        <p className="text-xs text-sage-600">
                          Durasi <strong>{tripDays} hari</strong> &bull; Estimasi
                          budget rata-rata{" "}
                          <strong>{formatIDR(hmBudget / tripDays)}/hari</strong>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="w-full sm:w-auto"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali
                  </Button>
                  {isCompletePass && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setSkipHoneymoon(true);
                        setStep(4);
                      }}
                      className="w-full sm:w-auto text-sage-600"
                    >
                      Lewati dulu
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="lg"
                    className="w-full sm:flex-1"
                    onClick={() => {
                      if (isCompletePass && hmDestination.trim()) {
                        setSkipHoneymoon(false);
                      }
                      setStep(4);
                    }}
                  >
                    Tinjau Ringkasan
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 4: SELESAI & KONFIRMASI */}
            {step === 4 && (
              <div className="space-y-5">
                <div className="text-center space-y-2">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sage text-white shadow-sm">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-sage-900">
                    Rencana Siap Dibuat!
                  </h1>
                  <p className="text-xs sm:text-sm text-sage-600">
                    Periksa kembali ringkasan awal sebelum masuk ke Dashboard{" "}
                    <strong>{coupleTitle}</strong>.
                  </p>
                </div>

                <div className="rounded-2xl border border-sage/12 bg-cream-50 p-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-sage-600">Nama Pasangan</span>
                    <span className="font-bold text-sage-900">{coupleTitle}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-sage-600">Tanggal Nikah</span>
                    <span className="font-semibold text-sage-900">
                      {weddingDate
                        ? new Date(weddingDate).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "Belum ditentukan"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-sage-600">Target Budget Nikah</span>
                    <span className="font-bold text-sage-900">
                      {formatIDR(budgetTarget)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-sage-600">Estimasi Tamu</span>
                    <span className="font-semibold text-sage-900">
                      {formatNumberID(guestEstimate)} pax
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-sage-600">Pos Anggaran Otomatis</span>
                    <span className="font-semibold text-sage-900">
                      {allocations.length} kategori pernikahan
                    </span>
                  </div>
                  {isCompletePass && !skipHoneymoon && hmDestination.trim() && (
                    <div className="pt-2 border-t border-sage/10 flex justify-between gap-3">
                      <span className="text-sage-600">Honeymoon</span>
                      <span className="font-semibold text-terracotta-700 text-right">
                        {hmDestination}
                        {tripDays > 0 ? ` (${tripDays} hari)` : ""} &bull;{" "}
                        {formatIDR(hmBudget)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(3)}
                    disabled={submitting}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Ubah
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    className="flex-1"
                    onClick={handleFinish}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Menyiapkan Dashboard...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Buat Rencana Anggaran
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
