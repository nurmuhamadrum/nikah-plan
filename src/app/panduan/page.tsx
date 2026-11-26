import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedProfileAndWorkspace } from "@/lib/workspace-server";
import { AppShell } from "@/components/layout/app-shell";
import { PanduanClient } from "./panduan-client";

export const metadata: Metadata = {
  title: "Pusat Panduan & Strategi Nikah",
  description:
    "Panduan eksklusif merencanakan pernikahan impian tanpa stres & tanpa boros: Metode WIFE, Scenario Planner 30/50/80 Jt, Script Negosiasi Vendor, dan Checklist 10 Kesalahan Fatal.",
};

export default async function PanduanPage() {
  const supabase = await createClient();
  const { profile, bundle } =
    await getAuthenticatedProfileAndWorkspace(supabase);

  if (!profile) redirect("/login?next=/panduan");
  if (!profile.has_paid) redirect("/checkout");
  if (!bundle) redirect("/onboarding");

  return (
    <AppShell userName={profile.full_name} avatarUrl={profile.avatar_url}>
      <PanduanClient initialBundle={bundle} />
    </AppShell>
  );
}
