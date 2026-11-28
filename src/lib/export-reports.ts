"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { WorkspaceBundle } from "@/lib/workspace-data";
import { formatIDR } from "@/lib/utils";
import { FUNDING_SOURCE_META } from "@/lib/category-icons";
import {
  calculateTripDays,
  formatForeignCurrency,
} from "@/lib/budget-allocator";
import type { FundingSource, InvitationRsvp } from "@/types/database";

function slugifyCouple(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "nikahplan"
  );
}

function getTodayStamp(): string {
  return new Date().toISOString().split("T")[0];
}

function computeReportSummary(bundle: WorkspaceBundle) {
  const { workspace, categories, items, payments, gifts } = bundle;
  const weddingItems = items.filter((i) => i.phase === "WEDDING");
  const weddingItemIds = new Set(weddingItems.map((i) => i.id));
  const weddingPayments = payments.filter((p) => weddingItemIds.has(p.item_id));

  const targetWedding = Number(workspace.wedding_budget_target) || 0;
  const totalEstimated = weddingItems.reduce(
    (s, i) => s + (Number(i.estimated_cost) || 0),
    0
  );
  const totalDeal = weddingItems.reduce(
    (s, i) => s + (Number(i.deal_cost) || Number(i.estimated_cost) || 0),
    0
  );
  const totalPaid = weddingPayments
    .filter((p) => p.is_paid)
    .reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const remainingWedding = Math.max(0, targetWedding - totalPaid);

  const fundingTotals: Record<FundingSource, number> = {
    JOINT: 0,
    GROOM_FAMILY: 0,
    BRIDE_FAMILY: 0,
    ANGPAO: 0,
  };
  for (const p of weddingPayments.filter((pay) => pay.is_paid)) {
    fundingTotals[p.funding] += Number(p.amount) || 0;
  }

  const angpaoTotal = gifts
    .filter((g) => g.gift_type !== "PHYSICAL")
    .reduce((s, g) => s + (Number(g.amount) || 0), 0);
  const angpaoToVendor = gifts
    .filter((g) => g.gift_type !== "PHYSICAL" && g.allocated_to === "WEDDING_COVER")
    .reduce((s, g) => s + (Number(g.amount) || 0), 0);
  const angpaoToHoneymoon = gifts
    .filter(
      (g) => g.gift_type !== "PHYSICAL" && g.allocated_to === "HONEYMOON_FUND"
    )
    .reduce((s, g) => s + (Number(g.amount) || 0), 0);

  const hmItems = items.filter((i) => i.phase !== "WEDDING");
  const hmWallet =
    (Number(workspace.honeymoon_budget_target) || 0) + angpaoToHoneymoon;
  const hmSpent = hmItems.reduce(
    (s, i) => s + (Number(i.deal_cost) || Number(i.estimated_cost) || 0),
    0
  );
  const hmRemaining = Math.max(0, hmWallet - hmSpent);
  const hmDays = calculateTripDays(
    workspace.honeymoon_start_date,
    workspace.honeymoon_end_date
  );
  const hmDailyPocket = hmDays > 0 ? Math.round(hmRemaining / hmDays) : 0;

  return {
    categories,
    weddingItems,
    weddingPayments,
    hmItems,
    targetWedding,
    totalEstimated,
    totalDeal,
    totalPaid,
    remainingWedding,
    fundingTotals,
    angpaoTotal,
    angpaoToVendor,
    angpaoToHoneymoon,
    hmWallet,
    hmSpent,
    hmRemaining,
    hmDays,
    hmDailyPocket,
  };
}

/**
 * Export laporan anggaran lengkap ke PDF (100% client-side, bekerja saat offline).
 */
export function exportBudgetToPDF(bundle: WorkspaceBundle) {
  const { workspace, gifts, checklists } = bundle;
  const stats = computeReportSummary(bundle);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const PRIMARY: [number, number, number] = [24, 28, 46]; // #181C2E (Midnight Velvet)
  const ACCENT: [number, number, number] = [79, 107, 246]; // #4F6BF6 (Indigo)
  const SOFT_BG: [number, number, number] = [244, 245, 247]; // #F4F5F7 (Gallery Light Gray)

  // Header Banner
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, 210, 34, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("NikahPlan — Laporan Anggaran", 14, 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(
    `${workspace.couple_title}${workspace.wedding_date ? `  |  Tanggal Nikah: ${workspace.wedding_date}` : ""}`,
    14,
    23
  );
  doc.setFontSize(9);
  doc.text(
    `Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}  |  Estimasi Tamu: ${workspace.guest_estimate} pax`,
    14,
    29
  );

  // 1. Ringkasan Kesehatan Anggaran Pernikahan
  let y = 42;
  doc.setTextColor(...PRIMARY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("1. Ringkasan Anggaran Pernikahan & Sumber Dana", 14, y);

  autoTable(doc, {
    startY: y + 3,
    head: [["Metrik", "Nominal (IDR)", "Sumber Dana (Terbayar)", "Nominal (IDR)"]],
    body: [
      [
        "Target Bujet Pernikahan",
        formatIDR(stats.targetWedding),
        "Tabungan Bersama",
        formatIDR(stats.fundingTotals.JOINT),
      ],
      [
        "Total Estimasi Awal",
        formatIDR(stats.totalEstimated),
        "Keluarga Pihak Pria",
        formatIDR(stats.fundingTotals.GROOM_FAMILY),
      ],
      [
        "Total Deal Vendor",
        formatIDR(stats.totalDeal),
        "Keluarga Pihak Wanita",
        formatIDR(stats.fundingTotals.BRIDE_FAMILY),
      ],
      [
        "Total Sudah Dibayar",
        formatIDR(stats.totalPaid),
        "Alokasi Dana Angpao",
        formatIDR(stats.fundingTotals.ANGPAO),
      ],
      [
        "Sisa Anggaran Tersedia",
        formatIDR(stats.remainingWedding),
        "Total Angpao Terkumpul",
        formatIDR(stats.angpaoTotal),
      ],
    ],
    theme: "grid",
    headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5, textColor: [20, 22, 24] },
    alternateRowStyles: { fillColor: SOFT_BG },
    margin: { left: 14, right: 14 },
  });

  // 2. Daftar Vendor & Termin Pembayaran
  const catMap = new Map(bundle.categories.map((c) => [c.id, c.name]));
  const paymentsByItem = new Map<string, typeof bundle.payments>();
  for (const p of stats.weddingPayments) {
    const arr = paymentsByItem.get(p.item_id) ?? [];
    arr.push(p);
    paymentsByItem.set(p.item_id, arr);
  }

  const vendorRows = stats.weddingItems.map((item) => {
    const pays = paymentsByItem.get(item.id) ?? [];
    const paid = pays
      .filter((p) => p.is_paid)
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const deal = Number(item.deal_cost) || Number(item.estimated_cost) || 0;
    const terminText =
      pays.length > 0
        ? pays
            .map(
              (p) =>
                `${p.label} (${FUNDING_SOURCE_META[p.funding].label}: ${p.is_paid ? "Lunas" : "Belum"})`
            )
            .join(", ")
        : "-";
    return [
      catMap.get(item.category_id) || "-",
      item.title,
      formatIDR(Number(item.estimated_cost) || 0),
      formatIDR(deal),
      formatIDR(paid),
      terminText,
    ];
  });

  y = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
    ?.finalY
    ? (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
        .finalY + 10
    : 105;

  doc.setTextColor(...PRIMARY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("2. Rincian Vendor & Termin Pembayaran", 14, y);

  autoTable(doc, {
    startY: y + 3,
    head: [
      ["Kategori", "Vendor / Item", "Estimasi", "Deal", "Terbayar", "Termin"],
    ],
    body:
      vendorRows.length > 0
        ? vendorRows
        : [["-", "Belum ada data vendor tercatat", "-", "-", "-", "-"]],
    theme: "grid",
    headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [20, 22, 24] },
    alternateRowStyles: { fillColor: SOFT_BG },
    margin: { left: 14, right: 14 },
  });

  // 3. Angpao & Kado
  y =
    ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? 150) + 10;
  if (y > 245) {
    doc.addPage();
    y = 20;
  }

  doc.setTextColor(...ACCENT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("3. Catatan Angpao & Hadiah Pernikahan", 14, y);

  const giftRows = gifts.map((g) => [
    g.sender_name,
    g.gift_type,
    formatIDR(Number(g.amount) || 0),
    g.allocated_to,
    g.notes || "-",
  ]);

  autoTable(doc, {
    startY: y + 3,
    head: [["Pemberi", "Jenis", "Nominal", "Alokasi", "Catatan"]],
    body:
      giftRows.length > 0
        ? giftRows
        : [["-", "Belum ada catatan angpao/kado", "-", "-", "-"]],
    theme: "grid",
    headStyles: {
      fillColor: ACCENT,
      textColor: [255, 255, 255],
      fontSize: 8,
    },
    bodyStyles: { fontSize: 8, textColor: [20, 22, 24] },
    alternateRowStyles: { fillColor: SOFT_BG },
    margin: { left: 14, right: 14 },
  });

  // 4. Ringkasan & Pengeluaran Honeymoon (jika ada)
  if (workspace.plan === "COMPLETE_PASS") {
    y =
      ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
        ?.finalY ?? 200) + 10;
    if (y > 230) {
      doc.addPage();
      y = 20;
    }

    doc.setTextColor(...PRIMARY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(
      `4. Dompet Honeymoon${workspace.honeymoon_destination ? ` — ${workspace.honeymoon_destination}` : ""}`,
      14,
      y
    );

    const hmRows = stats.hmItems.map((item) => [
      item.phase === "HONEYMOON_PRE" ? "Pre-Trip" : "On-Trip",
      item.title,
      item.currency !== "IDR" && item.foreign_amount
        ? formatForeignCurrency(Number(item.foreign_amount), item.currency)
        : "-",
      formatIDR(Number(item.deal_cost) || 0),
      item.notes || "-",
    ]);

    autoTable(doc, {
      startY: y + 3,
      head: [
        [
          "Total Dompet",
          "Terpakai",
          "Sisa Dana",
          "Uang Jajan Harian",
          "Checklist Selesai",
        ],
      ],
      body: [
        [
          formatIDR(stats.hmWallet),
          formatIDR(stats.hmSpent),
          formatIDR(stats.hmRemaining),
          stats.hmDays > 0
            ? `${formatIDR(stats.hmDailyPocket)}/hari (${stats.hmDays} hr)`
            : "-",
          `${checklists.filter((c) => c.is_completed).length}/${checklists.length}`,
        ],
      ],
      theme: "grid",
      headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: [20, 22, 24] },
      margin: { left: 14, right: 14 },
    });

    if (hmRows.length > 0) {
      const nextY =
        ((doc as unknown as { lastAutoTable?: { finalY: number } })
          .lastAutoTable?.finalY ?? y + 24) + 5;
      autoTable(doc, {
        startY: nextY,
        head: [["Fase", "Pengeluaran", "Mata Uang Asing", "Konversi IDR", "Catatan"]],
        body: hmRows,
        theme: "grid",
        headStyles: {
          fillColor: [30, 36, 64],
          textColor: [255, 255, 255],
          fontSize: 8,
        },
        bodyStyles: { fontSize: 8, textColor: [20, 22, 24] },
        alternateRowStyles: { fillColor: SOFT_BG },
        margin: { left: 14, right: 14 },
      });
    }
  }

  const filename = `NikahPlan-Laporan-${slugifyCouple(workspace.couple_title)}-${getTodayStamp()}.pdf`;
  doc.save(filename);
}

/**
 * Export Ringkasan Eksekutif "Siap Rapat Keluarga" (1–2 halaman A4 rapi).
 * Memisahkan porsi dana Keluarga Pria, Keluarga Wanita, Tabungan Bersama,
 * dan Dana Angpao, plus ringkasan pos utama & 5 jadwal jatuh tempo terdekat.
 */
export function exportFamilyMeetingPDF(bundle: WorkspaceBundle) {
  const { workspace, categories, items, payments } = bundle;
  const stats = computeReportSummary(bundle);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const PRIMARY: [number, number, number] = [24, 28, 46]; // #181C2E
  const ACCENT: [number, number, number] = [79, 107, 246]; // #4F6BF6
  const GOLD: [number, number, number] = [224, 159, 62]; // #E09F3E
  const SOFT_BG: [number, number, number] = [244, 245, 247]; // #F4F5F7

  // 1. Header Banner Eksekutif
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, 210, 36, "F");
  doc.setFillColor(...GOLD);
  doc.rect(0, 35, 210, 1.2, "F");

  doc.setTextColor(224, 159, 62);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("RINGKASAN ANGGARAN SIAP RAPAT KELUARGA", 14, 11);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text(`Pernikahan ${workspace.couple_title}`, 14, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(220, 224, 236);
  doc.text(
    `${workspace.wedding_date ? `Tanggal Acara: ${workspace.wedding_date}   |   ` : ""}Estimasi Tamu: ${workspace.guest_estimate} pax   |   Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
    14,
    29
  );

  // 2. 4 Kartu KPI Besar
  const remainingObligation = Math.max(0, stats.totalDeal - stats.totalPaid);
  const kpis = [
    { label: "Target Anggaran", value: formatIDR(stats.targetWedding) },
    { label: "Total Deal / Estimasi", value: formatIDR(stats.totalDeal) },
    { label: "Sudah Dibayar", value: formatIDR(stats.totalPaid) },
    { label: "Sisa Kewajiban", value: formatIDR(remainingObligation) },
  ];

  const cardW = 43.5;
  const cardGap = 2.6;
  kpis.forEach((kpi, idx) => {
    const x = 14 + idx * (cardW + cardGap);
    doc.setFillColor(...SOFT_BG);
    doc.roundedRect(x, 42, cardW, 18, 2.5, 2.5, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(95, 105, 120);
    doc.text(kpi.label, x + 3, 48.5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(20, 22, 24);
    doc.text(kpi.value, x + 3, 55.5);
  });

  // 3. Pembagian Porsi Dana Keluarga (Terpisah: Bersama, Pria, Wanita, Angpao)
  const weddingItemIds = new Set(stats.weddingItems.map((i) => i.id));
  const weddingPayments = payments.filter((p) => weddingItemIds.has(p.item_id));

  const fundingBreakdown: Record<
    FundingSource,
    { paid: number; unpaid: number; total: number }
  > = {
    JOINT: { paid: 0, unpaid: 0, total: 0 },
    GROOM_FAMILY: { paid: 0, unpaid: 0, total: 0 },
    BRIDE_FAMILY: { paid: 0, unpaid: 0, total: 0 },
    ANGPAO: { paid: 0, unpaid: 0, total: 0 },
  };

  for (const p of weddingPayments) {
    const amt = Number(p.amount) || 0;
    if (p.is_paid) fundingBreakdown[p.funding].paid += amt;
    else fundingBreakdown[p.funding].unpaid += amt;
    fundingBreakdown[p.funding].total += amt;
  }

  const grandCommitted = Object.values(fundingBreakdown).reduce(
    (s, f) => s + f.total,
    0
  );

  doc.setTextColor(...PRIMARY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.text("1. Pembagian Porsi Dana Keluarga & Tabungan Bersama", 14, 69);

  // Stacked visual bar
  const barX = 14;
  const barY = 72;
  const barW = 182;
  const barH = 4.5;
  doc.setFillColor(229, 233, 240);
  doc.roundedRect(barX, barY, barW, barH, 1.5, 1.5, "F");

  if (grandCommitted > 0) {
    const barSources: Array<{
      key: FundingSource;
      rgb: [number, number, number];
    }> = [
      { key: "JOINT", rgb: PRIMARY },
      { key: "GROOM_FAMILY", rgb: ACCENT },
      { key: "BRIDE_FAMILY", rgb: GOLD },
      { key: "ANGPAO", rgb: [129, 140, 248] },
    ];
    let cursorX = barX;
    for (const s of barSources) {
      const segW = (fundingBreakdown[s.key].total / grandCommitted) * barW;
      if (segW > 0.5) {
        doc.setFillColor(...s.rgb);
        doc.rect(cursorX, barY, segW, barH, "F");
        cursorX += segW;
      }
    }
  }

  const fundingRows = (
    ["JOINT", "GROOM_FAMILY", "BRIDE_FAMILY", "ANGPAO"] as FundingSource[]
  ).map((key) => {
    const row = fundingBreakdown[key];
    const pct =
      grandCommitted > 0 ? Math.round((row.total / grandCommitted) * 100) : 0;
    return [
      FUNDING_SOURCE_META[key].fullLabel,
      `${pct}%`,
      formatIDR(row.paid),
      formatIDR(row.unpaid),
      formatIDR(row.total),
    ];
  });

  autoTable(doc, {
    startY: 79,
    head: [
      [
        "Sumber Dana",
        "Porsi",
        "Sudah Dibayar",
        "Akan Dibayar",
        "Total Komitmen",
      ],
    ],
    body: fundingRows,
    theme: "grid",
    headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5, textColor: [20, 22, 24] },
    alternateRowStyles: { fillColor: SOFT_BG },
    margin: { left: 14, right: 14 },
  });

  // 4. Ringkasan Pos Anggaran Utama per Kategori
  let y =
    ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? 120) + 9;

  doc.setTextColor(...PRIMARY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.text("2. Ringkasan Pos Anggaran Pernikahan", 14, y);

  const weddingCategories = categories.filter((c) => c.phase === "WEDDING");
  const catSummaryRows = weddingCategories.map((cat) => {
    const catItems = stats.weddingItems.filter((i) => i.category_id === cat.id);
    const catItemIds = new Set(catItems.map((i) => i.id));
    const catDeal = catItems.reduce(
      (s, i) => s + (Number(i.deal_cost) || Number(i.estimated_cost) || 0),
      0
    );
    const catPaid = weddingPayments
      .filter((p) => catItemIds.has(p.item_id) && p.is_paid)
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);
    return [
      cat.name,
      `${catItems.length} pos`,
      formatIDR(Number(cat.allocated_amount) || 0),
      formatIDR(catDeal),
      formatIDR(catPaid),
      formatIDR(Math.max(0, catDeal - catPaid)),
    ];
  });

  autoTable(doc, {
    startY: y + 3,
    head: [
      [
        "Kategori Pos",
        "Jumlah",
        "Target",
        "Deal / Estimasi",
        "Terbayar",
        "Sisa",
      ],
    ],
    body:
      catSummaryRows.length > 0
        ? catSummaryRows
        : [["-", "0 pos", "Rp0", "Rp0", "Rp0", "Rp0"]],
    theme: "grid",
    headStyles: { fillColor: ACCENT, textColor: [255, 255, 255], fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [20, 22, 24] },
    alternateRowStyles: { fillColor: SOFT_BG },
    margin: { left: 14, right: 14 },
  });

  // 5. 5 Jadwal Jatuh Tempo Terdekat
  y =
    ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? 185) + 9;
  if (y > 235) {
    doc.addPage();
    y = 18;
  }

  const itemTitleMap = new Map(items.map((i) => [i.id, i.title]));
  const upcomingPayments = weddingPayments
    .filter((p) => !p.is_paid && p.due_date)
    .sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""))
    .slice(0, 5);

  doc.setTextColor(...PRIMARY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.text("3. Jadwal Pembayaran Jatuh Tempo Terdekat", 14, y);

  autoTable(doc, {
    startY: y + 3,
    head: [["Jatuh Tempo", "Vendor / Pos", "Termin", "Sumber Dana", "Nominal"]],
    body:
      upcomingPayments.length > 0
        ? upcomingPayments.map((p) => [
            p.due_date || "-",
            itemTitleMap.get(p.item_id) || "-",
            p.label,
            FUNDING_SOURCE_META[p.funding].fullLabel,
            formatIDR(Number(p.amount) || 0),
          ])
        : [["-", "Tidak ada jadwal tagihan jatuh tempo terdekat", "-", "-", "-"]],
    theme: "grid",
    headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [20, 22, 24] },
    alternateRowStyles: { fillColor: SOFT_BG },
    margin: { left: 14, right: 14 },
  });

  // 6. Kotak Catatan Kesepakatan Rapat Keluarga
  const notesY =
    ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? 240) + 8;
  if (notesY < 268) {
    doc.setDrawColor(210, 214, 224);
    doc.roundedRect(14, notesY, 182, 20, 2.5, 2.5, "S");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(95, 105, 120);
    doc.text("Catatan & Kesepakatan Rapat Keluarga:", 18, notesY + 6);
  }

  const filename = `NikahPlan-Rapat-Keluarga-${slugifyCouple(workspace.couple_title)}-${getTodayStamp()}.pdf`;
  doc.save(filename);
}

/**
 * Export laporan lengkap ke workbook Excel (.xlsx) 4 sheet (100% client-side).
 */
export function exportBudgetToExcel(bundle: WorkspaceBundle) {
  const { workspace, gifts, checklists } = bundle;
  const stats = computeReportSummary(bundle);
  const catMap = new Map(bundle.categories.map((c) => [c.id, c.name]));

  const wb = XLSX.utils.book_new();

  // Sheet 1: Ringkasan
  const summarySheetData = [
    ["LAPORAN ANGGARAN NIKAHPLAN"],
    ["Nama Pasangan", workspace.couple_title],
    ["Tanggal Pernikahan", workspace.wedding_date || "-"],
    ["Estimasi Tamu (Pax)", workspace.guest_estimate],
    ["Paket Aktif", workspace.plan],
    ["Tanggal Export", getTodayStamp()],
    [],
    ["RINGKASAN PERNIKAHAN", "NOMINAL (IDR)"],
    ["Target Bujet Pernikahan", stats.targetWedding],
    ["Total Estimasi Awal Vendor", stats.totalEstimated],
    ["Total Harga Deal Vendor", stats.totalDeal],
    ["Total Aktual Sudah Dibayar", stats.totalPaid],
    ["Sisa Anggaran Tersedia", stats.remainingWedding],
    [],
    ["PEMBAGIAN SUMBER DANA (TERBAYAR)", "NOMINAL (IDR)"],
    ["Tabungan Bersama", stats.fundingTotals.JOINT],
    ["Keluarga Pihak Pria", stats.fundingTotals.GROOM_FAMILY],
    ["Keluarga Pihak Wanita", stats.fundingTotals.BRIDE_FAMILY],
    ["Dana Angpao", stats.fundingTotals.ANGPAO],
    [],
    ["RINGKASAN HONEYMOON", "NILAI"],
    ["Destinasi", workspace.honeymoon_destination || "-"],
    ["Durasi (Hari)", stats.hmDays],
    [
      "Kurs Tersimpan",
      `1 ${workspace.honeymoon_currency} = Rp ${workspace.honeymoon_exchange_rate}`,
    ],
    ["Total Dompet Honeymoon (IDR)", stats.hmWallet],
    ["Total Pengeluaran Honeymoon (IDR)", stats.hmSpent],
    ["Sisa Dompet Honeymoon (IDR)", stats.hmRemaining],
    ["Estimasi Uang Jajan Harian (IDR)", stats.hmDailyPocket],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summarySheetData);
  wsSummary["!cols"] = [{ wch: 36 }, { wch: 28 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan");

  // Sheet 2: Vendor & Termin
  const vendorSheetRows: (string | number)[][] = [
    [
      "Kategori",
      "Nama Vendor / Item",
      "Estimasi Awal (IDR)",
      "Harga Deal (IDR)",
      "Selisih (IDR)",
      "Status Booked",
      "Termin",
      "Nominal Termin (IDR)",
      "Sumber Dana",
      "Jatuh Tempo",
      "Status Termin",
      "Tanggal Lunas",
    ],
  ];

  const paymentsByItem = new Map<string, typeof bundle.payments>();
  for (const p of stats.weddingPayments) {
    const arr = paymentsByItem.get(p.item_id) ?? [];
    arr.push(p);
    paymentsByItem.set(p.item_id, arr);
  }

  for (const item of stats.weddingItems) {
    const catName = catMap.get(item.category_id) || "-";
    const est = Number(item.estimated_cost) || 0;
    const deal = Number(item.deal_cost) || 0;
    const diff = deal > 0 ? deal - est : 0;
    const pays = paymentsByItem.get(item.id) ?? [];

    if (pays.length === 0) {
      vendorSheetRows.push([
        catName,
        item.title,
        est,
        deal,
        diff,
        item.is_booked ? "Booked" : "Belum",
        "-",
        0,
        "-",
        "-",
        "-",
        "-",
      ]);
    } else {
      for (const p of pays) {
        vendorSheetRows.push([
          catName,
          item.title,
          est,
          deal,
          diff,
          item.is_booked ? "Booked" : "Belum",
          p.label,
          Number(p.amount) || 0,
          FUNDING_SOURCE_META[p.funding].fullLabel,
          p.due_date || "-",
          p.is_paid ? "Lunas" : "Belum Lunas",
          p.paid_date || "-",
        ]);
      }
    }
  }

  const wsVendors = XLSX.utils.aoa_to_sheet(vendorSheetRows);
  wsVendors["!cols"] = [
    { wch: 22 },
    { wch: 28 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, wsVendors, "Vendor & Termin");

  // Sheet 3: Angpao & Kado
  const angpaoRows: (string | number)[][] = [
    ["Nama Pemberi", "Jenis", "Nominal (IDR)", "Alokasi", "Catatan"],
    ...gifts.map((g) => [
      g.sender_name,
      g.gift_type,
      Number(g.amount) || 0,
      g.allocated_to,
      g.notes || "-",
    ]),
  ];
  const wsAngpao = XLSX.utils.aoa_to_sheet(angpaoRows);
  wsAngpao["!cols"] = [
    { wch: 28 },
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, wsAngpao, "Angpao & Kado");

  // Sheet 4: Honeymoon
  const hmSheetRows: (string | number)[][] = [
    [
      "Fase",
      "Kategori",
      "Pengeluaran",
      "Mata Uang",
      "Nominal Asing",
      "Konversi IDR",
      "Catatan",
    ],
    ...stats.hmItems.map((i) => [
      i.phase === "HONEYMOON_PRE" ? "Pre-Trip" : "On-Trip",
      catMap.get(i.category_id) || "-",
      i.title,
      i.currency,
      Number(i.foreign_amount) || 0,
      Number(i.deal_cost) || 0,
      i.notes || "-",
    ]),
    [],
    ["CHECKLIST PRA-PERJALANAN", "STATUS"],
    ...checklists.map((c) => [c.title, c.is_completed ? "Selesai" : "Belum"]),
  ];
  const wsHoneymoon = XLSX.utils.aoa_to_sheet(hmSheetRows);
  wsHoneymoon["!cols"] = [
    { wch: 28 },
    { wch: 22 },
    { wch: 28 },
    { wch: 12 },
    { wch: 16 },
    { wch: 18 },
    { wch: 26 },
  ];
  XLSX.utils.book_append_sheet(wb, wsHoneymoon, "Honeymoon");

  const filename = `NikahPlan-Laporan-${slugifyCouple(workspace.couple_title)}-${getTodayStamp()}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Export rekap konfirmasi RSVP & ucapan doa tamu undangan ke Excel (.xlsx).
 */
export function exportRsvpToExcel(
  coupleTitle: string,
  rsvps: InvitationRsvp[]
) {
  const wb = XLSX.utils.book_new();

  const hadirRows = rsvps.filter((r) => r.attendance === "HADIR");
  const raguRows = rsvps.filter((r) => r.attendance === "RAGU");
  const tidakRows = rsvps.filter((r) => r.attendance === "TIDAK_HADIR");
  const totalPax = hadirRows.reduce(
    (sum, r) => sum + Math.max(1, Number(r.guest_count) || 1),
    0
  );

  const summaryRows: (string | number)[][] = [
    ["REKAP RSVP UNDANGAN PERNIKAHAN — NIKAHPLAN"],
    ["Mempelai", coupleTitle],
    ["Tanggal Unduh", getTodayStamp()],
    [],
    ["METRIK", "JUMLAH"],
    ["Total Responden", rsvps.length],
    ["Konfirmasi Hadir", hadirRows.length],
    ["Estimasi Total Tamu Hadir (Pax)", totalPax],
    ["Masih Ragu", raguRows.length],
    ["Tidak Hadir", tidakRows.length],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary["!cols"] = [{ wch: 32 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan RSVP");

  const statusLabel = (attendance: InvitationRsvp["attendance"]) =>
    attendance === "HADIR"
      ? "Hadir"
      : attendance === "RAGU"
        ? "Masih Ragu"
        : "Tidak Hadir";

  const guestRows: (string | number)[][] = [
    [
      "No",
      "Nama Tamu",
      "Status Kehadiran",
      "Jumlah Tamu (Pax)",
      "Ucapan & Doa",
      "Waktu Konfirmasi",
    ],
    ...rsvps.map((r, idx) => [
      idx + 1,
      r.guest_name,
      statusLabel(r.attendance),
      r.attendance === "HADIR" ? Math.max(1, Number(r.guest_count) || 1) : 0,
      r.message || "-",
      new Date(r.created_at).toLocaleString("id-ID"),
    ]),
  ];
  const wsGuests = XLSX.utils.aoa_to_sheet(guestRows);
  wsGuests["!cols"] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 18 },
    { wch: 18 },
    { wch: 44 },
    { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, wsGuests, "Daftar Tamu & Ucapan");

  const filename = `NikahPlan-RSVP-${slugifyCouple(coupleTitle)}-${getTodayStamp()}.xlsx`;
  XLSX.writeFile(wb, filename);
}
