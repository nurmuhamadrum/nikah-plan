import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CustomerFeedbackRow } from "@/types/database";

const createFeedbackSchema = z.object({
  category: z.enum(["BUG", "FEATURE", "SUGGESTION", "PRAISE"]).default("SUGGESTION"),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  page_path: z.string().trim().max(200).nullable().optional(),
  message: z
    .string()
    .trim()
    .min(5, "Pesan masukan minimal 5 karakter.")
    .max(1500, "Pesan masukan maksimal 1.500 karakter."),
  sender_name: z.string().trim().max(100).optional(),
  sender_email: z.string().trim().email("Format email tidak valid.").or(z.literal("")).optional(),
});

function isMissingTableError(err: { code?: string; message?: string } | null) {
  if (!err) return false;
  return (
    err.code === "42P01" ||
    err.code === "PGRST205" ||
    (err.message ?? "").includes("does not exist")
  );
}

/**
 * GET /api/feedback
 * Mengambil riwayat masukan milik pengguna yang sedang login.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ feedbacks: [], isLoggedIn: false });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("customer_feedbacks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(25);

    if (error) {
      if (isMissingTableError(error)) {
        return NextResponse.json({
          feedbacks: [],
          isLoggedIn: true,
          migrationMissing: true,
        });
      }
      return NextResponse.json(
        { error: "Gagal memuat riwayat masukan." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      feedbacks: (data as CustomerFeedbackRow[] | null) ?? [],
      isLoggedIn: true,
    });
  } catch (err) {
    console.error("[API GET /api/feedback] Error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memuat riwayat masukan." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/feedback
 * Menyimpan masukan baru dari pengguna login maupun pengunjung publik.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createFeedbackSchema.safeParse(body);
    if (!parsed.success) {
      const firstErr =
        parsed.error.issues[0]?.message || "Data masukan tidak valid.";
      return NextResponse.json({ error: firstErr }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let userId: string | null = null;
    let workspaceId: string | null = null;
    let senderName = parsed.data.sender_name?.trim() || "Pengunjung NikahPlan";
    let senderEmail = parsed.data.sender_email?.trim() || null;

    if (user) {
      userId = user.id;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email, active_workspace_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        senderName = profile.full_name || senderName;
        senderEmail = profile.email || user.email || senderEmail;
        workspaceId = profile.active_workspace_id;
      } else {
        senderEmail = user.email || senderEmail;
      }
    }

    const admin = createAdminClient();
    const { data: inserted, error } = await admin
      .from("customer_feedbacks")
      .insert({
        user_id: userId,
        workspace_id: workspaceId,
        sender_name: senderName,
        sender_email: senderEmail,
        category: parsed.data.category,
        rating: parsed.data.rating ?? null,
        page_path: parsed.data.page_path ?? null,
        message: parsed.data.message,
        status: "NEW",
      })
      .select("*")
      .single();

    if (error) {
      if (isMissingTableError(error)) {
        return NextResponse.json(
          {
            error:
              "Tabel `customer_feedbacks` belum dibuat di Supabase. Jalankan Migration 006 di Supabase SQL Editor.",
          },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: `Gagal mengirim masukan: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ feedback: inserted }, { status: 201 });
  } catch (err) {
    console.error("[API POST /api/feedback] Error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengirim masukan." },
      { status: 500 }
    );
  }
}
