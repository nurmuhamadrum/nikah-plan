import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS, validatePromoCode, type PlanDefinition } from "@/lib/plans";
import type { PlanType, PricingPlanFeature } from "@/types/database";

export interface HeroContent {
  badge: string;
  headline: string;
  headlineAccent: string;
  headlineSuffix: string;
  subheadline: string;
  primaryCta: string;
  secondaryCta: string;
}

export interface AnnouncementContent {
  enabled: boolean;
  text: string;
  promoCode: string;
}

export interface SiteContentsBundle {
  hero: HeroContent;
  announcement: AnnouncementContent;
  defaultExchangeRates: Record<string, number>;
}

export const DEFAULT_HERO_CONTENT: HeroContent = {
  badge: 'From "I Do" to Honeymoon • PWA Offline-First',
  headline: "Atur Budget Nikah & Bulan Madu",
  headlineAccent: "Tanpa Drama",
  headlineSuffix: "Bersama Pasangan",
  subheadline:
    "Lacak estimasi vs harga deal vendor, jadwalkan termin DP, pisahkan porsi dana keluarga, hingga ubah saldo angpao menjadi dompet honeymoon — semuanya tersinkronisasi rapi di HP Anda berdua.",
  primaryCta: "Aktifkan Couple Pass",
  secondaryCta: "Lihat Paket Couple Pass",
};

export const DEFAULT_ANNOUNCEMENT_CONTENT: AnnouncementContent = {
  enabled: false,
  text: "Promo Calon Pengantin 2026: Gunakan kode NIKAH2026 saat checkout untuk diskon 15%!",
  promoCode: "NIKAH2026",
};

export const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
  JPY: 105,
  SGD: 12000,
  THB: 465,
  MYR: 3650,
  KRW: 11.5,
  EUR: 17200,
  USD: 16000,
  AUD: 10500,
};

/**
 * Mengambil konfigurasi harga & fitur paket dari tabel `pricing_plans` Supabase.
 * Jika tabel belum dimigrasi / env belum siap, fallback aman ke PLANS default.
 */
export async function getDynamicPricingPlans(): Promise<
  Record<PlanType, PlanDefinition>
> {
  const fallback: Record<PlanType, PlanDefinition> = {
    WEDDING_ONLY: { ...PLANS.WEDDING_ONLY },
    COMPLETE_PASS: { ...PLANS.COMPLETE_PASS },
  };

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return fallback;
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from("pricing_plans").select("*");
    if (error || !data || data.length === 0) {
      return fallback;
    }

    const result = { ...fallback };
    for (const row of data) {
      const features = Array.isArray(row.features)
        ? (row.features as PricingPlanFeature[])
        : fallback[row.id].features;

      result[row.id] = {
        id: row.id,
        name: row.name,
        tagline: row.tagline,
        price: Number(row.price),
        originalPrice: Number(row.original_price),
        badge: row.badge || undefined,
        recommended: Boolean(row.recommended),
        features,
      };
    }

    return result;
  } catch {
    return fallback;
  }
}

export function calculateUpgradePrice(
  plans: Record<PlanType, PlanDefinition>
): number {
  return Math.max(10000, plans.COMPLETE_PASS.price - plans.WEDDING_ONLY.price);
}

/**
 * Mengambil konten dinamis Landing Page (Hero, Announcement Banner, Kurs Default).
 */
export async function getDynamicSiteContents(): Promise<SiteContentsBundle> {
  const fallback: SiteContentsBundle = {
    hero: { ...DEFAULT_HERO_CONTENT },
    announcement: { ...DEFAULT_ANNOUNCEMENT_CONTENT },
    defaultExchangeRates: { ...DEFAULT_EXCHANGE_RATES },
  };

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return fallback;
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from("site_contents").select("*");
    if (error || !data || data.length === 0) {
      return fallback;
    }

    const map = new Map(data.map((r) => [r.key, r.value]));
    const heroRaw = map.get("hero") as Partial<HeroContent> | undefined;
    const annRaw = map.get("announcement") as
      | Partial<AnnouncementContent>
      | undefined;
    const ratesRaw = map.get("default_exchange_rates") as
      | Record<string, number>
      | undefined;

    return {
      hero: heroRaw ? { ...fallback.hero, ...heroRaw } : fallback.hero,
      announcement: annRaw
        ? { ...fallback.announcement, ...annRaw }
        : fallback.announcement,
      defaultExchangeRates: ratesRaw
        ? { ...fallback.defaultExchangeRates, ...ratesRaw }
        : fallback.defaultExchangeRates,
    };
  } catch {
    return fallback;
  }
}

/**
 * Memvalidasi kode promo secara dinamis dari tabel `promo_codes` di Supabase
 * (memeriksa aktif, tanggal kedaluwarsa, dan kuota pemakaian), dengan fallback aman.
 */
export async function validateDynamicPromoCode(
  rawCode: string | null | undefined,
  basePrice: number
): Promise<{
  valid: boolean;
  code: string | null;
  discountAmount: number;
  finalAmount: number;
  description?: string;
  reason?: string;
}> {
  if (!rawCode || !rawCode.trim()) {
    return { valid: false, code: null, discountAmount: 0, finalAmount: basePrice };
  }

  const normalized = rawCode.trim().toUpperCase();

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return validatePromoCode(normalized, basePrice);
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("promo_codes")
      .select("*")
      .eq("code", normalized)
      .maybeSingle();

    if (error) {
      return validatePromoCode(normalized, basePrice);
    }

    if (!data) {
      return {
        valid: false,
        code: null,
        discountAmount: 0,
        finalAmount: basePrice,
        reason: "Kode promo tidak ditemukan.",
      };
    }

    if (!data.is_active) {
      return {
        valid: false,
        code: null,
        discountAmount: 0,
        finalAmount: basePrice,
        reason: "Kode promo sedang tidak aktif.",
      };
    }

    if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
      return {
        valid: false,
        code: null,
        discountAmount: 0,
        finalAmount: basePrice,
        reason: "Kode promo sudah kedaluwarsa.",
      };
    }

    if (data.max_uses !== null && data.used_count >= data.max_uses) {
      return {
        valid: false,
        code: null,
        discountAmount: 0,
        finalAmount: basePrice,
        reason: "Kuota kode promo sudah habis.",
      };
    }

    const val = Number(data.discount_value) || 0;
    const discountAmount =
      data.discount_type === "PERCENT"
        ? Math.round((basePrice * Math.min(90, val)) / 100)
        : Math.min(val, Math.max(0, basePrice - 10000));

    return {
      valid: true,
      code: data.code,
      discountAmount,
      finalAmount: Math.max(10000, basePrice - discountAmount),
      description: data.description || `Diskon kode ${data.code}`,
    };
  } catch {
    return validatePromoCode(normalized, basePrice);
  }
}
