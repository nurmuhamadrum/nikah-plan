"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import type { Workspace } from "@/types/database";
import { executeOfflineFirstMutation } from "@/lib/offline/sync-engine";
import {
  buildDefaultHoneymoonCategories,
  buildDefaultHoneymoonChecklists,
  calculateTripDays,
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
import { DatePicker } from "@/components/ui/date-picker";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";

interface HoneymoonSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: Workspace;
  hasHoneymoonCategories: boolean;
  hasChecklists: boolean;
  onSuccess: () => Promise<void>;
}

export function HoneymoonSettingsDialog({
  open,
  onOpenChange,
  workspace,
  hasHoneymoonCategories,
  hasChecklists,
  onSuccess,
}: HoneymoonSettingsDialogProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const confirm = useConfirm();

  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currency, setCurrency] = useState("JPY");
  const [exchangeRate, setExchangeRate] = useState("105");
  const [budgetTarget, setBudgetTarget] = useState("35000000");

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setErrorMsg(null);
      setDestination(workspace.honeymoon_destination || "");
      setStartDate(workspace.honeymoon_start_date || "");
      setEndDate(workspace.honeymoon_end_date || "");
      const cur = workspace.honeymoon_currency || "JPY";
      setCurrency(cur);
      setExchangeRate(
        String(
          cur !== "IDR" && Number(workspace.honeymoon_exchange_rate) > 1
            ? Number(workspace.honeymoon_exchange_rate)
            : getCurrencyOption(cur).defaultRateToIDR
        )
      );
      setBudgetTarget(String(Number(workspace.honeymoon_budget_target) || 35000000));
    }
  }, [open, workspace]);

  const handleCurrencyChange = (nextCode: string) => {
    setCurrency(nextCode);
    setExchangeRate(String(getCurrencyOption(nextCode).defaultRateToIDR));
  };

  const tripDays = calculateTripDays(startDate, endDate);
  const budgetNum = Math.max(0, Number(budgetTarget) || 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;

    const ok = await confirm({
      title: "Simpan Pengaturan Honeymoon?",
      description: `Destinasi "${destination.trim()}" dengan target budget ${formatIDR(budgetNum)} (${currency}) akan disimpan.`,
      confirmLabel: "Ya, Simpan",
    });
    if (!ok) return;

    setSaving(true);
    setErrorMsg(null);

    try {
      const rateNum = Math.max(0.01, Number(exchangeRate) || 1);
      const { queued } = await executeOfflineFirstMutation({
        workspaceId: workspace.id,
        table: "workspaces",
        operation: "UPDATE",
        recordId: workspace.id,
        payload: {
          honeymoon_destination: destination.trim(),
          honeymoon_start_date: startDate || null,
          honeymoon_end_date: endDate || null,
          honeymoon_currency: currency,
          honeymoon_exchange_rate: currency === "IDR" ? 1 : rateNum,
          honeymoon_budget_target: budgetNum,
        },
        queryClient,
      });

      if (!hasHoneymoonCategories) {
        const defaultCats = buildDefaultHoneymoonCategories(budgetNum);
        for (const c of defaultCats) {
          await executeOfflineFirstMutation({
            workspaceId: workspace.id,
            table: "budget_categories",
            operation: "INSERT",
            payload: { ...c, workspace_id: workspace.id },
            queryClient,
          });
        }
      }

      if (!hasChecklists) {
        const defaultChecks = buildDefaultHoneymoonChecklists(
          destination.trim()
        );
        for (const c of defaultChecks) {
          await executeOfflineFirstMutation({
            workspaceId: workspace.id,
            table: "honeymoon_checklists",
            operation: "INSERT",
            payload: {
              ...c,
              workspace_id: workspace.id,
              is_completed: false,
              linked_item_id: null,
            },
            queryClient,
          });
        }
      }

      if (!queued) {
        await onSuccess();
        toast.success(
          "Pengaturan Honeymoon disimpan",
          `Destinasi ${destination.trim()} (${formatIDR(budgetNum)}).`
        );
      } else {
        toast.warning(
          "Pengaturan disimpan di antrean offline",
          "Akan disinkronkan otomatis saat kembali online."
        );
      }
      onOpenChange(false);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Gagal menyimpan pengaturan honeymoon.";
      setErrorMsg(msg);
      toast.error("Gagal menyimpan pengaturan", msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pengaturan Rencana Honeymoon</DialogTitle>
          <DialogDescription>
            Kurs mata uang tersimpan digunakan untuk konversi otomatis IDR saat
            mencatat pengeluaran (termasuk saat offline).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          {errorMsg && (
            <p className="rounded-xl border border-terracotta/30 bg-terracotta-50 px-3 py-2 text-xs text-terracotta-800">
              {errorMsg}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="hm-set-dest">Destinasi</Label>
            <Input
              id="hm-set-dest"
              required
              placeholder="Contoh: Jepang (Tokyo & Kyoto)"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="hm-set-start">Tanggal Berangkat</Label>
              <DatePicker
                id="hm-set-start"
                displayMode="modal"
                value={startDate}
                onChange={setStartDate}
                placeholder="Pilih tgl berangkat..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hm-set-end">Tanggal Pulang</Label>
              <DatePicker
                id="hm-set-end"
                displayMode="modal"
                minDate={startDate || undefined}
                value={endDate}
                onChange={setEndDate}
                placeholder="Pilih tgl pulang..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Mata Uang Tujuan</Label>
              <Select value={currency} onValueChange={handleCurrencyChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HONEYMOON_CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} ({c.symbol}) — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hm-set-rate">Kurs ke IDR (1 {currency})</Label>
              <CurrencyInput
                id="hm-set-rate"
                allowDecimal
                disabled={currency === "IDR"}
                value={currency === "IDR" ? "1" : exchangeRate}
                onValueChange={setExchangeRate}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hm-set-budget">Target Dana Awal Honeymoon (IDR)</Label>
            <CurrencyInput
              id="hm-set-budget"
              placeholder="35.000.000"
              value={budgetTarget}
              onValueChange={setBudgetTarget}
            />
            {tripDays > 0 && budgetNum > 0 && (
              <p className="text-xs text-sage-600">
                Durasi <strong>{tripDays} hari</strong> &bull; Rata-rata awal{" "}
                <strong>{formatIDR(budgetNum / tripDays)}/hari</strong>
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button type="submit" disabled={saving || !destination.trim()}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Rencana"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
