import { createAdminClient } from "@/lib/supabase/admin";
import { generateInviteCode } from "@/lib/utils";
import type { Workspace } from "@/types/database";

function hasValidServiceRoleKey(): boolean {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
  if (!key) return false;
  if (key.includes("your-supabase") || key.includes("xxxx")) return false;
  return true;
}

/**
 * Self-healing provisioning untuk user yang sudah berstatus `has_paid = true`
 * tetapi belum memiliki `active_workspace_id` atau baris `workspace_members`
 * (misalnya ketika `has_paid` diaktifkan manual di Supabase Dashboard).
 */
export async function ensurePaidUserWorkspace(userId: string): Promise<{
  workspace: Workspace | null;
  errorReason: string | null;
}> {
  if (!hasValidServiceRoleKey()) {
    return {
      workspace: null,
      errorReason:
        "SUPABASE_SERVICE_ROLE_KEY di file .env belum diisi atau masih berisi placeholder. Isi service_role key dari Supabase Dashboard (Project Settings → API) lalu restart server dev.",
    };
  }

  try {
    const admin = createAdminClient();

    const { data: profile, error: profileErr } = await admin
      .from("profiles")
      .select("id, full_name, has_paid, active_workspace_id")
      .eq("id", userId)
      .maybeSingle();

    if (profileErr || !profile) {
      return {
        workspace: null,
        errorReason:
          "Profil pengguna tidak ditemukan di tabel public.profiles. Pastikan migrasi SQL 001–003 sudah dijalankan.",
      };
    }

    if (!profile.has_paid) {
      return { workspace: null, errorReason: "Akun belum berstatus berbayar." };
    }

    // 1. Jika active_workspace_id sudah terisi, pastikan workspace ada & user terdaftar di workspace_members
    if (profile.active_workspace_id) {
      const { data: existingWs } = await admin
        .from("workspaces")
        .select("*")
        .eq("id", profile.active_workspace_id)
        .maybeSingle();

      if (existingWs) {
        const { data: member } = await admin
          .from("workspace_members")
          .select("id")
          .eq("workspace_id", existingWs.id)
          .eq("user_id", userId)
          .maybeSingle();

        if (!member) {
          await admin.from("workspace_members").insert({
            workspace_id: existingWs.id,
            user_id: userId,
            role: "OWNER",
          });
        }

        return { workspace: existingWs, errorReason: null };
      }
    }

    // 2. Cek apakah user sudah menjadi anggota di suatu workspace yang ada
    const { data: membership } = await admin
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (membership?.workspace_id) {
      const { data: existingWs } = await admin
        .from("workspaces")
        .select("*")
        .eq("id", membership.workspace_id)
        .maybeSingle();

      if (existingWs) {
        await admin
          .from("profiles")
          .update({ active_workspace_id: existingWs.id })
          .eq("id", userId);

        return { workspace: existingWs, errorReason: null };
      }
    }

    // 3. Jika belum punya workspace sama sekali, buat workspace baru otomatis + tautkan sebagai OWNER
    const firstName = profile.full_name?.split(" ")[0] || "Kami";
    const coupleTitle = `${firstName} & Pasangan`;

    let createdWs: Workspace | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const inviteCode = generateInviteCode(8);
      const { data: inserted, error: wsErr } = await admin
        .from("workspaces")
        .insert({
          couple_title: coupleTitle,
          plan: "COMPLETE_PASS",
          invite_code: inviteCode,
          guest_estimate: 300,
          wedding_budget_target: 150000000,
          onboarding_completed: false,
        })
        .select("*")
        .single();

      if (!wsErr && inserted) {
        createdWs = inserted;
        break;
      }
    }

    if (!createdWs) {
      return {
        workspace: null,
        errorReason:
          "Gagal membuat workspace baru di database. Periksa log server dan pastikan migrasi SQL sudah dijalankan.",
      };
    }

    const { error: memberErr } = await admin.from("workspace_members").insert({
      workspace_id: createdWs.id,
      user_id: userId,
      role: "OWNER",
    });

    if (memberErr) {
      return {
        workspace: null,
        errorReason: `Workspace dibuat, tetapi gagal menautkan OWNER: ${memberErr.message}`,
      };
    }

    await admin
      .from("profiles")
      .update({ active_workspace_id: createdWs.id })
      .eq("id", userId);

    return { workspace: createdWs, errorReason: null };
  } catch (err) {
    console.error("[ensurePaidUserWorkspace] Error:", err);
    return {
      workspace: null,
      errorReason:
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menyiapkan workspace otomatis.",
    };
  }
}
