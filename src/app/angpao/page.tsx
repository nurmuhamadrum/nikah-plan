import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Gift, Sparkles, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedProfileAndWorkspace } from "@/lib/workspace-data";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Angpao & Gift Tracker",
  description:
    "Catat amplop dan kado pernikahan lalu alokasikan langsung ke tagihan vendor atau Dompet Honeymoon.",
};

export default async function AngpaoPlaceholderPage() {
  const supabase = await createClient();
  const { profile, bundle } =
    await getAuthenticatedProfileAndWorkspace(supabase);

  if (!profile) redirect("/login?next=/angpao");
  if (!profile.has_paid) redirect("/checkout");
  if (!bundle) redirect("/onboarding");

  return (
    <AppShell userName={profile.full_name} avatarUrl={profile.avatar_url}>
      <div className="space-y-5">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-sage-900">
            Angpao &amp; Gift Bridge
          </h1>
          <p className="text-xs sm:text-sm text-sage-600 mt-1">
            Jembatan pemasukan amplop resepsi menuju pelunasan vendor &amp; Dompet
            Honeymoon.
          </p>
        </div>

        <Card className="rounded-3xl border-sage/15 bg-white shadow-soft">
          <CardContent className="p-7 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-terracotta-50 text-terracotta">
              <Gift className="h-7 w-7" />
            </div>
            <Badge variant="softTerracotta" className="mx-auto">
              <Sparkles className="h-3.5 w-3.5" />
              Hadir di Phase 3
            </Badge>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h2 className="font-display text-xl font-bold text-sage-900">
                Modul Angpao &amp; Honeymoon Penuh
              </h2>
              <p className="text-sm text-sage-600">
                Di Phase 3 Anda dapat mencatat setiap amplop/hadiah dan
                mengalokasikannya dalam 1 klik untuk menutup sisa tagihan vendor
                atau mengisi Dompet Honeymoon.
              </p>
            </div>
            <Button asChild variant="sage">
              <Link href="/vendors">
                Kelola Vendor &amp; Termin Dulu
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
