"use client";

import type { InvitationRsvp, WeddingInvitation } from "@/types/database";
import { InvitationRenderer } from "@/components/invitations/invitation-renderer";

export function PublicInvitationClient({
  invitation,
  initialRsvps,
  guestNameParam,
  isOwnerPreview,
}: {
  invitation: WeddingInvitation;
  initialRsvps: InvitationRsvp[];
  guestNameParam: string;
  isOwnerPreview: boolean;
}) {
  return (
    <InvitationRenderer
      invitation={invitation}
      initialRsvps={initialRsvps}
      guestNameParam={guestNameParam}
      isOwnerPreview={isOwnerPreview}
      mode="public"
    />
  );
}
