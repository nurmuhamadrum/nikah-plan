-- ============================================================================
-- NikahPlan - Migration 003: Admin CMS, Dynamic Pricing, Promo Codes & Web Push
-- ============================================================================

-- 1. TAMBAH KOLOM is_admin PADA profiles & PERKETAT RLS UPDATE
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE NOT NULL;

DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
CREATE POLICY "profiles_update_self"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid()
        AND has_paid = (SELECT p.has_paid FROM public.profiles p WHERE p.id = auth.uid())
        AND is_admin = (SELECT p.is_admin FROM public.profiles p WHERE p.id = auth.uid())
    );

-- 2. TABEL PRICING PLANS (Dikelola oleh Admin di /admin)
CREATE TABLE IF NOT EXISTS public.pricing_plans (
    id public.plan_type PRIMARY KEY,
    name TEXT NOT NULL,
    tagline TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 10000),
    original_price NUMERIC(12, 2) NOT NULL CHECK (original_price >= 0),
    badge TEXT,
    recommended BOOLEAN DEFAULT FALSE NOT NULL,
    features JSONB DEFAULT '[]'::jsonb NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

DROP TRIGGER IF EXISTS trg_pricing_plans_updated_at ON public.pricing_plans;
CREATE TRIGGER trg_pricing_plans_updated_at
    BEFORE UPDATE ON public.pricing_plans
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pricing_plans_public_read" ON public.pricing_plans;
CREATE POLICY "pricing_plans_public_read"
    ON public.pricing_plans FOR SELECT
    TO anon, authenticated
    USING (TRUE);

-- Seed default pricing plans
INSERT INTO public.pricing_plans (id, name, tagline, price, original_price, badge, recommended, features, is_active)
VALUES
(
    'WEDDING_ONLY',
    'Wedding Only Pass',
    'Fokus rapi mengatur anggaran & vendor hingga hari H.',
    99000,
    149000,
    NULL,
    FALSE,
    '[
      {"label": "Akses seumur hidup (1x bayar untuk 2 akun pasangan)", "included": true},
      {"label": "Smart Wedding Budget Allocator & Split Funding", "included": true},
      {"label": "Pelacak Vendor, Multi-Termin DP & Bukti Bayar", "included": true},
      {"label": "Angpao & Gift Tracker", "included": true},
      {"label": "Mode Offline PWA + Sinkronisasi Real-time", "included": true},
      {"label": "Honeymoon Planner & Dompet Multi-Mata Uang", "included": false},
      {"label": "Kalkulator Uang Jajan Harian & Checklist Travel", "included": false}
    ]'::jsonb,
    TRUE
),
(
    'COMPLETE_PASS',
    'Complete Couple Pass',
    'Ekosistem lengkap dari akad, resepsi, hingga bulan madu.',
    149000,
    249000,
    'Paling Populer',
    TRUE,
    '[
      {"label": "Akses seumur hidup (1x bayar untuk 2 akun pasangan)", "included": true},
      {"label": "Smart Wedding Budget Allocator & Split Funding", "included": true},
      {"label": "Pelacak Vendor, Multi-Termin DP & Bukti Bayar", "included": true},
      {"label": "Angpao Bridge langsung ke Dompet Honeymoon", "included": true},
      {"label": "Mode Offline PWA + Sinkronisasi Real-time", "included": true},
      {"label": "Honeymoon Planner & Dompet Multi-Mata Uang", "included": true},
      {"label": "Kalkulator Uang Jajan Harian & Checklist Travel", "included": true}
    ]'::jsonb,
    TRUE
)
ON CONFLICT (id) DO NOTHING;

-- 3. TABEL PROMO CODES (Dikelola oleh Admin di /admin)
CREATE TABLE IF NOT EXISTS public.promo_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(32) UNIQUE NOT NULL,
    discount_type VARCHAR(16) NOT NULL CHECK (discount_type IN ('PERCENT', 'FIXED')),
    discount_value NUMERIC(12, 2) NOT NULL CHECK (discount_value > 0),
    description TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    max_uses INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
    used_count INTEGER DEFAULT 0 NOT NULL CHECK (used_count >= 0),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON public.promo_codes(code);

DROP TRIGGER IF EXISTS trg_promo_codes_updated_at ON public.promo_codes;
CREATE TRIGGER trg_promo_codes_updated_at
    BEFORE UPDATE ON public.promo_codes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Validasi promo dilakukan lewat server route (/api/promo/validate & /api/checkout)
-- sehingga tidak perlu mengekspos daftar semua promo ke publik secara langsung.

INSERT INTO public.promo_codes (code, discount_type, discount_value, description, is_active)
VALUES
    ('NIKAH2026', 'PERCENT', 15, 'Diskon 15% Spesial Calon Pengantin 2026', TRUE),
    ('COUPLE20', 'FIXED', 20000, 'Potongan langsung Rp20.000', TRUE),
    ('EARLYBIRD', 'PERCENT', 20, 'Diskon 20% Early Bird', TRUE)
ON CONFLICT (code) DO NOTHING;

-- 4. TABEL SITE CONTENTS (CMS Landing Hero, Banner Promo, Kurs Default)
CREATE TABLE IF NOT EXISTS public.site_contents (
    key VARCHAR(64) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

DROP TRIGGER IF EXISTS trg_site_contents_updated_at ON public.site_contents;
CREATE TRIGGER trg_site_contents_updated_at
    BEFORE UPDATE ON public.site_contents
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.site_contents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_contents_public_read" ON public.site_contents;
CREATE POLICY "site_contents_public_read"
    ON public.site_contents FOR SELECT
    TO anon, authenticated
    USING (TRUE);

INSERT INTO public.site_contents (key, value)
VALUES
(
    'hero',
    '{
      "badge": "From \"I Do\" to Honeymoon • PWA Offline-First",
      "headline": "Atur Budget Nikah & Bulan Madu",
      "headlineAccent": "Tanpa Drama",
      "headlineSuffix": "Bersama Pasangan",
      "subheadline": "Lacak estimasi vs harga deal vendor, jadwalkan termin DP, pisahkan porsi dana keluarga, hingga ubah saldo angpao menjadi dompet honeymoon — semuanya tersinkronisasi rapi di HP Anda berdua.",
      "primaryCta": "Aktifkan Couple Pass",
      "secondaryCta": "Lihat Paket Couple Pass"
    }'::jsonb
),
(
    'announcement',
    '{
      "enabled": true,
      "text": "Promo Calon Pengantin 2026: Gunakan kode NIKAH2026 saat checkout untuk diskon 15%!",
      "promoCode": "NIKAH2026"
    }'::jsonb
),
(
    'default_exchange_rates',
    '{
      "JPY": 105,
      "SGD": 12000,
      "THB": 465,
      "MYR": 3650,
      "KRW": 11.5,
      "EUR": 17200,
      "USD": 16000,
      "AUD": 10500
    }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- 5. TABEL PUSH SUBSCRIPTIONS (Web Push Notifications H-3 Jatuh Tempo)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    endpoint TEXT UNIQUE NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_workspace ON public.push_subscriptions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON public.push_subscriptions(user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_subscriptions_select_own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_select_own"
    ON public.push_subscriptions FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "push_subscriptions_insert_own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_insert_own"
    ON public.push_subscriptions FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid()
        AND public.is_workspace_member(workspace_id)
    );

DROP POLICY IF EXISTS "push_subscriptions_delete_own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_delete_own"
    ON public.push_subscriptions FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());
