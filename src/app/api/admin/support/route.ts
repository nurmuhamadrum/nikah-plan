import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const adminReplySchema = z.object({
  ticketId: z.string().uuid(),
  message: z
    .string()
    .trim()
    .min(2, "Balasan minimal 2 karakter.")
    .max(2000, "Balasan maksimal 2.000 karakter."),
  nextStatus: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]).optional(),
});

const updateStatusSchema = z.object({
  ticketId: z.string().uuid(),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]),
});

const deleteTicketSchema = z.object({
  ticketId: z.string().uuid(),
});

/**
 * POST /api/admin/support
 * Admin CS mengirim balasan ke thread tiket pengguna.
 */
export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const parsed = adminReplySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data balasan tidak valid." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: msg, error: msgErr } = await admin
      .from("support_messages")
      .insert({
        ticket_id: parsed.data.ticketId,
        sender_role: "ADMIN",
        sender_name: "Tim CS NikahPlan",
        message: parsed.data.message,
      })
      .select("*")
      .single();

    if (msgErr || !msg) {
      return NextResponse.json(
        { error: `Gagal mengirim balasan CS: ${msgErr?.message || "Unknown"}` },
        { status: 500 }
      );
    }

    const statusToSet = parsed.data.nextStatus ?? "IN_PROGRESS";
    await admin
      .from("support_tickets")
      .update({
        status: statusToSet,
        last_message_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.ticketId);

    return NextResponse.json(
      { message: msg, status: statusToSet },
      { status: 201 }
    );
  } catch (err) {
    console.error("[API POST /api/admin/support] Error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengirim balasan CS." },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/support
 * Admin memperbarui status tiket CS.
 */
export async function PUT(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const parsed = updateStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("support_tickets")
      .update({ status: parsed.data.status })
      .eq("id", parsed.data.ticketId);

    if (error) {
      return NextResponse.json(
        { error: `Gagal memperbarui status tiket: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, status: parsed.data.status });
  } catch (err) {
    console.error("[API PUT /api/admin/support] Error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memperbarui status tiket." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/support
 * Admin menghapus tiket CS (beserta pesan cascade).
 */
export async function DELETE(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const parsed = deleteTicketSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "ID tiket tidak valid." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("support_tickets")
      .delete()
      .eq("id", parsed.data.ticketId);

    if (error) {
      return NextResponse.json(
        { error: `Gagal menghapus tiket: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API DELETE /api/admin/support] Error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menghapus tiket." },
      { status: 500 }
    );
  }
}
