import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { JoinClient } from "./join-client";

export const metadata: Metadata = {
  title: "Terima Undangan Pasangan",
  description:
    "Bergabung ke workspace pernikahan & bulan madu pasangan Anda di NikahPlan tanpa perlu membayar ulang.",
};

export default async function JoinWorkspacePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const normalizedCode = code.trim().toUpperCase();

  let workspaceInfo: {
    id: string;
    coupleTitle: string;
    plan: "WEDDING_ONLY" | "COMPLETE_PASS";
    memberCount: number;
  } | null = null;
  let isLoggedIn = false;
  let userEmail: string | undefined;
  let alreadyMember = false;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      isLoggedIn = true;
      userEmail = user.email;
    }

    const admin = createAdminClient();
    const { data: ws } = await admin
      .from("workspaces")
      .select("id, couple_title, plan")
      .eq("invite_code", normalizedCode)
      .maybeSingle();

    if (ws) {
      const { data: members } = await admin
        .from("workspace_members")
        .select("user_id")
        .eq("workspace_id", ws.id);

      workspaceInfo = {
        id: ws.id,
        coupleTitle: ws.couple_title,
        plan: ws.plan,
        memberCount: members?.length ?? 0,
      };

      if (user && members?.some((m) => m.user_id === user.id)) {
        alreadyMember = true;
      }
    }
  } catch (err) {
    console.error("[JoinPage] Failed to load invite metadata:", err);
  }

  return (
    <JoinClient
      code={normalizedCode}
      workspace={workspaceInfo}
      isLoggedIn={isLoggedIn}
      userEmail={userEmail}
      alreadyMember={alreadyMember}
    />
  );
}
