import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MIDTRANS_SNAP_JS_URL } from "@/lib/midtrans";
import {
  calculateUpgradePrice,
  getDynamicPricingPlans,
} from "@/lib/dynamic-config";
import type { PlanType } from "@/types/database";
import { CheckoutClient } from "./checkout-client";

export const metadata: Metadata = {
  title: "Aktivasi & Upgrade Couple Pass",
  description:
    "Pilih atau upgrade paket NikahPlan dan selesaikan pembayaran aman via Midtrans Snap.",
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; order_id?: string; upgrade?: string }>;
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

  const isUpgradeRequested = params.upgrade === "1";

  if (profile?.has_paid) {
    if (isUpgradeRequested && profile.active_workspace_id) {
      const { data: ws } = await supabase
        .from("workspaces")
        .select("plan")
        .eq("id", profile.active_workspace_id)
        .maybeSingle();

      if (ws?.plan !== "WEDDING_ONLY") {
        redirect("/dashboard");
      }
    } else {
      redirect("/onboarding");
    }
  }

  const plans = await getDynamicPricingPlans();
  const upgradePrice = calculateUpgradePrice(plans);
  const initialPlan: PlanType =
    !isUpgradeRequested && params.plan === "WEDDING_ONLY"
      ? "WEDDING_ONLY"
      : "COMPLETE_PASS";

  return (
    <CheckoutClient
      userEmail={profile?.email || user.email || ""}
      userName={profile?.full_name || user.email?.split("@")[0] || "Pengguna"}
      initialPlan={initialPlan}
      plans={plans}
      isUpgrade={isUpgradeRequested && Boolean(profile?.has_paid)}
      upgradePrice={upgradePrice}
      snapJsUrl={MIDTRANS_SNAP_JS_URL}
      midtransClientKey={process.env.MIDTRANS_PUBLIC_MIDTRANS_CLIENT_KEY || ""}
      callbackOrderId={params.order_id}
    />
  );
}
