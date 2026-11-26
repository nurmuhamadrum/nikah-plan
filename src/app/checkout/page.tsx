import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MIDTRANS_SNAP_JS_URL } from "@/lib/midtrans";
import type { PlanType } from "@/types/database";
import { CheckoutClient } from "./checkout-client";

export const metadata: Metadata = {
  title: "Aktivasi Couple Pass",
  description:
    "Pilih paket NikahPlan dan selesaikan pembayaran aman via Midtrans Snap.",
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; order_id?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/checkout");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, has_paid, active_workspace_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.has_paid) {
    redirect("/onboarding");
  }

  const initialPlan: PlanType =
    params.plan === "WEDDING_ONLY" ? "WEDDING_ONLY" : "COMPLETE_PASS";

  return (
    <CheckoutClient
      userEmail={profile?.email || user.email || ""}
      userName={profile?.full_name || user.email?.split("@")[0] || "Pengguna"}
      initialPlan={initialPlan}
      snapJsUrl={MIDTRANS_SNAP_JS_URL}
      midtransClientKey={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ""}
      callbackOrderId={params.order_id}
    />
  );
}
