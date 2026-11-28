"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  Heart,
  Loader2,
  Plane,
  Plus,
  X,
  Zap,
} from "lucide-react";
import type { WorkspaceBundle } from "@/lib/workspace-data";
import { fetchWorkspaceBundleOfflineFirst } from "@/lib/offline/query-helpers";
import {
  executeOfflineFirstMutation,
  queueReceiptUploadOffline,
} from "@/lib/offline/sync-engine";
import {
  HONEYMOON_CURRENCIES,
  getCurrencyOption,
} from "@/lib/budget-allocator";
import {
  compressReceiptFile,
  formatFileSize,
  type CompressedImageResult,
} from "@/lib/image-compression";
import { createClient } from "@/lib/supabase/client";
import { logWorkspaceActivity } from "@/lib/activity-logger";
import { formatIDR } from "@/lib/utils";
import { useToast } from "@/components/providers/toast-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QuickAddFabProps {
  workspaceId?: string | null;
  userName?: string;
}

export function QuickAddFab({ workspaceId, userName }: QuickAddFabProps) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [open, setOpen] = useState(false);
  const [bundle, setBundle] = useState<WorkspaceBundle | null>(null);
  const [quickMode, setQuickMode] = useState<"WEDDING" | "HONEYMOON">("WEDDING");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("IDR");
  const [categoryId, setCategoryId] = useState("");
  const [compressedReceipt, setCompressedReceipt] =
    useState<CompressedImageResult | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sembunyikan FAB pada halaman editor undangan agar tidak mengganggu toolbar sticky
  const isHiddenRoute =
    !workspaceId || pathname === "/undangan" || pathname.startsWith("/undangan/");

  // Muat snapshot kategori workspace saat dialog dibuka
  useEffect(() => {
    if (!open || !workspaceId) return;
    const cached = queryClient.getQueryData<WorkspaceBundle>([
      "workspace-data",
      workspaceId,
    ]);
    if (cached) {
      setBundle(cached);
    } else {
      fetchWorkspaceBundleOfflineFirst(workspaceId).then((loaded) => {
        if (loaded) setBundle(loaded);
      });
    }
  }, [open, workspaceId, queryClient]);

  const canUseHoneymoon = bundle?.workspace.plan === "COMPLETE_PASS";

  const modeCategories = useMemo(() => {
    if (!bundle) return [];
    if (quickMode === "WEDDING") {
      return bundle.categories.filter((c) => c.phase === "WEDDING");
    }
    return bundle.categories.filter((c) => c.phase !== "WEDDING");
  }, [bundle, quickMode]);

  useEffect(() => {
    if (!open) return;
    if (modeCategories.length > 0 && !modeCategories.some((c) => c.id === categoryId)) {
      setCategoryId(modeCategories[0].id);
    }
    if (quickMode === "HONEYMOON" && bundle?.workspace.honeymoon_currency) {
      setCurrency(bundle.workspace.honeymoon_currency);
    } else if (quickMode === "WEDDING") {
      setCurrency("IDR");
    }
  }, [open, quickMode, modeCategories, categoryId, bundle]);

  const activeRateToIdr = useMemo(() => {
    if (currency === "IDR") return 1;
    if (
      bundle?.workspace.honeymoon_currency === currency &&
      Number(bundle.workspace.honeymoon_exchange_rate) > 0
    ) {
      return Number(bundle.workspace.honeymoon_exchange_rate);
    }
    return getCurrencyOption(currency).defaultRateToIDR;
  }, [currency, bundle]);

  const numericAmount = Math.max(0, Number(amount) || 0);
  const convertedIdr =
    currency === "IDR"
      ? numericAmount
      : Math.round(numericAmount * activeRateToIdr);

  const handleReceiptPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressing(true);
    try {
      const result = await compressReceiptFile(file);
      setCompressedReceipt(result);
    } catch {
      toast.error("Gagal memproses foto struk.");
    } finally {
      setCompressing(false);
      e.target.value = "";
    }
  };

  const resetForm = () => {
    setTitle("");
    setAmount("");
    setCompressedReceipt(null);
  };

  const handleQuickSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !title.trim() || numericAmount <= 0) return;

    setSaving(true);
    try {
      let targetCatId = categoryId;

      // Pastikan ada kategori valid (buat kategori default cepat jika belum ada)
      if (!targetCatId) {
        const defaultPhase =
          quickMode === "WEDDING" ? "WEDDING" : "HONEYMOON_ONTRIP";
        const catRes = await executeOfflineFirstMutation({
          workspaceId,
          table: "budget_categories",
          operation: "INSERT",
          payload: {
            workspace_id: workspaceId,
            phase: defaultPhase,
            name:
              quickMode === "WEDDING"
                ? "Pengeluaran Lainnya"
                : "Jajan & Aktivitas Honeymoon",
            icon: quickMode === "WEDDING" ? "receipt" : "plane",
            allocated_amount: 0,
            sort_order: 99,
          },
          queryClient,
        });
        targetCatId = catRes.id;
      }

      const today = new Date().toISOString().slice(0, 10);

      if (quickMode === "HONEYMOON") {
        const { queued } = await executeOfflineFirstMutation({
          workspaceId,
          table: "budget_items",
          operation: "INSERT",
          payload: {
            workspace_id: workspaceId,
            category_id: targetCatId,
            phase: "HONEYMOON_ONTRIP",
            title: title.trim(),
            estimated_cost: convertedIdr,
            deal_cost: convertedIdr,
            currency,
            foreign_amount: currency === "IDR" ? null : numericAmount,
            is_booked: true,
            notes: "Dicatat via Quick-Add 3 Detik",
          },
          queryClient,
        });

        await logWorkspaceActivity({
          workspaceId,
          actorName: userName,
          actionType: "QUICK_EXPENSE",
          summary: `mencatat pengeluaran honeymoon "${title.trim()}" (${formatIDR(convertedIdr)})`,
          entityPath: "/dashboard",
          queryClient,
        });

        toast.success(
          queued ? "Tersimpan di antrean offline" : "Pengeluaran honeymoon tercatat!",
          `${title.trim()} — ${formatIDR(convertedIdr)}`
        );
      } else {
        // Mode Nikah: buat pos + termin lunas sekaligus (+ upload struk bila ada)
        const itemRes = await executeOfflineFirstMutation({
          workspaceId,
          table: "budget_items",
          operation: "INSERT",
          payload: {
            workspace_id: workspaceId,
            category_id: targetCatId,
            phase: "WEDDING",
            title: title.trim(),
            estimated_cost: convertedIdr,
            deal_cost: convertedIdr,
            currency: "IDR",
            foreign_amount: null,
            is_booked: true,
            notes: "Dicatat via Quick-Add 3 Detik",
          },
          queryClient,
        });

        const payRes = await executeOfflineFirstMutation({
          workspaceId,
          table: "item_payments",
          operation: "INSERT",
          payload: {
            workspace_id: workspaceId,
            item_id: itemRes.id,
            label: "Pembayaran Cepat",
            amount: convertedIdr,
            funding: "JOINT",
            due_date: today,
            is_paid: true,
            paid_date: today,
            receipt_url: null,
          },
          queryClient,
        });

        // Upload foto struk (online langsung / offline masuk antrean outbox)
        if (compressedReceipt) {
          if (typeof navigator !== "undefined" && !navigator.onLine) {
            await queueReceiptUploadOffline({
              workspaceId,
              paymentId: payRes.id,
              blob: compressedReceipt.blob,
              ext: compressedReceipt.ext,
              contentType: compressedReceipt.contentType,
              previousPath: null,
            });
          } else {
            const supabase = createClient();
            const storagePath = `${workspaceId}/${payRes.id}-${Date.now()}.${compressedReceipt.ext}`;
            const { error: uploadError } = await supabase.storage
              .from("receipts")
              .upload(storagePath, compressedReceipt.blob, {
                contentType: compressedReceipt.contentType,
                upsert: true,
              });
            if (uploadError) {
              await queueReceiptUploadOffline({
                workspaceId,
                paymentId: payRes.id,
                blob: compressedReceipt.blob,
                ext: compressedReceipt.ext,
                contentType: compressedReceipt.contentType,
                previousPath: null,
              });
            } else {
              await executeOfflineFirstMutation({
                workspaceId,
                table: "item_payments",
                operation: "UPDATE",
                recordId: payRes.id,
                payload: { receipt_url: storagePath },
                queryClient,
              });
            }
          }
        }

        await logWorkspaceActivity({
          workspaceId,
          actorName: userName,
          actionType: "QUICK_EXPENSE",
          summary: `mencatat cepat "${title.trim()}" (${formatIDR(convertedIdr)})`,
          entityPath: "/vendors",
          queryClient,
        });

        toast.success(
          itemRes.queued
            ? "Tersimpan di antrean offline"
            : "Pengeluaran tercatat dalam 3 detik!",
          `${title.trim()} — ${formatIDR(convertedIdr)}`
        );
      }

      await queryClient.invalidateQueries({
        queryKey: ["workspace-data", workspaceId],
      });
      resetForm();
      setOpen(false);
    } catch (err) {
      toast.error(
        "Gagal mencatat pengeluaran cepat",
        err instanceof Error ? err.message : "Silakan coba lagi."
      );
    } finally {
      setSaving(false);
    }
  };

  if (isHiddenRoute) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Catat Pengeluaran Cepat"
        title="Catat Pengeluaran Cepat (3 Detik)"
        className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-4 md:bottom-6 md:right-6 z-30 inline-flex h-13 items-center gap-2 rounded-full bg-midnight-btn px-4 py-3 text-white shadow-lift border border-white/15 hover:opacity-95 active:scale-95 transition-all"
      >
        <Plus className="h-5 w-5 text-[#E09F3E]" />
        <span className="hidden sm:inline text-xs font-bold tracking-wide">
          Catat Cepat
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="inline-flex items-center gap-2">
              <Zap className="h-4.5 w-4.5 text-[#E09F3E]" />
              Catat Pengeluaran Cepat (3 Detik)
            </DialogTitle>
            <DialogDescription>
              Cocok saat survey Wedding Expo atau jajan Honeymoon — cukup isi
              nominal, nama, dan foto struk opsional.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleQuickSave} className="space-y-4">
            {/* Switcher Nikah vs Honeymoon */}
            {canUseHoneymoon && (
              <div className="grid grid-cols-2 gap-1 rounded-full bg-[#F4F5F7] p-1 border border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setQuickMode("WEDDING")}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-semibold transition-colors ${
                    quickMode === "WEDDING"
                      ? "bg-midnight-btn text-white shadow-sm"
                      : "text-[#5F6978]"
                  }`}
                >
                  <Heart className="h-3.5 w-3.5" />
                  Pernikahan (IDR)
                </button>
                <button
                  type="button"
                  onClick={() => setQuickMode("HONEYMOON")}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-semibold transition-colors ${
                    quickMode === "HONEYMOON"
                      ? "bg-midnight-btn text-white shadow-sm"
                      : "text-[#5F6978]"
                  }`}
                >
                  <Plane className="h-3.5 w-3.5" />
                  Honeymoon
                </button>
              </div>
            )}

            {/* Nominal + Mata Uang */}
            <div className="grid grid-cols-12 gap-2.5">
              <div
                className={
                  quickMode === "HONEYMOON"
                    ? "col-span-7 space-y-1.5"
                    : "col-span-12 space-y-1.5"
                }
              >
                <Label htmlFor="quick-amount">
                  Nominal ({currency})
                </Label>
                <CurrencyInput
                  id="quick-amount"
                  allowDecimal={currency !== "IDR"}
                  value={amount}
                  onValueChange={setAmount}
                  placeholder={currency === "IDR" ? "250.000" : "3500"}
                  className="text-base font-bold"
                />
              </div>

              {quickMode === "HONEYMOON" && (
                <div className="col-span-5 space-y-1.5">
                  <Label>Mata Uang</Label>
                  <Select value={currency} onValueChange={setCurrency}>
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
              )}
            </div>

            {quickMode === "HONEYMOON" &&
              currency !== "IDR" &&
              numericAmount > 0 && (
                <p className="text-xs font-semibold text-[#4F6BF6] tabular-nums -mt-2">
                  &approx; {formatIDR(convertedIdr)} (kurs 1 {currency} ={" "}
                  {formatIDR(activeRateToIdr)})
                </p>
              )}

            {/* Judul & Kategori */}
            <div className="space-y-1.5">
              <Label htmlFor="quick-title">Untuk Apa?</Label>
              <Input
                id="quick-title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  quickMode === "WEDDING"
                    ? "Contoh: Sample Undangan / DP Souvenir"
                    : "Contoh: Makan Ramen Ichiran / Tiket Shinkansen"
                }
              />
            </div>

            {modeCategories.length > 0 && (
              <div className="space-y-1.5">
                <Label>Kategori</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {modeCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Opsional Foto Struk (Mode Nikah) */}
            {quickMode === "WEDDING" && (
              <div className="space-y-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleReceiptPick}
                  className="hidden"
                />
                {compressedReceipt ? (
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-xs text-emerald-800">
                    <span className="truncate font-medium">
                      Struk siap ({formatFileSize(compressedReceipt.compressedSize)})
                    </span>
                    <button
                      type="button"
                      onClick={() => setCompressedReceipt(null)}
                      className="p-0.5 hover:text-red-600"
                      aria-label="Hapus foto struk"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={compressing}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {compressing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Camera className="h-3.5 w-3.5 text-[#4F6BF6]" />
                    )}
                    {compressing
                      ? "Mengompresi struk..."
                      : "Snap Foto Struk (Opsional)"}
                  </Button>
                )}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={saving || !title.trim() || numericAmount <= 0}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>Simpan Cepat &bull; {formatIDR(convertedIdr)}</>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
