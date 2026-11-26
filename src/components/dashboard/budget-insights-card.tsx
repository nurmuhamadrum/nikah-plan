"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  PieChart,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WeddingInsightsSummary } from "@/lib/budget-insights";
import { formatIDR } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface BudgetInsightsCardProps {
  insights: WeddingInsightsSummary;
}

function formatCompactJuta(value: number): string {
  if (value >= 1_000_000) {
    const jt = value / 1_000_000;
    return `${jt % 1 === 0 ? jt.toFixed(0) : jt.toFixed(1)}Jt`;
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}rb`;
  }
  return `${value}`;
}

export function BudgetInsightsCard({ insights }: BudgetInsightsCardProps) {
  const [showChart, setShowChart] = useState(true);

  const { overallHealth } = insights;
  const HealthIcon =
    overallHealth.level === "overbudget"
      ? AlertTriangle
      : overallHealth.level === "warning"
        ? AlertTriangle
        : CheckCircle2;

  const chartData = insights.categoryRows
    .filter((r) => r.allocated > 0 || r.effectiveSpent > 0)
    .slice(0, 8)
    .map((r) => ({
      name:
        r.category.name.length > 13
          ? `${r.category.name.slice(0, 12)}…`
          : r.category.name,
      fullName: r.category.name,
      Target: r.allocated,
      Realisasi: r.effectiveSpent,
    }));

  return (
    <div className="space-y-4">
      {/* Banner Status Kesehatan Budget Keseluruhan */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border px-4 py-3 shadow-sm ${overallHealth.bannerClass}`}
      >
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          <HealthIcon className="h-4.5 w-4.5 shrink-0 mt-0.5 sm:mt-0" />
          <div className="min-w-0">
            <p className="text-xs font-bold leading-snug">
              {overallHealth.level === "overbudget"
                ? `Overbudget ${formatIDR(overallHealth.overAmount)} — Perlu penyesuaian segera`
                : overallHealth.level === "warning"
                  ? `Hampir Habis (${overallHealth.usagePct}%) — Sisa ${formatIDR(overallHealth.remaining)}`
                  : `Budget masih aman (${overallHealth.usagePct}% terpakai) — Sisa ${formatIDR(overallHealth.remaining)}`}
            </p>
            <p className="text-[11px] opacity-80 leading-snug mt-0.5">
              {insights.overbudgetCategories.length > 0
                ? `${insights.overbudgetCategories.length} pos melewati batas alokasi.`
                : insights.warningCategories.length > 0
                  ? `${insights.warningCategories.length} pos mendekati batas (≥ 90%).`
                  : "Semua kategori berada dalam batas aman."}
            </p>
          </div>
        </div>

        <Button
          asChild
          size="sm"
          variant="outline"
          className="h-8 px-3 text-[11px] shrink-0 bg-white/85"
        >
          <Link href="/panduan">
            <BookOpen className="h-3.5 w-3.5 text-terracotta" />
            Panduan &amp; Skenario
          </Link>
        </Button>
      </div>

      {/* Kartu Insight & Decision Support */}
      <Card className="glass-strong rounded-3xl shadow-card overflow-hidden">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amberwarm-light text-sage-900">
                <Lightbulb className="h-4 w-4 text-terracotta" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-sage-900">
                  Insight &amp; Decision Support
                </h2>
                <p className="text-[11px] text-sage-600">
                  Analisis otomatis real-time dari data vendor &amp; termin
                </p>
              </div>
            </div>

            {chartData.length > 0 && (
              <button
                type="button"
                onClick={() => setShowChart((prev) => !prev)}
                className="inline-flex items-center gap-1 rounded-full border border-sage/15 bg-white px-2.5 py-1 text-[11px] font-semibold text-sage-700 hover:bg-sage-50 transition-colors"
              >
                <BarChart3 className="h-3.5 w-3.5 text-sage" />
                Grafik
                {showChart ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
            )}
          </div>

          {/* 4 Metrik Kunci */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl border border-sage/10 bg-white/90 p-3">
              <p className="inline-flex items-center gap-1 text-[10.5px] font-medium text-sage-600">
                <PieChart className="h-3 w-3 text-sage" />
                Utilization Rate
              </p>
              <p className="font-display text-lg sm:text-xl font-semibold tabular-nums text-sage-900 mt-0.5">
                {insights.utilizationRate}%
              </p>
              <p className="text-[10px] text-sage-500">
                Terbayar aktual: {insights.paidRate}%
              </p>
            </div>

            <div className="rounded-2xl border border-sage/10 bg-white/90 p-3">
              <p className="inline-flex items-center gap-1 text-[10.5px] font-medium text-sage-600">
                {insights.efficiencyDelta >= 0 ? (
                  <TrendingDown className="h-3 w-3 text-emerald-600" />
                ) : (
                  <TrendingUp className="h-3 w-3 text-red-600" />
                )}
                Efisiensi Budget
              </p>
              <p
                className={`font-display text-base sm:text-lg font-semibold tabular-nums truncate mt-0.5 ${
                  insights.efficiencyDelta >= 0
                    ? "text-emerald-700"
                    : "text-red-600"
                }`}
              >
                {insights.efficiencyDelta >= 0
                  ? `Hemat ${formatIDR(insights.efficiencyDelta)}`
                  : `+${formatIDR(Math.abs(insights.efficiencyDelta))}`}
              </p>
              <p className="text-[10px] text-sage-500">
                {insights.efficiencyDelta >= 0
                  ? "Masih di bawah target"
                  : "Melebihi target utama"}
              </p>
            </div>

            <div className="rounded-2xl border border-sage/10 bg-white/90 p-3">
              <p className="inline-flex items-center gap-1 text-[10.5px] font-medium text-sage-600">
                <Target className="h-3 w-3 text-terracotta" />
                Kategori Terbesar
              </p>
              <p className="text-xs sm:text-sm font-bold text-sage-900 truncate mt-1">
                {insights.largestCategory?.category.name ?? "-"}
              </p>
              <p className="text-[10.5px] font-semibold tabular-nums text-sage-600">
                {insights.largestCategory
                  ? formatIDR(
                      insights.largestCategory.effectiveSpent ||
                        insights.largestCategory.allocated
                    )
                  : "Belum ada data"}
              </p>
            </div>

            <div className="rounded-2xl border border-sage/10 bg-white/90 p-3">
              <p className="inline-flex items-center gap-1 text-[10.5px] font-medium text-sage-600">
                <AlertTriangle className="h-3 w-3 text-amber-600" />
                Status Kategori
              </p>
              <p className="text-xs sm:text-sm font-bold text-sage-900 mt-1">
                {insights.overbudgetCategories.length > 0 ? (
                  <span className="text-red-600">
                    {insights.overbudgetCategories.length} Overbudget
                  </span>
                ) : insights.warningCategories.length > 0 ? (
                  <span className="text-amber-700">
                    {insights.warningCategories.length} Hampir Habis
                  </span>
                ) : (
                  <span className="text-emerald-700">Semua Aman</span>
                )}
              </p>
              <p className="text-[10px] text-sage-500">
                Dari {insights.categoryRows.length} pos aktif
              </p>
            </div>
          </div>

          {/* Rekomendasi Otomatis */}
          <div className="rounded-2xl border border-sage/12 bg-sage-50/75 px-3.5 py-2.5 text-xs text-sage-800 leading-relaxed">
            <span className="font-bold text-sage-900">Rekomendasi: </span>
            {insights.recommendation}
          </div>

          {/* Visual Progress Bar Chart (Target vs Realisasi) */}
          {showChart && chartData.length > 0 && (
            <div className="pt-1 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-sage-600">
                <span className="font-semibold text-sage-800">
                  Target vs Realisasi per Kategori
                </span>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-sage-200" />
                    Target
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-terracotta" />
                    Realisasi
                  </span>
                </div>
              </div>

              <div className="h-48 w-full rounded-2xl border border-sage/10 bg-white/80 p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 8, right: 8, left: -16, bottom: 4 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#E5E0D5"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: "#537662" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={formatCompactJuta}
                      tick={{ fontSize: 10, fill: "#537662" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(val: number) => formatIDR(Number(val) || 0)}
                      labelFormatter={(_label, payload) =>
                        (payload?.[0]?.payload as { fullName?: string })
                          ?.fullName || String(_label)
                      }
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid rgba(61,82,69,0.12)",
                        fontSize: "12px",
                      }}
                    />
                    <Bar
                      dataKey="Target"
                      fill="#C5D6CC"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={24}
                    />
                    <Bar
                      dataKey="Realisasi"
                      fill="#C87D55"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={24}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
