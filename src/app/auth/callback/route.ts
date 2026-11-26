import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Jika ada parameter `next` yang aman (misal `/join/ABC12345`), prioritaskan redirect ke sana
      if (next && next.startsWith("/") && !next.startsWith("//")) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // Periksa status pembayaran & onboarding user
      const { data: profile } = await supabase
        .from("profiles")
        .select("has_paid, active_workspace_id")
        .eq("id", data.user.id)
        .maybeSingle();

      if (!profile?.has_paid) {
        return NextResponse.redirect(`${origin}/checkout`);
      }

      if (profile.active_workspace_id) {
        const { data: workspace } = await supabase
          .from("workspaces")
          .select("onboarding_completed")
          .eq("id", profile.active_workspace_id)
          .maybeSingle();

        if (workspace?.onboarding_completed) {
          return NextResponse.redirect(`${origin}/dashboard`);
        }
      }

      return NextResponse.redirect(`${origin}/onboarding`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
