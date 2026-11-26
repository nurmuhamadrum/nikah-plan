"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Edit3,
  Gift,
  Lock,
  Plane,
  Plus,
  Settings2,
  Trash2,
  Wallet,
} from "lucide-react";
import type { WorkspaceBundle } from "@/lib/workspace-data";
import type { BudgetItem, HoneymoonChecklist } from "@/types/database";
import { executeOfflineFirstMutation } from "@/lib/offline/sync-engine";
import {
  calculateTripDays,
  formatForeignCurrency,
  getCurrencyOption,
} from "@/lib/budget-allocator";
import { formatIDR } from "@/lib/utils";
import { CategoryIconBadge } from "@/lib/category-icons";
import { BotanicalCorner } from "@/components/brand/botanical-accent";
import { HoneymoonExpenseDialog } from "@/components/honeymoon/honeymoon-expense-dialog";
import { HoneymoonSettingsDialog } from "@/components/honeymoon/honeymoon-settings-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface HoneymoonPanelProps {
  bundle: WorkspaceBundle;
  onRefresh: () => Promise<void>;
}

export function HoneymoonPanel({ bundle, onRefresh }: HoneymoonPanelProps) {
  const queryClient = useQueryClient();

  const { workspace, categories, items, gifts, checklists } = bundle;

  const [expenseFilter, setExpenseFilter] = useState<
    "ALL" | "HONEYMOON_PRE" | "HONEYMOON_ONTRIP"
  >("ALL");
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [addingChecklist, setAddingChecklist] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [expensePrefill, setExpensePrefill] = useState<{
    title?: string;
    phase?: "HONEYMOON_PRE" | "HONEYMOON_ONTRIP";
    checklistId?: string;
  } | null>(null);

  const hmCategories = useMemo(
    () =>
      categories.filter(
        (c) => c.phase === "HONEYMOON_PRE" || c.phase === "HONEYMOON_ONTRIP"
      ),
    [categories]
  );

  const hmCategoryMap = useMemo(
    () => new Map(hmCategories.map((c) => [c.id, c])),
    [hmCategories]
  );

  const hmItems = useMemo(
    () =>
      items.filter(
        (i) => i.phase === "HONEYMOON_PRE" || i.phase === "HONEYMOON_ONTRIP"
      ),
    [items]
  );

  const filteredItems = useMemo(() => {
    if (expenseFilter === "ALL") return hmItems;
    return hmItems.filter((i) => i.phase === expenseFilter);
  }, [hmItems, expenseFilter]);

  const metrics = useMemo(() => {
    const baseTarget = Number(workspace.honeymoon_budget_target) || 0;
    const angpaoBoost = gifts
      .filter((g) => g.allocated_to === "HONEYMOON_FUND")
      .reduce((sum, g) => sum + (Number(g.amount) || 0), 0);
    const totalWallet = baseTarget + angpaoBoost;

    const preTripSpent = hmItems
      .filter((i) => i.phase === "HONEYMOON_PRE")
      .reduce(
        (s, i) => s + (Number(i.deal_cost) || Number(i.estimated_cost) || 0),
        0
      );

    const onTripSpent = hmItems
      .filter((i) => i.phase === "HONEYMOON_ONTRIP")
      .reduce(
        (s, i) => s + (Number(i.deal_cost) || Number(i.estimated_cost) || 0),
        0
      );

    const totalSpent = preTripSpent + onTripSpent;
    const remainingForDaily = Math.max(0, totalWallet - totalSpent);
    const days = calculateTripDays(
      workspace.honeymoon_start_date,
      workspace.honeymoon_end_date
    );
    const dailyPocketIDR = days > 0 ? Math.round(remainingForDaily / days) : 0;

    const rate = Number(workspace.honeymoon_exchange_rate) || 1;
    const dailyPocketForeign =
      workspace.honeymoon_currency !== "IDR" && rate > 0
        ? dailyPocketIDR / rate
        : 0;

    const remainingPct =
      totalWallet > 0
        ? Math.min(100, Math.round((remainingForDaily / totalWallet) * 100))
        : 0;

    return {
      baseTarget,
      angpaoBoost,
      totalWallet,
      preTripSpent,
      onTripSpent,
      totalSpent,
      remainingForDaily,
      days,
      dailyPocketIDR,
      dailyPocketForeign,
      remainingPct,
    };
  }, [workspace, gifts, hmItems]);

  const handleToggleChecklist = async (item: HoneymoonChecklist) => {
    const { queued } = await executeOfflineFirstMutation({
      workspaceId: workspace.id,
      table: "honeymoon_checklists",
      operation: "UPDATE",
      recordId: item.id,
      payload: { is_completed: !item.is_completed },
      queryClient,
    });
    if (!queued) await onRefresh();
  };

  const handleAddChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistTitle.trim()) return;
    setAddingChecklist(true);
    try {
      const { queued } = await executeOfflineFirstMutation({
        workspaceId: workspace.id,
        table: "honeymoon_checklists",
        operation: "INSERT",
        payload: {
          workspace_id: workspace.id,
          title: newChecklistTitle.trim(),
          category: "PRETRIP",
          is_completed: false,
          linked_item_id: null,
          sort_order: checklists.length + 1,
        },
        queryClient,
      });
      setNewChecklistTitle("");
      if (!queued) await onRefresh();
    } finally {
      setAddingChecklist(false);
    }
  };

  const handleDeleteChecklist = async (id: string) => {
    const { queued } = await executeOfflineFirstMutation({
      workspaceId: workspace.id,
      table: "honeymoon_checklists",
      operation: "DELETE",
      recordId: id,
      queryClient,
    });
    if (!queued) await onRefresh();
  };

  // Guard untuk paket WEDDING_ONLY
  if (workspace.plan !== "COMPLETE_PASS") {
    return (
      <Card className="rounded-3xl border-sage/15 bg-white shadow-soft">
        <CardContent className="p-7 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-terracotta-50 text-terracotta">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="font-display text-2xl font-bold text-sage-900">
            Modul Honeymoon Planner
          </h2>
          <p className="text-sm text-sage-600 max-w-md mx-auto">
            Paket aktif Anda adalah <strong>Wedding Only Pass</strong>. Dompet
            Honeymoon, kalkulator uang jajan harian, dan pencatatan multi-mata
            uang tersedia di <strong>Complete Couple Pass</strong>.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Empty state jika user melewati Step 3 saat onboarding
  if (!workspace.honeymoon_destination) {
    return (
      <>
        <Card className="rounded-3xl border-sage/15 bg-white shadow-soft">
          <CardContent className="p-7 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sage-50 text-sage">
              <Plane className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-display text-2xl font-bold text-sage-900">
                Mulai Rencana Honeymoon
              </h2>
              <p className="text-sm text-sage-600 max-w-sm mx-auto">
                Tentukan destinasi, durasi hari, mata uang lokal, dan target dana
                agar kalkulator uang jajan harian aktif otomatis.
              </p>
            </div>
            <Button
              type="button"
              size="lg"
              onClick={() => setSettingsOpen(true)}
            >
              Atur Destinasi Honeymoon
            </Button>
          </CardContent>
        </Card>

        <HoneymoonSettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          workspace={workspace}
          hasHoneymoonCategories={hmCategories.length > 0}
          hasChecklists={checklists.length > 0}
          onSuccess={onRefresh}
        />
      </>
    );
  }

  // Circular Progress Ring Geometry (matching Screen 3 UI reference)
  const ringRadius = 17;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset =
    ringCircumference - (metrics.remainingPct / 100) * ringCircumference;
  const curOpt = getCurrencyOption(workspace.honeymoon_currency);

  return (
    <div className="space-y-5">
      {/* Header Rencana Honeymoon */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-sage-600">Rencana Honeymoon</p>
          <h2 className="text-2xl font-bold text-sage-900 inline-flex flex-wrap items-center gap-2 mt-0.5">
            <span>{workspace.honeymoon_destination}</span>
            {metrics.days > 0 && (
              <span className="text-base font-medium text-sage-600">
                ({metrics.days} Hari)
              </span>
            )}
            <Plane className="h-5 w-5 text-terracotta" />
          </h2>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 px-3 text-xs shrink-0"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings2 className="h-3.5 w-3.5" />
          Atur Trip
        </Button>
      </div>

      {/* Kartu Dompet Honeymoon (Warm Sage #3D5245 + Progress Ring ala Screen 3) */}
      <Card className="relative overflow-hidden rounded-3xl border-0 bg-white shadow-soft">
        <div className="relative bg-sage text-cream-50 p-5 sm:p-6 space-y-4">
          <BotanicalCorner
            className="absolute -top-3 -right-3 h-32 w-32 opacity-25"
            variant="terracotta"
          />

          <div className="relative z-10 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-cream-200/85">
                Dompet Honeymoon &bull; Total Dana
              </p>
              <Badge
                variant="outline"
                className="border-white/25 bg-white/10 text-cream-50 text-[10px]"
              >
                {workspace.honeymoon_currency === "IDR"
                  ? "IDR"
                  : `1 ${workspace.honeymoon_currency} = ${formatIDR(Number(workspace.honeymoon_exchange_rate))}`}
              </Badge>
            </div>
            <p className="text-3xl sm:text-4xl font-bold tracking-tight">
              {formatIDR(metrics.totalWallet)}
            </p>
            {metrics.angpaoBoost > 0 && (
              <p className="text-[11px] text-terracotta-200 inline-flex items-center gap-1">
                <Gift className="h-3 w-3" />
                Termasuk +{formatIDR(metrics.angpaoBoost)} dari Angpao Bridge
              </p>
            )}
          </div>

          <div className="relative z-10 border-t border-white/15 pt-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-cream-200/85">Uang Jajan Harian:</p>
              <p className="text-xl sm:text-2xl font-bold mt-0.5">
                {metrics.days > 0
                  ? `${formatIDR(metrics.dailyPocketIDR)} / hari`
                  : "Atur tanggal trip"}
              </p>
              {metrics.days > 0 && workspace.honeymoon_currency !== "IDR" && (
                <p className="text-xs text-cream-200/85 mt-0.5">
                  ≈{" "}
                  {formatForeignCurrency(
                    metrics.dailyPocketForeign,
                    workspace.honeymoon_currency
                  )}{" "}
                  / hari ({curOpt.name})
                </p>
              )}
            </div>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/12 text-terracotta-200">
              <Wallet className="h-6 w-6" />
            </span>
          </div>
        </div>

        {/* Footer Progress Ring + Pre-Trip / On-Trip Breakdown */}
        <CardContent className="p-4 sm:p-5 bg-white space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <svg className="h-11 w-11 -rotate-90 shrink-0" viewBox="0 0 44 44">
                <circle
                  cx="22"
                  cy="22"
                  r={ringRadius}
                  fill="none"
                  stroke="#E5E0D5"
                  strokeWidth="4.5"
                />
                <circle
                  cx="22"
                  cy="22"
                  r={ringRadius}
                  fill="none"
                  stroke="#3D5245"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                  className="transition-all duration-500"
                />
              </svg>
              <div>
                <p className="text-sm font-bold text-sage-900">
                  Sisa Dana Tersedia: {metrics.remainingPct}%
                </p>
                <p className="text-xs text-sage-600">
                  {formatIDR(metrics.remainingForDaily)} tersisa dari{" "}
                  {formatIDR(metrics.totalWallet)}
                </p>
              </div>
            </div>

            <Link
              href="/angpao"
              className="text-xs font-semibold text-terracotta hover:underline shrink-0"
            >
              + Dana Angpao
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-sage/10 text-xs">
            <div className="rounded-xl bg-cream-50 px-3 py-2">
              <p className="text-[10px] text-sage-600">Pre-Trip (Tiket/Hotel)</p>
              <p className="font-bold text-sage-900 mt-0.5">
                {formatIDR(metrics.preTripSpent)}
              </p>
            </div>
            <div className="rounded-xl bg-cream-50 px-3 py-2">
              <p className="text-[10px] text-sage-600">On-Trip (Harian)</p>
              <p className="font-bold text-terracotta-700 mt-0.5">
                {formatIDR(metrics.onTripSpent)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Persiapan Pra-Perjalanan (Interactive Checklist ala Screen 3) */}
      <Card className="rounded-3xl border-sage/12 bg-white shadow-card">
        <CardContent className="p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-sage-900">
              Persiapan Pra-Perjalanan
            </h3>
            <span className="text-xs font-semibold text-sage-600">
              {checklists.filter((c) => c.is_completed).length}/
              {checklists.length} selesai
            </span>
          </div>

          <div className="space-y-2.5">
            {checklists.map((item) => (
              <div
                key={item.id}
                className="group flex items-start justify-between gap-2.5"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggleChecklist(item)}
                    aria-label={`Tandai ${item.title}`}
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                      item.is_completed
                        ? "border-sage bg-sage text-white"
                        : "border-sage/35 bg-white hover:border-sage"
                    }`}
                  >
                    {item.is_completed && <Check className="h-3.5 w-3.5 stroke-[2.8]" />}
                  </button>

                  <div className="min-w-0">
                    <p
                      className={`text-sm font-medium leading-snug ${
                        item.is_completed
                          ? "line-through text-sage-500"
                          : "text-sage-900"
                      }`}
                    >
                      {item.title}
                    </p>
                    {!item.is_completed && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItem(null);
                          setExpensePrefill({
                            title: item.title,
                            phase: "HONEYMOON_PRE",
                            checklistId: item.id,
                          });
                          setExpenseDialogOpen(true);
                        }}
                        className="text-xs font-semibold text-sage-700 underline underline-offset-2 hover:text-terracotta mt-0.5"
                      >
                        Bayar Sekarang
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteChecklist(item.id)}
                  aria-label={`Hapus ${item.title}`}
                  className="opacity-60 hover:opacity-100 text-sage-400 hover:text-terracotta p-1 shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddChecklist} className="flex gap-2 pt-2">
            <Input
              placeholder="Tambah checklist (misal: Beli JR Pass / Asuransi)..."
              value={newChecklistTitle}
              onChange={(e) => setNewChecklistTitle(e.target.value)}
              className="h-9 text-xs bg-cream-50"
            />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="h-9 px-3 shrink-0"
              disabled={addingChecklist || !newChecklistTitle.trim()}
            >
              <Plus className="h-3.5 w-3.5" />
              Tambah
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Pengeluaran Honeymoon (Multi-Mata Uang) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-bold text-sage-900">
            Pengeluaran Honeymoon
          </h3>

          <div className="flex items-center gap-1">
            {(
              [
                { id: "ALL", label: "Semua" },
                { id: "HONEYMOON_PRE", label: "Pre-Trip" },
                { id: "HONEYMOON_ONTRIP", label: "On-Trip" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setExpenseFilter(tab.id)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  expenseFilter === tab.id
                    ? "bg-sage text-white"
                    : "bg-white border border-sage/15 text-sage-700 hover:bg-sage-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <Card className="rounded-2xl border-dashed border-sage/20 bg-white/80">
            <CardContent className="p-5 text-center text-xs text-sage-600">
              Belum ada pengeluaran honeymoon tercatat. Klik tombol{" "}
              <strong>Tambah Pengeluaran</strong> di bawah untuk mencatat biaya
              tiket, hotel, atau belanja harian dalam{" "}
              <strong>{workspace.honeymoon_currency}</strong> /{" "}
              <strong>IDR</strong>.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredItems.map((item) => {
              const cat = hmCategoryMap.get(item.category_id);
              const isForeign =
                item.currency &&
                item.currency !== "IDR" &&
                Number(item.foreign_amount) > 0;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-sage/10 bg-white p-3.5 shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CategoryIconBadge
                      iconKey={cat?.icon || "plane"}
                      className="h-9 w-9"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-sm font-bold text-sage-900 truncate">
                          {item.title}
                        </p>
                        <Badge
                          variant={
                            item.phase === "HONEYMOON_PRE"
                              ? "softSage"
                              : "softTerracotta"
                          }
                          className="text-[10px] py-0 px-2"
                        >
                          {item.phase === "HONEYMOON_PRE"
                            ? "Pre-Trip"
                            : "On-Trip"}
                        </Badge>
                      </div>
                      <p className="text-xs text-sage-600 mt-0.5">
                        {isForeign ? (
                          <>
                            <span className="font-bold text-sage-900">
                              {formatForeignCurrency(
                                Number(item.foreign_amount),
                                item.currency
                              )}
                            </span>{" "}
                            <span>(≈ {formatIDR(Number(item.deal_cost))})</span>
                          </>
                        ) : (
                          <span className="font-bold text-sage-900">
                            {formatIDR(Number(item.deal_cost))}
                          </span>
                        )}
                        {item.notes ? ` • ${item.notes}` : ""}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    aria-label={`Edit ${item.title}`}
                    onClick={() => {
                      setEditingItem(item);
                      setExpensePrefill(null);
                      setExpenseDialogOpen(true);
                    }}
                  >
                    <Edit3 className="h-4 w-4 text-sage-600" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Primary CTA Button (Soft Terracotta Pill ala Screen 3) */}
        <Button
          type="button"
          size="lg"
          className="w-full"
          onClick={() => {
            setEditingItem(null);
            setExpensePrefill(null);
            setExpenseDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Tambah Pengeluaran
        </Button>
      </div>

      {/* Modals */}
      <HoneymoonSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        workspace={workspace}
        hasHoneymoonCategories={hmCategories.length > 0}
        hasChecklists={checklists.length > 0}
        onSuccess={onRefresh}
      />

      <HoneymoonExpenseDialog
        open={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
        workspace={workspace}
        categories={hmCategories}
        editingItem={editingItem}
        prefill={expensePrefill}
        onSuccess={onRefresh}
      />
    </div>
  );
}
