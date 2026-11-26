import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedProfileAndWorkspace } from "@/lib/workspace-data";
import { getAppUrl } from "@/lib/utils";
import { AppShell } from "@/components/layout/app-shell";
import { SettingsClient } from "./settings-client";

export const metadata: Metadata = {
  title: "Profil & Pengaturan",
  description:
    "Kelola profil pasangan, tautan undangan workspace, dan pengaturan NikahPlan.",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const { profile, bundle } =
    await getAuthenticatedProfileAndWorkspace(supabase);

  if (!profile) redirect("/login?next=/settings");
  if (!profile.has_paid) redirect("/checkout");
  if (!bundle) redirect("/onboarding");

  const { data: memberRows } = await supabase
    .from("workspace_members")
    .select("user_id, role")
    .eq("workspace_id", bundle.workspace.id);

  const memberIds = (memberRows ?? []).map((m) => m.user_id);
  const { data: memberProfiles } =
    memberIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", memberIds)
      : { data: [] };

  const profileMap = new Map(
    (memberProfiles ?? []).map((p) => [p.id, p])
  );

  const members = (memberRows ?? []).map((m) => {
    const p = profileMap.get(m.user_id);
    return {
      full_name: p?.full_name || "Anggota",
      email: p?.email || "-",
      role: m.role,
    };
  });

  const inviteUrl = `${getAppUrl()}/join/${bundle.workspace.invite_code}`;

  return (
    <AppShell userName={profile.full_name} avatarUrl={profile.avatar_url}>
      <SettingsClient
        profile={profile}
        workspace={bundle.workspace}
        members={members}
        inviteUrl={inviteUrl}
      />
    </AppShell>
  );
}
