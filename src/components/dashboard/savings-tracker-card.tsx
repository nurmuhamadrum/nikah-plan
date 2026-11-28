"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Loader2,
  PiggyBank,
  Plus,
  Settings2,
  Trash2,
  TrendingUp,
} from "lucide-react";
import type {
  ItemPayment,
  SavingsContributor,
  SavingsEntry,
  Workspace,
} from "@/types/database";
import { executeOfflineFirstMutation } from "@/lib/offline/sync-engine";
import { logWorkspaceActivity } from "@/lib/activity-logger";
import { formatIDR } from "@/lib/utils";
import { useToast } from "@/components/providers/toast-provider";
import { useConfirm } from "@/components/providers/confirm-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { MonthPicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";

interface SavingsTrackerCardProps {
  workspace: Workspace;
  savings: SavingsEntry[];
  unpaidWeddingPayments: ItemPayment[];
  remainingObligation: number;
  actorName: string;
  onRefresh: () => Promise<void>;
}

const CONTRIBUTOR_META: Record<
  SavingsContributor,
  { label: string; badgeClass: string }
> = {
  GROOM: {
    label: "Pihak Pria",
    badgeClass: "bg-[#EEF2FF] text-[#4F6BF6] border-[#4F6BF6]/20",
  },
  BRIDE: {
    label: "Pihak Wanita",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
  },
  JOINT: {
    label: "Tabungan Bersama",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getUpcomingMonthKeys(count = 4): Array<{ key: string; label: string }> {
  const now = new Date();
  const list: Array<{ key: string; label: string }> = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("id-ID", {
      month: "short",
      year: "numeric",
    });
    list.push({ key, label });
  }
  return list;
}

export function SavingsTrackerCard({
  workspace,
  savings,
  unpaidWeddingPayments,
  remainingObligation,
  actorName,
  onRefresh,
}: SavingsTrackerCardProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const confirm = useConfirm();

  const [showAddForm, setShowAddForm] = useState(false);
  const [showTargetForm, setShowTargetForm] = useState(false);

  // Add saving entry states
  const [contributor, setContributor] = useState<SavingsContributor>("JOINT");
  const [amount, setAmount] = useState("2500000");
  const [entryMonth, setEntryMonth] = useState(getCurrentMonthKey());
  const [notes, setNotes] = useState("");
  const [savingEntry, setSavingEntry] = useState(false);

  // Monthly target states
  const [targetGroom, setTargetGroom] = useState(
    String(Number(workspace.monthly_saving_groom) || 0)
  );
  const [targetBride, setTargetBride] = useState(
    String(Number(workspace.monthly_saving_bride) || 0)
  );
  const [savingTarget, setSavingTarget] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const monthlyGroom = Number(workspace.monthly_saving_groom) || 0;
  const monthlyBride = Number(workspace.monthly_saving_bride) || 0;
  const monthlyTargetTotal = monthlyGroom + monthlyBride;

  const totalSaved = useMemo(
    () => savings.reduce((sum, s) => sum + (Number(s.amount) || 0), 0),
    [savings]
  );

  const coveragePct =
    remainingObligation > 0
      ? Math.min(100, Math.round((totalSaved / remainingObligation) * 100))
      : totalSaved > 0
        ? 100
        : 0;

  // Proyeksi Cashflow 4 Bulan ke Depan
  const cashflowMonths = useMemo(() => {
    const months = getUpcomingMonthKeys(4);
    const dueByMonth = new Map<string, number>();

    for (const p of unpaidWeddingPayments) {
      if (!p.due_date) continue;
      const monthKey = p.due_date.slice(0, 7);
      dueByMonth.set(
        monthKey,
        (dueByMonth.get(monthKey) || 0) + (Number(p.amount) || 0)
      );
    }

    let cumulativeDue = 0;
    return months.map((m, idx) => {
      const dueThisMonth = dueByMonth.get(m.key) || 0;
      cumulativeDue += dueThisMonth;
      // Bulan 0 = tabungan terkumpul saat ini; bulan berikutnya ditambah target nabung bulanan
      const projectedSavings = totalSaved + idx * monthlyTargetTotal;
      const netGap = projectedSavings - cumulativeDue;
      return {
        ...m,
        dueThisMonth,
        cumulativeDue,
        projectedSavings,
        netGap,
        isDeficit: dueThisMonth > 0 && netGap < 0,
      };
    });
  }, [unpaidWeddingPayments, totalSaved, monthlyTargetTotal]);

  const hasDeficitAlert = cashflowMonths.some((m) => m.isDeficit);

  const handleSaveMonthlyTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTarget(true);
    try {
      const gVal = Math.max(0, Number(targetGroom) || 0);
      const bVal = Math.max(0, Number(targetBride) || 0);
      const { queued } = await executeOfflineFirstMutation({
        workspaceId: workspace.id,
        table: "workspaces",
        operation: "UPDATE",
        recordId: workspace.id,
        payload: {
          monthly_saving_groom: gVal,
          monthly_saving_bride: bVal,
        },
        queryClient,
      });

      if (!queued) await onRefresh();
      await logWorkspaceActivity({
        workspaceId: workspace.id,
        actorName,
        actionType: "SAVING_ADD",
        summary: `mengatur target tabungan bulanan menjadi ${formatIDR(gVal + bVal)}/bulan`,
        entityPath: "/dashboard",
        queryClient,
      });

      toast.success(
        "Target tabungan bulanan diperbarui",
        `Total target ${formatIDR(gVal + bVal)}/bulan.`
      );
      setShowTargetForm(false);
    } catch (err) {
      toast.error(
        "Gagal menyimpan target tabungan",
        err instanceof Error
          ? err.message
          : "Pastikan Migrasi 008 sudah dijalankan di Supabase."
      );
    } finally {
      setSavingTarget(false);
    }
  };

  const handleAddSavingEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Math.max(0, Number(amount) || 0);
    if (numAmount <= 0) return;

    setSavingEntry(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const { queued } = await executeOfflineFirstMutation({
        workspaceId: workspace.id,
        table: "savings_entries",
        operation: "INSERT",
        payload: {
          workspace_id: workspace.id,
          entry_month: entryMonth || getCurrentMonthKey(),
          contributor,
          amount: numAmount,
          notes: notes.trim() || null,
          saved_date: today,
        },
        queryClient,
      });

      if (!queued) await onRefresh();
      await logWorkspaceActivity({
        workspaceId: workspace.id,
        actorName,
        actionType: "SAVING_ADD",
        summary: `mencatat setoran tabungan ${formatIDR(numAmount)} (${CONTRIBUTOR_META[contributor].label})`,
        entityPath: "/dashboard",
        queryClient,
      });

      toast.success(
        queued ? "Setoran disimpan offline" : "Setoran tabungan tercatat",
        `${formatIDR(numAmount)} ditambahkan ke Tabungan Menuju Hari-H.`
      );
      setNotes("");
      setShowAddForm(false);
    } catch (err) {
      toast.error(
        "Gagal mencatat tabungan",
        err instanceof Error
          ? err.message
          : "Pastikan Migrasi 008 sudah dijalankan di Supabase."
      );
    } finally {
      setSavingEntry(false);
    }
  };

  const handleDeleteSaving = async (entry: SavingsEntry) => {
    const ok = await confirm({
      title: "Hapus catatan setoran tabungan?",
      description: `Setoran sebesar ${formatIDR(Number(entry.amount))} (${CONTRIBUTOR_META[entry.contributor].label}) akan dihapus.`,
      confirmLabel: "Ya, Hapus",
      variant: "destructive",
    });
    if (!ok) return;

    setDeletingId(entry.id);
    try {
      const { queued } = await executeOfflineFirstMutation({
        workspaceId: workspace.id,
        table: "savings_entries",
        operation: "DELETE",
        recordId: entry.id,
        queryClient,
      });
      if (!queued) await onRefresh();
      toast.info("Catatan tabungan dihapus.");
    } catch {
      toast.error("Gagal menghapus catatan tabungan.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className="rounded-3xl border border-black/[0.06] bg-white shadow-card">
      <CardContent className="p-5 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-2.5">
          <div className="flex items-start gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#4F6BF6]">
              <PiggyBank className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-base font-bold text-[#141618]">
                Tabungan Menuju Hari-H &amp; Cashflow
              </h2>
              <p className="text-xs text-[#5F6978]">
                Bandingkan pemasukan tabungan bulanan dengan jatuh tempo termin
                vendor.
              </p>
            </div>
          </div>

          <div className="flex w-full sm:w-auto items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="flex-1 sm:flex-none h-9 sm:h-8 px-2.5 text-xs"
              onClick={() => {
                setTargetGroom(String(monthlyGroom));
                setTargetBride(String(monthlyBride));
                setShowTargetForm((prev) => !prev);
                setShowAddForm(false);
              }}
            >
              <Settings2 className="h-3.5 w-3.5" />
              Target Bulanan
            </Button>
            <Button
              type="button"
              size="sm"
              className="flex-1 sm:flex-none h-9 sm:h-8 px-3 text-xs"
              onClick={() => {
                setShowAddForm((prev) => !prev);
                setShowTargetForm(false);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Catat Setoran
            </Button>
          </div>
        </div>

        {/* Form Pengaturan Target Bulanan */}
        {showTargetForm && (
          <form
            onSubmit={handleSaveMonthlyTarget}
            className="rounded-2xl border border-[#4F6BF6]/20 bg-[#F4F5F7] p-4 space-y-3"
          >
            <p className="text-xs font-bold text-[#141618]">
              Target Menabung per Bulan (untuk Proyeksi Cashflow)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Target Pihak Pria / bulan</Label>
                <CurrencyInput
                  value={targetGroom}
                  onValueChange={setTargetGroom}
                  placeholder="3.000.000"
                  className="bg-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Target Pihak Wanita / bulan</Label>
                <CurrencyInput
                  value={targetBride}
                  onValueChange={setTargetBride}
                  placeholder="2.000.000"
                  className="bg-white"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center justify-between sm:block rounded-xl bg-white sm:bg-transparent border border-black/[0.06] sm:border-0 px-3 py-2 sm:p-0 text-xs text-[#5F6978]">
                <span>Total target:</span>{" "}
                <strong className="text-[#141618] tabular-nums">
                  {formatIDR(
                    (Number(targetGroom) || 0) + (Number(targetBride) || 0)
                  )}
                  /bulan
                </strong>
              </div>
              <div className="flex flex-col-reverse sm:flex-row items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="w-full sm:w-auto"
                  onClick={() => setShowTargetForm(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="w-full sm:w-auto"
                  disabled={savingTarget}
                >
                  {savingTarget && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Simpan Target
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* Form Catat Setoran Tabungan */}
        {showAddForm && (
          <form
            onSubmit={handleAddSavingEntry}
            className="rounded-2xl border border-black/[0.08] bg-[#F4F5F7] p-4 space-y-3"
          >
            <p className="text-xs font-bold text-[#141618]">
              Catat Setoran Tabungan Baru
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(["JOINT", "GROOM", "BRIDE"] as SavingsContributor[]).map(
                (key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setContributor(key)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      contributor === key
                        ? "bg-midnight-btn text-white"
                        : "bg-white border border-black/10 text-[#5F6978]"
                    }`}
                  >
                    {CONTRIBUTOR_META[key].label}
                  </button>
                )
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <Label className="text-xs">Nominal Setoran</Label>
                <CurrencyInput
                  value={amount}
                  onValueChange={setAmount}
                  placeholder="2.500.000"
                  className="bg-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Untuk Bulan</Label>
                <MonthPicker
                  value={entryMonth}
                  onChange={setEntryMonth}
                  className="bg-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Catatan (Opsional)</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Gaji bulan ini / THR"
                  className="bg-white"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="w-full sm:w-auto"
                onClick={() => setShowAddForm(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                className="w-full sm:w-auto"
                disabled={savingEntry || (Number(amount) || 0) <= 0}
              >
                {savingEntry && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Simpan Setoran
              </Button>
            </div>
          </form>
        )}

        {/* KPI Ringkas Tabungan */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="rounded-2xl bg-[#F4F5F7] p-3.5">
            <p className="text-[11px] text-[#5F6978]">Tabungan Terkumpul</p>
            <p className="font-display text-lg font-bold text-[#141618] tabular-nums mt-0.5">
              {formatIDR(totalSaved)}
            </p>
          </div>
          <div className="rounded-2xl bg-[#F4F5F7] p-3.5">
            <p className="text-[11px] text-[#5F6978]">Target Nabung / Bulan</p>
            <p className="font-display text-lg font-bold text-[#4F6BF6] tabular-nums mt-0.5">
              {monthlyTargetTotal > 0 ? formatIDR(monthlyTargetTotal) : "Belum diatur"}
            </p>
          </div>
          <div className="rounded-2xl bg-[#F4F5F7] p-3.5">
            <p className="text-[11px] text-[#5F6978]">
              Cakupan Sisa Kewajiban
            </p>
            <p className="font-display text-lg font-bold text-[#141618] tabular-nums mt-0.5">
              {coveragePct}%{" "}
              <span className="text-[11px] font-normal text-[#5F6978]">
                ({formatIDR(remainingObligation)})
              </span>
            </p>
          </div>
        </div>

        {/* Proyeksi Cashflow 4 Bulan ke Depan */}
        <div className="space-y-2.5 pt-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="inline-flex items-center gap-1.5 text-xs font-bold text-[#141618]">
              <CalendarClock className="h-3.5 w-3.5 text-[#4F6BF6]" />
              Proyeksi Cashflow 4 Bulan Ke Depan
            </p>
            {hasDeficitAlert ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10.5px] font-semibold text-amber-800">
                <AlertTriangle className="h-3 w-3" />
                Ada bulan perlu tambahan dana
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10.5px] font-semibold text-emerald-700">
                <TrendingUp className="h-3 w-3" />
                Cashflow Terjaga
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {cashflowMonths.map((m) => (
              <div
                key={m.key}
                className={`rounded-2xl border p-3 space-y-1.5 ${
                  m.isDeficit
                    ? "border-amber-200 bg-amber-50/70"
                    : "border-black/[0.06] bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-bold text-[#141618]">
                    {m.label}
                  </span>
                  {m.dueThisMonth > 0 ? (
                    m.isDeficit ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    )
                  ) : null}
                </div>
                <div className="space-y-0.5 text-[10.5px]">
                  <p className="text-[#5F6978]">
                    Tagihan:{" "}
                    <strong className="text-[#141618] tabular-nums">
                      {m.dueThisMonth > 0 ? formatIDR(m.dueThisMonth) : "Rp0"}
                    </strong>
                  </p>
                  <p className="text-[#5F6978]">
                    Proyeksi:{" "}
                    <strong className="text-[#4F6BF6] tabular-nums">
                      {formatIDR(m.projectedSavings)}
                    </strong>
                  </p>
                </div>
                {m.isDeficit && (
                  <p className="text-[10px] font-bold text-amber-800 tabular-nums">
                    Kurang {formatIDR(Math.abs(m.netGap))}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 4 Setoran Terakhir */}
        {savings.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-black/[0.06]">
            <p className="text-[11px] font-semibold text-[#5F6978]">
              Setoran Tabungan Terbaru ({savings.length})
            </p>
            <div className="space-y-1.5">
              {savings.slice(0, 4).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-black/[0.05] bg-[#FAFAFB] px-3 py-2 text-xs"
                >
                  <div className="min-w-0 flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-[#141618] tabular-nums">
                      +{formatIDR(Number(entry.amount))}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                        CONTRIBUTOR_META[entry.contributor].badgeClass
                      }`}
                    >
                      {CONTRIBUTOR_META[entry.contributor].label}
                    </span>
                    <span className="text-[11px] text-[#5F6978] truncate">
                      {entry.entry_month}
                      {entry.notes ? ` · ${entry.notes}` : ""}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={deletingId === entry.id}
                    onClick={() => handleDeleteSaving(entry)}
                    aria-label="Hapus setoran"
                    className="p-1 text-[#94A3B8] hover:text-red-600 transition-colors shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
