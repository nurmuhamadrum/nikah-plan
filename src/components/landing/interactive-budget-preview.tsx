"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Lock, Pencil, Sparkles, Users, ArrowRight } from "lucide-react";
import { calculateWeddingPreview } from "@/lib/plans";
import { formatIDR, formatNumberID } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BotanicalCorner } from "@/components/brand/botanical-accent";

const BUDGET_PRESETS = [75000000, 150000000, 250000000, 400000000];

/** Angka rupiah yang beranimasi halus setiap nilainya berubah. */
function AnimatedIDR({ value, className }: { value: number; className?: string }) {
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => formatIDR(Math.round(v / 100000) * 100000));

  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.5, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [mv, value]);

  return <motion.span className={`tabular-nums ${className ?? ""}`}>{text}</motion.span>;
}

export function InteractiveBudgetPreview() {
  const [targetBudget, setTargetBudget] = useState<number>(150000000);
  const [guestCount, setGuestCount] = useState<number>(300);

  const preview = useMemo(
    () => calculateWeddingPreview(targetBudget, guestCount),
    [targetBudget, guestCount]
  );

  return (
    <Card className="relative overflow-hidden rounded-3xl border-white/70 bg-white/80 p-4 shadow-lift backdrop-blur-xl sm:p-5">
      <BotanicalCorner
        className="absolute -bottom-4 -right-4 h-24 w-24 opacity-30"
        variant="sage"
      />
      <BotanicalCorner
        className="absolute -top-4 -left-4 h-20 w-20 rotate-180 opacity-25"
        variant="terracotta"
      />

      <div className="relative z-10 space-y-3.5">
        <div className="text-center space-y-0.5">
          <p className="font-script text-2xl leading-none text-terracotta">Simulasi</p>
          <h3 className="font-display text-base sm:text-[17px] font-semibold text-sage-900">
            Cek Cepat Budget Pernikahanmu
          </h3>
        </div>

        {/* Target Budget Box (matching reference UI) */}
        <div className="rounded-2xl bg-white border border-sage/10 p-3 shadow-sm space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-medium text-sage-600">Target Budget</p>
              <AnimatedIDR
                value={targetBudget}
                className="block font-display text-xl sm:text-2xl font-semibold tracking-tight text-sage-900"
              />
            </div>
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-cream-100 text-sage-700">
              <Pencil className="h-3 w-3" />
            </span>
          </div>

          <Slider
            value={[targetBudget]}
            min={30000000}
            max={500000000}
            step={5000000}
            onValueChange={([val]) => setTargetBudget(val)}
            aria-label="Target Budget Pernikahan"
          />

          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {BUDGET_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setTargetBudget(preset)}
                className={`relative rounded-full px-2 py-0.5 text-[10.5px] font-semibold transition-colors ${
                  targetBudget === preset
                    ? "text-white"
                    : "bg-cream-200/80 text-sage-700 hover:bg-cream-300"
                }`}
              >
                {targetBudget === preset && (
                  <motion.span
                    layoutId="budget-preset-pill"
                    className="absolute inset-0 rounded-full bg-sage"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  />
                )}
                <span className="relative">Rp {preset / 1000000} Jt</span>
              </button>
            ))}
          </div>
        </div>

        {/* Jumlah Tamu Slider */}
        <div className="space-y-1.5 px-0.5">
          <div className="flex items-center justify-between text-xs sm:text-[13px]">
            <span className="inline-flex items-center gap-1.5 font-medium text-sage-800">
              <Users className="h-3.5 w-3.5 text-sage" />
              Jumlah Tamu (Pax)
            </span>
            <span className="font-bold text-sage-900 tabular-nums">
              {formatNumberID(guestCount)} pax
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
          <div className="flex justify-between gap-2 text-[10.5px] text-sage-600">
            <span>Per tamu: {formatIDR(preview.costPerGuest)}</span>
            <span>Katering: ~{formatIDR(preview.recommendedCateringPerPax)}/pax</span>
          </div>
        </div>

        {/* Donut Chart + Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center pt-0.5">
          <div className="relative mx-auto h-36 w-36 sm:col-span-5">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={preview.slices}
                  dataKey="percentage"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={64}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {preview.slices.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-medium text-sage-600">
                Estimasi
              </span>
              <span className="text-xs font-bold text-sage-900">Alokasi</span>
            </div>
          </div>

          <div className="space-y-1.5 sm:col-span-7">
            {preview.slices.map((slice) => (
              <div
                key={slice.key}
                className="relative rounded-xl border border-sage/10 bg-white/95 px-2.5 py-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: slice.color }}
                    />
                    <span className="text-[11px] font-semibold text-sage-900 truncate">
                      {slice.name} ({slice.percentage}%)
                    </span>
                  </div>
                  {slice.locked ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-cream-200 px-1.5 py-0.5 text-[9.5px] font-semibold text-sage-700 shrink-0">
                      <Lock className="h-2.5 w-2.5" />
                      Pro
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-sage-900 tabular-nums shrink-0">
                      {formatIDR(slice.amount)}
                    </span>
                  )}
                </div>

                {/* Blurred teaser for locked categories */}
                {slice.locked ? (
                  <div className="mt-0.5 flex items-center justify-between">
                    <span className="text-[10px] text-sage-600 blur-[3.5px] select-none">
                      {formatIDR(slice.amount)} • Rincian termin DP
                    </span>
                  </div>
                ) : (
                  <p className="mt-0.5 text-[10px] text-sage-600 line-clamp-1">
                    {slice.tip}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Blurred Teaser Banner */}
        <div className="rounded-xl border border-terracotta/25 bg-terracotta-50/80 px-3 py-2">
          <p className="text-[11px] font-semibold text-terracotta-800 inline-flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 shrink-0 text-terracotta" />
            Buka rincian 18+ pos vendor, jadwal DP &amp; Split Funding
          </p>
          <p className="text-[10.5px] text-terracotta-700/90 mt-0.5">
            Termasuk cadangan dana darurat {formatIDR(preview.suggestedEmergencyFund)} &amp; Dompet Honeymoon.
          </p>
        </div>

        <Button asChild size="default" className="w-full h-10 text-sm">
          <Link href="/login?next=/checkout">
            Buat Rencana Anggaran Sekarang
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
