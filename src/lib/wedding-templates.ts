/**
 * Katalog Template 10 Kategori & 51 Sub-Item Pernikahan Indonesia
 * serta 3 Skenario Anggaran (30 Jt / 50 Jt / 80 Jt) berdasarkan referensi XLSX.
 */

export interface StandardWeddingCategoryTemplate {
  key: string;
  name: string;
  icon: string;
  recommendation: string;
  /** Bobot persentase default (total = 100%) berdasarkan simulasi 50 Jt */
  defaultPct: number;
  /** 51 sub-item siap pakai */
  defaultItems: string[];
}

export const STANDARD_WEDDING_CATEGORIES: StandardWeddingCategoryTemplate[] = [
  {
    key: "venue_dekor",
    name: "Venue & Dekorasi",
    icon: "utensils",
    recommendation: "Prioritas utama — negosiasi early booking",
    defaultPct: 26,
    defaultItems: [
      "Sewa Gedung",
      "Dekorasi Pelaminan",
      "Dekorasi Meja Tamu",
      "Lighting",
      "Sound System",
      "Genset",
    ],
  },
  {
    key: "catering",
    name: "Catering & Konsumsi",
    icon: "utensils",
    recommendation: "Hitung per kepala × jumlah tamu",
    defaultPct: 28,
    defaultItems: [
      "Catering Tamu",
      "Catering Keluarga",
      "Kue Pengantin",
      "Minuman",
      "Snack Box",
      "Biaya Sewa Peralatan Makan",
    ],
  },
  {
    key: "dokumentasi",
    name: "Fotografer & Videografer",
    icon: "camera",
    recommendation: "Book 6–12 bulan sebelum hari H",
    defaultPct: 9,
    defaultItems: [
      "Fotografer Akad",
      "Fotografer Resepsi",
      "Videografer",
      "Drone",
      "Album Foto",
      "Edit Video Highlight",
    ],
  },
  {
    key: "busana",
    name: "Busana Pengantin",
    icon: "shirt",
    recommendation: "Sewa lebih hemat 60–80% dibanding beli",
    defaultPct: 7,
    defaultItems: [
      "Gaun Pengantin",
      "Jas Pengantin",
      "Sewa Busana Adat",
      "Aksesoris",
      "Sepatu Pengantin",
      "Busana Keluarga",
    ],
  },
  {
    key: "entertainment",
    name: "Entertainment & MC",
    icon: "music",
    recommendation: "Bisa digabung paket dengan vendor musik",
    defaultPct: 5,
    defaultItems: [
      "MC / Pembawa Acara",
      "Band / Musik Live",
      "DJ",
      "Traditional Performer",
      "Sulap / Hiburan",
    ],
  },
  {
    key: "undangan_souvenir",
    name: "Undangan & Souvenir",
    icon: "mail",
    recommendation: "E-invitation hemat hingga 70%",
    defaultPct: 4,
    defaultItems: [
      "Undangan Cetak",
      "E-Invitation",
      "Souvenir Tamu",
      "Amplop / Kotak Souvenir",
      "Stempel / Label",
    ],
  },
  {
    key: "transportasi",
    name: "Transportasi",
    icon: "car",
    recommendation: "Minimal 2 unit mobil pengantin / keluarga",
    defaultPct: 3,
    defaultItems: [
      "Mobil Pengantin",
      "Bus Keluarga",
      "Dekorasi Kendaraan",
      "Bensin & Parkir",
    ],
  },
  {
    key: "makeup",
    name: "Make Up & Riasan",
    icon: "sparkles",
    recommendation: "Trial MUA 1–2 bulan sebelum hari H sangat disarankan",
    defaultPct: 5,
    defaultItems: [
      "MUA Pengantin",
      "MUA Ibu Pengantin",
      "MUA Bridesmaids",
      "Hair Stylist",
    ],
  },
  {
    key: "floral",
    name: "Bunga & Floral",
    icon: "flower",
    recommendation: "Artificial flowers lebih hemat untuk dekorasi",
    defaultPct: 3,
    defaultItems: [
      "Bouquet Pengantin",
      "Bunga Dekorasi",
      "Bunga Meja",
      "Corsage & Boutonniere",
    ],
  },
  {
    key: "lainnya",
    name: "Lain-lain & Dana Darurat",
    icon: "shield",
    recommendation: "Dana cadangan wajib 5–10% dari total budget",
    defaultPct: 10,
    defaultItems: [
      "Cincin Nikah",
      "Mahar",
      "Biaya KUA / Catatan Sipil",
      "Undangan Digital",
      "Honeymoon",
      "Dana Tak Terduga (10%)",
    ],
  },
];

export type ScenarioId = "BUDGET_30M" | "MID_50M" | "PREMIUM_80M";

export interface BudgetScenario {
  id: ScenarioId;
  name: string;
  badge: string;
  tagline: string;
  totalBudget: number;
  guestRecommendation: number;
  accentClass: string;
  /** Peta nominal persis per key kategori dari Sheet Scenario XLSX */
  allocations: Record<string, number>;
}

export const BUDGET_SCENARIOS: BudgetScenario[] = [
  {
    id: "BUDGET_30M",
    name: "Budget Nikah",
    badge: "Hemat & Intim",
    tagline: "Cocok untuk akad & resepsi intim ~150 tamu di aula/rumah.",
    totalBudget: 30_000_000,
    guestRecommendation: 150,
    accentClass: "border-sage/25 bg-sage-50/70 text-sage-800",
    allocations: {
      venue_dekor: 7_500_000,
      catering: 9_000_000,
      dokumentasi: 2_400_000,
      busana: 2_100_000,
      entertainment: 1_500_000,
      undangan_souvenir: 1_500_000,
      transportasi: 900_000,
      makeup: 1_500_000,
      floral: 1_200_000,
      lainnya: 2_400_000,
    },
  },
  {
    id: "MID_50M",
    name: "Menengah Nikah",
    badge: "Paling Populer",
    tagline: "Simulasi ideal < 50 Jt untuk 200 tamu, akad + resepsi 1 hari.",
    totalBudget: 50_000_000,
    guestRecommendation: 200,
    accentClass: "border-amberwarm/40 bg-amberwarm-light/60 text-sage-900",
    allocations: {
      venue_dekor: 14_000_000,
      catering: 14_000_000,
      dokumentasi: 4_500_000,
      busana: 3_500_000,
      entertainment: 2_500_000,
      undangan_souvenir: 2_000_000,
      transportasi: 1_500_000,
      makeup: 2_500_000,
      floral: 2_000_000,
      lainnya: 3_500_000,
    },
  },
  {
    id: "PREMIUM_80M",
    name: "Premium Nikah",
    badge: "Lega & Lengkap",
    tagline: "Ruang leluasa untuk 300–400 tamu dengan vendor pilihan utama.",
    totalBudget: 80_000_000,
    guestRecommendation: 350,
    accentClass: "border-terracotta/30 bg-terracotta-50/70 text-terracotta-800",
    allocations: {
      venue_dekor: 24_000_000,
      catering: 20_000_000,
      dokumentasi: 8_000_000,
      busana: 6_400_000,
      entertainment: 4_800_000,
      undangan_souvenir: 3_200_000,
      transportasi: 2_400_000,
      makeup: 4_000_000,
      floral: 3_200_000,
      lainnya: 4_000_000,
    },
  },
];

/**
 * Menghasilkan alokasi proporsional untuk 10 kategori standar pada nominal budget custom.
 */
export function buildScaledScenarioAllocations(totalBudget: number): {
  key: string;
  name: string;
  icon: string;
  allocatedAmount: number;
  percentage: number;
  recommendation: string;
}[] {
  const safe = Math.max(1_000_000, Math.round(totalBudget));
  const raw = STANDARD_WEDDING_CATEGORIES.map((cat) => ({
    key: cat.key,
    name: cat.name,
    icon: cat.icon,
    percentage: cat.defaultPct,
    recommendation: cat.recommendation,
    allocatedAmount: Math.round(((safe * cat.defaultPct) / 100) / 100_000) * 100_000,
  }));

  // Koreksi selisih pembulatan pada kategori terakhir agar total persis = safe
  const sum = raw.reduce((s, r) => s + r.allocatedAmount, 0);
  const diff = safe - sum;
  if (raw.length > 0 && diff !== 0) {
    raw[raw.length - 1].allocatedAmount = Math.max(
      0,
      raw[raw.length - 1].allocatedAmount + diff
    );
  }
  return raw;
}
