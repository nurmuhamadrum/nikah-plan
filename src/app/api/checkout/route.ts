import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS, validatePromoCode } from "@/lib/plans";
import { createMidtransSnapTransaction } from "@/lib/midtrans";
import { getAppUrl } from "@/lib/utils";

const checkoutSchema = z.object({
  plan: z.enum(["WEDDING_ONLY", "COMPLETE_PASS"]),
  promoCode: z.string().trim().max(32).optional().nullable(),
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

    const planDef = PLANS[parsed.data.plan];
    const promoResult = validatePromoCode(parsed.data.promoCode, planDef.price);
    const finalAmount = promoResult.finalAmount;

    const admin = createAdminClient();

    // Ambil profil user
    const { data: profile } = await admin
      .from("profiles")
      .select("id, full_name, email, has_paid")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.has_paid) {
      return NextResponse.json(
        { error: "Akun Anda sudah memiliki akses aktif.", alreadyPaid: true },
        { status: 409 }
      );
    }

    const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
    const orderId = `NP-${Date.now()}-${randomSuffix}`;
    const appUrl = getAppUrl();

    // Panggil Midtrans Snap API untuk mendapatkan snap_token
    const snap = await createMidtransSnapTransaction({
      orderId,
      amount: finalAmount,
      planName: planDef.name,
      planId: planDef.id,
      customer: {
        firstName: profile?.full_name || user.email?.split("@")[0] || "Pengguna",
        email: profile?.email || user.email || "",
      },
      finishUrl: `${appUrl}/checkout?order_id=${encodeURIComponent(orderId)}&status=finish`,
    });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Simpan transaksi ke tabel subscriptions dengan status PENDING
    const { error: insertError } = await admin.from("subscriptions").insert({
      user_id: user.id,
      order_id: orderId,
      plan: planDef.id,
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
