"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Calendar,
  ChevronRight,
  Plus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fetchWorkspaceBundle, type WorkspaceBundle } from "@/lib/workspace-data";
import { useWorkspaceRealtime } from "@/hooks/use-workspace-realtime";
import { useAppStore } from "@/store/use-app-store";
import { formatIDR } from "@/lib/utils";
import {
  CategoryIconBadge,
  FUNDING_SOURCE_META,
} from "@/lib/category-icons";
import type { FundingSource, Profile } from "@/types/database";
import { NikahPlanLogo } from "@/components/brand/logo";
import { BotanicalCorner } from "@/components/brand/botanical-accent";
import { SyncStatusBadge } from "@/components/dashboard/sync-status-badge";
import { HoneymoonPanel } from "@/components/honeymoon/honeymoon-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  const mode = useAppStore((s) => s.mode);
  const setMode = useAppStore((s) => s.setMode);
  const startSync = useAppStore((s) => s.startSync);
  const endSync = useAppStore((s) => s.endSync);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const workspaceId = initialBundle.workspace.id;
  useWorkspaceRealtime(workspaceId);

  const { data: bundle = initialBundle } = useQuery({
    queryKey: ["workspace-data", workspaceId],
    queryFn: async () => {
      const supabase = createClient();
      const fresh = await fetchWorkspaceBundle(supabase, workspaceId);
      return fresh ?? initialBundle;
    },
    initialData: initialBundle,
  });

  const { workspace, categories, items, payments } = bundle;

  // --- KALKULASI WEDDING METRICS ---
  const weddingCategories = useMemo(
    () => categories.filter((c) => c.phase === "WEDDING"),
    [categories]
  );

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

  // --- RINGKASAN PER KATEGORI ---
  const categorySummaries = useMemo(() => {
    return weddingCategories.map((cat) => {
      const catItems = weddingItems.filter((i) => i.category_id === cat.id);
      const catItemIds = new Set(catItems.map((i) => i.id));
      const catDeal = catItems.reduce(
        (s, i) => s + (Number(i.deal_cost) || Number(i.estimated_cost) || 0),
        0
      );
      const catPaid = weddingPayments
        .filter((p) => catItemIds.has(p.item_id) && p.is_paid)
        .reduce((s, p) => s + (Number(p.amount) || 0), 0);
      return {
        category: cat,
        itemCount: catItems.length,
        totalDeal: catDeal,
        totalPaid: catPaid,
      };
    });
  }, [weddingCategories, weddingItems, weddingPayments]);

  const refreshData = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["workspace-data", workspaceId],
    });
  };

  const handleQuickMarkPaid = async (paymentId: string) => {
    setMarkingId(paymentId);
    startSync();
    try {
      const supabase = createClient();
      const today = new Date().toISOString().split("T")[0];
      await supabase
        .from("item_payments")
        .update({ is_paid: true, paid_date: today })
        .eq("id", paymentId);
      await queryClient.invalidateQueries({
        queryKey: ["workspace-data", workspaceId],
      });
    } finally {
      endSync();
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
      {/* Decorative botanical accent on top-right matching UI reference */}
      <BotanicalCorner
        className="pointer-events-none absolute -top-5 -right-4 h-36 w-36 opacity-35"
        variant="sage"
      />

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
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-terracotta tracking-tight">
            {workspace.couple_title}
          </h1>
          {weddingCountdown !== null && weddingCountdown >= 0 && (
            <Badge variant="softSage" className="text-xs">
              <Calendar className="h-3.5 w-3.5" />
              H-{weddingCountdown} Hari
            </Badge>
          )}
        </div>
        <SyncStatusBadge />
      </header>

      {/* Segmented Mode Switcher (Pernikahan | Honeymoon) */}
      <div
        role="tablist"
        aria-label="Mode Anggaran"
        className="relative z-10 grid grid-cols-2 rounded-full bg-cream-200/90 p-1 border border-sage/10"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "WEDDING"}
          onClick={() => setMode("WEDDING")}
          className={`rounded-full py-2.5 text-sm font-semibold transition-all ${
            mode === "WEDDING"
              ? "bg-sage text-cream-50 shadow-sm"
              : "text-sage-700 hover:text-sage-900"
          }`}
        >
          Pernikahan
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "HONEYMOON"}
          onClick={() => setMode("HONEYMOON")}
          className={`rounded-full py-2.5 text-sm font-semibold transition-all ${
            mode === "HONEYMOON"
              ? "bg-sage text-cream-50 shadow-sm"
              : "text-sage-700 hover:text-sage-900"
          }`}
        >
          Honeymoon
        </button>
      </div>

      {/* ================================================================= */}
      {/* MODE PERNIKAHAN                                                   */}
      {/* ================================================================= */}
      {mode === "WEDDING" ? (
        <div className="space-y-5 relative z-10">
          {/* Kartu Kesehatan Anggaran & Funding Split Bar */}
          <Card className="rounded-3xl border-sage/12 bg-white shadow-soft">
            <CardContent className="p-5 sm:p-6 space-y-5">
              {/* Primary Metric: Sisa Anggaran */}
              <div className="space-y-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-sage-600">
                      Sisa Anggaran Tersedia
                    </p>
                    <p className="text-3xl sm:text-4xl font-bold tracking-tight text-sage-900 mt-0.5">
                      {formatIDR(metrics.remainingBudget)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-sage-600">
                    ~{metrics.remainingPct}%
                  </span>
                </div>

                {/* Progress Bar Warm Sage */}
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-cream-200">
                  <div
                    className="h-full rounded-full bg-sage transition-all duration-500"
                    style={{ width: `${metrics.spentPct}%` }}
                  />
                </div>

                {/* 3 Sub-Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 pt-1.5">
                  <div className="rounded-xl bg-cream-50 px-3 py-2 border border-sage/8">
                    <p className="text-[10px] font-medium text-sage-600">
                      Target Bujet
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-sage-900 truncate mt-0.5">
                      {formatIDR(metrics.targetBudget)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-cream-50 px-3 py-2 border border-sage/8">
                    <p className="text-[10px] font-medium text-sage-600">
                      Deal Vendor
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-terracotta-700 truncate mt-0.5">
                      {formatIDR(metrics.totalDeal)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-cream-50 px-3 py-2 border border-sage/8">
                    <p className="text-[10px] font-medium text-sage-600">
                      Sudah Dibayar
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-sage-800 truncate mt-0.5">
                      {formatIDR(metrics.totalPaid)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pembagian Dana (Funding Split Bar) */}
              <div className="space-y-2.5 pt-2 border-t border-sage/10">
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
                        <span className="font-bold text-sage-900">
                          ({entry.pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

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
                    className="rounded-2xl border border-terracotta/30 bg-[#FDF3EE] p-4 flex items-center justify-between gap-3"
                  >
                    <Link
                      href={`/vendors${item ? `?category=${item.category_id}` : ""}`}
                      className="flex items-start gap-3 min-w-0 flex-1"
                    >
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-terracotta/15 text-terracotta-700">
                        <AlertTriangle className="h-4.5 w-4.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-terracotta-800">
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
                );
              })}
            </div>
          )}

          {/* Daftar Kategori Anggaran */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-sage-900">
                Pos Anggaran Pernikahan
              </h2>
              <Button asChild size="sm" variant="default">
                <Link href="/vendors?new=1">
                  <Plus className="h-3.5 w-3.5" />
                  Tambah Vendor
                </Link>
              </Button>
            </div>

            {categorySummaries.length === 0 ? (
              <Card className="rounded-2xl border-dashed border-sage/25 bg-white/80">
                <CardContent className="p-6 text-center space-y-3">
                  <p className="text-sm font-medium text-sage-700">
                    Belum ada kategori anggaran pernikahan.
                  </p>
                  <Button asChild size="sm" variant="sage">
                    <Link href="/vendors">Buat Kategori Pertama</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2.5">
                {categorySummaries.map(
                  ({ category, itemCount, totalDeal, totalPaid }) => {
                    const allocated = Number(category.allocated_amount) || 0;
                    const displayAmount = totalDeal > 0 ? totalDeal : allocated;
                    const progress =
                      allocated > 0
                        ? Math.min(100, Math.round((totalPaid / allocated) * 100))
                        : 0;

                    return (
                      <Link
                        key={category.id}
                        href={`/vendors?category=${category.id}`}
                        className="group flex items-center justify-between gap-3 rounded-2xl border border-sage/10 bg-white p-4 shadow-sm transition-all hover:border-sage/30 hover:shadow-card"
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <CategoryIconBadge iconKey={category.icon} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-sage-900 truncate">
                                {category.name}
                              </p>
                              <span className="text-[11px] text-sage-500 shrink-0">
                                ({itemCount} item)
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-sage-700 mt-0.5">
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
                                  className="h-full rounded-full bg-sage/80"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <ChevronRight className="h-5 w-5 text-sage-400 transition-transform group-hover:translate-x-0.5 group-hover:text-sage-700 shrink-0" />
                      </Link>
                    );
                  }
                )}
              </div>
            )}
          </div>
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
