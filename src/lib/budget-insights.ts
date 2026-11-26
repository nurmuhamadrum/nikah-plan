import type {
  BudgetCategory,
  BudgetItem,
  ItemPayment,
  Workspace,
} from "@/types/database";
import { formatIDR } from "@/lib/utils";

export type BudgetHealthLevel = "safe" | "warning" | "overbudget";

export interface BudgetHealthMeta {
  level: BudgetHealthLevel;
  label: string;
  shortLabel: string;
  usagePct: number;
  remaining: number;
  overAmount: number;
  badgeClass: string;
  barClass: string;
  bannerClass: string;
}

/**
 * Menghitung status kesehatan 3 warna otomatis sesuai referensi XLSX:
 * - Hijau (Aman): < 90% terpakai
 * - Oranye (Hampir Habis): 90% – 100% terpakai
 * - Merah (Overbudget): > 100% terpakai
 */
export function getBudgetHealthStatus(
  actualAmount: number,
  targetAmount: number
): BudgetHealthMeta {
  const actual = Math.max(0, Number(actualAmount) || 0);
  const target = Math.max(0, Number(targetAmount) || 0);

  if (target <= 0) {
    return {
      level: actual > 0 ? "warning" : "safe",
      label: actual > 0 ? "Belum ada target" : "Aman",
      shortLabel: actual > 0 ? "Perlu Target" : "Aman",
      usagePct: 0,
      remaining: 0,
      overAmount: actual,
      badgeClass:
        actual > 0
          ? "border-amberwarm/45 bg-amberwarm-light/80 text-amber-900"
          : "border-sage/20 bg-sage-50 text-sage-800",
      barClass: actual > 0 ? "bg-amberwarm" : "bg-sage",
      bannerClass: "border-sage/20 bg-sage-50/80 text-sage-900",
    };
  }

  const usagePct = Math.round((actual / target) * 100);
  const diff = target - actual;

  if (actual > target) {
    const over = actual - target;
    return {
      level: "overbudget",
      label: `Overbudget +${formatIDR(over)}`,
      shortLabel: "Overbudget",
      usagePct,
      remaining: 0,
      overAmount: over,
      badgeClass: "border-red-200 bg-red-50 text-red-700",
      barClass: "bg-red-500",
      bannerClass: "border-red-200/80 bg-red-50/90 text-red-900",
    };
  }

  if (usagePct >= 90) {
    return {
      level: "warning",
      label: `Hampir Habis • Sisa ${formatIDR(diff)}`,
      shortLabel: "Hampir Habis",
      usagePct,
      remaining: diff,
      overAmount: 0,
      badgeClass: "border-amber-300/70 bg-amber-50 text-amber-800",
      barClass: "bg-amber-500",
      bannerClass: "border-amber-300/70 bg-amber-50/90 text-amber-950",
    };
  }

  return {
    level: "safe",
    label: `Aman • Sisa ${formatIDR(diff)}`,
    shortLabel: "Aman",
    usagePct,
    remaining: diff,
    overAmount: 0,
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
    barClass: "bg-sage",
    bannerClass: "border-emerald-200/80 bg-emerald-50/85 text-emerald-950",
  };
}

export interface CategoryInsightRow {
  category: BudgetCategory;
  itemCount: number;
  allocated: number;
  totalDeal: number;
  totalPaid: number;
  /** Nilai realisasi yang dibandingkan terhadap alokasi: deal bila ada, fallback paid */
  effectiveSpent: number;
  health: BudgetHealthMeta;
}

export interface WeddingInsightsSummary {
  targetBudget: number;
  totalAllocated: number;
  totalDeal: number;
  totalPaid: number;
  effectiveTotal: number;
  overallHealth: BudgetHealthMeta;
  utilizationRate: number;
  paidRate: number;
  efficiencyDelta: number; // positif = hemat, negatif = overbudget
  largestCategory: CategoryInsightRow | null;
  overbudgetCategories: CategoryInsightRow[];
  warningCategories: CategoryInsightRow[];
  categoryRows: CategoryInsightRow[];
  recommendation: string;
}

/**
 * Mesin Decision Support real-time untuk Dashboard NikahPlan
 * (mengadaptasi Sheet Summary & Insight dari lampiran XLSX).
 */
export function computeWeddingInsights(
  workspace: Workspace,
  categories: BudgetCategory[],
  items: BudgetItem[],
  payments: ItemPayment[]
): WeddingInsightsSummary {
  const weddingCategories = categories.filter((c) => c.phase === "WEDDING");
  const weddingItems = items.filter((i) => i.phase === "WEDDING");
  const weddingItemIds = new Set(weddingItems.map((i) => i.id));
  const weddingPayments = payments.filter((p) => weddingItemIds.has(p.item_id));

  const targetBudget = Number(workspace.wedding_budget_target) || 0;
  const totalAllocated = weddingCategories.reduce(
    (sum, c) => sum + (Number(c.allocated_amount) || 0),
    0
  );

  const categoryRows: CategoryInsightRow[] = weddingCategories.map((cat) => {
    const catItems = weddingItems.filter((i) => i.category_id === cat.id);
    const catItemIds = new Set(catItems.map((i) => i.id));
    const totalDeal = catItems.reduce(
      (s, i) => s + (Number(i.deal_cost) || Number(i.estimated_cost) || 0),
      0
    );
    const totalPaid = weddingPayments
      .filter((p) => catItemIds.has(p.item_id) && p.is_paid)
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);

    const allocated = Number(cat.allocated_amount) || 0;
    const effectiveSpent = Math.max(totalDeal, totalPaid);
    const health = getBudgetHealthStatus(effectiveSpent, allocated);

    return {
      category: cat,
      itemCount: catItems.length,
      allocated,
      totalDeal,
      totalPaid,
      effectiveSpent,
      health,
    };
  });

  const totalDeal = categoryRows.reduce((s, r) => s + r.totalDeal, 0);
  const totalPaid = categoryRows.reduce((s, r) => s + r.totalPaid, 0);
  const effectiveTotal = Math.max(totalDeal, totalPaid);

  const overallHealth = getBudgetHealthStatus(effectiveTotal, targetBudget);
  const utilizationRate =
    targetBudget > 0 ? Math.round((effectiveTotal / targetBudget) * 1000) / 10 : 0;
  const paidRate =
    targetBudget > 0 ? Math.round((totalPaid / targetBudget) * 1000) / 10 : 0;
  const efficiencyDelta = targetBudget - effectiveTotal;

  const sortedBySpend = [...categoryRows].sort(
    (a, b) => (b.effectiveSpent || b.allocated) - (a.effectiveSpent || a.allocated)
  );
  const largestCategory = sortedBySpend[0] ?? null;

  const overbudgetCategories = categoryRows.filter(
    (r) => r.health.level === "overbudget"
  );
  const warningCategories = categoryRows.filter(
    (r) => r.health.level === "warning"
  );

  let recommendation =
    "Semua pos masih on-track! Pertahankan disiplin input termin dan jaga dana darurat 10% tetap utuh hingga hari H.";

  if (overallHealth.level === "overbudget") {
    recommendation = `Total komitmen sudah melampaui target sebesar ${formatIDR(overallHealth.overAmount)}. Tinjau kategori overbudget atau gunakan Script Negosiasi di tab Panduan untuk memangkas biaya tambahan.`;
  } else if (overbudgetCategories.length > 0) {
    const names = overbudgetCategories
      .slice(0, 2)
      .map((r) => r.category.name)
      .join(" & ");
    recommendation = `${overbudgetCategories.length} kategori (${names}) melewati alokasi awal. Anda bisa menyeimbangkan dengan menggeser sisa dari kategori lain yang masih longgar.`;
  } else if (overallHealth.level === "warning" || warningCategories.length > 0) {
    recommendation =
      "Pemakaian anggaran mendekati batas 90%. Pastikan tidak ada biaya tersembunyi (listrik, parkir, overtime) sebelum tanda tangan pelunasan vendor.";
  } else if (weddingItems.length === 0) {
    recommendation =
      "Mulai dengan menambahkan daftar vendor di menu Vendor (atau pakai Template 51 Item siap pakai) agar insight anggaran terhitung otomatis.";
  }

  return {
    targetBudget,
    totalAllocated,
    totalDeal,
    totalPaid,
    effectiveTotal,
    overallHealth,
    utilizationRate,
    paidRate,
    efficiencyDelta,
    largestCategory,
    overbudgetCategories,
    warningCategories,
    categoryRows,
    recommendation,
  };
}
