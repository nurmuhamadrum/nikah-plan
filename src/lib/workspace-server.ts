import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Profile } from "@/types/database";
import { fetchWorkspaceBundle, type WorkspaceBundle } from "@/lib/workspace-data";
import { ensurePaidUserWorkspace } from "@/lib/workspace-provisioning";

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { profile: null, bundle: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

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
