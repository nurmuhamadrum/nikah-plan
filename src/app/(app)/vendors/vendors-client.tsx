"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Edit3,
  FolderPlus,
  Paperclip,
  Phone,
  Plus,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { WorkspaceBundle } from "@/lib/workspace-data";
import { fetchWorkspaceBundleOfflineFirst } from "@/lib/offline/query-helpers";
import {
  executeOfflineFirstMutation,
  saveWorkspaceSnapshot,
} from "@/lib/offline/sync-engine";
import { useToast } from "@/components/providers/toast-provider";
import { useWorkspaceRealtime } from "@/hooks/use-workspace-realtime";
import { formatIDR } from "@/lib/utils";
import {
  CategoryIconBadge,
  FUNDING_SOURCE_META,
} from "@/lib/category-icons";
import type {
  BudgetCategory,
  BudgetItem,
  FundingSource,
  ItemPayment,
} from "@/types/database";
import { SyncStatusBadge } from "@/components/dashboard/sync-status-badge";
import { CategoryDialog } from "@/components/vendors/category-dialog";
import { VendorDialog } from "@/components/vendors/vendor-dialog";
import { PaymentDialog } from "@/components/vendors/payment-dialog";
import { ReceiptPreviewDialog } from "@/components/vendors/receipt-preview-dialog";
import { TemplatePickerDialog } from "@/components/vendors/template-picker-dialog";
import { getBudgetHealthStatus } from "@/lib/budget-insights";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

interface VendorsClientProps {
  initialBundle: WorkspaceBundle;
  initialCategoryId?: string;
  openNewVendorOnMount?: boolean;
}

function buildWhatsAppLink(contact: string): string | null {
  const digits = contact.replace(/[^\d+]/g, "");
  if (digits.length < 8) return null;
  let normalized = digits.replace(/^\+/, "");
  if (normalized.startsWith("0")) {
    normalized = `62${normalized.slice(1)}`;
  }
  return `https://wa.me/${normalized}`;
}

export function VendorsClient({
  initialBundle,
  initialCategoryId,
  openNewVendorOnMount = false,
}: VendorsClientProps) {
  const queryClient = useQueryClient();
  const toast = useToast();

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

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialCategoryId || "ALL"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [fundingFilter, setFundingFilter] = useState<FundingSource | "ALL">(
    "ALL"
  );
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {}
  );

  // Dialog states
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(
    null
  );

  const [vendorDialogOpen, setVendorDialogOpen] = useState(
    openNewVendorOnMount
  );
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<BudgetItem | null>(null);

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentTargetItem, setPaymentTargetItem] = useState<BudgetItem | null>(
    null
  );
  const [editingPayment, setEditingPayment] = useState<ItemPayment | null>(
    null
  );

  const [receiptPreview, setReceiptPreview] = useState<{
    open: boolean;
    path: string | null;
    title: string;
  }>({ open: false, path: null, title: "" });

  const refreshData = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["workspace-data", workspaceId],
    });
  };

  const weddingCategories = useMemo(
    () => bundle.categories.filter((c) => c.phase === "WEDDING"),
    [bundle.categories]
  );

  const weddingItems = useMemo(
    () => bundle.items.filter((i) => i.phase === "WEDDING"),
    [bundle.items]
  );

  const paymentsByItem = useMemo(() => {
    const map = new Map<string, ItemPayment[]>();
    for (const p of bundle.payments) {
      const list = map.get(p.item_id) ?? [];
      list.push(p);
      map.set(p.item_id, list);
    }
    return map;
  }, [bundle.payments]);

  const categoryMap = useMemo(
    () => new Map(weddingCategories.map((c) => [c.id, c])),
    [weddingCategories]
  );

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return weddingItems.filter((item) => {
      if (selectedCategory !== "ALL" && item.category_id !== selectedCategory) {
        return false;
      }
      if (q) {
        const catName = categoryMap.get(item.category_id)?.name || "";
        const match =
          item.title.toLowerCase().includes(q) ||
          catName.toLowerCase().includes(q) ||
          (item.notes || "").toLowerCase().includes(q);
        if (!match) return false;
      }
      if (fundingFilter !== "ALL") {
        const itemPays = paymentsByItem.get(item.id) ?? [];
        if (!itemPays.some((p) => p.funding === fundingFilter)) {
          return false;
        }
      }
      return true;
    });
  }, [
    weddingItems,
    selectedCategory,
    searchQuery,
    fundingFilter,
    categoryMap,
    paymentsByItem,
  ]);

  // Summary KPIs
  const summary = useMemo(() => {
    let totalEstimated = 0;
    let totalDeal = 0;
    let totalPaid = 0;

    for (const item of filteredItems) {
      totalEstimated += Number(item.estimated_cost) || 0;
      totalDeal += Number(item.deal_cost) || Number(item.estimated_cost) || 0;
      const pays = paymentsByItem.get(item.id) ?? [];
      for (const p of pays) {
        if (p.is_paid) totalPaid += Number(p.amount) || 0;
      }
    }

    return {
      totalEstimated,
      totalDeal,
      totalPaid,
      diff: totalDeal - totalEstimated,
    };
  }, [filteredItems, paymentsByItem]);

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: prev[itemId] === undefined ? false : !prev[itemId],
    }));
  };

  const handleTogglePaymentPaid = async (payment: ItemPayment) => {
    const nextPaid = !payment.is_paid;
    const today = new Date().toISOString().split("T")[0];
    try {
      const { queued } = await executeOfflineFirstMutation({
        workspaceId,
        table: "item_payments",
        operation: "UPDATE",
        recordId: payment.id,
        payload: {
          is_paid: nextPaid,
          paid_date: nextPaid ? payment.paid_date || today : null,
        },
        queryClient,
      });
      if (!queued) {
        await refreshData();
        toast.success(
          nextPaid ? "Termin ditandai lunas" : "Status lunas dibatalkan",
          `"${payment.label}" (${formatIDR(Number(payment.amount) || 0)}).`
        );
      } else {
        toast.warning(
          "Status termin disimpan di antrean offline",
          `"${payment.label}" akan disinkronkan saat online.`
        );
      }
    } catch (err) {
      toast.error(
        "Gagal memperbarui status termin",
        err instanceof Error ? err.message : "Silakan coba lagi."
      );
    }
  };

  const activeCategoryObj =
    selectedCategory !== "ALL" ? categoryMap.get(selectedCategory) ?? null : null;

  return (
    <div className="space-y-5 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-sage-900">
            Vendor &amp; Termin
          </h1>
          <SyncStatusBadge />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={weddingCategories.length === 0}
            onClick={() => setTemplateDialogOpen(true)}
          >
            <Sparkles className="h-3.5 w-3.5 text-terracotta" />
            Template Item
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingCategory(null);
              setCatDialogOpen(true);
            }}
          >
            <FolderPlus className="h-4 w-4" />
            Kategori
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={weddingCategories.length === 0}
            onClick={() => {
              setEditingVendor(null);
              setVendorDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Tambah Vendor
          </Button>
        </div>
      </div>

      {/* Ringkasan Estimasi vs Deal vs Aktual */}
      <div className="grid grid-cols-3 gap-2.5">
        <Card className="glass-strong rounded-2xl">
          <CardContent className="p-3.5">
            <p className="text-[11px] font-medium text-sage-600">
              Estimasi Awal
            </p>
            <p className="text-sm sm:text-base font-bold text-sage-900 mt-0.5 truncate">
              {formatIDR(summary.totalEstimated)}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-sage/10 bg-white">
          <CardContent className="p-3.5">
            <p className="text-[11px] font-medium text-sage-600">
              Harga Deal
            </p>
            <p className="text-sm sm:text-base font-bold text-terracotta-700 mt-0.5 truncate">
              {formatIDR(summary.totalDeal)}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-sage/10 bg-white">
          <CardContent className="p-3.5">
            <p className="text-[11px] font-medium text-sage-600">
              Sudah Dibayar
            </p>
            <p className="text-sm sm:text-base font-bold text-sage-800 mt-0.5 truncate">
              {formatIDR(summary.totalPaid)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Horizontal Category Pills */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory("ALL")}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
              selectedCategory === "ALL"
                ? "bg-sage text-cream-50 shadow-sm"
                : "bg-white border border-sage/15 text-sage-700 hover:bg-sage-50"
            }`}
          >
            Semua ({weddingItems.length})
          </button>

          {weddingCategories.map((cat) => {
            const count = weddingItems.filter(
              (i) => i.category_id === cat.id
            ).length;
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                  active
                    ? "bg-sage text-cream-50 shadow-sm"
                    : "bg-white border border-sage/15 text-sage-700 hover:bg-sage-50"
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Active Category Header Bar (with health status & quick edit category button) */}
        {activeCategoryObj && (() => {
          const catHealth = getBudgetHealthStatus(
            Math.max(summary.totalDeal, summary.totalPaid),
            Number(activeCategoryObj.allocated_amount) || 0
          );
          return (
          <div className="flex items-center justify-between gap-2 rounded-2xl border border-sage/12 bg-sage-50/70 px-4 py-2.5 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <CategoryIconBadge
                iconKey={activeCategoryObj.icon}
                className="h-8 w-8"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="font-bold text-sage-900 truncate">
                    {activeCategoryObj.name}
                  </p>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${catHealth.badgeClass}`}
                  >
                    {catHealth.shortLabel}
                    {Number(activeCategoryObj.allocated_amount) > 0
                      ? ` • ${catHealth.usagePct}%`
                      : ""}
                  </span>
                </div>
                <p className="text-sage-600">
                  Target alokasi:{" "}
                  <strong className="tabular-nums">
                    {formatIDR(Number(activeCategoryObj.allocated_amount) || 0)}
                  </strong>
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs shrink-0"
              onClick={() => {
                setEditingCategory(activeCategoryObj);
                setCatDialogOpen(true);
              }}
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit Pos
            </Button>
          </div>
          );
        })()}
      </div>

      {/* Search + Funding Source Filter */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sage-500" />
          <Input
            placeholder="Cari nama vendor, catatan, atau kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {(["ALL", "JOINT", "GROOM_FAMILY", "BRIDE_FAMILY", "ANGPAO"] as const).map(
            (key) => {
              const active = fundingFilter === key;
              const label =
                key === "ALL" ? "Semua Dana" : FUNDING_SOURCE_META[key].label;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFundingFilter(key)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold border transition-colors ${
                    active
                      ? "border-terracotta bg-terracotta text-white"
                      : "border-sage/15 bg-white text-sage-700 hover:bg-cream-100"
                  }`}
                >
                  {label}
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Vendor Items List */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          tone="terracotta"
          title="Belum ada vendor di tampilan ini"
          description="Tambahkan vendor pertama Anda untuk membandingkan estimasi awal vs harga deal serta mencatat termin DP & bukti bayar."
          action={
            <>
              <Button
                type="button"
                size="sm"
                disabled={weddingCategories.length === 0}
                onClick={() => {
                  setEditingVendor(null);
                  setVendorDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Tambah Vendor Sekarang
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={weddingCategories.length === 0}
                onClick={() => setTemplateDialogOpen(true)}
              >
                <Sparkles className="h-3.5 w-3.5 text-terracotta" />
                Muat Template 51 Item
              </Button>
            </>
          }
        />
      ) : (
        <div className="space-y-3.5">
          {filteredItems.map((item) => {
            const cat = categoryMap.get(item.category_id);
            const itemPayments = paymentsByItem.get(item.id) ?? [];
            const est = Number(item.estimated_cost) || 0;
            const deal = Number(item.deal_cost) || 0;
            const effectiveTotal = deal > 0 ? deal : est;
            const paidSum = itemPayments
              .filter((p) => p.is_paid)
              .reduce((s, p) => s + (Number(p.amount) || 0), 0);
            const remainingPay = Math.max(0, effectiveTotal - paidSum);
            const variance = deal > 0 && est > 0 ? deal - est : 0;
            const isExpanded = expandedItems[item.id] ?? true;
            const waLink = item.vendor_contact
              ? buildWhatsAppLink(item.vendor_contact)
              : null;

            return (
              <Card
                key={item.id}
                className="rounded-3xl border-sage/12 bg-white overflow-hidden shadow-card"
              >
                <CardContent className="p-4 sm:p-5 space-y-3.5">
                  {/* Top Row: Title, Category, Status & Edit */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <CategoryIconBadge
                        iconKey={cat?.icon}
                        className="h-10 w-10 mt-0.5"
                      />
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="text-base font-bold text-sage-900 leading-snug">
                            {item.title}
                          </h3>
                          {item.is_booked && (
                            <Badge variant="softSage" className="text-[10px] py-0.5 px-2">
                              Booked
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-sage-600">
                          <span>{cat?.name || "Kategori"}</span>
                          {item.vendor_contact && (
                            <>
                              <span>&bull;</span>
                              {waLink ? (
                                <a
                                  href={waLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 font-medium text-sage-800 hover:text-terracotta underline-offset-2 hover:underline"
                                >
                                  <Phone className="h-3 w-3" />
                                  {item.vendor_contact}
                                </a>
                              ) : (
                                <span>{item.vendor_contact}</span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label={`Edit ${item.title}`}
                        onClick={() => {
                          setEditingVendor(item);
                          setVendorDialogOpen(true);
                        }}
                      >
                        <Edit3 className="h-4 w-4 text-sage-600" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Toggle termin"
                        onClick={() => toggleExpand(item.id)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-sage-600" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-sage-600" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Estimasi Awal vs Harga Deal + Selisih */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 rounded-2xl bg-cream-50 border border-sage/8 p-3 text-xs">
                    <div>
                      <p className="text-[10px] text-sage-600">Estimasi Awal</p>
                      <p className="font-semibold text-sage-800 mt-0.5">
                        {formatIDR(est)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-sage-600">Harga Deal</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="font-bold text-sage-900">
                          {deal > 0 ? formatIDR(deal) : "Belum deal"}
                        </p>
                        {variance !== 0 && (
                          <span
                            className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                              variance < 0
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-terracotta-50 text-terracotta-700"
                            }`}
                          >
                            {variance < 0 ? (
                              <TrendingDown className="h-2.5 w-2.5" />
                            ) : (
                              <TrendingUp className="h-2.5 w-2.5" />
                            )}
                            {variance < 0 ? "Hemat" : "+"}
                            {formatIDR(Math.abs(variance))}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 pt-2 sm:pt-0 border-sage/10">
                      <p className="text-[10px] text-sage-600">
                        Terbayar / Sisa
                      </p>
                      <p className="font-bold text-sage-900 mt-0.5">
                        {formatIDR(paidSum)}{" "}
                        <span className="font-normal text-sage-500">
                          / sisa {formatIDR(remainingPay)}
                        </span>
                      </p>
                    </div>
                  </div>

                  {item.notes && (
                    <p className="text-xs text-sage-600 italic px-1">
                      Catatan: {item.notes}
                    </p>
                  )}

                  {/* Multi-Termin Section */}
                  {isExpanded && (
                    <div className="space-y-2.5 pt-1 border-t border-sage/10">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-sage-800">
                          Jadwal Termin Pembayaran ({itemPayments.length})
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-3 text-[11px]"
                          onClick={() => {
                            setPaymentTargetItem(item);
                            setEditingPayment(null);
                            setPaymentDialogOpen(true);
                          }}
                        >
                          <Plus className="h-3 w-3" />
                          Tambah Termin
                        </Button>
                      </div>

                      {itemPayments.length === 0 ? (
                        <p className="text-xs text-sage-500 py-1.5">
                          Belum ada termin dicatat. Klik &ldquo;Tambah Termin&rdquo;
                          untuk menjadwalkan Booking Fee, DP, atau Pelunasan.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {itemPayments.map((pay) => {
                            const fundMeta = FUNDING_SOURCE_META[pay.funding];
                            return (
                              <div
                                key={pay.id}
                                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-2xl border p-3 transition-colors ${
                                  pay.is_paid
                                    ? "border-sage/15 bg-sage-50/40"
                                    : "border-sage/12 bg-white"
                                }`}
                              >
                                <div className="flex items-start gap-2.5 min-w-0">
                                  <button
                                    type="button"
                                    onClick={() => handleTogglePaymentPaid(pay)}
                                    className="mt-0.5 shrink-0 text-sage hover:scale-110 transition-transform"
                                    title={
                                      pay.is_paid
                                        ? "Tandai belum lunas"
                                        : "Tandai sudah lunas"
                                    }
                                  >
                                    {pay.is_paid ? (
                                      <CheckCircle2 className="h-5 w-5 text-sage" />
                                    ) : (
                                      <Circle className="h-5 w-5 text-sage-300" />
                                    )}
                                  </button>

                                  <div className="min-w-0 space-y-1">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span
                                        className={`text-sm font-semibold ${
                                          pay.is_paid
                                            ? "line-through text-sage-600"
                                            : "text-sage-900"
                                        }`}
                                      >
                                        {pay.label}
                                      </span>
                                      <span
                                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${fundMeta.badgeClass}`}
                                      >
                                        {fundMeta.label}
                                      </span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-sage-600">
                                      <span className="font-bold text-sage-900">
                                        {formatIDR(Number(pay.amount))}
                                      </span>
                                      {pay.due_date && (
                                        <span className="inline-flex items-center gap-1">
                                          <Calendar className="h-3 w-3" />
                                          Jatuh tempo:{" "}
                                          {new Date(
                                            pay.due_date
                                          ).toLocaleDateString("id-ID", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                          })}
                                        </span>
                                      )}
                                      {pay.is_paid && pay.paid_date && (
                                        <span className="text-emerald-700 font-medium">
                                          &bull; Lunas{" "}
                                          {new Date(
                                            pay.paid_date
                                          ).toLocaleDateString("id-ID", {
                                            day: "numeric",
                                            month: "short",
                                          })}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                                  {pay.receipt_url && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-7 px-2.5 text-[11px]"
                                      onClick={() =>
                                        setReceiptPreview({
                                          open: true,
                                          path: pay.receipt_url,
                                          title: `${pay.label} — ${item.title}`,
                                        })
                                      }
                                    >
                                      <Paperclip className="h-3 w-3 text-terracotta" />
                                      Bukti
                                    </Button>
                                  )}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2.5 text-[11px]"
                                    onClick={() => {
                                      setPaymentTargetItem(item);
                                      setEditingPayment(pay);
                                      setPaymentDialogOpen(true);
                                    }}
                                  >
                                    Edit
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <CategoryDialog
        open={catDialogOpen}
        onOpenChange={setCatDialogOpen}
        workspaceId={workspaceId}
        category={editingCategory}
        nextSortOrder={weddingCategories.length + 1}
        onSuccess={refreshData}
      />

      <VendorDialog
        open={vendorDialogOpen}
        onOpenChange={setVendorDialogOpen}
        workspaceId={workspaceId}
        categories={weddingCategories}
        defaultCategoryId={
          selectedCategory !== "ALL" ? selectedCategory : undefined
        }
        item={editingVendor}
        onSuccess={refreshData}
      />

      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        workspaceId={workspaceId}
        item={paymentTargetItem}
        payment={editingPayment}
        onSuccess={refreshData}
      />

      <ReceiptPreviewDialog
        open={receiptPreview.open}
        onOpenChange={(open) =>
          setReceiptPreview((prev) => ({ ...prev, open }))
        }
        receiptPath={receiptPreview.path}
        title={receiptPreview.title}
      />

      <TemplatePickerDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        workspaceId={workspaceId}
        categories={weddingCategories}
        existingItems={weddingItems}
        defaultCategoryId={
          selectedCategory !== "ALL" ? selectedCategory : undefined
        }
        onSuccess={refreshData}
      />
    </div>
  );
}
