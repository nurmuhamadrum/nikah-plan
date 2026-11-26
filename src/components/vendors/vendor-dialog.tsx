"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import type { BudgetCategory, BudgetItem } from "@/types/database";
import { executeOfflineFirstMutation } from "@/lib/offline/sync-engine";
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

interface VendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  categories: BudgetCategory[];
  defaultCategoryId?: string;
  item: BudgetItem | null;
  onSuccess: () => Promise<void>;
}

export function VendorDialog({
  open,
  onOpenChange,
  workspaceId,
  categories,
  defaultCategoryId,
  item,
  onSuccess,
}: VendorDialogProps) {
  const queryClient = useQueryClient();

  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("0");
  const [dealCost, setDealCost] = useState("0");
  const [vendorContact, setVendorContact] = useState("");
  const [notes, setNotes] = useState("");
  const [isBooked, setIsBooked] = useState(false);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setErrorMsg(null);
      if (item) {
        setCategoryId(item.category_id);
        setTitle(item.title);
        setEstimatedCost(String(Number(item.estimated_cost) || 0));
        setDealCost(String(Number(item.deal_cost) || 0));
        setVendorContact(item.vendor_contact || "");
        setNotes(item.notes || "");
        setIsBooked(item.is_booked);
      } else {
        setCategoryId(defaultCategoryId || categories[0]?.id || "");
        setTitle("");
        setEstimatedCost("0");
        setDealCost("0");
        setVendorContact("");
        setNotes("");
        setIsBooked(false);
      }
    }
  }, [open, item, defaultCategoryId, categories]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !categoryId) return;

    setSaving(true);
    setErrorMsg(null);

    try {
      const payload = {
        category_id: categoryId,
        title: title.trim(),
        estimated_cost: Math.max(0, Number(estimatedCost) || 0),
        deal_cost: Math.max(0, Number(dealCost) || 0),
        vendor_contact: vendorContact.trim() || null,
        notes: notes.trim() || null,
        is_booked: isBooked,
      };

      const { queued } = item
        ? await executeOfflineFirstMutation({
            workspaceId,
            table: "budget_items",
            operation: "UPDATE",
            recordId: item.id,
            payload,
            queryClient,
          })
        : await executeOfflineFirstMutation({
            workspaceId,
            table: "budget_items",
            operation: "INSERT",
            payload: {
              workspace_id: workspaceId,
              phase: "WEDDING",
              currency: "IDR",
              foreign_amount: null,
              ...payload,
            },
            queryClient,
          });

      if (!queued) await onSuccess();
      onOpenChange(false);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal menyimpan data vendor."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    const confirmed = window.confirm(
      `Hapus vendor "${item.title}" beserta seluruh jadwal termin pembayarannya?`
    );
    if (!confirmed) return;

    setDeleting(true);
    setErrorMsg(null);

    try {
      const { queued } = await executeOfflineFirstMutation({
        workspaceId,
        table: "budget_items",
        operation: "DELETE",
        recordId: item.id,
        queryClient,
      });

      if (!queued) await onSuccess();
      onOpenChange(false);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal menghapus vendor."
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
            {item ? "Edit Item Vendor" : "Tambah Vendor / Item Baru"}
          </DialogTitle>
          <DialogDescription>
            Bandingkan estimasi awal dengan harga deal final dari vendor.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          {errorMsg && (
            <p className="rounded-xl border border-terracotta/30 bg-terracotta-50 px-3 py-2 text-xs text-terracotta-800">
              {errorMsg}
            </p>
          )}

          <div className="space-y-2">
            <Label>Kategori</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori anggaran" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor-title">Nama Vendor / Item Pengeluaran</Label>
            <Input
              id="vendor-title"
              required
              placeholder="Contoh: Katering Puspa 300 Pax / Dekorasi Pelaminan"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="est-cost">Estimasi Awal (IDR)</Label>
              <Input
                id="est-cost"
                type="number"
                min={0}
                step={100000}
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deal-cost">Harga Deal Vendor (IDR)</Label>
              <Input
                id="deal-cost"
                type="number"
                min={0}
                step={100000}
                value={dealCost}
                onChange={(e) => setDealCost(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor-contact">
              Kontak WhatsApp / PIC Vendor (Opsional)
            </Label>
            <Input
              id="vendor-contact"
              placeholder="Contoh: 081234567890 (Mba Rani)"
              value={vendorContact}
              onChange={(e) => setVendorContact(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor-notes">Catatan / Paket (Opsional)</Label>
            <textarea
              id="vendor-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Bonus stall, jam loading, syarat pelunasan..."
              className="w-full rounded-xl border border-sage/20 bg-white px-3.5 py-2.5 text-sm text-sage-900 placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/40"
            />
          </div>

          <label className="flex items-center gap-2.5 rounded-xl border border-sage/15 bg-cream-50 px-3.5 py-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={isBooked}
              onChange={(e) => setIsBooked(e.target.checked)}
              className="h-4 w-4 rounded accent-sage"
            />
            <span className="text-sm font-medium text-sage-900">
              Vendor sudah fix / booked
            </span>
          </label>

          <DialogFooter className="gap-2">
            {item && (
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
              disabled={saving || deleting || !title.trim() || !categoryId}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Vendor"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
