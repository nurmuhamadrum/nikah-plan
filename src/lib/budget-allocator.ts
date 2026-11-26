export interface SmartCategoryAllocation {
  name: string;
  icon: string;
  percentage: number;
  amount: number;
  color: string;
}

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  defaultRateToIDR: number;
}

export const HONEYMOON_CURRENCIES: CurrencyOption[] = [
  { code: "IDR", name: "Rupiah Indonesia", symbol: "Rp", defaultRateToIDR: 1 },
  { code: "JPY", name: "Yen Jepang", symbol: "¥", defaultRateToIDR: 105 },
  { code: "SGD", name: "Dolar Singapura", symbol: "S$", defaultRateToIDR: 12000 },
  { code: "THB", name: "Baht Thailand", symbol: "฿", defaultRateToIDR: 465 },
  { code: "MYR", name: "Ringgit Malaysia", symbol: "RM", defaultRateToIDR: 3650 },
  { code: "KRW", name: "Won Korea", symbol: "₩", defaultRateToIDR: 11.5 },
  { code: "EUR", name: "Euro Eropa", symbol: "€", defaultRateToIDR: 17200 },
  { code: "USD", name: "Dolar AS", symbol: "$", defaultRateToIDR: 16000 },
  { code: "AUD", name: "Dolar Australia", symbol: "A$", defaultRateToIDR: 10500 },
];

export function getCurrencyOption(code: string): CurrencyOption {
  return (
    HONEYMOON_CURRENCIES.find((c) => c.code === code) ?? HONEYMOON_CURRENCIES[0]
  );
}

/**
 * Menghasilkan 6 pos anggaran pernikahan awal secara cerdas berdasarkan
 * target bujet dan jumlah tamu (pax).
 */
export function buildSmartWeddingAllocations(
  totalBudget: number,
  guestEstimate: number
): SmartCategoryAllocation[] {
  const safeBudget = Math.max(0, totalBudget);
  const costPerGuest = guestEstimate > 0 ? safeBudget / guestEstimate : 500000;

  // Sesuaikan bobot Katering & Venue bila jumlah tamu relatif padat terhadap bujet
  const cateringPct =
    costPerGuest < 350000 ? 48 : costPerGuest > 750000 ? 40 : 45;
  const decorPct = 15;
  const photoPct = 10;
  const attirePct = 15;
  const seserahanPct = 8;
  const emergencyPct = Math.max(
    5,
    100 - cateringPct - decorPct - photoPct - attirePct - seserahanPct
  );

  const raw: Omit<SmartCategoryAllocation, "amount">[] = [
    {
      name: "Venue & Katering",
      icon: "utensils",
      percentage: cateringPct,
      color: "#3D5245",
    },
    {
      name: "Dekorasi & Lighting",
      icon: "flower",
      percentage: decorPct,
      color: "#C87D55",
    },
    {
      name: "Dokumentasi",
      icon: "camera",
      percentage: photoPct,
      color: "#8E9E93",
    },
    {
      name: "Busana & MUA",
      icon: "shirt",
      percentage: attirePct,
      color: "#D4A359",
    },
    {
      name: "Seserahan, Mahar & WO",
      icon: "gift",
      percentage: seserahanPct,
      color: "#B98A68",
    },
    {
      name: "Dana Darurat & Lainnya",
      icon: "shield",
      percentage: emergencyPct,
      color: "#BEB8AC",
    },
  ];

  return raw.map((item) => ({
    ...item,
    amount: Math.round((safeBudget * item.percentage) / 100),
  }));
}

export function buildDefaultHoneymoonCategories(honeymoonBudget: number) {
  const safe = Math.max(0, honeymoonBudget);
  return [
    {
      phase: "HONEYMOON_PRE" as const,
      name: "Tiket Pesawat & Transport",
      icon: "plane",
      allocated_amount: Math.round(safe * 0.35),
      sort_order: 1,
    },
    {
      phase: "HONEYMOON_PRE" as const,
      name: "Hotel & Akomodasi",
      icon: "hotel",
      allocated_amount: Math.round(safe * 0.3),
      sort_order: 2,
    },
    {
      phase: "HONEYMOON_PRE" as const,
      name: "Visa, Asuransi & Internet",
      icon: "file",
      allocated_amount: Math.round(safe * 0.1),
      sort_order: 3,
    },
    {
      phase: "HONEYMOON_ONTRIP" as const,
      name: "Kuliner & Jajan Harian",
      icon: "utensils",
      allocated_amount: Math.round(safe * 0.15),
      sort_order: 4,
    },
    {
      phase: "HONEYMOON_ONTRIP" as const,
      name: "Aktivitas & Oleh-Oleh",
      icon: "gift",
      allocated_amount: Math.round(safe * 0.1),
      sort_order: 5,
    },
  ];
}

export function buildDefaultHoneymoonChecklists(destination: string) {
  const destLabel = destination.trim() || "Tujuan";
  return [
    {
      title: `Paspor & Visa ${destLabel}`,
      category: "DOCUMENT",
      sort_order: 1,
    },
    {
      title: "Tiket Pesawat Pulang-Pergi",
      category: "BOOKING",
      sort_order: 2,
    },
    {
      title: `Booking Hotel di ${destLabel}`,
      category: "BOOKING",
      sort_order: 3,
    },
    {
      title: "Transport Lokal / eSIM Internet",
      category: "PACKING",
      sort_order: 4,
    },
  ];
}

export function calculateTripDays(
  startDate: string | null | undefined,
  endDate: string | null | undefined
): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  const diffDays =
    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diffDays);
}

export function convertToIDR(
  foreignAmount: number,
  exchangeRate: number
): number {
  if (!Number.isFinite(foreignAmount) || !Number.isFinite(exchangeRate)) {
    return 0;
  }
  return Math.round(Math.max(0, foreignAmount) * Math.max(0, exchangeRate));
}

export function formatForeignCurrency(
  amount: number,
  currencyCode: string
): string {
  const opt = getCurrencyOption(currencyCode);
  const hasDecimals = ["USD", "EUR", "SGD", "AUD", "MYR"].includes(opt.code);
  const formatted = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: hasDecimals ? 2 : 0,
  }).format(amount);
  return `${opt.symbol}${formatted}`;
}
