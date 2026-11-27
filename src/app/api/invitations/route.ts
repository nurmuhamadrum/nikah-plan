import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { slugifyInvitation } from "@/lib/invitation-themes";

const loveStorySchema = z.object({
  year: z.string().trim().max(24),
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().max(400),
});

const giftAccountSchema = z.object({
  bank: z.string().trim().min(1).max(50),
  accountNumber: z.string().trim().min(3).max(50),
  accountHolder: z.string().trim().min(1).max(80),
});

const saveInvitationSchema = z.object({
  slug: z.string().trim().min(3, "Slug minimal 3 karakter").max(60),
  is_published: z.boolean(),
  theme: z.enum([
    "BOTANICAL_SAGE",
    "WARM_TERRACOTTA",
    "CLASSIC_GOLD",
    "MIDNIGHT_GARDEN",
    "MINIMAL_EDITORIAL",
    "JAVANESE_HERITAGE",
    "POLAROID_SCRAPBOOK",
    "SAKURA_BLUSH",
  ]),
  groom_name: z.string().trim().min(1, "Nama panggilan mempelai pria wajib diisi").max(60),
  groom_full_name: z.string().trim().max(120).default(""),
  groom_parents: z.string().trim().max(180).default(""),
  groom_instagram: z.string().trim().max(80).nullable().optional(),
  bride_name: z.string().trim().min(1, "Nama panggilan mempelai wanita wajib diisi").max(60),
  bride_full_name: z.string().trim().max(120).default(""),
  bride_parents: z.string().trim().max(180).default(""),
  bride_instagram: z.string().trim().max(80).nullable().optional(),
  opening_quote: z.string().trim().max(600).default(""),
  quote_source: z.string().trim().max(80).default(""),
  cover_photo_url: z.string().trim().max(500).nullable().optional(),
  akad_date: z.string().trim().nullable().optional(),
  akad_time: z.string().trim().max(60).default(""),
  akad_venue: z.string().trim().max(140).default(""),
  akad_address: z.string().trim().max(300).default(""),
  akad_maps_url: z.string().trim().max(500).nullable().optional(),
  resepsi_date: z.string().trim().nullable().optional(),
  resepsi_time: z.string().trim().max(60).default(""),
  resepsi_venue: z.string().trim().max(140).default(""),
  resepsi_address: z.string().trim().max(300).default(""),
  resepsi_maps_url: z.string().trim().max(500).nullable().optional(),
  love_stories: z.array(loveStorySchema).max(8).default([]),
  gift_accounts: z.array(giftAccountSchema).max(5).default([]),
  gift_address: z.string().trim().max(300).nullable().optional(),
  gallery_urls: z.array(z.string().trim().max(500)).max(6).default([]),
  show_rsvp: z.boolean().default(true),
  show_gift: z.boolean().default(true),
  closing_message: z.string().trim().max(500).default(""),
});

/**
 * PUT /api/invitations
 * Menyimpan / mempublikasikan undangan digital untuk workspace berpaket COMPLETE_PASS.
 */
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("has_paid, active_workspace_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.has_paid || !profile.active_workspace_id) {
      return NextResponse.json(
        { error: "Workspace aktif belum tersedia." },
        { status: 403 }
      );
    }

    const workspaceId = profile.active_workspace_id;
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id, plan")
      .eq("id", workspaceId)
      .maybeSingle();

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace tidak ditemukan." },
        { status: 404 }
      );
    }

    if (workspace.plan !== "COMPLETE_PASS") {
      return NextResponse.json(
        {
          error:
            "Fitur Undangan Online hanya tersedia untuk paket Complete Couple Pass.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = saveInvitationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data undangan tidak valid." },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const normalizedSlug = slugifyInvitation(input.slug);
    if (normalizedSlug.length < 3) {
      return NextResponse.json(
        { error: "URL slug minimal 3 karakter huruf/angka." },
        { status: 400 }
      );
    }

    // Cek konflik slug pada workspace lain
    const { data: existingSlug } = await supabase
      .from("wedding_invitations")
      .select("id, workspace_id")
      .eq("slug", normalizedSlug)
      .maybeSingle();

    if (existingSlug && existingSlug.workspace_id !== workspaceId) {
      return NextResponse.json(
        {
          error: `URL "/u/${normalizedSlug}" sudah dipakai pasangan lain. Silakan tambahkan tahun atau variasi nama (misal: ${normalizedSlug}-2026).`,
        },
        { status: 409 }
      );
    }

    const payload = {
      workspace_id: workspaceId,
      slug: normalizedSlug,
      is_published: input.is_published,
      theme: input.theme,
      groom_name: input.groom_name,
      groom_full_name: input.groom_full_name,
      groom_parents: input.groom_parents,
      groom_instagram: input.groom_instagram || null,
      bride_name: input.bride_name,
      bride_full_name: input.bride_full_name,
      bride_parents: input.bride_parents,
      bride_instagram: input.bride_instagram || null,
      opening_quote: input.opening_quote,
      quote_source: input.quote_source,
      cover_photo_url: input.cover_photo_url || null,
      akad_date: input.akad_date || null,
      akad_time: input.akad_time,
      akad_venue: input.akad_venue,
      akad_address: input.akad_address,
      akad_maps_url: input.akad_maps_url || null,
      resepsi_date: input.resepsi_date || null,
      resepsi_time: input.resepsi_time,
      resepsi_venue: input.resepsi_venue,
      resepsi_address: input.resepsi_address,
      resepsi_maps_url: input.resepsi_maps_url || null,
      love_stories: input.love_stories,
      gift_accounts: input.gift_accounts,
      gift_address: input.gift_address || null,
      gallery_urls: input.gallery_urls,
      show_rsvp: input.show_rsvp,
      show_gift: input.show_gift,
      closing_message: input.closing_message,
    };

    const { data: saved, error: upsertErr } = await supabase
      .from("wedding_invitations")
      .upsert(payload, { onConflict: "workspace_id" })
      .select("*")
      .single();

    if (upsertErr) {
      const hint =
        upsertErr.code === "42P01" || upsertErr.code === "PGRST205"
          ? "Tabel wedding_invitations belum dibuat. Jalankan Migration 004 di Supabase SQL Editor."
          : upsertErr.message;
      return NextResponse.json({ error: hint }, { status: 500 });
    }

    return NextResponse.json({ invitation: saved });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat menyimpan undangan.",
      },
      { status: 500 }
    );
  }
}
