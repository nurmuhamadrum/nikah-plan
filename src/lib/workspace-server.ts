import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Profile } from "@/types/database";
import { createClient } from "@/lib/supabase/server";
import { fetchWorkspaceBundle, type WorkspaceBundle } from "@/lib/workspace-data";
import { ensurePaidUserWorkspace } from "@/lib/workspace-provisioning";

/**
 * Per-request deduplicated auth & profile lookup menggunakan React.cache().
 * Mencegah query ganda saat (app)/layout.tsx dan page.tsx berjalan pada request yang sama.
 */
export const getCachedAuthProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return profile ?? null;
});

/**
 * Server-only helper untuk memuat profil & workspace bundle,
 * sekaligus melakukan self-healing provisioning jika user `has_paid = true`
 * belum memiliki workspace atau membership yang valid.
 */
export async function getAuthenticatedProfileAndWorkspace(
  supabase: SupabaseClient<Database>
): Promise<{
  profile: Profile | null;
  bundle: WorkspaceBundle | null;
}> {
  const profile = await getCachedAuthProfile();

  if (!profile || !profile.has_paid) {
    return { profile: profile ?? null, bundle: null };
  }

  let workspaceId = profile.active_workspace_id;
  let bundle = workspaceId
    ? await fetchWorkspaceBundle(supabase, workspaceId)
    : null;

  if (!bundle) {
    const provisioned = await ensurePaidUserWorkspace(profile.id);
    if (provisioned.workspace) {
      workspaceId = provisioned.workspace.id;
      bundle = await fetchWorkspaceBundle(supabase, workspaceId);
    }
  }

  return {
    profile: workspaceId
      ? { ...profile, active_workspace_id: workspaceId }
      : profile,
    bundle,
  };
}
