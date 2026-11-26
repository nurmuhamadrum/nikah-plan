"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import type { GiftAllocation, GiftType, WeddingGift } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/use-app-store";
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

const AMOUNT_PRESETS = [100000, 200000, 500000, 1000000, 2000000];

interface GiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  gift: WeddingGift | null;
  canAllocateHoneymoon: boolean;
  onSuccess: () => Promise<void>;
}

export function GiftDialog({
  open,
  onOpenChange,
  workspaceId,
  gift,
  canAllocateHoneymoon,
  onSuccess,
}: GiftDialogProps) {
  const startSync = useAppStore((s) => s.startSync);
  const endSync = useAppStore((s) => s.endSync);

  const [senderName, setSenderName] = useState("");
  const [giftType, setGiftType] = useState<GiftType>("CASH");
  const [amount, setAmount] = useState("200000");
  const [allocatedTo, setAllocatedTo] = useState<GiftAllocation>("UNALLOCATED");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setErrorMsg(null);
      if (gift) {
        setSenderName(gift.sender_name);
        setGiftType(gift.gift_type);
        setAmount(String(Number(gift.amount) || 0));
        setAllocatedTo(gift.allocated_to);
        setNotes(gift.notes || "");
      } else {
        setSenderName("");
        setGiftType("CASH");
        setAmount("200000");
        setAllocatedTo("UNALLOCATED");
        setNotes("");
      }
    }
  }, [open, gift]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim()) return;

    setSaving(true);
    setErrorMsg(null);
    startSync();

    try {
      const supabase = createClient();
      const amountNum =
        giftType === "PHYSICAL"
          ? Math.max(0, Number(amount) || 0)
          : Math.max(0, Number(amount) || 0);

      const safeAllocation: GiftAllocation =
        giftType === "PHYSICAL"
          ? "UNALLOCATED"
          : allocatedTo === "HONEYMOON_FUND" && !canAllocateHoneymoon
            ? "UNALLOCATED"
            : allocatedTo;

      const payload = {
        sender_name: senderName.trim(),
        gift_type: giftType,
        amount: amountNum,
        allocated_to: safeAllocation,
        notes: notes.trim() || null,
      };

      if (gift) {
        const { error } = await supabase
          .from("wedding_gifts")
          .update(payload)
          .eq("id", gift.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("wedding_gifts").insert({
          workspace_id: workspaceId,
          ...payload,
        });
        if (error) throw error;
      }

      await onSuccess();
      onOpenChange(false);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal menyimpan data angpao."
      );
    } finally {
      endSync();
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!gift) return;
    const confirmed = window.confirm(
      `Hapus catatan hadiah dari "${gift.sender_name}"?`
    );
    if (!confirmed) return;

    setDeleting(true);
    setErrorMsg(null);
    startSync();

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("wedding_gifts")
        .delete()
        .eq("id", gift.id);
      if (error) throw error;
      await onSuccess();
      onOpenChange(false);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal menghapus catatan."
      );
    } finally {
      endSync();
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {gift ? "Edit Catatan Angpao / Kado" : "Catat Angpao / Hadiah Baru"}
          </DialogTitle>
          <DialogDescription>
            Catat amplop tunai, transfer, atau kado fisik dari tamu resepsi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          {errorMsg && (
            <p className="rounded-xl border border-terracotta/30 bg-terracotta-50 px-3 py-2 text-xs text-terracotta-800">
              {errorMsg}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="gift-sender">Nama Pemberi / Grup Tamu</Label>
            <Input
              id="gift-sender"
              required
              placeholder="Contoh: Keluarga Pak Budi / Teman Kantor IT"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { value: "CASH", label: "Tunai" },
                { value: "TRANSFER", label: "Transfer" },
                { value: "PHYSICAL", label: "Kado Fisik" },
              ] as { value: GiftType; label: string }[]
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setGiftType(opt.value);
                  if (opt.value === "PHYSICAL" && amount === "200000") {
                    setAmount("0");
                  }
                }}
                className={`rounded-xl py-2.5 text-xs font-semibold border transition-all ${
                  giftType === opt.value
                    ? "border-sage bg-sage text-white shadow-sm"
                    : "border-sage/15 bg-cream-50 text-sage-700 hover:bg-sage-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="gift-amount">
              {giftType === "PHYSICAL"
                ? "Estimasi Nilai Kado (Opsional, IDR)"
                : "Nominal Angpao (IDR)"}
            </Label>
            <Input
              id="gift-amount"
              type="number"
              min={0}
              step={10000}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {giftType !== "PHYSICAL" && (
              <div className="flex flex-wrap gap-1.5">
                {AMOUNT_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(String(preset))}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                      Number(amount) === preset
                        ? "bg-terracotta text-white"
                        : "bg-cream-200/80 text-sage-700 hover:bg-cream-300"
                    }`}
                  >
                    {preset >= 1000000
                      ? `Rp${preset / 1000000}jt`
                      : `Rp${preset / 1000}rb`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {giftType !== "PHYSICAL" && (
            <div className="space-y-2">
              <Label>Alokasi Dana</Label>
              <Select
                value={allocatedTo}
                onValueChange={(v) => setAllocatedTo(v as GiftAllocation)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNALLOCATED">
                    Belum Dialokasikan (Saldo Bebas)
                  </SelectItem>
                  <SelectItem value="WEDDING_COVER">
                    Tutup Tagihan Vendor Pernikahan
                  </SelectItem>
                  {canAllocateHoneymoon && (
                    <SelectItem value="HONEYMOON_FUND">
                      Masuk Dompet Honeymoon
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="gift-notes">Catatan / Keterangan Kado</Label>
            <Input
              id="gift-notes"
              placeholder={
                giftType === "PHYSICAL"
                  ? "Contoh: Air Fryer Philips 4L / Bedcover King"
                  : "Contoh: Amplop meja VIP / BCA an. Rina"
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter className="gap-2">
            {gift && (
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
              disabled={saving || deleting || !senderName.trim()}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Catatan"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
