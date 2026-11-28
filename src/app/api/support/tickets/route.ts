import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDynamicSiteContents } from "@/lib/dynamic-config";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type {
  SupportMessageRow,
  SupportTicketRow,
  SupportTicketWithMessages,
} from "@/types/database";

const createTicketSchema = z.object({
  topic: z
    .enum(["PEMBAYARAN", "AKUN_PASANGAN", "UNDANGAN", "TEKNIS", "LAINNYA"])
    .default("LAINNYA"),
  subject: z
    .string()
    .trim()
    .min(4, "Subjek bantuan minimal 4 karakter.")
    .max(140, "Subjek maksimal 140 karakter."),
  message: z
    .string()
    .trim()
    .min(6, "Detail kendala minimal 6 karakter.")
    .max(2000, "Detail kendala maksimal 2.000 karakter."),
  requester_name: z.string().trim().max(100).optional(),
  requester_email: z
    .string()
    .trim()
    .email("Format email tidak valid.")
    .or(z.literal(""))
    .optional(),
});

function isMissingTableError(err: { code?: string; message?: string } | null) {
  if (!err) return false;
  return (
    err.code === "42P01" ||
    err.code === "PGRST205" ||
    (err.message ?? "").includes("does not exist")
  );
}

function generateTicketCode(): string {
  const now = new Date();
  const ym = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CS-${ym}-${rand}`;
}

/**
 * GET /api/support/tickets
 * Mengembalikan kontak CS dinamis + daftar tiket bantuan & percakapan milik user yang login.
 */
export async function GET() {
  try {
    const [contents, supabase] = await Promise.all([
      getDynamicSiteContents(),
      createClient(),
    ]);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        tickets: [],
        supportContact: contents.supportContact,
        isLoggedIn: false,
      });
    }

    const admin = createAdminClient();
    const { data: ticketRows, error: ticketErr } = await admin
      .from("support_tickets")
      .select("*")
      .eq("user_id", user.id)
      .order("last_message_at", { ascending: false })
      .limit(20);

    if (ticketErr) {
      if (isMissingTableError(ticketErr)) {
        return NextResponse.json({
          tickets: [],
          supportContact: contents.supportContact,
          isLoggedIn: true,
          migrationMissing: true,
        });
      }
      return NextResponse.json(
        { error: "Gagal memuat daftar tiket bantuan." },
        { status: 500 }
      );
    }

    const rows = (ticketRows as SupportTicketRow[] | null) ?? [];
    const ticketIds = rows.map((t) => t.id);

    let messagesByTicket = new Map<string, SupportMessageRow[]>();
    if (ticketIds.length > 0) {
      const { data: msgRows } = await admin
        .from("support_messages")
        .select("*")
        .in("ticket_id", ticketIds)
        .order("created_at", { ascending: true });

      messagesByTicket = new Map<string, SupportMessageRow[]>();
      for (const m of (msgRows as SupportMessageRow[] | null) ?? []) {
        const list = messagesByTicket.get(m.ticket_id) ?? [];
        list.push(m);
        messagesByTicket.set(m.ticket_id, list);
      }
    }

    const tickets: SupportTicketWithMessages[] = rows.map((t) => ({
      ...t,
      messages: messagesByTicket.get(t.id) ?? [],
    }));

    return NextResponse.json({
      tickets,
      supportContact: contents.supportContact,
      isLoggedIn: true,
    });
  } catch (err) {
    console.error("[API GET /api/support/tickets] Error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memuat layanan Customer Service." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/support/tickets
 * Membuat tiket bantuan Customer Service baru beserta pesan pertamanya.
 */
export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const { allowed, retryAfterSec } = checkRateLimit(`support:${ip}`, 5, 60_000);
    if (!allowed) {
      return NextResponse.json(
        {
          error: `Terlalu banyak permintaan tiket bantuan. Coba lagi dalam ${retryAfterSec} detik.`,
        },
        { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
      );
    }

    const body = await request.json();
    const parsed = createTicketSchema.safeParse(body);
    if (!parsed.success) {
      const firstErr =
        parsed.error.issues[0]?.message || "Data tiket bantuan tidak valid.";
      return NextResponse.json({ error: firstErr }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let userId: string | null = null;
    let workspaceId: string | null = null;
    let requesterName =
      parsed.data.requester_name?.trim() || "Pengunjung NikahPlan";
    let requesterEmail = parsed.data.requester_email?.trim() || null;

    if (user) {
      userId = user.id;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email, active_workspace_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        requesterName = profile.full_name || requesterName;
        requesterEmail = profile.email || user.email || requesterEmail;
        workspaceId = profile.active_workspace_id;
      } else {
        requesterEmail = user.email || requesterEmail;
      }
    }

    const admin = createAdminClient();
    const ticketCode = generateTicketCode();
    const nowIso = new Date().toISOString();

    const { data: createdTicket, error: tErr } = await admin
      .from("support_tickets")
      .insert({
        ticket_code: ticketCode,
        user_id: userId,
        workspace_id: workspaceId,
        requester_name: requesterName,
        requester_email: requesterEmail,
        topic: parsed.data.topic,
        subject: parsed.data.subject,
        status: "OPEN",
        last_message_at: nowIso,
      })
      .select("*")
      .single();

    if (tErr || !createdTicket) {
      if (isMissingTableError(tErr)) {
        return NextResponse.json(
          {
            error:
              "Tabel `support_tickets` belum dibuat di Supabase. Jalankan Migration 006 di Supabase SQL Editor.",
          },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: `Gagal membuat tiket bantuan: ${tErr?.message || "Unknown"}` },
        { status: 500 }
      );
    }

    const { data: firstMsg } = await admin
      .from("support_messages")
      .insert({
        ticket_id: createdTicket.id,
        sender_role: "USER",
        sender_name: requesterName,
        message: parsed.data.message,
      })
      .select("*")
      .single();

    const fullTicket: SupportTicketWithMessages = {
      ...(createdTicket as SupportTicketRow),
      messages: firstMsg ? [firstMsg as SupportMessageRow] : [],
    };

    return NextResponse.json({ ticket: fullTicket }, { status: 201 });
  } catch (err) {
    console.error("[API POST /api/support/tickets] Error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat membuat tiket bantuan." },
      { status: 500 }
    );
  }
}
