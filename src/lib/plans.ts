import type { PlanType } from "@/types/database";

export interface PlanDefinition {
  id: PlanType;
  name: string;
  tagline: string;
  price: number;
  originalPrice: number;
  badge?: string;
  recommended?: boolean;
  features: {
    label: string;
    included: boolean;
  }[];
}

export const PLANS: Record<PlanType, PlanDefinition> = {
  WEDDING_ONLY: {
    id: "WEDDING_ONLY",
    name: "Wedding Only Pass",
    tagline: "Fokus rapi mengatur anggaran & vendor hingga hari H.",
    price: 99000,
    originalPrice: 149000,
    features: [
      { label: "Akses seumur hidup (1x bayar untuk 2 akun pasangan)", included: true },
      { label: "Smart Wedding Budget Allocator & Split Funding", included: true },
      { label: "Pelacak Vendor, Multi-Termin DP & Bukti Bayar", included: true },
      { label: "Angpao & Gift Tracker", included: true },
      { label: "Mode Offline PWA + Sinkronisasi Real-time", included: true },
      { label: "Honeymoon Planner & Dompet Multi-Mata Uang", included: false },
      { label: "Kalkulator Uang Jajan Harian & Checklist Travel", included: false },
      { label: "Buat Undangan Online Sendiri (4 Tema + RSVP & Buku Tamu)", included: false },
    ],
  },
  COMPLETE_PASS: {
    id: "COMPLETE_PASS",
    name: "Complete Couple Pass",
    tagline: "Ekosistem lengkap dari akad, resepsi, undangan digital, hingga bulan madu.",
    price: 149000,
    originalPrice: 249000,
    badge: "Paling Populer",
    recommended: true,
    features: [
      { label: "Akses seumur hidup (1x bayar untuk 2 akun pasangan)", included: true },
      { label: "Smart Wedding Budget Allocator & Split Funding", included: true },
      { label: "Pelacak Vendor, Multi-Termin DP & Bukti Bayar", included: true },
      { label: "Angpao Bridge langsung ke Dompet Honeymoon", included: true },
      { label: "Mode Offline PWA + Sinkronisasi Real-time", included: true },
      { label: "Honeymoon Planner & Dompet Multi-Mata Uang", included: true },
      { label: "Kalkulator Uang Jajan Harian & Checklist Travel", included: true },
      { label: "Buat Undangan Online Sendiri (4 Tema + RSVP & Buku Tamu)", included: true },
    ],
  },
};

export interface PromoCodeRule {
  code: string;
  discountPercent?: number;
  discountFixed?: number;
  description: string;
}

const PROMO_CODES: Record<string, PromoCodeRule> = {
  NIKAH2026: {
    code: "NIKAH2026",
    discountPercent: 15,
    description: "Diskon 15% Spesial Calon Pengantin 2026",
  },
  COUPLE20: {
    code: "COUPLE20",
    discountFixed: 20000,
    description: "Potongan langsung Rp20.000",
  },
  EARLYBIRD: {
    code: "EARLYBIRD",
    discountPercent: 20,
    description: "Diskon 20% Early Bird",
  },
};

export function validatePromoCode(
  rawCode: string | null | undefined,
  basePrice: number
): {
  valid: boolean;
  code: string | null;
  discountAmount: number;
  finalAmount: number;
  description?: string;
} {
  if (!rawCode || !rawCode.trim()) {
    return { valid: false, code: null, discountAmount: 0, finalAmount: basePrice };
  }
  const normalized = rawCode.trim().toUpperCase();
  const rule = PROMO_CODES[normalized];
  if (!rule) {
    return { valid: false, code: null, discountAmount: 0, finalAmount: basePrice };
  }

  let discountAmount = 0;
  if (rule.discountPercent) {
    discountAmount = Math.round((basePrice * rule.discountPercent) / 100);
  } else if (rule.discountFixed) {
    discountAmount = Math.min(rule.discountFixed, basePrice - 10000);
  }

  return {
    valid: true,
    code: rule.code,
    discountAmount,
    finalAmount: Math.max(10000, basePrice - discountAmount),
    description: rule.description,
  };
}

export interface PreviewAllocationSlice {
  key: string;
  name: string;
  percentage: number;
  amount: number;
  color: string;
  locked?: boolean;
  tip: string;
}

/**
 * Menghitung simulasi alokasi anggaran pernikahan sesuai referensi UI NikahPlan
 * dan menyesuaikan porsi katering secara dinamis berdasarkan jumlah tamu (pax).
 */
export function calculateWeddingPreview(
  totalBudget: number,
  guestCount: number
): {
  slices: PreviewAllocationSlice[];
  costPerGuest: number;
  recommendedCateringPerPax: number;
  suggestedEmergencyFund: number;
} {
  // Penyesuaian halus porsi katering berdasarkan rasio tamu vs budget
  const costPerGuest = guestCount > 0 ? totalBudget / guestCount : 0;
  const cateringPct = costPerGuest < 350000 ? 50 : costPerGuest > 750000 ? 40 : 45;
  const decorPhotoPct = 25;
  const attireMuaPct = 15;
  const otherPct = 100 - cateringPct - decorPhotoPct - attireMuaPct;

  const slices: PreviewAllocationSlice[] = [
    {
      key: "catering_venue",
      name: "Katering & Venue",
      percentage: cateringPct,
      amount: Math.round((totalBudget * cateringPct) / 100),
      color: "#3D5245",
      locked: false,
      tip: `Estimasi ±Rp${Math.round(((totalBudget * (cateringPct / 100)) * 0.65) / Math.max(1, guestCount)).toLocaleString("id-ID")}/pax untuk makanan & gedung`,
    },
    {
      key: "decor_photo",
      name: "Dekorasi & Dokumentasi",
      percentage: decorPhotoPct,
      amount: Math.round((totalBudget * decorPhotoPct) / 100),
      color: "#C87D55",
      locked: false,
      tip: "Termasuk pelaminan, lighting, foto & video liputan hari H",
    },
    {
      key: "attire_mua",
      name: "Pakaian & Rias",
      percentage: attireMuaPct,
      amount: Math.round((totalBudget * attireMuaPct) / 100),
      color: "#D4A359",
      locked: true,
      tip: "Rincian MUA pengantin, busana keluarga & seragam panitia",
    },
    {
      key: "others",
      name: "Seserahan, WO & Dana Darurat",
      percentage: otherPct,
      amount: Math.round((totalBudget * otherPct) / 100),
      color: "#BEB8AC",
      locked: true,
      tip: "Termasuk cadangan 10% untuk biaya tak terduga & angpao bridge",
    },
  ];

  return {
    slices,
    costPerGuest: Math.round(costPerGuest),
    recommendedCateringPerPax: Math.round(
      ((totalBudget * (cateringPct / 100)) * 0.65) / Math.max(1, guestCount)
    ),
    suggestedEmergencyFund: Math.round(totalBudget * 0.1),
  };
}
