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
