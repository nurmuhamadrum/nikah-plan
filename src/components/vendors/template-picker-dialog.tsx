"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, CheckSquare, Loader2, Sparkles, Square } from "lucide-react";
import type { BudgetCategory, BudgetItem } from "@/types/database";
import { STANDARD_WEDDING_CATEGORIES } from "@/lib/wedding-templates";
import { executeOfflineFirstMutation } from "@/lib/offline/sync-engine";
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TemplatePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  categories: BudgetCategory[];
  existingItems: BudgetItem[];
  defaultCategoryId?: string;
  onSuccess: () => Promise<void> | void;
}

function findBestTemplateKey(categoryName?: string): string {
  if (!categoryName) return STANDARD_WEDDING_CATEGORIES[0].key;
  const lower = categoryName.toLowerCase();
  if (lower.includes("catering") || lower.includes("katering")) return "catering";
  if (lower.includes("venue") || lower.includes("gedung") || lower.includes("dekor"))
    return "venue_dekor";
  if (lower.includes("foto") || lower.includes("video") || lower.includes("dokum"))
    return "dokumentasi";
  if (lower.includes("busana") || lower.includes("gaun")) return "busana";
  if (lower.includes("mua") || lower.includes("make") || lower.includes("rias"))
    return "makeup";
  if (lower.includes("mc") || lower.includes("hibur") || lower.includes("enter") || lower.includes("musik"))
    return "entertainment";
  if (lower.includes("undang") || lower.includes("souvenir")) return "undangan_souvenir";
  if (lower.includes("transport") || lower.includes("mobil")) return "transportasi";
  if (lower.includes("bunga") || lower.includes("floral")) return "floral";
  return "lainnya";
}

export function TemplatePickerDialog({
  open,
  onOpenChange,
  workspaceId,
  categories,
  existingItems,
  defaultCategoryId,
  onSuccess,
}: TemplatePickerDialogProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const confirm = useConfirm();
  const [targetCategoryId, setTargetCategoryId] = useState<string>("");
  const [templateKey, setTemplateKey] = useState<string>(
    STANDARD_WEDDING_CATEGORIES[0].key
  );
  const [selectedTitles, setSelectedTitles] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErrorMsg(null);
    const initialCatId = defaultCategoryId || categories[0]?.id || "";
    setTargetCategoryId(initialCatId);
    const matchedCat = categories.find((c) => c.id === initialCatId);
    setTemplateKey(findBestTemplateKey(matchedCat?.name));
    setSelectedTitles([]);
  }, [open, defaultCategoryId, categories]);

  const existingTitleSet = useMemo(() => {
    return new Set(existingItems.map((i) => i.title.trim().toLowerCase()));
  }, [existingItems]);

  const activeTemplate = useMemo(
    () =>
      STANDARD_WEDDING_CATEGORIES.find((t) => t.key === templateKey) ??
      STANDARD_WEDDING_CATEGORIES[0],
    [templateKey]
  );

  const availableItems = useMemo(
    () =>
      activeTemplate.defaultItems.filter(
        (title) => !existingTitleSet.has(title.toLowerCase())
      ),
    [activeTemplate, existingTitleSet]
  );

  const toggleTitle = (title: string) => {
    setSelectedTitles((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const handleToggleAll = () => {
    if (selectedTitles.length === availableItems.length) {
      setSelectedTitles([]);
    } else {
      setSelectedTitles([...availableItems]);
    }
  };

  const handleTemplateChange = (nextKey: string) => {
    setTemplateKey(nextKey);
    setSelectedTitles([]);
  };

  const handleSubmit = async () => {
    if (!targetCategoryId || selectedTitles.length === 0) return;
    const targetCatName =
      categories.find((c) => c.id === targetCategoryId)?.name || "kategori terpilih";
    const ok = await confirm({
      title: `Tambahkan ${selectedTitles.length} Item Template?`,
      description: `${selectedTitles.length} sub-item dari "${activeTemplate.name}" akan dimasukkan ke kategori "${targetCatName}".`,
      confirmLabel: "Ya, Tambahkan",
    });
    if (!ok) return;

    setSaving(true);
    setErrorMsg(null);

    try {
      let anyOnline = false;
      for (const title of selectedTitles) {
        const { queued } = await executeOfflineFirstMutation({
          workspaceId,
          table: "budget_items",
          operation: "INSERT",
          payload: {
            workspace_id: workspaceId,
            category_id: targetCategoryId,
            phase: "WEDDING",
            title,
            estimated_cost: 0,
            deal_cost: 0,
            currency: "IDR",
            foreign_amount: null,
            vendor_contact: null,
            notes: `Ditambahkan dari Template ${activeTemplate.name}`,
            is_booked: false,
          },
          queryClient,
        });
        if (!queued) anyOnline = true;
      }

      if (anyOnline) {
        await onSuccess();
        toast.success(
          `${selectedTitles.length} item template ditambahkan`,
          `Berhasil dimasukkan ke kategori "${targetCatName}".`
        );
      } else {
        toast.warning(
          `${selectedTitles.length} item disimpan di antrean offline`,
          "Akan disinkronkan otomatis saat kembali online."
        );
      }
      onOpenChange(false);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Gagal menambahkan item template.";
      setErrorMsg(msg);
      toast.error("Gagal menambahkan template", msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[88vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-sage-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-terracotta" />
            Muat Template 51 Sub-Item Pernikahan
          </DialogTitle>
          <DialogDescription>
            Pilih rincian item siap pakai tanpa perlu mengetik dari awal. Item
            yang sudah ada di daftar Anda otomatis ditandai.
          </DialogDescription>
        </DialogHeader>

        <div className="-mx-1 space-y-4 overflow-y-auto px-1 py-1">
          {errorMsg && (
            <div className="rounded-xl border border-terracotta/30 bg-terracotta-50 px-3 py-2 text-xs text-terracotta-800">
              {errorMsg}
            </div>
          )}

          {/* Pilih Kategori Tujuan di Workspace */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Masukkan ke Kategori Anda</Label>
              <Select
                value={targetCategoryId}
                onValueChange={(val) => {
                  setTargetCategoryId(val);
                  const cat = categories.find((c) => c.id === val);
                  if (cat) {
                    setTemplateKey(findBestTemplateKey(cat.name));
                    setSelectedTitles([]);
                  }
                }}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Pilih kategori..." />
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

            <div className="space-y-1.5">
              <Label className="text-xs">Kelompok Template Referensi</Label>
              <Select value={templateKey} onValueChange={handleTemplateChange}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STANDARD_WEDDING_CATEGORIES.map((tpl) => (
                    <SelectItem key={tpl.key} value={tpl.key}>
                      {tpl.name} ({tpl.defaultItems.length})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-xl border border-sage/12 bg-sage-50/70 px-3 py-2 text-[11px] text-sage-700">
            <strong className="text-sage-900">Tips: </strong>
            {activeTemplate.recommendation}
          </div>

          {/* Daftar Checklist Item */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-sage-800">
                Sub-Item {activeTemplate.name} ({selectedTitles.length} dipilih)
              </p>
              {availableItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleToggleAll}
                  className="text-xs font-semibold text-terracotta hover:underline"
                >
                  {selectedTitles.length === availableItems.length
                    ? "Batal Pilih Semua"
                    : `Pilih Semua (${availableItems.length})`}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeTemplate.defaultItems.map((title) => {
                const alreadyExists = existingTitleSet.has(title.toLowerCase());
                const checked = selectedTitles.includes(title);

                return (
                  <button
                    key={title}
                    type="button"
                    disabled={alreadyExists || saving}
                    onClick={() => toggleTitle(title)}
                    className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-xs transition-all ${
                      alreadyExists
                        ? "border-sage/10 bg-cream-100/70 text-sage-400 cursor-not-allowed"
                        : checked
                          ? "border-sage bg-sage-50 text-sage-900 font-semibold shadow-sm"
                          : "border-sage/15 bg-white text-sage-800 hover:border-sage/35"
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      {alreadyExists ? (
                        <Check className="h-3.5 w-3.5 text-sage-400 shrink-0" />
                      ) : checked ? (
                        <CheckSquare className="h-3.5 w-3.5 text-sage shrink-0" />
                      ) : (
                        <Square className="h-3.5 w-3.5 text-sage-400 shrink-0" />
                      )}
                      <span className="truncate">{title}</span>
                    </span>
                    {alreadyExists && (
                      <span className="text-[10px] rounded-full bg-cream-200 px-1.5 py-0.5 shrink-0">
                        Ada
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Batal
          </Button>
          <Button
            type="button"
            disabled={saving || selectedTitles.length === 0 || !targetCategoryId}
            onClick={handleSubmit}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menambahkan...
              </>
            ) : (
              `Tambahkan ${selectedTitles.length} Item`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
