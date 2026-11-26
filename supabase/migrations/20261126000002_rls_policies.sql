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
