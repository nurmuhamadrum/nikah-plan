"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft, Loader2, Trash2 } from "lucide-react";
import type { BudgetCategory, BudgetItem, Workspace } from "@/types/database";
import { executeOfflineFirstMutation } from "@/lib/offline/sync-engine";
import {
  buildDefaultHoneymoonCategories,
  convertToIDR,
  formatForeignCurrency,
  getCurrencyOption,
  HONEYMOON_CURRENCIES,
} from "@/lib/budget-allocator";
import { formatIDR } from "@/lib/utils";
import { useToast } from "@/components/providers/toast-provider";
import { useConfirm } from "@/components/providers/confirm-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";

type HoneymoonPhase = "HONEYMOON_PRE" | "HONEYMOON_ONTRIP";

interface HoneymoonExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: Workspace;
  categories: BudgetCategory[];
  editingItem: BudgetItem | null;
  prefill?: {
    title?: string;
    phase?: HoneymoonPhase;
    checklistId?: string;
  } | null;
  onSuccess: () => Promise<void>;
}

export function HoneymoonExpenseDialog({
  open,
  onOpenChange,
  workspace,
  categories,
  editingItem,
  prefill,
  onSuccess,
}: HoneymoonExpenseDialogProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const confirm = useConfirm();

  const [phase, setPhase] = useState<HoneymoonPhase>("HONEYMOON_ONTRIP");
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [currency, setCurrency] = useState(workspace.honeymoon_currency || "IDR");
  const [inputAmount, setInputAmount] = useState("");
  const [exchangeRate, setExchangeRate] = useState("1");
  const [notes, setNotes] = useState("");
  const [markChecklistDone, setMarkChecklistDone] = useState(true);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const phaseCategories = useMemo(
    () => categories.filter((c) => c.phase === phase),
    [categories, phase]
  );

  useEffect(() => {
    if (!open) return;
    setErrorMsg(null);

    if (editingItem) {
      const nextPhase: HoneymoonPhase =
        editingItem.phase === "HONEYMOON_PRE"
          ? "HONEYMOON_PRE"
          : "HONEYMOON_ONTRIP";
      setPhase(nextPhase);
      setCategoryId(editingItem.category_id);
      setTitle(editingItem.title);

      const cur = editingItem.currency || "IDR";
      setCurrency(cur);
      if (cur !== "IDR" && editingItem.foreign_amount) {
        setInputAmount(String(Number(editingItem.foreign_amount)));
        const derivedRate =
          Number(editingItem.foreign_amount) > 0
            ? Number(editingItem.deal_cost) / Number(editingItem.foreign_amount)
            : Number(workspace.honeymoon_exchange_rate) || 1;
        setExchangeRate(String(Math.round(derivedRate * 100) / 100));
      } else {
        setInputAmount(String(Number(editingItem.deal_cost) || 0));
        setExchangeRate("1");
      }
      setNotes(editingItem.notes || "");
    } else {
      const defaultPhase: HoneymoonPhase =
        prefill?.phase ?? "HONEYMOON_ONTRIP";
      setPhase(defaultPhase);
      setTitle(prefill?.title || "");

      // Default ke mata uang tujuan untuk On-Trip, atau IDR untuk Pre-Trip
      const defaultCur =
        defaultPhase === "HONEYMOON_ONTRIP"
          ? workspace.honeymoon_currency || "IDR"
          : "IDR";
      setCurrency(defaultCur);
      setExchangeRate(
        defaultCur === workspace.honeymoon_currency
          ? String(Number(workspace.honeymoon_exchange_rate) || 1)
          : String(getCurrencyOption(defaultCur).defaultRateToIDR)
      );
      setInputAmount("");
      setNotes("");
      setMarkChecklistDone(true);

      const matchingCats = categories.filter((c) => c.phase === defaultPhase);
      setCategoryId(matchingCats[0]?.id || "");
    }
  }, [open, editingItem, prefill, workspace, categories]);

  // Sinkronkan categoryId ketika user berpindah tab phase
  useEffect(() => {
    if (!open) return;
    if (
      phaseCategories.length > 0 &&
      !phaseCategories.some((c) => c.id === categoryId)
    ) {
      setCategoryId(phaseCategories[0].id);
    }
  }, [open, phase, phaseCategories, categoryId]);

  const handleCurrencyChange = (nextCode: string) => {
    setCurrency(nextCode);
    if (nextCode === "IDR") {
      setExchangeRate("1");
    } else if (nextCode === workspace.honeymoon_currency) {
      setExchangeRate(String(Number(workspace.honeymoon_exchange_rate) || 1));
    } else {
      setExchangeRate(String(getCurrencyOption(nextCode).defaultRateToIDR));
    }
  };

  const amountNum = Math.max(0, Number(inputAmount) || 0);
  const rateNum = currency === "IDR" ? 1 : Math.max(0.01, Number(exchangeRate) || 1);
  const convertedIDR =
    currency === "IDR"
      ? Math.round(amountNum)
      : convertToIDR(amountNum, rateNum);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || amountNum <= 0) return;

    const ok = await confirm({
      title: editingItem
        ? "Simpan Perubahan Pengeluaran?"
        : "Catat Pengeluaran Honeymoon?",
      description: `"${title.trim()}" senilai ${formatIDR(convertedIDR)} akan dicatat ke Dompet Honeymoon.`,
      confirmLabel: "Ya, Simpan",
    });
    if (!ok) return;

    setSaving(true);
    setErrorMsg(null);

    try {
      let resolvedCategoryId = categoryId;
      let anyQueued = false;

      // Auto-seed kategori honeymoon jika workspace belum memilikinya
      if (!resolvedCategoryId) {
        const defaults = buildDefaultHoneymoonCategories(
          Number(workspace.honeymoon_budget_target) || 0
        );
        for (const c of defaults) {
          const { id, queued } = await executeOfflineFirstMutation({
            workspaceId: workspace.id,
            table: "budget_categories",
            operation: "INSERT",
            payload: { ...c, workspace_id: workspace.id },
            queryClient,
          });
          if (queued) anyQueued = true;
          if (!resolvedCategoryId && c.phase === phase) {
            resolvedCategoryId = id;
          }
        }
      }

      const payload = {
        category_id: resolvedCategoryId,
        phase,
        title: title.trim(),
        estimated_cost: convertedIDR,
        deal_cost: convertedIDR,
        currency,
        foreign_amount: currency === "IDR" ? null : amountNum,
        notes: notes.trim() || null,
        vendor_contact: null,
        is_booked: true,
      };

      const { id: savedItemId, queued } = editingItem
        ? await executeOfflineFirstMutation({
            workspaceId: workspace.id,
            table: "budget_items",
            operation: "UPDATE",
            recordId: editingItem.id,
            payload,
            queryClient,
          })
        : await executeOfflineFirstMutation({
            workspaceId: workspace.id,
            table: "budget_items",
            operation: "INSERT",
            payload: {
              workspace_id: workspace.id,
              ...payload,
            },
            queryClient,
          });

      if (queued) anyQueued = true;

      if (prefill?.checklistId && markChecklistDone) {
        const res = await executeOfflineFirstMutation({
          workspaceId: workspace.id,
          table: "honeymoon_checklists",
          operation: "UPDATE",
          recordId: prefill.checklistId,
          payload: {
            is_completed: true,
            linked_item_id: savedItemId ?? null,
          },
          queryClient,
        });
        if (res.queued) anyQueued = true;
      }

      if (!anyQueued) {
        await onSuccess();
        toast.success(
          editingItem
            ? "Pengeluaran honeymoon diperbarui"
            : "Pengeluaran honeymoon dicatat",
          `"${title.trim()}" (${formatIDR(convertedIDR)}).`
        );
      } else {
        toast.warning(
          "Pengeluaran disimpan di antrean offline",
          `"${title.trim()}" akan sinkron saat online.`
        );
      }
      onOpenChange(false);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Gagal menyimpan pengeluaran honeymoon.";
      setErrorMsg(msg);
      toast.error("Gagal menyimpan pengeluaran", msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingItem) return;
    const confirmed = await confirm({
      title: "Hapus Pengeluaran Honeymoon?",
      description: `Hapus pengeluaran "${editingItem.title}" dari Dompet Honeymoon?`,
      confirmLabel: "Ya, Hapus",
      variant: "destructive",
    });
    if (!confirmed) return;

    setDeleting(true);
    setErrorMsg(null);
    try {
      const { queued } = await executeOfflineFirstMutation({
        workspaceId: workspace.id,
        table: "budget_items",
        operation: "DELETE",
        recordId: editingItem.id,
        queryClient,
      });
      if (!queued) {
        await onSuccess();
        toast.success("Pengeluaran dihapus", `"${editingItem.title}" telah dihapus.`);
      } else {
        toast.warning("Penghapusan masuk antrean offline");
      }
      onOpenChange(false);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Gagal menghapus pengeluaran.";
      setErrorMsg(msg);
      toast.error("Gagal menghapus pengeluaran", msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingItem
              ? "Edit Pengeluaran Honeymoon"
              : "Tambah Pengeluaran Honeymoon"}
          </DialogTitle>
          <DialogDescription>
            Catat biaya dalam IDR atau mata uang lokal tujuan dengan konversi
            otomatis ke Rupiah.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          {errorMsg && (
            <p className="rounded-xl border border-terracotta/30 bg-terracotta-50 px-3 py-2 text-xs text-terracotta-800">
              {errorMsg}
            </p>
          )}

          {/* Phase Toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPhase("HONEYMOON_PRE")}
              className={`rounded-xl py-2.5 text-xs font-semibold border transition-all ${
                phase === "HONEYMOON_PRE"
                  ? "border-sage bg-sage text-white shadow-sm"
                  : "border-sage/15 bg-cream-50 text-sage-700 hover:bg-sage-50"
              }`}
            >
              Pra-Perjalanan (Pre-Trip)
            </button>
            <button
              type="button"
              onClick={() => setPhase("HONEYMOON_ONTRIP")}
              className={`rounded-xl py-2.5 text-xs font-semibold border transition-all ${
                phase === "HONEYMOON_ONTRIP"
                  ? "border-sage bg-sage text-white shadow-sm"
                  : "border-sage/15 bg-cream-50 text-sage-700 hover:bg-sage-50"
              }`}
            >
              Selama Trip (On-Trip)
            </button>
          </div>

          {phaseCategories.length > 0 && (
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {phaseCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="hm-exp-title">Nama Pengeluaran</Label>
            <Input
              id="hm-exp-title"
              required
              placeholder={
                phase === "HONEYMOON_PRE"
                  ? "Contoh: Tiket PP Jakarta - Tokyo / Hotel Shinjuku"
                  : "Contoh: Ramen Ichiran / Tiket Shinkansen"
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Multi-Currency Input */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-5 space-y-2">
              <Label>Mata Uang</Label>
              <Select value={currency} onValueChange={handleCurrencyChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HONEYMOON_CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} ({c.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-7 space-y-2">
              <Label htmlFor="hm-exp-amount">
                Nominal ({getCurrencyOption(currency).symbol})
              </Label>
              <CurrencyInput
                id="hm-exp-amount"
                required
                allowDecimal={currency !== "IDR"}
                placeholder={currency === "IDR" ? "1.500.000" : "15.000"}
                value={inputAmount}
                onValueChange={setInputAmount}
                className="font-bold"
              />
            </div>
          </div>

          {/* Live Currency Conversion Box */}
          {currency !== "IDR" && (
            <div className="rounded-2xl border border-sage/15 bg-sage-50/70 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <Label
                  htmlFor="hm-exp-rate"
                  className="text-xs text-sage-700 inline-flex items-center gap-1.5"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5 text-sage" />
                  Kurs tersimpan (1 {currency} → IDR)
                </Label>
                <CurrencyInput
                  id="hm-exp-rate"
                  allowDecimal
                  value={exchangeRate}
                  onValueChange={setExchangeRate}
                  className="w-28 h-8 text-right text-xs font-bold bg-white"
                />
              </div>
              <div className="flex items-center justify-between border-t border-sage/10 pt-2 text-xs">
                <span className="text-sage-700">
                  {amountNum > 0
                    ? formatForeignCurrency(amountNum, currency)
                    : `${getCurrencyOption(currency).symbol}0`}
                </span>
                <span className="text-sm font-bold text-sage-900">
                  ≈ {formatIDR(convertedIDR)}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="hm-exp-notes">Catatan (Opsional)</Label>
            <Input
              id="hm-exp-notes"
              placeholder="Contoh: Kartu kredit / tunai / booking Agoda"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {prefill?.checklistId && (
            <label className="flex items-center gap-2.5 rounded-xl border border-sage/15 bg-cream-50 px-3.5 py-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={markChecklistDone}
                onChange={(e) => setMarkChecklistDone(e.target.checked)}
                className="h-4 w-4 rounded accent-sage"
              />
              <span className="text-xs font-medium text-sage-900">
                Otomatis centang selesai pada checklist pra-perjalanan
              </span>
            </label>
          )}

          <DialogFooter className="gap-2">
            {editingItem && (
              <Button
                type="button"
                variant="outline"
                className="text-terracotta-700 border-terracotta/30 hover:bg-terracotta-50 sm:mr-auto"
                onClick={handleDelete}
                disabled={deleting || saving}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Hapus
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={saving || deleting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={saving || deleting || !title.trim() || amountNum <= 0}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Pengeluaran"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
