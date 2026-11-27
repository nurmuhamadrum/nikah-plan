"use client";

import { useEffect, useMemo, useState } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { Heart, Lock, Users } from "lucide-react";
import { calculateWeddingPreview } from "@/lib/plans";
import { formatIDR, formatNumberID } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";

const BUDGET_PRESETS = [75000000, 150000000, 250000000, 400000000];

const BAR_COLORS = ["#141618", "#4F6BF6", "#818CF8", "#E09F3E", "#94A3B8"];

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
  const [targetBudget, setTargetBudget] = useState<number>(150000000);
  const [guestCount, setGuestCount] = useState<number>(300);

  const preview = useMemo(
    () => calculateWeddingPreview(targetBudget, guestCount),
    [targetBudget, guestCount]
  );

  return (
    <div className="rounded-[2rem] border border-black/[0.06] bg-white p-5 sm:p-7 shadow-[0_18px_50px_-24px_rgba(17,19,23,0.14)] text-left">
      {/* Header Lembar Simulasi */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.06] pb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EEF2FF] text-[#4F6BF6]">
            <Heart className="h-4 w-4" />
          </span>
          <div>
            <p className="font-display text-sm sm:text-base font-bold text-[#141618]">
              Simulasi Rencana Anggaran
            </p>
            <p className="text-[11px] text-[#5F6978]">
              Geser angka untuk melihat estimasi porsi dana pernikahan kalian
            </p>
          </div>
        </div>
        <span className="rounded-full bg-[#F4F5F7] px-3 py-1 text-[11px] font-semibold text-[#141618] tabular-nums">
          ~{formatIDR(preview.costPerGuest)} / tamu
        </span>
      </div>

      {/* Grid 2 Kolom: Kontrol Kiri & Alokasi Kanan */}
      <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-12 md:items-center">
        {/* Kiri: Sliders & Presets (6 col) */}
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
              onValueChange={([val]) => setTargetBudget(val)}
              aria-label="Target Budget Pernikahan"
            />

            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {BUDGET_PRESETS.map((preset) => {
                const active = targetBudget === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTargetBudget(preset)}
                    className={`relative rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                      active
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
                    <span className="relative">Rp {preset / 1000000} Jt</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 border-t border-black/[0.06] pt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 font-medium text-[#5F6978]">
                <Users className="h-3.5 w-3.5 text-[#4F6BF6]" />
                Jumlah Tamu
              </span>
              <span className="font-bold text-[#141618] tabular-nums">
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
            <p className="text-[11px] text-[#8994A4] tabular-nums">
              Patokan katering: ~{formatIDR(preview.recommendedCateringPerPax)}/pax
            </p>
          </div>
        </div>

        {/* Kanan: Alokasi Porsi Dana Beranimasi (6 col) */}
        <div className="space-y-3.5 rounded-2xl bg-[#F7F8FA] p-4 sm:p-5 md:col-span-6">
          {preview.slices.map((slice, idx) => (
            <div key={slice.key} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-[#141618] truncate">
                  {slice.name}{" "}
                  <span className="font-mono text-[10.5px] font-normal text-[#5F6978]">
                    {slice.percentage}%
                  </span>
                </span>
                {slice.locked ? (
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-[#5F6978] shrink-0">
                    <Lock className="h-3 w-3" />
                    Di aplikasi
                  </span>
                ) : (
                  <span className="font-bold text-[#141618] tabular-nums shrink-0">
                    {formatIDR(slice.amount)}
                  </span>
                )}
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E5E9F0]">
                <motion.div
                  className="h-full rounded-full"
                  initial={false}
                  animate={{ width: `${slice.percentage}%` }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    backgroundColor: BAR_COLORS[idx % BAR_COLORS.length],
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
