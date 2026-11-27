-- ============================================================================
-- NikahPlan - Migration 005: Digital Invitation Themes V2 (8 Tema Beragam Layout)
-- Memperluas kolom `theme` pada `public.wedding_invitations` untuk mendukung
-- 4 tema baru berstruktur layout & ornamen berbeda:
--   MINIMAL_EDITORIAL, JAVANESE_HERITAGE, POLAROID_SCRAPBOOK, SAKURA_BLUSH
-- ============================================================================

ALTER TABLE public.wedding_invitations
    ALTER COLUMN theme TYPE VARCHAR(32);

DO $$
DECLARE
    constraint_rec RECORD;
BEGIN
    FOR constraint_rec IN
        SELECT c.conname
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE n.nspname = 'public'
          AND t.relname = 'wedding_invitations'
          AND c.contype = 'c'
          AND pg_get_constraintdef(c.oid) ILIKE '%theme%'
    LOOP
        EXECUTE format(
            'ALTER TABLE public.wedding_invitations DROP CONSTRAINT IF EXISTS %I',
            constraint_rec.conname
        );
    END LOOP;
END $$;

ALTER TABLE public.wedding_invitations
    ADD CONSTRAINT wedding_invitations_theme_check CHECK (
        theme IN (
            'BOTANICAL_SAGE',
            'WARM_TERRACOTTA',
            'CLASSIC_GOLD',
            'MIDNIGHT_GARDEN',
            'MINIMAL_EDITORIAL',
            'JAVANESE_HERITAGE',
            'POLAROID_SCRAPBOOK',
            'SAKURA_BLUSH'
        )
    );

-- Perbarui teks fitur pada pricing_plans bila sudah ada
UPDATE public.pricing_plans
SET features = (
    SELECT jsonb_agg(
        CASE
            WHEN elem->>'label' ILIKE 'Buat Undangan Online Sendiri%'
            THEN jsonb_set(
                elem,
                '{label}',
                '"Buat Undangan Online Sendiri (8 Tema Beragam Layout + RSVP & Buku Tamu)"'::jsonb
            )
            ELSE elem
        END
    )
    FROM jsonb_array_elements(features) elem
)
WHERE id IN ('WEDDING_ONLY', 'COMPLETE_PASS');
