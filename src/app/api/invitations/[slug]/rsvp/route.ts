import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const rsvpSchema = z.object({
  guest_name: z
    .string()
    .trim()
    .min(2, "Nama tamu minimal 2 karakter")
    .max(80, "Nama tamu maksimal 80 karakter"),
  attendance: z.enum(["HADIR", "TIDAK_HADIR", "RAGU"]),
  guest_count: z.number().int().min(1).max(10).default(1),
  message: z
    .string()
    .trim()
    .max(500, "Ucapan maksimal 500 karakter")
    .optional()
    .nullable(),
});

/**
 * POST /api/invitations/[slug]/rsvp
 * Endpoint publik bagi tamu undangan untuk mengirim konfirmasi kehadiran & ucapan doa.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const body = await request.json();
    const parsed = rsvpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data RSVP tidak valid." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: invitation, error: invErr } = await admin
      .from("wedding_invitations")
      .select("id, workspace_id, is_published, show_rsvp")
      .eq("slug", slug)
      .maybeSingle();

    if (invErr || !invitation) {
      return NextResponse.json(
        { error: "Undangan tidak ditemukan." },
        { status: 404 }
      );
    }

    if (!invitation.is_published || !invitation.show_rsvp) {
      return NextResponse.json(
        { error: "Formulir RSVP pada undangan ini belum dibuka." },
        { status: 403 }
      );
    }

    const { data: created, error: insertErr } = await admin
      .from("invitation_rsvps")
      .insert({
        invitation_id: invitation.id,
        workspace_id: invitation.workspace_id,
        guest_name: parsed.data.guest_name,
        attendance: parsed.data.attendance,
        guest_count:
          parsed.data.attendance === "TIDAK_HADIR" ? 1 : parsed.data.guest_count,
        message: parsed.data.message || null,
      })
      .select("*")
      .single();

    if (insertErr || !created) {
      return NextResponse.json(
        { error: insertErr?.message || "Gagal mengirim konfirmasi kehadiran." },
        { status: 500 }
      );
    }

    return NextResponse.json({ rsvp: created }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat mengirim RSVP.",
      },
      { status: 500 }
    );
  }
}
