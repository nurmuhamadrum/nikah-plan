"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, Upload, FileCheck2, X } from "lucide-react";
import type { BudgetItem, FundingSource, ItemPayment } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { compressReceiptFile } from "@/lib/image-compression";
import { FUNDING_SOURCE_META } from "@/lib/category-icons";
import {
  executeOfflineFirstMutation,
  queueReceiptUploadOffline,
} from "@/lib/offline/sync-engine";
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
import { Label } from "@/components/ui/label";

const TERMIN_PRESETS = ["Booking Fee", "DP 30%", "Termin 2", "Pelunasan H-14"];

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  item: BudgetItem | null;
  payment: ItemPayment | null;
  onSuccess: () => Promise<void>;
}

export function PaymentDialog({
  open,
  onOpenChange,
  workspaceId,
  item,
  payment,
  onSuccess,
}: PaymentDialogProps) {
  const queryClient = useQueryClient();

  const [label, setLabel] = useState("DP 30%");
  const [amount, setAmount] = useState("0");
  const [funding, setFunding] = useState<FundingSource>("JOINT");
  const [dueDate, setDueDate] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [paidDate, setPaidDate] = useState("");
  const [existingReceiptPath, setExistingReceiptPath] = useState<string | null>(
    null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setErrorMsg(null);
      setSelectedFile(null);
      if (payment) {
        setLabel(payment.label);
        setAmount(String(Number(payment.amount) || 0));
        setFunding(payment.funding);
        setDueDate(payment.due_date || "");
        setIsPaid(payment.is_paid);
        setPaidDate(payment.paid_date || "");
        setExistingReceiptPath(payment.receipt_url);
      } else {
        setLabel("DP 30%");
        const suggestedAmount = item
          ? Math.round((Number(item.deal_cost) || Number(item.estimated_cost) || 0) * 0.3)
          : 0;
        setAmount(String(suggestedAmount));
        setFunding("JOINT");
        setDueDate("");
        setIsPaid(false);
        setPaidDate("");
        setExistingReceiptPath(null);
      }
    }
  }, [open, payment, item]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || !label.trim()) return;

    setSaving(true);
    setErrorMsg(null);

    try {
      const amountNum = Math.max(0, Number(amount) || 0);
      const effectivePaidDate = isPaid
        ? paidDate || new Date().toISOString().split("T")[0]
        : null;

      // 1. Insert / update termin lewat offline-first mutation engine
      const { id: targetPaymentId, queued } = payment
        ? await executeOfflineFirstMutation({
            workspaceId,
            table: "item_payments",
            operation: "UPDATE",
            recordId: payment.id,
            payload: {
              label: label.trim(),
              amount: amountNum,
              funding,
              due_date: dueDate || null,
              is_paid: isPaid,
              paid_date: effectivePaidDate,
              receipt_url: existingReceiptPath,
            },
            queryClient,
          })
        : await executeOfflineFirstMutation({
            workspaceId,
            table: "item_payments",
            operation: "INSERT",
            payload: {
              workspace_id: workspaceId,
              item_id: item.id,
              label: label.trim(),
              amount: amountNum,
              funding,
              due_date: dueDate || null,
              is_paid: isPaid,
              paid_date: effectivePaidDate,
              receipt_url: null,
            },
            queryClient,
          });

      // 2. Kompres & unggah bukti bayar (jika offline, antrekan ke Dexie receiptOutbox!)
      if (selectedFile && targetPaymentId) {
        const compressed = await compressReceiptFile(selectedFile);

        if (queued || (typeof navigator !== "undefined" && !navigator.onLine)) {
          await queueReceiptUploadOffline({
            workspaceId,
            paymentId: targetPaymentId,
            blob: compressed.blob,
            ext: compressed.ext,
            contentType: compressed.contentType,
            previousPath: existingReceiptPath,
          });
        } else {
          const supabase = createClient();
          const storagePath = `${workspaceId}/${targetPaymentId}-${Date.now()}.${compressed.ext}`;
          const { error: uploadError } = await supabase.storage
            .from("receipts")
            .upload(storagePath, compressed.blob, {
              contentType: compressed.contentType,
              upsert: true,
            });

          if (uploadError) {
            // Fallback ke antrean offline jika jaringan putus saat upload
            await queueReceiptUploadOffline({
              workspaceId,
              paymentId: targetPaymentId,
              blob: compressed.blob,
              ext: compressed.ext,
              contentType: compressed.contentType,
              previousPath: existingReceiptPath,
            });
          } else {
            if (existingReceiptPath && existingReceiptPath !== storagePath) {
              await supabase.storage
                .from("receipts")
                .remove([existingReceiptPath]);
            }
            await executeOfflineFirstMutation({
              workspaceId,
              table: "item_payments",
              operation: "UPDATE",
              recordId: targetPaymentId,
              payload: { receipt_url: storagePath },
              queryClient,
            });
          }
        }
      }

      if (!queued) await onSuccess();
      onOpenChange(false);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal menyimpan termin pembayaran."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!payment) return;
    const confirmed = window.confirm(`Hapus termin "${payment.label}"?`);
    if (!confirmed) return;

    setDeleting(true);
    setErrorMsg(null);

    try {
      if (
        payment.receipt_url &&
        (typeof navigator === "undefined" || navigator.onLine)
      ) {
        const supabase = createClient();
        await supabase.storage.from("receipts").remove([payment.receipt_url]);
      }
      const { queued } = await executeOfflineFirstMutation({
        workspaceId,
        table: "item_payments",
        operation: "DELETE",
        recordId: payment.id,
        queryClient,
      });

      if (!queued) await onSuccess();
      onOpenChange(false);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal menghapus termin."
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {payment ? "Edit Termin Pembayaran" : "Tambah Termin Pembayaran"}
          </DialogTitle>
          <DialogDescription>
            {item ? `Vendor: ${item.title}` : "Atur jadwal cicilan & bukti bayar."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          {errorMsg && (
            <p className="rounded-xl border border-terracotta/30 bg-terracotta-50 px-3 py-2 text-xs text-terracotta-800">
              {errorMsg}
            </p>
          )}

          {/* Label + Preset Pills */}
          <div className="space-y-2">
            <Label htmlFor="termin-label">Nama Termin</Label>
            <Input
              id="termin-label"
              required
              placeholder="Contoh: DP 30% / Pelunasan H-14"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
            <div className="flex flex-wrap gap-1.5">
              {TERMIN_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setLabel(preset)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    label === preset
                      ? "bg-sage text-white"
                      : "bg-cream-200/80 text-sage-700 hover:bg-cream-300"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="termin-amount">Nominal (IDR)</Label>
              <Input
                id="termin-amount"
                type="number"
                required
                min={0}
                step={50000}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Sumber Dana</Label>
              <Select
                value={funding}
                onValueChange={(v) => setFunding(v as FundingSource)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih sumber dana" />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.keys(FUNDING_SOURCE_META) as FundingSource[]
                  ).map((key) => (
                    <SelectItem key={key} value={key}>
                      {FUNDING_SOURCE_META[key].fullLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="termin-due">Tanggal Jatuh Tempo</Label>
              <Input
                id="termin-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            {isPaid && (
              <div className="space-y-2">
                <Label htmlFor="termin-paid-date">Tanggal Dibayar</Label>
                <Input
                  id="termin-paid-date"
                  type="date"
                  value={paidDate}
                  onChange={(e) => setPaidDate(e.target.value)}
                />
              </div>
            )}
          </div>

          <label className="flex items-center gap-2.5 rounded-xl border border-sage/15 bg-cream-50 px-3.5 py-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={isPaid}
              onChange={(e) => {
                setIsPaid(e.target.checked);
                if (e.target.checked && !paidDate) {
                  setPaidDate(new Date().toISOString().split("T")[0]);
                }
              }}
              className="h-4 w-4 rounded accent-sage"
            />
            <span className="text-sm font-medium text-sage-900">
              Termin ini sudah lunas dibayar
            </span>
          </label>

          {/* Upload Bukti Bayar */}
          <div className="space-y-2">
            <Label htmlFor="receipt-upload">
              Bukti Bayar / Kwitansi (JPG, PNG, WebP, PDF)
            </Label>

            <div className="rounded-xl border border-dashed border-sage/25 bg-cream-50/70 p-3.5 space-y-2">
              <label
                htmlFor="receipt-upload"
                className="flex items-center justify-center gap-2 text-xs font-semibold text-sage-800 cursor-pointer py-1"
              >
                <Upload className="h-4 w-4 text-terracotta" />
                <span>
                  {selectedFile
                    ? selectedFile.name
                    : existingReceiptPath
                      ? "Ganti file bukti bayar"
                      : "Pilih foto struk / PDF (kompresi otomatis)"}
                </span>
              </label>
              <input
                id="receipt-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setSelectedFile(file);
                }}
              />

              {(selectedFile || existingReceiptPath) && (
                <div className="flex items-center justify-between rounded-lg bg-white border border-sage/10 px-2.5 py-1.5 text-xs text-sage-700">
                  <span className="inline-flex items-center gap-1.5 truncate">
                    <FileCheck2 className="h-3.5 w-3.5 text-sage shrink-0" />
                    <span className="truncate">
                      {selectedFile
                        ? `Siap diunggah: ${selectedFile.name}`
                        : "Bukti bayar tersimpan di Supabase Storage"}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setExistingReceiptPath(null);
                    }}
                    className="text-sage-500 hover:text-terracotta p-0.5"
                    aria-label="Hapus lampiran"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            {payment && (
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
            <Button type="submit" disabled={saving || deleting || !label.trim()}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Termin"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
