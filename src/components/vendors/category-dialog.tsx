"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import type { BudgetCategory } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { CATEGORY_ICON_OPTIONS } from "@/lib/category-icons";
import { useAppStore } from "@/store/use-app-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  category: BudgetCategory | null;
  nextSortOrder: number;
  onSuccess: () => Promise<void>;
}

export function CategoryDialog({
  open,
  onOpenChange,
  workspaceId,
  category,
  nextSortOrder,
  onSuccess,
}: CategoryDialogProps) {
  const startSync = useAppStore((s) => s.startSync);
  const endSync = useAppStore((s) => s.endSync);

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("utensils");
  const [allocatedAmount, setAllocatedAmount] = useState("10000000");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setErrorMsg(null);
      if (category) {
        setName(category.name);
        setIcon(category.icon || "utensils");
        setAllocatedAmount(String(Number(category.allocated_amount) || 0));
      } else {
        setName("");
        setIcon("utensils");
        setAllocatedAmount("10000000");
      }
    }
  }, [open, category]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setErrorMsg(null);
    startSync();

    try {
      const supabase = createClient();
      const amountNum = Math.max(0, Number(allocatedAmount) || 0);

      if (category) {
        const { error } = await supabase
          .from("budget_categories")
          .update({
            name: name.trim(),
            icon,
            allocated_amount: amountNum,
          })
          .eq("id", category.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("budget_categories").insert({
          workspace_id: workspaceId,
          phase: "WEDDING",
          name: name.trim(),
          icon,
          allocated_amount: amountNum,
          sort_order: nextSortOrder,
        });
        if (error) throw error;
      }

      await onSuccess();
      onOpenChange(false);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal menyimpan kategori."
      );
    } finally {
      endSync();
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!category) return;
    const confirmed = window.confirm(
      `Hapus kategori "${category.name}" beserta seluruh item vendor dan termin di dalamnya?`
    );
    if (!confirmed) return;

    setDeleting(true);
    setErrorMsg(null);
    startSync();

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("budget_categories")
        .delete()
        .eq("id", category.id);
      if (error) throw error;

      await onSuccess();
      onOpenChange(false);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal menghapus kategori."
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
            {category ? "Edit Kategori Anggaran" : "Tambah Kategori Baru"}
          </DialogTitle>
          <DialogDescription>
            Atur pos anggaran pernikahan agar pencatatan vendor lebih terstruktur.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          {errorMsg && (
            <p className="rounded-xl border border-terracotta/30 bg-terracotta-50 px-3 py-2 text-xs text-terracotta-800">
              {errorMsg}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="cat-name">Nama Kategori</Label>
            <Input
              id="cat-name"
              required
              placeholder="Contoh: Venue & Katering"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-alloc">Alokasi Target (IDR)</Label>
            <Input
              id="cat-alloc"
              type="number"
              min={0}
              step={500000}
              value={allocatedAmount}
              onChange={(e) => setAllocatedAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Pilih Ikon</Label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {CATEGORY_ICON_OPTIONS.slice(0, 12).map((opt) => {
                const Icon = opt.icon;
                const selected = icon === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    title={opt.label}
                    onClick={() => setIcon(opt.key)}
                    className={`flex h-11 items-center justify-center rounded-xl border transition-all ${
                      selected
                        ? "border-sage bg-sage text-white shadow-sm"
                        : "border-sage/15 bg-cream-50 text-sage-700 hover:bg-sage-50"
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter className="gap-2">
            {category && (
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
            <Button type="submit" disabled={saving || deleting || !name.trim()}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Kategori"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
