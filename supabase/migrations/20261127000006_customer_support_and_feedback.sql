-- ============================================================================
-- NikahPlan - Migration 006: Customer Service (Tiket 2 Arah) & Customer Feedback
-- Menambahkan tabel:
--   1. public.customer_feedbacks (saran, request fitur, bug, ulasan rating 1-5)
--   2. public.support_tickets    (tiket bantuan customer service)
--   3. public.support_messages   (percakapan 2 arah user <-> admin CS)
-- serta seed konfigurasi `support_contact` pada public.site_contents.
-- ============================================================================

-- 1. TABEL CUSTOMER FEEDBACKS
CREATE TABLE IF NOT EXISTS public.customer_feedbacks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
    sender_name TEXT NOT NULL DEFAULT 'Pengguna NikahPlan',
    sender_email TEXT,
    category VARCHAR(24) NOT NULL DEFAULT 'SUGGESTION' CHECK (
        category IN ('BUG', 'FEATURE', 'SUGGESTION', 'PRAISE')
    ),
    rating SMALLINT CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
    page_path TEXT,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'NEW' CHECK (
        status IN ('NEW', 'REVIEWED', 'RESOLVED')
    ),
    admin_reply TEXT,
    is_public_testimonial BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_customer_feedbacks_user ON public.customer_feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_feedbacks_status ON public.customer_feedbacks(status, created_at DESC);

DROP TRIGGER IF EXISTS trg_customer_feedbacks_updated_at ON public.customer_feedbacks;
CREATE TRIGGER trg_customer_feedbacks_updated_at
    BEFORE UPDATE ON public.customer_feedbacks
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.customer_feedbacks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer_feedbacks_select_own" ON public.customer_feedbacks;
CREATE POLICY "customer_feedbacks_select_own"
    ON public.customer_feedbacks FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "customer_feedbacks_insert_own" ON public.customer_feedbacks;
CREATE POLICY "customer_feedbacks_insert_own"
    ON public.customer_feedbacks FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 2. TABEL SUPPORT TICKETS (CUSTOMER SERVICE)
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_code VARCHAR(24) UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
    requester_name TEXT NOT NULL DEFAULT 'Pengguna NikahPlan',
    requester_email TEXT,
    topic VARCHAR(24) NOT NULL DEFAULT 'LAINNYA' CHECK (
        topic IN ('PEMBAYARAN', 'AKUN_PASANGAN', 'UNDANGAN', 'TEKNIS', 'LAINNYA')
    ),
    subject TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (
        status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED')
    ),
    last_message_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status, last_message_at DESC);

DROP TRIGGER IF EXISTS trg_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER trg_support_tickets_updated_at
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "support_tickets_select_own" ON public.support_tickets;
CREATE POLICY "support_tickets_select_own"
    ON public.support_tickets FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "support_tickets_insert_own" ON public.support_tickets;
CREATE POLICY "support_tickets_insert_own"
    ON public.support_tickets FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 3. TABEL SUPPORT MESSAGES (PERCAKAPAN 2 ARAH TIKET CS)
CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_role VARCHAR(16) NOT NULL CHECK (sender_role IN ('USER', 'ADMIN')),
    sender_name TEXT NOT NULL DEFAULT 'Pengguna',
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON public.support_messages(ticket_id, created_at ASC);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "support_messages_select_own_ticket" ON public.support_messages;
CREATE POLICY "support_messages_select_own_ticket"
    ON public.support_messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.support_tickets st
            WHERE st.id = ticket_id AND st.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "support_messages_insert_own_ticket" ON public.support_messages;
CREATE POLICY "support_messages_insert_own_ticket"
    ON public.support_messages FOR INSERT
    TO authenticated
    WITH CHECK (
        sender_role = 'USER'
        AND EXISTS (
            SELECT 1 FROM public.support_tickets st
            WHERE st.id = ticket_id AND st.user_id = auth.uid()
        )
    );

-- 4. SEED KONTAK CUSTOMER SERVICE DINAMIS DI site_contents
INSERT INTO public.site_contents (key, value)
VALUES (
    'support_contact',
    '{
      "whatsappNumber": "6281234567890",
      "email": "support@nikahplan.id",
      "operationalHours": "Senin–Minggu, 09.00–21.00 WIB",
      "responseEstimate": "Rata-rata balas < 15 menit pada jam operasional"
    }'::jsonb
)
ON CONFLICT (key) DO NOTHING;
