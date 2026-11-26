"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Banknote,
  Edit3,
  Gift,
  Landmark,
  Loader2,
  Package,
  Plane,
  Plus,
  ReceiptText,
  Search,
  Sparkles,
} from "lucide-react";
import type { WorkspaceBundle } from "@/lib/workspace-data";
import { fetchWorkspaceBundleOfflineFirst } from "@/lib/offline/query-helpers";
import {
  executeOfflineFirstMutation,
  saveWorkspaceSnapshot,
} from "@/lib/offline/sync-engine";
import { useWorkspaceRealtime } from "@/hooks/use-workspace-realtime";
import { useAppStore } from "@/store/use-app-store";
import { formatIDR } from "@/lib/utils";
import type { GiftAllocation, GiftType, WeddingGift } from "@/types/database";
import { SyncStatusBadge } from "@/components/dashboard/sync-status-badge";
import { GiftDialog } from "@/components/angpao/gift-dialog";
import { AllocateVendorDialog } from "@/components/angpao/allocate-vendor-dialog";
import { BotanicalCorner } from "@/components/brand/botanical-accent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface AngpaoClientProps {
  initialBundle: WorkspaceBundle;
}

const GIFT_TYPE_META: Record<
  GiftType,
  { label: string; icon: typeof Banknote; badgeClass: string }
> = {
  CASH: {
    label: "Tunai",
    icon: Banknote,
    badgeClass: "bg-sage-50 text-sage-800 border-sage/20",
  },
  TRANSFER: {
    label: "Transfer",
    icon: Landmark,
    badgeClass: "bg-amberwarm-light text-sage-900 border-amberwarm/40",
  },
  PHYSICAL: {
    label: "Kado Fisik",
    icon: Package,
    badgeClass: "bg-terracotta-50 text-terracotta-800 border-terracotta/25",
  },
};

const ALLOC_META: Record<
  GiftAllocation,
  { label: string; badgeClass: string }
> = {
  UNALLOCATED: {
    label: "Belum Dialokasi",
    badgeClass: "bg-cream-200 text-sage-700",
  },
  WEDDING_COVER: {
    label: "Tutup Vendor",
    badgeClass: "bg-sage text-cream-50",
  },
  HONEYMOON_FUND: {
    label: "Dompet Honeymoon",
    badgeClass: "bg-terracotta text-white",
  },
};

export function AngpaoClient({ initialBundle }: AngpaoClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setMode = useAppStore((s) => s.setMode);

  const workspaceId = initialBundle.workspace.id;
  useWorkspaceRealtime(workspaceId);

  useEffect(() => {
    saveWorkspaceSnapshot(initialBundle);
  }, [initialBundle]);

  const { data: bundle = initialBundle } = useQuery({
    queryKey: ["workspace-data", workspaceId],
    queryFn: () => fetchWorkspaceBundleOfflineFirst(workspaceId, initialBundle),
    initialData: initialBundle,
  });

  const canAllocateHoneymoon = bundle.workspace.plan === "COMPLETE_PASS";

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<GiftType | "ALL">("ALL");
  const [allocFilter, setAllocFilter] = useState<GiftAllocation | "ALL">("ALL");

  // Dialogs & actions
  const [giftDialogOpen, setGiftDialogOpen] = useState(false);
  const [editingGift, setEditingGift] = useState<WeddingGift | null>(null);
  const [vendorAllocOpen, setVendorAllocOpen] = useState(false);
  const [allocatingHoneymoon, setAllocatingHoneymoon] = useState(false);
  const [quickUpdatingId, setQuickUpdatingId] = useState<string | null>(null);

  const refreshData = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["workspace-data", workspaceId],
    });
  };

  // Summary metrics
  const stats = useMemo(() => {
    let totalCash = 0;
    let unallocated = 0;
    let weddingCover = 0;
    let honeymoonFund = 0;
    let physicalCount = 0;

    for (const g of bundle.gifts) {
      const amt = Number(g.amount) || 0;
      if (g.gift_type === "PHYSICAL") {
        physicalCount += 1;
        continue;
      }
      totalCash += amt;
      if (g.allocated_to === "UNALLOCATED") unallocated += amt;
      else if (g.allocated_to === "WEDDING_COVER") weddingCover += amt;
      else if (g.allocated_to === "HONEYMOON_FUND") honeymoonFund += amt;
    }

    return {
      totalCash,
      unallocated,
      weddingCover,
      honeymoonFund,
      physicalCount,
      totalCount: bundle.gifts.length,
    };
  }, [bundle.gifts]);

  const unallocatedCashGifts = useMemo(
    () =>
      bundle.gifts.filter(
        (g) => g.gift_type !== "PHYSICAL" && g.allocated_to === "UNALLOCATED"
      ),
    [bundle.gifts]
  );

  const unpaidVendorPayments = useMemo(() => {
    const weddingItems = bundle.items.filter((i) => i.phase === "WEDDING");
    const itemMap = new Map(weddingItems.map((i) => [i.id, i]));
    return bundle.payments
      .filter((p) => !p.is_paid && itemMap.has(p.item_id))
      .map((p) => ({
        payment: p,
        item: itemMap.get(p.item_id),
      }));
  }, [bundle.items, bundle.payments]);

  const filteredGifts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return bundle.gifts.filter((g) => {
      if (typeFilter !== "ALL" && g.gift_type !== typeFilter) return false;
      if (allocFilter !== "ALL" && g.allocated_to !== allocFilter) return false;
      if (q) {
        const hit =
          g.sender_name.toLowerCase().includes(q) ||
          (g.notes || "").toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [bundle.gifts, searchQuery, typeFilter, allocFilter]);

  const handleBulkMoveToHoneymoon = async () => {
    if (!canAllocateHoneymoon || unallocatedCashGifts.length === 0) return;
    const confirmed = window.confirm(
      `Pindahkan seluruh saldo angpao bebas (${formatIDR(stats.unallocated)}) ke Dompet Honeymoon?`
    );
    if (!confirmed) return;

    setAllocatingHoneymoon(true);
    try {
      let anyOnline = false;
      for (const g of unallocatedCashGifts) {
        const { queued } = await executeOfflineFirstMutation({
          workspaceId,
          table: "wedding_gifts",
          operation: "UPDATE",
          recordId: g.id,
          payload: { allocated_to: "HONEYMOON_FUND" },
          queryClient,
        });
        if (!queued) anyOnline = true;
      }
      if (anyOnline) await refreshData();
    } finally {
      setAllocatingHoneymoon(false);
    }
  };

  const handleSingleAllocation = async (
    giftId: string,
    target: GiftAllocation
  ) => {
    setQuickUpdatingId(giftId);
    try {
      const { queued } = await executeOfflineFirstMutation({
        workspaceId,
        table: "wedding_gifts",
        operation: "UPDATE",
        recordId: giftId,
        payload: { allocated_to: target },
        queryClient,
      });
      if (!queued) await refreshData();
    } finally {
      setQuickUpdatingId(null);
    }
  };

  const goToHoneymoonDashboard = () => {
    setMode("HONEYMOON");
    router.push("/dashboard");
  };

  return (
    <div className="relative space-y-5 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-sage-900">
            Angpao &amp; Gift Bridge
          </h1>
          <SyncStatusBadge />
        </div>

        <Button
          type="button"
          size="sm"
          onClick={() => {
            setEditingGift(null);
            setGiftDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Catat Angpao / Kado
        </Button>
      </div>

      {/* Hero Summary Card (Warm Sage #3D5245) */}
      <Card className="relative overflow-hidden rounded-3xl border-0 bg-sage text-cream-50 shadow-soft">
        <BotanicalCorner
          className="absolute -bottom-6 -right-4 h-36 w-36 opacity-20"
          variant="terracotta"
        />
        <CardContent className="relative z-10 p-5 sm:p-6 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-cream-200/85">
                Total Pemasukan Angpao (Tunai &amp; Transfer)
              </p>
              <p className="text-3xl sm:text-4xl font-bold tracking-tight mt-1">
                {formatIDR(stats.totalCash)}
              </p>
              <p className="text-xs text-cream-200/80 mt-1">
                {stats.totalCount} catatan tercatat &bull; {stats.physicalCount}{" "}
                kado fisik
              </p>
            </div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-terracotta-200">
              <Gift className="h-6 w-6" />
            </span>
          </div>

          {/* 3 Bucket Breakdown */}
          <div className="grid grid-cols-3 gap-2 border-t border-white/15 pt-4">
            <div className="rounded-xl bg-white/10 px-3 py-2.5">
              <p className="text-[10px] text-cream-200/80">Belum Dialokasi</p>
              <p className="text-xs sm:text-sm font-bold truncate mt-0.5">
                {formatIDR(stats.unallocated)}
              </p>
            </div>
            <div className="rounded-xl bg-white/10 px-3 py-2.5">
              <p className="text-[10px] text-cream-200/80">Tutup Vendor</p>
              <p className="text-xs sm:text-sm font-bold truncate mt-0.5">
                {formatIDR(stats.weddingCover)}
              </p>
            </div>
            <div className="rounded-xl bg-white/10 px-3 py-2.5">
              <p className="text-[10px] text-cream-200/80">Ke Honeymoon</p>
              <p className="text-xs sm:text-sm font-bold text-terracotta-200 truncate mt-0.5">
                {formatIDR(stats.honeymoonFund)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Action Allocation Bridge */}
      {stats.unallocated > 0 && (
        <Card className="rounded-2xl border-terracotta/25 bg-terracotta-50/75">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-terracotta-800 inline-flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-terracotta" />
                  Aksi Cepat Jembatan Angpao
                </p>
                <p className="text-xs text-sage-700 mt-0.5">
                  Tersedia <strong>{formatIDR(stats.unallocated)}</strong> saldo
                  angpao bebas. Alokasikan langsung sekarang:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                type="button"
                variant="sage"
                size="sm"
                className="w-full"
                onClick={() => setVendorAllocOpen(true)}
              >
                <ReceiptText className="h-4 w-4" />
                Tutup Sisa Tagihan Vendor
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                className="w-full"
                disabled={!canAllocateHoneymoon || allocatingHoneymoon}
                onClick={handleBulkMoveToHoneymoon}
              >
                {allocatingHoneymoon ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plane className="h-4 w-4" />
                )}
                {canAllocateHoneymoon
                  ? "Kirim ke Dompet Honeymoon"
                  : "Honeymoon (Paket Complete)"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shortcut ke Dompet Honeymoon jika sudah ada dana honeymoon */}
      {canAllocateHoneymoon && stats.honeymoonFund > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-sage/12 bg-white px-4 py-3 text-xs">
          <span className="text-sage-700">
            <strong className="text-sage-900">
              {formatIDR(stats.honeymoonFund)}
            </strong>{" "}
            dari angpao sudah masuk ke Dompet Honeymoon!
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 text-xs text-terracotta-700 shrink-0"
            onClick={goToHoneymoonDashboard}
          >
            Lihat Dompet
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sage-500" />
          <Input
            placeholder="Cari nama pemberi amplop atau keterangan kado..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(["ALL", "CASH", "TRANSFER", "PHYSICAL"] as const).map((t) => {
            const active = typeFilter === t;
            const label = t === "ALL" ? "Semua Jenis" : GIFT_TYPE_META[t].label;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-semibold border transition-colors ${
                  active
                    ? "border-sage bg-sage text-white"
                    : "border-sage/15 bg-white text-sage-700 hover:bg-sage-50"
                }`}
              >
                {label}
              </button>
            );
          })}

          <span className="text-sage-300 px-0.5">|</span>

          {(
            ["ALL", "UNALLOCATED", "WEDDING_COVER", "HONEYMOON_FUND"] as const
          ).map((a) => {
            const active = allocFilter === a;
            const label = a === "ALL" ? "Semua Status" : ALLOC_META[a].label;
            return (
              <button
                key={a}
                type="button"
                onClick={() => setAllocFilter(a)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-semibold border transition-colors ${
                  active
                    ? "border-terracotta bg-terracotta text-white"
                    : "border-sage/15 bg-white text-sage-700 hover:bg-cream-100"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Gift List */}
      {filteredGifts.length === 0 ? (
        <Card className="rounded-3xl border-dashed border-sage/25 bg-white/85">
          <CardContent className="p-8 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cream-200 text-sage">
              <Gift className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-sage-900">
                Belum ada catatan angpao atau kado
              </p>
              <p className="text-xs text-sage-600 max-w-sm mx-auto">
                Catat pemasukan amplop &amp; kado bersama pasangan secara
                real-time, lalu alokasikan ke pelunasan vendor atau Dompet
                Honeymoon.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setEditingGift(null);
                setGiftDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Catat Angpao Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {filteredGifts.map((gift) => {
            const typeMeta = GIFT_TYPE_META[gift.gift_type];
            const TypeIcon = typeMeta.icon;
            const allocMeta = ALLOC_META[gift.allocated_to];
            const isPhysical = gift.gift_type === "PHYSICAL";

            return (
              <Card
                key={gift.id}
                className="rounded-2xl border-sage/12 bg-white shadow-sm"
              >
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span
                      className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${typeMeta.badgeClass}`}
                    >
                      <TypeIcon className="h-4.5 w-4.5" />
                    </span>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-sm font-bold text-sage-900 truncate">
                          {gift.sender_name}
                        </p>
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 px-2"
                        >
                          {typeMeta.label}
                        </Badge>
                        {!isPhysical && (
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${allocMeta.badgeClass}`}
                          >
                            {allocMeta.label}
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-bold text-sage-900">
                        {isPhysical
                          ? Number(gift.amount) > 0
                            ? `Kado Fisik (~${formatIDR(Number(gift.amount))})`
                            : "Kado Fisik"
                          : formatIDR(Number(gift.amount))}
                      </p>

                      {gift.notes && (
                        <p className="text-xs text-sage-600">{gift.notes}</p>
                      )}
                    </div>
                  </div>

                  {/* Per-item Quick Allocation & Edit */}
                  <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-center shrink-0">
                    {!isPhysical && gift.allocated_to === "UNALLOCATED" && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2.5 text-[11px]"
                          disabled={quickUpdatingId === gift.id}
                          onClick={() =>
                            handleSingleAllocation(gift.id, "WEDDING_COVER")
                          }
                        >
                          → Vendor
                        </Button>
                        {canAllocateHoneymoon && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 px-2.5 text-[11px] border-terracotta/30 text-terracotta-700 hover:bg-terracotta-50"
                            disabled={quickUpdatingId === gift.id}
                            onClick={() =>
                              handleSingleAllocation(gift.id, "HONEYMOON_FUND")
                            }
                          >
                            → Honeymoon
                          </Button>
                        )}
                      </>
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label={`Edit ${gift.sender_name}`}
                      onClick={() => {
                        setEditingGift(gift);
                        setGiftDialogOpen(true);
                      }}
                    >
                      <Edit3 className="h-4 w-4 text-sage-600" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <GiftDialog
        open={giftDialogOpen}
        onOpenChange={setGiftDialogOpen}
        workspaceId={workspaceId}
        gift={editingGift}
        canAllocateHoneymoon={canAllocateHoneymoon}
        onSuccess={refreshData}
      />

      <AllocateVendorDialog
        open={vendorAllocOpen}
        onOpenChange={setVendorAllocOpen}
        unallocatedGifts={unallocatedCashGifts}
        unpaidPayments={unpaidVendorPayments}
        onSuccess={refreshData}
      />
    </div>
  );
}
