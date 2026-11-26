import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const joinSchema = z.object({
  inviteCode: z.string().trim().min(4).max(16),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu untuk menerima undangan." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = joinSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Format kode undangan tidak valid." },
        { status: 400 }
      );
    }

    const normalizedCode = parsed.data.inviteCode.toUpperCase();
    const admin = createAdminClient();

    // 1. Cari workspace berdasarkan invite_code
    const { data: workspace, error: wsError } = await admin
      .from("workspaces")
      .select("id, couple_title, onboarding_completed")
      .eq("invite_code", normalizedCode)
      .maybeSingle();

    if (wsError || !workspace) {
      return NextResponse.json(
        { error: "Kode undangan tidak ditemukan atau sudah tidak berlaku." },
        { status: 404 }
      );
    }

    // 2. Periksa daftar anggota workspace saat ini
    const { data: members, error: membersError } = await admin
      .from("workspace_members")
      .select("user_id, role")
      .eq("workspace_id", workspace.id);

    if (membersError) {
      return NextResponse.json(
        { error: "Gagal memeriksa status keanggotaan workspace." },
        { status: 500 }
      );
    }

    const alreadyMember = members?.some((m) => m.user_id === user.id);

    if (!alreadyMember) {
      // Validasi kuota maksimal 2 anggota (Owner + Partner)
      if ((members?.length ?? 0) >= 2) {
        return NextResponse.json(
          {
            error:
              "Workspace ini sudah penuh (maksimal 2 anggota: Owner & Pasangan).",
          },
          { status: 409 }
        );
      }

      // Tambahkan user sebagai PARTNER
      const { error: insertMemberError } = await admin
        .from("workspace_members")
        .insert({
          workspace_id: workspace.id,
          user_id: user.id,
          role: "PARTNER",
        });

      if (insertMemberError) {
        return NextResponse.json(
          { error: `Gagal bergabung ke workspace: ${insertMemberError.message}` },
          { status: 400 }
        );
      }
    }

    // 3. Aktifkan akses pasangan tanpa perlu membayar ulang (has_paid = true)
    const { error: updateProfileError } = await admin
      .from("profiles")
      .update({
        has_paid: true,
        active_workspace_id: workspace.id,
      })
      .eq("id", user.id);

    if (updateProfileError) {
      return NextResponse.json(
        { error: "Gagal mengaktifkan akses akun pasangan." },
        { status: 500 }
      );
    }

    const redirectTo = workspace.onboarding_completed
      ? "/dashboard"
      : "/onboarding";

    return NextResponse.json({
      success: true,
      workspaceId: workspace.id,
      coupleTitle: workspace.couple_title,
      redirectTo,
    });
  } catch (err) {
    console.error("[API /api/join] Error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal saat memproses undangan." },
      { status: 500 }
    );
  }
}
