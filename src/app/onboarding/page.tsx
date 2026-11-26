import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Sparkles, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NikahPlanLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function OnboardingPlaceholderPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/onboarding");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, has_paid, active_workspace_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.has_paid) {
    redirect("/checkout");
  }

  let inviteCode: string | null = null;
  let coupleTitle = "Workspace Anda";

  if (profile.active_workspace_id) {
    const { data: ws } = await supabase
      .from("workspaces")
      .select("couple_title, invite_code")
      .eq("id", profile.active_workspace_id)
      .maybeSingle();
    if (ws) {
      coupleTitle = ws.couple_title;
      inviteCode = ws.invite_code;
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex justify-center">
          <NikahPlanLogo size="lg" />
        </div>
        <Card className="rounded-3xl border-sage/15 shadow-soft">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-sage text-white">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <Badge variant="softSage" className="mx-auto mb-2">
              <Sparkles className="h-3.5 w-3.5 text-terracotta" />
              Akses Couple Pass Aktif
            </Badge>
            <CardTitle className="font-display text-2xl">
              Selamat Datang, {coupleTitle}!
            </CardTitle>
            <CardDescription>
              Pembayaran &amp; workspace Anda sudah aktif. Wizard Onboarding 4
              langkah akan dibangun pada Phase 2.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {inviteCode && (
              <div className="rounded-xl border border-sage/15 bg-cream-50 p-4 text-center space-y-1">
                <p className="text-xs text-sage-600">Kode Undangan Pasangan</p>
                <p className="font-mono text-lg font-bold tracking-widest text-sage-900">
                  {inviteCode}
                </p>
                <p className="text-[11px] text-sage-600">
                  Tautan: /join/{inviteCode}
                </p>
              </div>
            )}
            <Button asChild size="lg" className="w-full">
              <Link href="/dashboard">
                Lanjut ke Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
