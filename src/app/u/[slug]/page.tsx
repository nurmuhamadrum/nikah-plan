import type { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { InvitationRsvp, WeddingInvitation } from "@/types/database";
import { NikahPlanLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { PublicInvitationClient } from "./public-invitation-client";

export const dynamic = "force-dynamic";

async function loadInvitationBySlug(slug: string): Promise<{
  invitation: WeddingInvitation | null;
  isOwnerPreview: boolean;
}> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("wedding_invitations")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (!data) {
      return { invitation: null, isOwnerPreview: false };
    }

    const inv = data as WeddingInvitation;
    if (inv.is_published) {
      return { invitation: inv, isOwnerPreview: false };
    }

    // Jika masih Draft, cek apakah pengunjung adalah anggota workspace pemilik undangan
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: membership } = await admin
        .from("workspace_members")
        .select("id")
        .eq("workspace_id", inv.workspace_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (membership) {
        return { invitation: inv, isOwnerPreview: true };
      }
    }

    return { invitation: null, isOwnerPreview: false };
  } catch {
    return { invitation: null, isOwnerPreview: false };
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { invitation } = await loadInvitationBySlug(slug);

  if (!invitation) {
    return {
      title: "Undangan Tidak Ditemukan",
    };
  }

  const coupleTitle = `${invitation.groom_name} & ${invitation.bride_name}`;
  return {
    title: `Undangan Pernikahan ${coupleTitle}`,
    description: `Dengan penuh sukacita kami mengundang Anda menghadiri acara pernikahan ${coupleTitle}.`,
    openGraph: {
      title: `Undangan Pernikahan ${coupleTitle}`,
      description: invitation.opening_quote.slice(0, 150),
      images: invitation.cover_photo_url ? [invitation.cover_photo_url] : [],
    },
  };
}

export default async function PublicInvitationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ to?: string }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const { invitation, isOwnerPreview } = await loadInvitationBySlug(slug);

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="glass-strong max-w-md w-full rounded-3xl p-8 text-center space-y-4 shadow-lift">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-terracotta-50 text-terracotta border border-terracotta/20">
            <Mail className="h-7 w-7" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-sage-900">
            Undangan Belum Tersedia
          </h1>
          <p className="text-sm text-sage-600 leading-relaxed">
            Tautan undangan <code className="font-mono">/u/{slug}</code> tidak
            ditemukan atau belum dipublikasikan oleh mempelai.
          </p>
          <div className="pt-2 flex flex-col items-center gap-3">
            <Button asChild variant="sage">
              <Link href="/">Kembali ke NikahPlan</Link>
            </Button>
            <NikahPlanLogo size="sm" />
          </div>
        </div>
      </div>
    );
  }

  const admin = createAdminClient();
  const { data: rsvpRows } = await admin
    .from("invitation_rsvps")
    .select("*")
    .eq("invitation_id", invitation.id)
    .order("created_at", { ascending: false })
    .limit(60);

  return (
    <PublicInvitationClient
      invitation={invitation}
      initialRsvps={(rsvpRows ?? []) as InvitationRsvp[]}
      guestNameParam={query.to?.trim() || ""}
      isOwnerPreview={isOwnerPreview}
    />
  );
}
