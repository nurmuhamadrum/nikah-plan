import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const replySchema = z.object({
  message: z
    .string()
    .trim()
    .min(2, "Pesan balasan minimal 2 karakter.")
    .max(2000, "Pesan balasan maksimal 2.000 karakter."),
});

/**
 * POST /api/support/tickets/[id]/reply
 * Pengguna membalas percakapan pada tiket bantuan miliknya.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await context.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = replySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Pesan tidak valid." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: ticket } = await admin
      .from("support_tickets")
      .select("id, user_id, requester_name, status")
      .eq("id", ticketId)
      .maybeSingle();

    if (!ticket || ticket.user_id !== user.id) {
      return NextResponse.json(
        { error: "Tiket tidak ditemukan atau bukan milik akun Anda." },
        { status: 404 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    const senderName = profile?.full_name || ticket.requester_name || "Pengguna";

    const { data: newMsg, error: msgErr } = await admin
      .from("support_messages")
      .insert({
        ticket_id: ticketId,
        sender_role: "USER",
        sender_name: senderName,
        message: parsed.data.message,
      })
      .select("*")
      .single();

    if (msgErr || !newMsg) {
      return NextResponse.json(
        { error: "Gagal mengirim balasan." },
        { status: 500 }
      );
    }

    const nextStatus = ticket.status === "RESOLVED" ? "OPEN" : ticket.status;
    await admin
      .from("support_tickets")
      .update({
        status: nextStatus,
        last_message_at: new Date().toISOString(),
      })
      .eq("id", ticketId);

    return NextResponse.json(
      { message: newMsg, status: nextStatus },
      { status: 201 }
    );
  } catch (err) {
    console.error("[API POST /api/support/tickets/[id]/reply] Error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengirim balasan." },
      { status: 500 }
    );
  }
}
