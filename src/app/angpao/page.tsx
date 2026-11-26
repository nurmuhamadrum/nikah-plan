import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedProfileAndWorkspace } from "@/lib/workspace-server";
import { AppShell } from "@/components/layout/app-shell";
import { AngpaoClient } from "./angpao-client";

export const metadata: Metadata = {
  title: "Angpao & Gift Bridge Tracker",
  description:
    "Catat amplop tunai, transfer, dan kado pernikahan lalu alokasikan langsung ke tagihan vendor atau Dompet Honeymoon.",
};

export default async function AngpaoPage() {
  const supabase = await createClient();
  const { profile, bundle } =
    await getAuthenticatedProfileAndWorkspace(supabase);

  if (!profile) redirect("/login?next=/angpao");
  if (!profile.has_paid) redirect("/checkout");
  if (!bundle) redirect("/onboarding");

  return (
    <AppShell userName={profile.full_name} avatarUrl={profile.avatar_url}>
      <AngpaoClient initialBundle={bundle} />
    </AppShell>
  );
}
