import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedProfileAndWorkspace } from "@/lib/workspace-server";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardClient } from "./dashboard-client";

export const metadata: Metadata = {
  title: "Dashboard Anggaran",
  description:
    "Pantau kesehatan anggaran pernikahan, pembagian sumber dana, tagihan vendor mendesak, dan dompet honeymoon.",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { profile, bundle } =
    await getAuthenticatedProfileAndWorkspace(supabase);

  if (!profile) {
    redirect("/login?next=/dashboard");
  }

  if (!profile.has_paid) {
    redirect("/checkout");
  }

  if (!bundle) {
    redirect("/onboarding");
  }

  if (!bundle.workspace.onboarding_completed) {
    redirect("/onboarding");
  }

  return (
    <AppShell userName={profile.full_name} avatarUrl={profile.avatar_url}>
      <DashboardClient profile={profile} initialBundle={bundle} />
    </AppShell>
  );
}
