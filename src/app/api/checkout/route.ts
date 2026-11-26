import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  calculateUpgradePrice,
  getDynamicPricingPlans,
  validateDynamicPromoCode,
} from "@/lib/dynamic-config";
import { createMidtransSnapTransaction } from "@/lib/midtrans";
import { getAppUrl } from "@/lib/utils";

const checkoutSchema = z.object({
  plan: z.enum(["WEDDING_ONLY", "COMPLETE_PASS"]),
  promoCode: z.string().trim().max(32).optional().nullable(),
  isUpgrade: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu sebelum melanjutkan checkout." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Pilihan paket tidak valid." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("id, full_name, email, has_paid, active_workspace_id")
      .eq("id", user.id)
      .maybeSingle();

    const plans = await getDynamicPricingPlans();
    const isUpgrade = Boolean(parsed.data.isUpgrade);

    let targetPlan = parsed.data.plan;
    let basePrice = plans[targetPlan].price;
    let planLabel = plans[targetPlan].name;

    if (isUpgrade) {
      if (!profile?.has_paid || !profile.active_workspace_id) {
        return NextResponse.json(
          { error: "Akun belum memiliki paket aktif untuk di-upgrade." },
          { status: 400 }
        );
      }

      const { data: ws } = await admin
        .from("workspaces")
        .select("plan")
        .eq("id", profile.active_workspace_id)
        .maybeSingle();

      if (ws?.plan === "COMPLETE_PASS") {
        return NextResponse.json(
          {
            error: "Workspace Anda sudah menggunakan Complete Couple Pass.",
            alreadyPaid: true,
          },
          { status: 409 }
        );
      }

      targetPlan = "COMPLETE_PASS";
      basePrice = calculateUpgradePrice(plans);
      planLabel = `Upgrade ke ${plans.COMPLETE_PASS.name}`;
    } else if (profile?.has_paid) {
      return NextResponse.json(
        { error: "Akun Anda sudah memiliki akses aktif.", alreadyPaid: true },
        { status: 409 }
      );
    }

    const promoResult = await validateDynamicPromoCode(
      parsed.data.promoCode,
      basePrice
    );
    const finalAmount = promoResult.finalAmount;

    const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
    const orderId = `${isUpgrade ? "NPUPG" : "NP"}-${Date.now()}-${randomSuffix}`;
    const appUrl = getAppUrl();

    const finishUrl = isUpgrade
      ? `${appUrl}/checkout?upgrade=1&order_id=${encodeURIComponent(orderId)}&status=finish`
      : `${appUrl}/checkout?order_id=${encodeURIComponent(orderId)}&status=finish`;

    const snap = await createMidtransSnapTransaction({
      orderId,
      amount: finalAmount,
      planName: planLabel,
      planId: targetPlan,
      customer: {
        firstName: profile?.full_name || user.email?.split("@")[0] || "Pengguna",
        email: profile?.email || user.email || "",
      },
      finishUrl,
    });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error: insertError } = await admin.from("subscriptions").insert({
      user_id: user.id,
      order_id: orderId,
      plan: targetPlan,
      amount: finalAmount,
      promo_code: promoResult.valid ? promoResult.code : null,
      status: "PENDING",
      snap_token: snap.token,
      expires_at: expiresAt,
    });

    if (insertError) {
      console.error("[API /api/checkout] Insert subscription failed:", insertError);
      return NextResponse.json(
        { error: "Gagal menyimpan data transaksi." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      orderId,
      snapToken: snap.token,
      redirectUrl: snap.redirect_url,
      amount: finalAmount,
      discountAmount: promoResult.discountAmount,
      promoApplied: promoResult.valid ? promoResult.code : null,
    });
  } catch (err) {
    console.error("[API /api/checkout] Error:", err);
    const message =
      err instanceof Error
        ? err.message
        : "Gagal memproses transaksi Midtrans.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
