"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Lock, Pencil, Sparkles, Users, ArrowRight } from "lucide-react";
import { calculateWeddingPreview } from "@/lib/plans";
import { formatIDR, formatNumberID } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BotanicalCorner } from "@/components/brand/botanical-accent";

const BUDGET_PRESETS = [75000000, 150000000, 250000000, 400000000];

export function InteractiveBudgetPreview() {
  const [targetBudget, setTargetBudget] = useState<number>(150000000);
  const [guestCount, setGuestCount] = useState<number>(300);

  const preview = useMemo(
    () => calculateWeddingPreview(targetBudget, guestCount),
    [targetBudget, guestCount]
  );

  return (
    <Card className="relative overflow-hidden border-sage/15 bg-cream-50/90 p-5 sm:p-7 shadow-soft rounded-3xl">
      <BotanicalCorner
        className="absolute -bottom-4 -right-4 h-32 w-32 opacity-30"
        variant="sage"
      />
      <BotanicalCorner
        className="absolute -top-4 -left-4 h-24 w-24 rotate-180 opacity-25"
        variant="terracotta"
      />

      <div className="relative z-10 space-y-5">
        <div className="text-center space-y-1">
          <p className="font-display text-lg font-bold text-sage">NikahPlan</p>
          <h3 className="text-base sm:text-lg font-semibold text-sage-900">
            Simulasi Cepat Budget Pernikahanmu
          </h3>
        </div>

        {/* Target Budget Box (matching reference UI) */}
        <div className="rounded-2xl bg-white border border-sage/10 p-4 shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-sage-600">Target Budget</p>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-sage-900 mt-0.5">
                {formatIDR(targetBudget)}
              </p>
            </div>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-cream-100 text-sage-700">
              <Pencil className="h-3.5 w-3.5" />
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

          <div className="flex flex-wrap gap-1.5 pt-1">
            {BUDGET_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setTargetBudget(preset)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  targetBudget === preset
                    ? "bg-sage text-white"
                    : "bg-cream-200/80 text-sage-700 hover:bg-cream-300"
                }`}
              >
                Rp {preset / 1000000} Jt
              </button>
            ))}
          </div>
        </div>

        {/* Jumlah Tamu Slider */}
        <div className="space-y-2.5 px-1">
          <div className="flex items-center justify-between text-sm">
            <span className="inline-flex items-center gap-1.5 font-medium text-sage-800">
              <Users className="h-4 w-4 text-sage" />
              Jumlah Tamu (Pax)
            </span>
            <span className="font-bold text-sage-900">
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
          <div className="flex justify-between text-[11px] text-sage-600">
            <span>Estimasi per tamu: {formatIDR(preview.costPerGuest)}</span>
            <span>Rekomendasi katering: ~{formatIDR(preview.recommendedCateringPerPax)}/pax</span>
          </div>
        </div>

        {/* Donut Chart + Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-1">
          <div className="relative mx-auto h-44 w-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={preview.slices}
                  dataKey="percentage"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={76}
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
              <span className="text-[11px] font-medium text-sage-600">
                Estimasi
              </span>
              <span className="text-sm font-bold text-sage-900">Alokasi</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {preview.slices.map((slice) => (
              <div
                key={slice.key}
                className="relative rounded-xl border border-sage/10 bg-white/95 px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: slice.color }}
                    />
                    <span className="text-xs font-semibold text-sage-900 truncate">
                      {slice.name} ({slice.percentage}%)
                    </span>
                  </div>
                  {slice.locked ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-cream-200 px-2 py-0.5 text-[10px] font-semibold text-sage-700 shrink-0">
                      <Lock className="h-2.5 w-2.5" />
                      Pro
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-sage-900 shrink-0">
                      {formatIDR(slice.amount)}
                    </span>
                  )}
                </div>

                {/* Blurred teaser for locked categories */}
                {slice.locked ? (
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[11px] text-sage-600 blur-[4px] select-none">
                      {formatIDR(slice.amount)} • Rincian termin DP
                    </span>
                  </div>
                ) : (
                  <p className="mt-0.5 text-[11px] text-sage-600 line-clamp-1">
                    {slice.tip}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Blurred Teaser Banner + CTA */}
        <div className="rounded-2xl border border-terracotta/25 bg-terracotta-50/80 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-terracotta-800 inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-terracotta" />
              Buka rincian 18+ pos vendor, jadwal DP &amp; Split Funding
            </p>
            <p className="text-[11px] text-terracotta-700/90">
              Termasuk cadangan dana darurat {formatIDR(preview.suggestedEmergencyFund)} &amp; integrasi Dompet Honeymoon.
            </p>
          </div>
        </div>

        <Button asChild size="lg" className="w-full">
          <Link href="/login?next=/checkout">
            Buat Rencana Anggaran Sekarang
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
