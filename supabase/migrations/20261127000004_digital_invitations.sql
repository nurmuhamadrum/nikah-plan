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
