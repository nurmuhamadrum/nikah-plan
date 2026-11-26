import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/utils";
import { OnboardingWizard } from "./onboarding-wizard";

export const metadata: Metadata = {
  title: "Setup Rencana Pernikahan",
  description:
    "Atur profil pasangan, alokasi budget pernikahan pintar, dan rencana honeymoon dalam 4 langkah cepat.",
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/onboarding");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("has_paid, active_workspace_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.has_paid) {
    redirect("/checkout");
  }

  if (!profile.active_workspace_id) {
    redirect("/checkout");
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", profile.active_workspace_id)
    .maybeSingle();

  if (!workspace) {
    redirect("/checkout");
  }

  if (workspace.onboarding_completed && params.edit !== "1") {
    redirect("/dashboard");
  }

  const { count: memberCount } = await supabase
    .from("workspace_members")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspace.id);

  return (
    <OnboardingWizard
      workspace={workspace}
      memberCount={memberCount ?? 1}
      appUrl={getAppUrl()}
    />
  );
}
