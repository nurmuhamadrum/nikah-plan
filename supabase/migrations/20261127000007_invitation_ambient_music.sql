-- =============================================================================
-- Migration 007: Musik Ambient untuk Undangan Pernikahan Online
-- Menambahkan kolom music_preset & music_url pada tabel wedding_invitations
-- =============================================================================

ALTER TABLE public.wedding_invitations
  ADD COLUMN IF NOT EXISTS music_preset TEXT NOT NULL DEFAULT 'ROMANTIC_PIANO'
    CHECK (music_preset IN ('OFF', 'ROMANTIC_PIANO', 'MUSIC_BOX', 'HARP_GARDEN', 'JAVANESE_AMBIENT', 'CUSTOM')),
  ADD COLUMN IF NOT EXISTS music_url TEXT;
