"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, CheckCircle2, Loader2, ReceiptText } from "lucide-react";
import type { BudgetItem, ItemPayment, WeddingGift } from "@/types/database";
import { formatIDR } from "@/lib/utils";
import { executeOfflineFirstMutation } from "@/lib/offline/sync-engine";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AllocateVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unallocatedGifts: WeddingGift[];
  unpaidPayments: { payment: ItemPayment; item?: BudgetItem }[];
  onSuccess: () => Promise<void>;
}

export function AllocateVendorDialog({
  open,
  onOpenChange,
  unallocatedGifts,
  unpaidPayments,
  onSuccess,
}: AllocateVendorDialogProps) {
  const queryClient = useQueryClient();

  const [selectedPaymentIds, setSelectedPaymentIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const workspaceId =
    unallocatedGifts[0]?.workspace_id ||
    unpaidPayments[0]?.payment.workspace_id ||
    "";

  const availablePool = useMemo(
    () =>
      unallocatedGifts
        .filter((g) => g.gift_type !== "PHYSICAL")
        .reduce((sum, g) => sum + (Number(g.amount) || 0), 0),
    [unallocatedGifts]
  );

  const selectedTotal = useMemo(
    () =>
      unpaidPayments
        .filter((u) => selectedPaymentIds.includes(u.payment.id))
        .reduce((sum, u) => sum + (Number(u.payment.amount) || 0), 0),
    [unpaidPayments, selectedPaymentIds]
  );

  const togglePayment = (id: string) => {
    setSelectedPaymentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirm = async () => {
    if (!workspaceId) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const today = new Date().toISOString().split("T")[0];
      let anyOnline = false;

      for (const paymentId of selectedPaymentIds) {
        const { queued } = await executeOfflineFirstMutation({
          workspaceId,
          table: "item_payments",
          operation: "UPDATE",
          recordId: paymentId,
          payload: {
            is_paid: true,
            paid_date: today,
            funding: "ANGPAO",
          },
          queryClient,
        });
        if (!queued) anyOnline = true;
      }

      const cashGiftIds = unallocatedGifts
        .filter((g) => g.gift_type !== "PHYSICAL")
        .map((g) => g.id);

      for (const giftId of cashGiftIds) {
        const { queued } = await executeOfflineFirstMutation({
          workspaceId,
          table: "wedding_gifts",
          operation: "UPDATE",
          recordId: giftId,
          payload: { allocated_to: "WEDDING_COVER" },
          queryClient,
        });
        if (!queued) anyOnline = true;
      }

      setSelectedPaymentIds([]);
      if (anyOnline) await onSuccess();
      onOpenChange(false);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Gagal mengalokasikan dana angpao ke tagihan vendor."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Alokasikan Angpao ke Tagihan Vendor</DialogTitle>
          <DialogDescription>
            Pilih termin vendor yang ingin langsung dilunasi dengan sumber dana{" "}
            <strong>Angpao</strong>, atau tandai seluruh saldo bebas untuk menutup
            biaya pernikahan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {errorMsg && (
            <p className="rounded-xl border border-terracotta/30 bg-terracotta-50 px-3 py-2 text-xs text-terracotta-800">
              {errorMsg}
            </p>
          )}

          <div className="rounded-2xl bg-cream-50 border border-sage/12 p-3.5 flex items-center justify-between text-xs">
            <div>
              <p className="text-sage-600">Saldo Angpao Tersedia</p>
              <p className="text-base font-bold text-sage-900">
                {formatIDR(availablePool)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sage-600">Dipilih untuk Dilunasi</p>
              <p
                className={`text-base font-bold ${
                  selectedTotal > availablePool
                    ? "text-terracotta-700"
                    : "text-sage-800"
                }`}
              >
                {formatIDR(selectedTotal)}
              </p>
            </div>
          </div>

          {unpaidPayments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-sage/20 p-5 text-center space-y-1.5">
              <ReceiptText className="h-6 w-6 text-sage-400 mx-auto" />
              <p className="text-xs font-semibold text-sage-800">
                Tidak ada termin vendor yang belum lunas
              </p>
              <p className="text-[11px] text-sage-600">
                Anda tetap bisa menandai saldo angpao sebagai dana penutup biaya
                pernikahan, atau kirim ke Dompet Honeymoon.
              </p>
            </div>
          ) : (
            <div className="-mx-1 space-y-2 max-h-60 overflow-y-auto px-1 py-0.5">
              {unpaidPayments.map(({ payment, item }) => {
                const checked = selectedPaymentIds.includes(payment.id);
                return (
                  <button
                    key={payment.id}
                    type="button"
                    onClick={() => togglePayment(payment.id)}
                    className={`w-full text-left flex items-center justify-between gap-3 rounded-2xl border p-3 transition-all ${
                      checked
                        ? "border-sage bg-sage-50/80 shadow-sm"
                        : "border-sage/12 bg-white hover:bg-cream-50"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                          checked
                            ? "border-sage bg-sage text-white"
                            : "border-sage/30 bg-white"
                        }`}
                      >
                        {checked && <Check className="h-3.5 w-3.5" />}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-sage-900 truncate">
                          {payment.label}
                          {item ? ` — ${item.title}` : ""}
                        </p>
                        {payment.due_date && (
                          <p className="text-[11px] text-sage-600">
                            Jatuh tempo:{" "}
                            {new Date(payment.due_date).toLocaleDateString(
                              "id-ID",
                              { day: "numeric", month: "short", year: "numeric" }
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-sage-900 shrink-0">
                      {formatIDR(Number(payment.amount))}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {selectedTotal > availablePool && (
            <p className="text-[11px] text-terracotta-700">
              Catatan: Total termin terpilih melebihi saldo angpao bebas saat ini,
              tetapi Anda tetap bisa melanjutkan jika kekurangan ditutup dari
              tabungan pribadi.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="sage"
            disabled={submitting || unallocatedGifts.length === 0}
            onClick={handleConfirm}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                {selectedPaymentIds.length > 0
                  ? `Lunasi ${selectedPaymentIds.length} Termin & Alokasi`
                  : "Alokasikan ke Biaya Nikah"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
