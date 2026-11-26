import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedProfileAndWorkspace } from "@/lib/workspace-server";
import { getAppUrl } from "@/lib/utils";
import type { InvitationRsvp, WeddingInvitation } from "@/types/database";
import { UndanganClient } from "./undangan-client";

export const metadata: Metadata = {
  title: "Buat Undangan Online",
  description:
    "Buat undangan pernikahan digital eksklusif dengan 4 pilihan tema, tautan personalisasi WhatsApp, amplop digital, dan buku tamu RSVP.",
};

export default async function UndanganPage() {
  const supabase = await createClient();
  const { profile, bundle } =
    await getAuthenticatedProfileAndWorkspace(supabase);

  if (!profile) redirect("/login?next=/undangan");
  if (!profile.has_paid) redirect("/checkout");
  if (!bundle) redirect("/onboarding");

  let invitation: WeddingInvitation | null = null;
  let rsvps: InvitationRsvp[] = [];
  let migrationMissing = false;

  if (bundle.workspace.plan === "COMPLETE_PASS") {
    const { data: invData, error: invErr } = await supabase
      .from("wedding_invitations")
      .select("*")
      .eq("workspace_id", bundle.workspace.id)
      .maybeSingle();

    if (invErr && (invErr.code === "42P01" || invErr.code === "PGRST205")) {
      migrationMissing = true;
    } else if (invData) {
      invitation = invData as WeddingInvitation;
      const { data: rsvpData } = await supabase
        .from("invitation_rsvps")
        .select("*")
        .eq("invitation_id", invData.id)
        .order("created_at", { ascending: false });
      rsvps = (rsvpData ?? []) as InvitationRsvp[];
    }
  }

  return (
    <UndanganClient
      workspace={bundle.workspace}
      initialInvitation={invitation}
      initialRsvps={rsvps}
      appUrl={getAppUrl()}
      migrationMissing={migrationMissing}
    />
  );
}
