import { redirect } from "next/navigation";
import { LogOut, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NikahPlanLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPlaceholderPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, has_paid, active_workspace_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.has_paid) {
    redirect("/checkout");
  }

  return (
    <div className="min-h-screen bg-cream px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <NikahPlanLogo size="md" />
          <form action="/auth/signout" method="post">
            <Button variant="outline" size="sm" type="submit">
              <LogOut className="h-3.5 w-3.5" />
              Keluar
            </Button>
          </form>
        </div>

        <Card className="rounded-3xl border-sage/15 shadow-soft">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="softSage">
                <CheckCircle2 className="h-3.5 w-3.5 text-sage" />
                Terverifikasi &amp; Terlindungi Paywall
              </Badge>
            </div>
            <CardTitle className="font-display text-2xl">
              Halo, {profile.full_name}
            </CardTitle>
            <CardDescription>
              Anda berada di halaman Dashboard yang dilindungi oleh Next.js
              Middleware dan Supabase RLS. Fitur lengkap Dashboard Wedding &amp;
              Honeymoon akan hadir di Phase 2 &amp; Phase 3.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-sage-600 font-mono">
              Active Workspace ID: {profile.active_workspace_id ?? "Belum diset"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
