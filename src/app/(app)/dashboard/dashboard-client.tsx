"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Calendar,
  ChevronRight,
  FileText,
  Plus,
} from "lucide-react";
import type { WorkspaceBundle } from "@/lib/workspace-data";
import { fetchWorkspaceBundleOfflineFirst } from "@/lib/offline/query-helpers";
import {
  executeOfflineFirstMutation,
  saveWorkspaceSnapshot,
} from "@/lib/offline/sync-engine";
import { logWorkspaceActivity } from "@/lib/activity-logger";
import { exportFamilyMeetingPDF } from "@/lib/export-reports";
import { useToast } from "@/components/providers/toast-provider";
import { useWorkspaceRealtime } from "@/hooks/use-workspace-realtime";
import { useAppStore } from "@/store/use-app-store";
import { formatIDR } from "@/lib/utils";
import {
  CategoryIconBadge,
  FUNDING_SOURCE_META,
} from "@/lib/category-icons";
import type { FundingSource, Profile } from "@/types/database";
import { NikahPlanLogo } from "@/components/brand/logo";
import { RevealItem, RevealStagger } from "@/components/motion/reveal";
import { SyncStatusBadge } from "@/components/dashboard/sync-status-badge";
import { BudgetInsightsCard } from "@/components/dashboard/budget-insights-card";
import { SavingsTrackerCard } from "@/components/dashboard/savings-tracker-card";
import { ActivityLogCard } from "@/components/dashboard/activity-log-card";
import { PaymentReminderButtons } from "@/components/vendors/payment-reminder-menu";
import { computeWeddingInsights } from "@/lib/budget-insights";
import { HoneymoonPanel } from "@/components/honeymoon/honeymoon-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

interface DashboardClientProps {
  profile: Profile;
  initialBundle: WorkspaceBundle;
}

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
}

export function DashboardClient({
  profile,
  initialBundle,
}: DashboardClientProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const mode = useAppStore((s) => s.mode);
  const setMode = useAppStore((s) => s.setMode);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const workspaceId = initialBundle.workspace.id;
  useWorkspaceRealtime(workspaceId);

  useEffect(() => {
    saveWorkspaceSnapshot(initialBundle);
  }, [initialBundle]);

  const { data: bundle = initialBundle } = useQuery({
    queryKey: ["workspace-data", workspaceId],
    queryFn: () => fetchWorkspaceBundleOfflineFirst(workspaceId, initialBundle),
    initialData: initialBundle,
  });

  const { workspace, categories, items, payments } = bundle;

  // --- KALKULASI WEDDING METRICS ---
  const weddingItems = useMemo(
    () => items.filter((i) => i.phase === "WEDDING"),
    [items]
  );

  const weddingItemIds = useMemo(
    () => new Set(weddingItems.map((i) => i.id)),
    [weddingItems]
  );

  const weddingPayments = useMemo(
    () => payments.filter((p) => weddingItemIds.has(p.item_id)),
    [payments, weddingItemIds]
  );

  const metrics = useMemo(() => {
    const targetBudget = Number(workspace.wedding_budget_target) || 0;
    const totalDeal = weddingItems.reduce(
      (sum, item) => sum + (Number(item.deal_cost) || Number(item.estimated_cost) || 0),
      0
    );
    const totalPaid = weddingPayments
      .filter((p) => p.is_paid)
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const remainingBudget = Math.max(0, targetBudget - totalPaid);
    const remainingPct =
      targetBudget > 0 ? Math.round((remainingBudget / targetBudget) * 100) : 0;
    const spentPct =
      targetBudget > 0
        ? Math.min(100, Math.round((totalPaid / targetBudget) * 100))
        : 0;

    return {
      targetBudget,
      totalDeal,
      totalPaid,
      remainingBudget,
      remainingPct,
      spentPct,
    };
  }, [workspace.wedding_budget_target, weddingItems, weddingPayments]);

  // --- FUNDING SPLIT BAR ---
  const fundingSplit = useMemo(() => {
    const paidOnly = weddingPayments.filter((p) => p.is_paid);
    const sourcePool = paidOnly.length > 0 ? paidOnly : weddingPayments;

    const totals: Record<FundingSource, number> = {
      JOINT: 0,
      GROOM_FAMILY: 0,
      BRIDE_FAMILY: 0,
      ANGPAO: 0,
    };

    for (const p of sourcePool) {
      totals[p.funding] = (totals[p.funding] || 0) + (Number(p.amount) || 0);
    }

    const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);

    // Jika belum ada termin sama sekali, tampilkan placeholder edukatif 50 / 30 / 20
    if (grandTotal === 0) {
      return {
        isEmpty: true,
        entries: [
          { key: "JOINT" as FundingSource, pct: 50, amount: 0 },
          { key: "GROOM_FAMILY" as FundingSource, pct: 30, amount: 0 },
          { key: "BRIDE_FAMILY" as FundingSource, pct: 20, amount: 0 },
        ],
      };
    }

    const keys: FundingSource[] = [
      "JOINT",
      "GROOM_FAMILY",
      "BRIDE_FAMILY",
      ...(totals.ANGPAO > 0 ? (["ANGPAO"] as FundingSource[]) : []),
    ];

    return {
      isEmpty: false,
      entries: keys.map((key) => ({
        key,
        amount: totals[key],
        pct: Math.round((totals[key] / grandTotal) * 100),
      })),
    };
  }, [weddingPayments]);

  // --- TAGIHAN MENDESAK (UPCOMING / OVERDUE TERMIN) ---
  const urgentPayments = useMemo(() => {
    const itemMap = new Map(weddingItems.map((i) => [i.id, i]));
    return weddingPayments
      .filter((p) => !p.is_paid && p.due_date)
      .map((p) => ({
        payment: p,
        item: itemMap.get(p.item_id),
        daysUntil: getDaysUntil(p.due_date!),
      }))
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 3);
  }, [weddingItems, weddingPayments]);

  // --- INSIGHT & DECISION SUPPORT (XLSX Summary Engine) ---
  const weddingInsights = useMemo(
    () => computeWeddingInsights(workspace, categories, items, payments),
    [workspace, categories, items, payments]
  );

  // --- RINGKASAN PER KATEGORI ---
  const categorySummaries = weddingInsights.categoryRows;

  const refreshData = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["workspace-data", workspaceId],
    });
  };

  const handleQuickMarkPaid = async (paymentId: string) => {
    setMarkingId(paymentId);
    try {
      const today = new Date().toISOString().split("T")[0];
      const { queued } = await executeOfflineFirstMutation({
        workspaceId,
        table: "item_payments",
        operation: "UPDATE",
        recordId: paymentId,
        payload: { is_paid: true, paid_date: today },
        queryClient,
      });
      const paidTarget = weddingPayments.find((p) => p.id === paymentId);
      const paidItem = paidTarget
        ? weddingItems.find((i) => i.id === paidTarget.item_id)
        : undefined;
      if (paidTarget) {
        await logWorkspaceActivity({
          workspaceId,
          actorName: profile.full_name,
          actionType: "PAYMENT_PAID",
          summary: `menandai "${paidTarget.label}"${paidItem ? ` (${paidItem.title})` : ""} sebesar ${formatIDR(Number(paidTarget.amount) || 0)} LUNAS`,
          entityPath: "/vendors",
          queryClient,
        });
      }

      if (!queued) {
        await queryClient.invalidateQueries({
          queryKey: ["workspace-data", workspaceId],
        });
        toast.success("Termin ditandai lunas", "Status pembayaran telah diperbarui.");
      } else {
        toast.warning(
          "Status lunas disimpan di antrean offline",
          "Akan disinkronkan otomatis saat kembali online."
        );
      }
    } catch (err) {
      toast.error(
        "Gagal menandai termin lunas",
        err instanceof Error ? err.message : "Silakan coba lagi."
      );
    } finally {
      setMarkingId(null);
    }
  };

  const initials = (profile.full_name || "NP")
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  const weddingCountdown = workspace.wedding_date
    ? getDaysUntil(workspace.wedding_date)
    : null;

  return (
    <div className="relative space-y-5 pb-4">
      {/* Mobile Top Bar (Logo + Avatar) */}
      <div className="relative z-10 flex items-center justify-between md:hidden">
        <NikahPlanLogo size="sm" />
        <Link href="/settings" aria-label="Profil & Pengaturan">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={profile.full_name}
              className="h-9 w-9 rounded-full object-cover border border-sage/20 shadow-sm"
            />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-100 text-xs font-bold text-sage-800 border border-sage/15">
              {initials}
            </span>
          )}
        </Link>
      </div>

      {/* Couple Header + Sync Indicator */}
      <header className="relative z-10 space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="font-script text-4xl sm:text-5xl text-gradient-warm leading-tight py-0.5">
            {workspace.couple_title}
          </h1>
          {weddingCountdown !== null && weddingCountdown >= 0 && (
            <Badge variant="shimmer" className="text-xs">
              <Calendar className="relative h-3.5 w-3.5 text-terracotta" />
              <span className="relative">H-{weddingCountdown} Hari</span>
            </Badge>
          )}
        </div>
        <SyncStatusBadge />
      </header>

      {/* Segmented Mode Switcher (Pernikahan | Honeymoon) */}
      <div
        role="tablist"
        aria-label="Mode Anggaran"
        className="relative z-10 grid grid-cols-2 rounded-full glass p-1 shadow-sm"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "WEDDING"}
          onClick={() => setMode("WEDDING")}
          className={`relative rounded-full py-2.5 text-sm font-semibold transition-colors ${
            mode === "WEDDING"
              ? "text-cream-50"
              : "text-sage-700 hover:text-sage-900"
          }`}
        >
          {mode === "WEDDING" && (
            <motion.span
              layoutId="dashboard-mode-pill"
              className="absolute inset-0 rounded-full bg-gradient-to-r from-sage-600 to-sage shadow-sm"
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
            />
          )}
          <span className="relative">Pernikahan</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "HONEYMOON"}
          onClick={() => setMode("HONEYMOON")}
          className={`relative rounded-full py-2.5 text-sm font-semibold transition-colors ${
            mode === "HONEYMOON"
              ? "text-cream-50"
              : "text-sage-700 hover:text-sage-900"
          }`}
        >
          {mode === "HONEYMOON" && (
            <motion.span
              layoutId="dashboard-mode-pill"
              className="absolute inset-0 rounded-full bg-gradient-to-r from-sage-600 to-sage shadow-sm"
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
            />
          )}
          <span className="relative">Honeymoon</span>
        </button>
      </div>

      {/* ================================================================= */}
      {/* MODE PERNIKAHAN                                                   */}
      {/* ================================================================= */}
      {mode === "WEDDING" ? (
        <div className="space-y-5 relative z-10">
          {/* Kartu Kesehatan Anggaran (Sleek Charcoal Hero) & Funding Split Bar */}
          <Card className="relative overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-card">
            <div className="relative bg-midnight-luxury p-5 sm:p-6 text-white space-y-4">

              {/* Primary Metric: Sisa Anggaran */}
              <div className="relative z-10 space-y-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-cream-200/85">
                      Sisa Anggaran Tersedia
                    </p>
                    <p className="font-display text-3xl sm:text-4xl font-semibold tracking-tight tabular-nums text-cream-50 mt-0.5">
                      {formatIDR(metrics.remainingBudget)}
                    </p>
                  </div>
                  <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-cream-50">
                    ~{metrics.remainingPct}%
                  </span>
                </div>

                {/* Progress Bar Animated */}
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/15">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-terracotta-300 via-amberwarm to-amberwarm-light"
                    initial={{ width: 0 }}
                    animate={{ width: `${metrics.spentPct}%` }}
                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>

                {/* 3 Sub-Metrics Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 pt-1.5">
                  <div className="flex items-center justify-between lg:block rounded-xl bg-white/10 px-3 py-2 border border-white/12 backdrop-blur-sm">
                    <p className="text-[11px] lg:text-[10px] font-medium text-cream-200/85">
                      Target Bujet
                    </p>
                    <p className="text-xs lg:text-sm font-bold text-cream-50 tabular-nums lg:truncate lg:mt-0.5">
                      {formatIDR(metrics.targetBudget)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between lg:block rounded-xl bg-white/10 px-3 py-2 border border-white/12 backdrop-blur-sm">
                    <p className="text-[11px] lg:text-[10px] font-medium text-cream-200/85">
                      Deal Vendor
                    </p>
                    <p className="text-xs lg:text-sm font-bold text-terracotta-200 tabular-nums lg:truncate lg:mt-0.5">
                      {formatIDR(metrics.totalDeal)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between lg:block rounded-xl bg-white/10 px-3 py-2 border border-white/12 backdrop-blur-sm">
                    <p className="text-[11px] lg:text-[10px] font-medium text-cream-200/85">
                      Sudah Dibayar
                    </p>
                    <p className="text-xs lg:text-sm font-bold text-amberwarm-light tabular-nums lg:truncate lg:mt-0.5">
                      {formatIDR(metrics.totalPaid)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <CardContent className="p-5 sm:p-6">
              {/* Pembagian Dana (Funding Split Bar) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-sage-800">
                    Pembagian Dana
                  </p>
                  {fundingSplit.isEmpty && (
                    <span className="text-[10px] text-sage-500">
                      Contoh proporsi &bull; catat termin untuk hitung otomatis
                    </span>
                  )}
                </div>

                <div className="flex h-3 w-full overflow-hidden rounded-full bg-cream-200 gap-0.5">
                  {fundingSplit.entries.map((entry) => {
                    const meta = FUNDING_SOURCE_META[entry.key];
                    if (entry.pct <= 0) return null;
                    return (
                      <div
                        key={entry.key}
                        style={{
                          width: `${entry.pct}%`,
                          backgroundColor: meta.color,
                        }}
                        className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                        title={`${meta.fullLabel}: ${entry.pct}%`}
                      />
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  {fundingSplit.entries.map((entry) => {
                    const meta = FUNDING_SOURCE_META[entry.key];
                    return (
                      <div
                        key={entry.key}
                        className="flex items-center gap-1.5 text-sage-700"
                      >
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: meta.color }}
                        />
                        <span className="font-medium">{meta.label}</span>
                        <span className="font-bold text-sage-900 tabular-nums">
                          ({entry.pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Kesehatan 3 Warna, Insight & Grafik Kategori */}
          <BudgetInsightsCard insights={weddingInsights} />

          {/* Tagihan Mendesak / Pengingat Jatuh Tempo */}
          {urgentPayments.length > 0 && (
            <div className="space-y-2.5">
              {urgentPayments.map(({ payment, item, daysUntil }) => {
                const dueLabel =
                  daysUntil < 0
                    ? `Terlambat ${Math.abs(daysUntil)} hari`
                    : daysUntil === 0
                      ? "Jatuh Tempo Hari Ini"
                      : `H-${daysUntil}`;

                return (
                  <div
                    key={payment.id}
                    className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Link
                        href={`/vendors${item ? `?category=${item.category_id}` : ""}`}
                        className="flex items-start gap-3 min-w-0 flex-1"
                      >
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                          <AlertTriangle className="h-4.5 w-4.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-amber-800">
                            Tagihan Mendesak &bull; {dueLabel}
                          </p>
                          <p className="text-sm font-semibold text-sage-900 truncate">
                            {payment.label}
                            {item ? ` — ${item.title}` : ""}
                          </p>
                          <p className="text-xs text-sage-700">
                            {formatIDR(Number(payment.amount))} &bull;{" "}
                            {FUNDING_SOURCE_META[payment.funding].fullLabel}
                          </p>
                        </div>
                      </Link>

                      <Button
                        type="button"
                        size="sm"
                        variant="sage"
                        className="shrink-0 h-8 px-3 text-xs"
                        disabled={markingId === payment.id}
                        onClick={() => handleQuickMarkPaid(payment.id)}
                      >
                        {markingId === payment.id ? "..." : "Lunas"}
                      </Button>
                    </div>

                    {payment.due_date && (
                      <div className="pl-0 sm:pl-12">
                        <PaymentReminderButtons
                          reminder={{
                            paymentId: payment.id,
                            label: payment.label,
                            vendorTitle: item?.title || "Vendor Pernikahan",
                            amount: Number(payment.amount) || 0,
                            funding: payment.funding,
                            dueDate: payment.due_date,
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Tabungan Menuju Hari-H & Proyeksi Cashflow */}
          <SavingsTrackerCard
            workspace={workspace}
            savings={bundle.savings ?? []}
            unpaidWeddingPayments={weddingPayments.filter((p) => !p.is_paid)}
            remainingObligation={Math.max(0, metrics.totalDeal - metrics.totalPaid)}
            actorName={profile.full_name}
            onRefresh={refreshData}
          />

          {/* Daftar Kategori Anggaran */}
          <div className="space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
              <h2 className="text-base font-bold text-sage-900">
                Pos Anggaran Pernikahan
              </h2>
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="flex-1 lg:flex-none"
                  onClick={() => {
                    exportFamilyMeetingPDF(bundle);
                    toast.success(
                      "PDF Rapat Keluarga diunduh",
                      "Ringkasan 1–2 halaman siap dicetak atau dibagikan ke grup keluarga."
                    );
                  }}
                >
                  <FileText className="h-3.5 w-3.5" />
                  PDF Rapat Keluarga
                </Button>
                <Button asChild size="sm" variant="default" className="flex-1 lg:flex-none">
                  <Link href="/vendors?new=1">
                    <Plus className="h-3.5 w-3.5" />
                    Tambah Vendor
                  </Link>
                </Button>
              </div>
            </div>

            {categorySummaries.length === 0 ? (
              <EmptyState
                icon={Plus}
                compact
                title="Belum ada kategori anggaran pernikahan"
                description="Mulai dengan membuat kategori pertama atau terapkan skenario 30/50/80 Juta di menu Panduan."
                action={
                  <>
                    <Button asChild size="sm" variant="sage">
                      <Link href="/vendors">Buat Kategori Pertama</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href="/panduan">Pilih Skenario</Link>
                    </Button>
                  </>
                }
              />
            ) : (
              <RevealStagger className="space-y-2.5" stagger={0.05} inView={false}>
                {categorySummaries.map(
                  ({ category, itemCount, allocated, totalDeal, totalPaid, health }) => {
                    const displayAmount = totalDeal > 0 ? totalDeal : allocated;
                    const progress =
                      allocated > 0
                        ? Math.min(100, Math.round((Math.max(totalDeal, totalPaid) / allocated) * 100))
                        : 0;

                    return (
                      <RevealItem key={category.id}>
                      <Link
                        href={`/vendors?category=${category.id}`}
                        className="group flex items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/85 backdrop-blur-sm p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sage/30 hover:shadow-card"
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <CategoryIconBadge iconKey={category.icon} />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p className="text-sm font-bold text-sage-900 truncate">
                                {category.name}
                              </p>
                              <span className="text-[11px] text-sage-500 shrink-0">
                                ({itemCount} item)
                              </span>
                              <span
                                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold shrink-0 ${health.badgeClass}`}
                              >
                                {health.shortLabel}
                                {allocated > 0 ? ` • ${health.usagePct}%` : ""}
                              </span>
                            </div>
                            <p className="text-xs font-semibold tabular-nums text-sage-700 mt-0.5">
                              {formatIDR(displayAmount)}{" "}
                              <span className="font-normal text-sage-500">
                                {totalDeal > 0
                                  ? `• Terbayar ${formatIDR(totalPaid)}`
                                  : "• Alokasi target"}
                              </span>
                            </p>
                            {allocated > 0 && (
                              <div className="mt-2 h-1.5 w-full max-w-[200px] overflow-hidden rounded-full bg-cream-200">
                                <div
                                  className={`h-full rounded-full transition-all ${health.barClass}`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <ChevronRight className="h-5 w-5 text-sage-400 transition-transform group-hover:translate-x-0.5 group-hover:text-sage-700 shrink-0" />
                      </Link>
                      </RevealItem>
                    );
                  }
                )}
              </RevealStagger>
            )}
          </div>

          {/* Riwayat Perubahan Pasangan (Activity Log Realtime) */}
          <ActivityLogCard activities={bundle.activities ?? []} />
        </div>
      ) : (
        /* ================================================================= */
        /* MODE HONEYMOON PENUH (Phase 3)                                    */
        /* ================================================================= */
        <div className="relative z-10">
          <HoneymoonPanel bundle={bundle} onRefresh={refreshData} />
        </div>
      )}
    </div>
  );
}
