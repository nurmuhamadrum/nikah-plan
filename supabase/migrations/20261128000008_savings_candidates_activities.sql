-- =============================================================================
-- Migration 008: Tabungan Menuju Hari-H, Kandidat Vendor & Activity Log Pasangan
-- =============================================================================

-- 1. Target Tabungan Bulanan Pasangan pada workspaces
ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS monthly_saving_groom NUMERIC(15, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_saving_bride NUMERIC(15, 2) NOT NULL DEFAULT 0;

-- 2. Kolom Kandidat Vendor Pembanding (JSONB array) pada budget_items
ALTER TABLE public.budget_items
  ADD COLUMN IF NOT EXISTS candidates JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 3. Tabel Setoran Tabungan Menuju Hari-H (savings_entries)
CREATE TABLE IF NOT EXISTS public.savings_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  entry_month VARCHAR(7) NOT NULL, -- Format YYYY-MM
  contributor VARCHAR(16) NOT NULL DEFAULT 'JOINT'
    CHECK (contributor IN ('GROOM', 'BRIDE', 'JOINT')),
  amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
  notes TEXT,
  saved_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_savings_entries_workspace
  ON public.savings_entries(workspace_id, saved_date DESC);

ALTER TABLE public.savings_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "savings_entries_select_member" ON public.savings_entries;
CREATE POLICY "savings_entries_select_member"
  ON public.savings_entries FOR SELECT
  TO authenticated
  USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "savings_entries_insert_member" ON public.savings_entries;
CREATE POLICY "savings_entries_insert_member"
  ON public.savings_entries FOR INSERT
  TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "savings_entries_update_member" ON public.savings_entries;
CREATE POLICY "savings_entries_update_member"
  ON public.savings_entries FOR UPDATE
  TO authenticated
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "savings_entries_delete_member" ON public.savings_entries;
CREATE POLICY "savings_entries_delete_member"
  ON public.savings_entries FOR DELETE
  TO authenticated
  USING (public.is_workspace_member(workspace_id));

-- 4. Tabel Riwayat Perubahan Pasangan (workspace_activities)
CREATE TABLE IF NOT EXISTS public.workspace_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL,
  action_type VARCHAR(32) NOT NULL DEFAULT 'UPDATE',
  summary TEXT NOT NULL,
  entity_path VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspace_activities_workspace
  ON public.workspace_activities(workspace_id, created_at DESC);

ALTER TABLE public.workspace_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace_activities_select_member" ON public.workspace_activities;
CREATE POLICY "workspace_activities_select_member"
  ON public.workspace_activities FOR SELECT
  TO authenticated
  USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "workspace_activities_insert_member" ON public.workspace_activities;
CREATE POLICY "workspace_activities_insert_member"
  ON public.workspace_activities FOR INSERT
  TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id));

-- 5. Daftarkan ke Supabase Realtime Publication secara idempoten
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'savings_entries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.savings_entries;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'workspace_activities'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_activities;
  END IF;
END $$;
