import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertCircle, LogOut, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ensurePaidUserWorkspace } from "@/lib/workspace-provisioning";
import { getAppUrl } from "@/lib/utils";
import { NikahPlanLogo } from "@/components/brand/logo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

  let workspace = null;
  if (profile.active_workspace_id) {
    const { data: ws } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", profile.active_workspace_id)
      .maybeSingle();
    workspace = ws;
  }

  // Self-healing: jika user sudah has_paid=true namun belum tertaut ke workspace/workspace_members,
  // buatkan workspace otomatis agar tidak terjadi redirect loop /onboarding <-> /checkout.
  let provisionError: string | null = null;
  if (!workspace) {
    const result = await ensurePaidUserWorkspace(user.id);
    workspace = result.workspace;
    provisionError = result.errorReason;
  }

  if (!workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg space-y-6">
          <div className="flex justify-center">
            <NikahPlanLogo size="lg" />
          </div>
          <Card className="glass-strong rounded-3xl border-terracotta/30 shadow-lift">
            <CardContent className="p-6 sm:p-7 space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-terracotta-50 text-terracotta">
                <AlertCircle className="h-7 w-7" />
              </div>
              <h1 className="font-display text-2xl font-bold text-sage-900">
                Workspace Belum Siap
              </h1>
              <p className="text-sm text-sage-700 leading-relaxed">
                Akun Anda sudah berstatus <strong>Aktif (has_paid = true)</strong>
                , tetapi workspace belum terhubung dengan akun Anda.
              </p>
              {provisionError && (
                <div className="rounded-xl border border-terracotta/25 bg-terracotta-50/80 p-3.5 text-left text-xs text-terracotta-900 leading-relaxed">
                  <strong>Detail:</strong> {provisionError}
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2 justify-center">
                <Button asChild variant="sage">
                  <Link href="/onboarding">
                    <RefreshCw className="h-4 w-4" />
                    Muat Ulang Halaman
                  </Link>
                </Button>
                <form action="/auth/signout" method="post">
                  <Button type="submit" variant="outline" className="w-full">
                    <LogOut className="h-4 w-4" />
                    Keluar Akun
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
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
