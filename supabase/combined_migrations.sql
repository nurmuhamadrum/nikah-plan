-- ============================================================================
-- NikahPlan - Migration 001: Initial Database Schema
-- Compatible with PostgreSQL 15+ / Supabase
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE public.plan_type AS ENUM ('WEDDING_ONLY', 'COMPLETE_PASS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.payment_status AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.workspace_role AS ENUM ('OWNER', 'PARTNER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.funding_source AS ENUM ('JOINT', 'GROOM_FAMILY', 'BRIDE_FAMILY', 'ANGPAO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.budget_phase AS ENUM ('WEDDING', 'HONEYMOON_PRE', 'HONEYMOON_ONTRIP');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. WORKSPACES (Shared Space untuk Pasangan)
-- Dibuat sebelum foreign key di profiles agar dapat direferensikan dengan bersih
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    couple_title TEXT NOT NULL,
    wedding_date DATE,
    guest_estimate INTEGER DEFAULT 300 CHECK (guest_estimate >= 0),
    wedding_budget_target NUMERIC(15, 2) DEFAULT 0 CHECK (wedding_budget_target >= 0),
    honeymoon_destination TEXT,
    honeymoon_start_date DATE,
    honeymoon_end_date DATE,
    honeymoon_currency VARCHAR(5) DEFAULT 'IDR' NOT NULL,
    honeymoon_exchange_rate NUMERIC(12, 4) DEFAULT 1.0000 NOT NULL CHECK (honeymoon_exchange_rate > 0),
    honeymoon_budget_target NUMERIC(15, 2) DEFAULT 0 CHECK (honeymoon_budget_target >= 0),
    plan public.plan_type NOT NULL,
    invite_code VARCHAR(12) UNIQUE NOT NULL,
    onboarding_completed BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. USERS PROFILE (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    has_paid BOOLEAN DEFAULT FALSE NOT NULL,
    active_workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. PAYMENT TRANSACTIONS (In-App Payment Gateway Records)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    order_id TEXT UNIQUE NOT NULL,
    plan public.plan_type NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    promo_code TEXT,
    status public.payment_status DEFAULT 'PENDING' NOT NULL,
    payment_method TEXT,
    snap_token TEXT,
    paid_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. WORKSPACE MEMBERS (Maksimal 2 user per workspace: Owner & Partner)
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role public.workspace_role NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(workspace_id, user_id)
);

-- 7. BUDGET CATEGORIES
CREATE TABLE IF NOT EXISTS public.budget_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    phase public.budget_phase NOT NULL,
    name TEXT NOT NULL,
    icon TEXT,
    allocated_amount NUMERIC(15, 2) DEFAULT 0 CHECK (allocated_amount >= 0),
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. BUDGET ITEMS / VENDORS
CREATE TABLE IF NOT EXISTS public.budget_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.budget_categories(id) ON DELETE CASCADE,
    phase public.budget_phase NOT NULL,
    title TEXT NOT NULL,
    vendor_contact TEXT,
    notes TEXT,
    estimated_cost NUMERIC(15, 2) DEFAULT 0 CHECK (estimated_cost >= 0),
    deal_cost NUMERIC(15, 2) DEFAULT 0 CHECK (deal_cost >= 0),
    currency VARCHAR(5) DEFAULT 'IDR' NOT NULL,
    foreign_amount NUMERIC(15, 2),
    is_booked BOOLEAN DEFAULT FALSE NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. PAYMENT SCHEDULES & TERMIN (Cicilan DP, Termin, Pelunasan)
CREATE TABLE IF NOT EXISTS public.item_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.budget_items(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
    funding public.funding_source DEFAULT 'JOINT' NOT NULL,
    due_date DATE,
    is_paid BOOLEAN DEFAULT FALSE NOT NULL,
    paid_date DATE,
    receipt_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 10. ANGPAO & GIFT TRACKER (Jembatan Wedding ke Honeymoon)
CREATE TABLE IF NOT EXISTS public.wedding_gifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    gift_type VARCHAR(20) DEFAULT 'CASH' NOT NULL CHECK (gift_type IN ('CASH', 'TRANSFER', 'PHYSICAL')),
    amount NUMERIC(15, 2) DEFAULT 0 CHECK (amount >= 0),
    allocated_to VARCHAR(20) DEFAULT 'UNALLOCATED' NOT NULL CHECK (allocated_to IN ('UNALLOCATED', 'WEDDING_COVER', 'HONEYMOON_FUND')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 11. HONEYMOON PRE-TRIP CHECKLIST (PRD Section 4.4)
CREATE TABLE IF NOT EXISTS public.honeymoon_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category VARCHAR(30) DEFAULT 'DOCUMENT' NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE NOT NULL,
    linked_item_id UUID REFERENCES public.budget_items(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- INDEXES FOR QUERY PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_active_workspace ON public.profiles(active_workspace_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_order_id ON public.subscriptions(order_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_invite_code ON public.workspaces(invite_code);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_categories_workspace_phase ON public.budget_categories(workspace_id, phase);
CREATE INDEX IF NOT EXISTS idx_budget_items_workspace_category ON public.budget_items(workspace_id, category_id);
CREATE INDEX IF NOT EXISTS idx_item_payments_workspace_item ON public.item_payments(workspace_id, item_id);
CREATE INDEX IF NOT EXISTS idx_item_payments_due_date ON public.item_payments(workspace_id, is_paid, due_date);
CREATE INDEX IF NOT EXISTS idx_wedding_gifts_workspace ON public.wedding_gifts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_honeymoon_checklists_workspace ON public.honeymoon_checklists(workspace_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- A. Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_workspaces_updated_at ON public.workspaces;
CREATE TRIGGER trg_workspaces_updated_at
    BEFORE UPDATE ON public.workspaces
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_budget_items_updated_at ON public.budget_items;
CREATE TRIGGER trg_budget_items_updated_at
    BEFORE UPDATE ON public.budget_items
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_item_payments_updated_at ON public.item_payments;
CREATE TRIGGER trg_item_payments_updated_at
    BEFORE UPDATE ON public.item_payments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_honeymoon_checklists_updated_at ON public.honeymoon_checklists;
CREATE TRIGGER trg_honeymoon_checklists_updated_at
    BEFORE UPDATE ON public.honeymoon_checklists
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- B. Auto-create profile when a new Supabase Auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    derived_name TEXT;
BEGIN
    derived_name := COALESCE(
        NEW.raw_user_meta_data ->> 'full_name',
        NEW.raw_user_meta_data ->> 'name',
        split_part(COALESCE(NEW.email, 'Pengguna'), '@', 1)
    );

    INSERT INTO public.profiles (id, full_name, email, avatar_url, has_paid)
    VALUES (
        NEW.id,
        derived_name,
        COALESCE(NEW.email, ''),
        NEW.raw_user_meta_data ->> 'avatar_url',
        FALSE
    )
    ON CONFLICT (id) DO UPDATE
    SET
        email = EXCLUDED.email,
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        updated_at = NOW();

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- C. Enforce maximum 2 members per workspace (1 Owner + 1 Partner)
CREATE OR REPLACE FUNCTION public.enforce_max_workspace_members()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    member_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO member_count
    FROM public.workspace_members
    WHERE workspace_id = NEW.workspace_id;

    IF member_count >= 2 THEN
        RAISE EXCEPTION 'Workspace sudah penuh (maksimal 2 anggota: Owner & Partner).'
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_max_workspace_members ON public.workspace_members;
CREATE TRIGGER trg_enforce_max_workspace_members
    BEFORE INSERT ON public.workspace_members
    FOR EACH ROW EXECUTE FUNCTION public.enforce_max_workspace_members();

-- D. Enable Realtime for collaborative sync between Owner & Partner
ALTER PUBLICATION supabase_realtime ADD TABLE public.workspaces;
ALTER PUBLICATION supabase_realtime ADD TABLE public.budget_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.budget_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.item_payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wedding_gifts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.honeymoon_checklists;


-- ============================================================================
-- END OF MIGRATION 001 / START OF MIGRATION 002
-- ============================================================================


-- ============================================================================
-- NikahPlan - Migration 002: Row-Level Security (RLS) Policies & Storage Rules
-- Prinsip: Setiap data hanya bisa diakses oleh anggota workspace_id yang sah.
-- ============================================================================

-- 1. SECURITY DEFINER HELPER FUNCTIONS (Menghindari infinite recursion RLS)
CREATE OR REPLACE FUNCTION public.is_workspace_member(target_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.workspace_members wm
        WHERE wm.workspace_id = target_workspace_id
          AND wm.user_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_owner(target_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.workspace_members wm
        WHERE wm.workspace_id = target_workspace_id
          AND wm.user_id = auth.uid()
          AND wm.role = 'OWNER'
    );
$$;

CREATE OR REPLACE FUNCTION public.shares_workspace_with(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.workspace_members wm1
        JOIN public.workspace_members wm2
          ON wm1.workspace_id = wm2.workspace_id
        WHERE wm1.user_id = auth.uid()
          AND wm2.user_id = target_user_id
    );
$$;

-- 2. ENABLE ROW LEVEL SECURITY ON ALL PUBLIC TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.honeymoon_checklists ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. POLICIES: profiles
-- ============================================================================
-- User dapat melihat profilnya sendiri dan profil pasangannya dalam workspace yang sama
DROP POLICY IF EXISTS "profiles_select_self_or_partner" ON public.profiles;
CREATE POLICY "profiles_select_self_or_partner"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (
        id = auth.uid()
        OR public.shares_workspace_with(id)
    );

-- User hanya dapat memperbarui nama/avatar miliknya sendiri (bukan memalsukan has_paid)
DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
CREATE POLICY "profiles_update_self"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid()
        AND has_paid = (SELECT p.has_paid FROM public.profiles p WHERE p.id = auth.uid())
    );

-- ============================================================================
-- 4. POLICIES: subscriptions
-- ============================================================================
-- User hanya bisa melihat riwayat transaksinya sendiri.
-- Insert/Update transaksi dilakukan via server API (service_role) agar aman dari manipulasi klien.
DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;
CREATE POLICY "subscriptions_select_own"
    ON public.subscriptions FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- ============================================================================
-- 5. POLICIES: workspaces
-- ============================================================================
-- Hanya anggota sah (Owner / Partner) yang bisa membaca dan mengubah workspace
DROP POLICY IF EXISTS "workspaces_select_member" ON public.workspaces;
CREATE POLICY "workspaces_select_member"
    ON public.workspaces FOR SELECT
    TO authenticated
    USING (public.is_workspace_member(id));

DROP POLICY IF EXISTS "workspaces_update_member" ON public.workspaces;
CREATE POLICY "workspaces_update_member"
    ON public.workspaces FOR UPDATE
    TO authenticated
    USING (public.is_workspace_member(id))
    WITH CHECK (public.is_workspace_member(id));

DROP POLICY IF EXISTS "workspaces_delete_owner_only" ON public.workspaces;
CREATE POLICY "workspaces_delete_owner_only"
    ON public.workspaces FOR DELETE
    TO authenticated
    USING (public.is_workspace_owner(id));

-- ============================================================================
-- 6. POLICIES: workspace_members
-- ============================================================================
-- Anggota bisa melihat daftar anggota di workspace-nya sendiri
DROP POLICY IF EXISTS "workspace_members_select_member" ON public.workspace_members;
CREATE POLICY "workspace_members_select_member"
    ON public.workspace_members FOR SELECT
    TO authenticated
    USING (public.is_workspace_member(workspace_id));

-- Hanya Owner yang dapat mencabut anggota Partner (jika diperlukan)
DROP POLICY IF EXISTS "workspace_members_delete_owner" ON public.workspace_members;
CREATE POLICY "workspace_members_delete_owner"
    ON public.workspace_members FOR DELETE
    TO authenticated
    USING (
        public.is_workspace_owner(workspace_id)
        AND role = 'PARTNER'
    );

-- ============================================================================
-- 7. POLICIES: budget_categories
-- ============================================================================
DROP POLICY IF EXISTS "budget_categories_select_member" ON public.budget_categories;
CREATE POLICY "budget_categories_select_member"
    ON public.budget_categories FOR SELECT
    TO authenticated
    USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "budget_categories_insert_member" ON public.budget_categories;
CREATE POLICY "budget_categories_insert_member"
    ON public.budget_categories FOR INSERT
    TO authenticated
    WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "budget_categories_update_member" ON public.budget_categories;
CREATE POLICY "budget_categories_update_member"
    ON public.budget_categories FOR UPDATE
    TO authenticated
    USING (public.is_workspace_member(workspace_id))
    WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "budget_categories_delete_member" ON public.budget_categories;
CREATE POLICY "budget_categories_delete_member"
    ON public.budget_categories FOR DELETE
    TO authenticated
    USING (public.is_workspace_member(workspace_id));

-- ============================================================================
-- 8. POLICIES: budget_items
-- ============================================================================
DROP POLICY IF EXISTS "budget_items_select_member" ON public.budget_items;
CREATE POLICY "budget_items_select_member"
    ON public.budget_items FOR SELECT
    TO authenticated
    USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "budget_items_insert_member" ON public.budget_items;
CREATE POLICY "budget_items_insert_member"
    ON public.budget_items FOR INSERT
    TO authenticated
    WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "budget_items_update_member" ON public.budget_items;
CREATE POLICY "budget_items_update_member"
    ON public.budget_items FOR UPDATE
    TO authenticated
    USING (public.is_workspace_member(workspace_id))
    WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "budget_items_delete_member" ON public.budget_items;
CREATE POLICY "budget_items_delete_member"
    ON public.budget_items FOR DELETE
    TO authenticated
    USING (public.is_workspace_member(workspace_id));

-- ============================================================================
-- 9. POLICIES: item_payments
-- ============================================================================
DROP POLICY IF EXISTS "item_payments_select_member" ON public.item_payments;
CREATE POLICY "item_payments_select_member"
    ON public.item_payments FOR SELECT
    TO authenticated
    USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "item_payments_insert_member" ON public.item_payments;
CREATE POLICY "item_payments_insert_member"
    ON public.item_payments FOR INSERT
    TO authenticated
    WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "item_payments_update_member" ON public.item_payments;
CREATE POLICY "item_payments_update_member"
    ON public.item_payments FOR UPDATE
    TO authenticated
    USING (public.is_workspace_member(workspace_id))
    WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "item_payments_delete_member" ON public.item_payments;
CREATE POLICY "item_payments_delete_member"
    ON public.item_payments FOR DELETE
    TO authenticated
    USING (public.is_workspace_member(workspace_id));

-- ============================================================================
-- 10. POLICIES: wedding_gifts
-- ============================================================================
DROP POLICY IF EXISTS "wedding_gifts_select_member" ON public.wedding_gifts;
CREATE POLICY "wedding_gifts_select_member"
    ON public.wedding_gifts FOR SELECT
    TO authenticated
    USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "wedding_gifts_insert_member" ON public.wedding_gifts;
CREATE POLICY "wedding_gifts_insert_member"
    ON public.wedding_gifts FOR INSERT
    TO authenticated
    WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "wedding_gifts_update_member" ON public.wedding_gifts;
CREATE POLICY "wedding_gifts_update_member"
    ON public.wedding_gifts FOR UPDATE
    TO authenticated
    USING (public.is_workspace_member(workspace_id))
    WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "wedding_gifts_delete_member" ON public.wedding_gifts;
CREATE POLICY "wedding_gifts_delete_member"
    ON public.wedding_gifts FOR DELETE
    TO authenticated
    USING (public.is_workspace_member(workspace_id));

-- ============================================================================
-- 11. POLICIES: honeymoon_checklists
-- ============================================================================
DROP POLICY IF EXISTS "honeymoon_checklists_select_member" ON public.honeymoon_checklists;
CREATE POLICY "honeymoon_checklists_select_member"
    ON public.honeymoon_checklists FOR SELECT
    TO authenticated
    USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "honeymoon_checklists_insert_member" ON public.honeymoon_checklists;
CREATE POLICY "honeymoon_checklists_insert_member"
    ON public.honeymoon_checklists FOR INSERT
    TO authenticated
    WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "honeymoon_checklists_update_member" ON public.honeymoon_checklists;
CREATE POLICY "honeymoon_checklists_update_member"
    ON public.honeymoon_checklists FOR UPDATE
    TO authenticated
    USING (public.is_workspace_member(workspace_id))
    WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "honeymoon_checklists_delete_member" ON public.honeymoon_checklists;
CREATE POLICY "honeymoon_checklists_delete_member"
    ON public.honeymoon_checklists FOR DELETE
    TO authenticated
    USING (public.is_workspace_member(workspace_id));

-- ============================================================================
-- 12. SUPABASE STORAGE BUCKET & RLS: receipts (Bukti Pembayaran Vendor)
-- Format path file: <workspace_id>/<payment_id>-<timestamp>.webp
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'receipts',
    'receipts',
    FALSE,
    5242880, -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "receipts_select_workspace_member" ON storage.objects;
CREATE POLICY "receipts_select_workspace_member"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'receipts'
        AND public.is_workspace_member(((storage.foldername(name))[1])::UUID)
    );

DROP POLICY IF EXISTS "receipts_insert_workspace_member" ON storage.objects;
CREATE POLICY "receipts_insert_workspace_member"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'receipts'
        AND public.is_workspace_member(((storage.foldername(name))[1])::UUID)
    );

DROP POLICY IF EXISTS "receipts_delete_workspace_member" ON storage.objects;
CREATE POLICY "receipts_delete_workspace_member"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'receipts'
        AND public.is_workspace_member(((storage.foldername(name))[1])::UUID)
    );


-- ============================================================================
-- END OF MIGRATION 002 / START OF MIGRATION 003
-- ============================================================================


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


-- ============================================================================
-- END OF MIGRATION 003 / START OF MIGRATION 004
-- ============================================================================


-- ============================================================================
-- NikahPlan - Migration 004: Digital Wedding Invitation Builder (COMPLETE_PASS)
-- Menambahkan tabel wedding_invitations, invitation_rsvps, storage bucket publik
-- `invitations`, dan pembaruan daftar fitur paket Complete Couple Pass.
-- ============================================================================

-- 1. HELPER FUNCTION: Cek apakah workspace berpaket COMPLETE_PASS
CREATE OR REPLACE FUNCTION public.is_complete_pass_workspace(target_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.workspaces w
        WHERE w.id = target_workspace_id
          AND w.plan = 'COMPLETE_PASS'
    );
$$;

-- 2. TABEL WEDDING INVITATIONS (1 Undangan Digital per Workspace)
CREATE TABLE IF NOT EXISTS public.wedding_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID UNIQUE NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    slug VARCHAR(64) UNIQUE NOT NULL,
    is_published BOOLEAN DEFAULT FALSE NOT NULL,
    theme VARCHAR(24) DEFAULT 'BOTANICAL_SAGE' NOT NULL CHECK (
        theme IN ('BOTANICAL_SAGE', 'WARM_TERRACOTTA', 'CLASSIC_GOLD', 'MIDNIGHT_GARDEN')
    ),

    -- Profil Mempelai Pria
    groom_name TEXT NOT NULL DEFAULT '',
    groom_full_name TEXT NOT NULL DEFAULT '',
    groom_parents TEXT NOT NULL DEFAULT '',
    groom_instagram TEXT,

    -- Profil Mempelai Wanita
    bride_name TEXT NOT NULL DEFAULT '',
    bride_full_name TEXT NOT NULL DEFAULT '',
    bride_parents TEXT NOT NULL DEFAULT '',
    bride_instagram TEXT,

    -- Pembuka & Cover
    opening_quote TEXT NOT NULL DEFAULT 'Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan hidup dari jenismu sendiri supaya kamu merasa tenteram kepadanya, dan dijadikan-Nya di antaramu rasa kasih dan sayang.',
    quote_source TEXT NOT NULL DEFAULT 'QS. Ar-Rum: 21',
    cover_photo_url TEXT,

    -- Acara Akad Nikah
    akad_date DATE,
    akad_time TEXT NOT NULL DEFAULT '08:00 - 10:00 WIB',
    akad_venue TEXT NOT NULL DEFAULT '',
    akad_address TEXT NOT NULL DEFAULT '',
    akad_maps_url TEXT,

    -- Acara Resepsi
    resepsi_date DATE,
    resepsi_time TEXT NOT NULL DEFAULT '11:00 - 14:00 WIB',
    resepsi_venue TEXT NOT NULL DEFAULT '',
    resepsi_address TEXT NOT NULL DEFAULT '',
    resepsi_maps_url TEXT,

    -- Kisah Cinta, Amplop Digital & Galeri (JSONB)
    love_stories JSONB DEFAULT '[]'::jsonb NOT NULL,
    gift_accounts JSONB DEFAULT '[]'::jsonb NOT NULL,
    gift_address TEXT,
    gallery_urls JSONB DEFAULT '[]'::jsonb NOT NULL,

    -- Pengaturan Tampilan
    show_rsvp BOOLEAN DEFAULT TRUE NOT NULL,
    show_gift BOOLEAN DEFAULT TRUE NOT NULL,
    closing_message TEXT NOT NULL DEFAULT 'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu.',

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wedding_invitations_slug ON public.wedding_invitations(slug);
CREATE INDEX IF NOT EXISTS idx_wedding_invitations_workspace ON public.wedding_invitations(workspace_id);

DROP TRIGGER IF EXISTS trg_wedding_invitations_updated_at ON public.wedding_invitations;
CREATE TRIGGER trg_wedding_invitations_updated_at
    BEFORE UPDATE ON public.wedding_invitations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.wedding_invitations ENABLE ROW LEVEL SECURITY;

-- Publik boleh membaca undangan yang sudah dipublikasikan; member workspace boleh membaca draft
DROP POLICY IF EXISTS "wedding_invitations_select_public_or_member" ON public.wedding_invitations;
CREATE POLICY "wedding_invitations_select_public_or_member"
    ON public.wedding_invitations FOR SELECT
    TO anon, authenticated
    USING (
        is_published = TRUE
        OR public.is_workspace_member(workspace_id)
    );

-- Hanya member workspace berpaket COMPLETE_PASS yang boleh membuat/mengubah/menghapus
DROP POLICY IF EXISTS "wedding_invitations_insert_complete_pass" ON public.wedding_invitations;
CREATE POLICY "wedding_invitations_insert_complete_pass"
    ON public.wedding_invitations FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_workspace_member(workspace_id)
        AND public.is_complete_pass_workspace(workspace_id)
    );

DROP POLICY IF EXISTS "wedding_invitations_update_complete_pass" ON public.wedding_invitations;
CREATE POLICY "wedding_invitations_update_complete_pass"
    ON public.wedding_invitations FOR UPDATE
    TO authenticated
    USING (
        public.is_workspace_member(workspace_id)
        AND public.is_complete_pass_workspace(workspace_id)
    )
    WITH CHECK (
        public.is_workspace_member(workspace_id)
        AND public.is_complete_pass_workspace(workspace_id)
    );

DROP POLICY IF EXISTS "wedding_invitations_delete_complete_pass" ON public.wedding_invitations;
CREATE POLICY "wedding_invitations_delete_complete_pass"
    ON public.wedding_invitations FOR DELETE
    TO authenticated
    USING (
        public.is_workspace_member(workspace_id)
        AND public.is_complete_pass_workspace(workspace_id)
    );

-- 3. TABEL INVITATION RSVPS (Konfirmasi Kehadiran & Dinding Ucapan Tamu)
CREATE TABLE IF NOT EXISTS public.invitation_rsvps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invitation_id UUID NOT NULL REFERENCES public.wedding_invitations(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    guest_name TEXT NOT NULL,
    attendance VARCHAR(16) NOT NULL CHECK (attendance IN ('HADIR', 'TIDAK_HADIR', 'RAGU')),
    guest_count INTEGER DEFAULT 1 NOT NULL CHECK (guest_count >= 1 AND guest_count <= 10),
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invitation_rsvps_invitation ON public.invitation_rsvps(invitation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invitation_rsvps_workspace ON public.invitation_rsvps(workspace_id);

ALTER TABLE public.invitation_rsvps ENABLE ROW LEVEL SECURITY;

-- Publik boleh membaca ucapan pada undangan yang dipublikasikan; member boleh membaca semua RSVP miliknya
DROP POLICY IF EXISTS "invitation_rsvps_select_public_or_member" ON public.invitation_rsvps;
CREATE POLICY "invitation_rsvps_select_public_or_member"
    ON public.invitation_rsvps FOR SELECT
    TO anon, authenticated
    USING (
        public.is_workspace_member(workspace_id)
        OR EXISTS (
            SELECT 1 FROM public.wedding_invitations wi
            WHERE wi.id = invitation_id AND wi.is_published = TRUE
        )
    );

-- Tamu publik boleh mengirim RSVP pada undangan yang dipublikasikan
DROP POLICY IF EXISTS "invitation_rsvps_insert_published" ON public.invitation_rsvps;
CREATE POLICY "invitation_rsvps_insert_published"
    ON public.invitation_rsvps FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.wedding_invitations wi
            WHERE wi.id = invitation_id
              AND wi.workspace_id = workspace_id
              AND wi.is_published = TRUE
              AND wi.show_rsvp = TRUE
        )
    );

-- Member workspace boleh menghapus ucapan (moderasi spam)
DROP POLICY IF EXISTS "invitation_rsvps_delete_member" ON public.invitation_rsvps;
CREATE POLICY "invitation_rsvps_delete_member"
    ON public.invitation_rsvps FOR DELETE
    TO authenticated
    USING (public.is_workspace_member(workspace_id));

-- 4. SUPABASE STORAGE BUCKET PUBLIK: invitations (Cover & Galeri Prewedding)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'invitations',
    'invitations',
    TRUE,
    3145728, -- 3 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "invitations_public_read" ON storage.objects;
CREATE POLICY "invitations_public_read"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'invitations');

DROP POLICY IF EXISTS "invitations_insert_workspace_member" ON storage.objects;
CREATE POLICY "invitations_insert_workspace_member"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'invitations'
        AND public.is_workspace_member(((storage.foldername(name))[1])::UUID)
        AND public.is_complete_pass_workspace(((storage.foldername(name))[1])::UUID)
    );

DROP POLICY IF EXISTS "invitations_delete_workspace_member" ON storage.objects;
CREATE POLICY "invitations_delete_workspace_member"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'invitations'
        AND public.is_workspace_member(((storage.foldername(name))[1])::UUID)
    );

-- 5. PERBARUI FITUR PADA TABEL pricing_plans (tambahkan poin Undangan Online bila belum ada)
UPDATE public.pricing_plans
SET features = features || '[{"label": "Buat Undangan Online Sendiri (4 Tema + RSVP & Buku Tamu)", "included": false}]'::jsonb
WHERE id = 'WEDDING_ONLY'
  AND NOT (features::text ILIKE '%Undangan Online%');

UPDATE public.pricing_plans
SET features = features || '[{"label": "Buat Undangan Online Sendiri (4 Tema + RSVP & Buku Tamu)", "included": true}]'::jsonb
WHERE id = 'COMPLETE_PASS'
  AND NOT (features::text ILIKE '%Undangan Online%');
