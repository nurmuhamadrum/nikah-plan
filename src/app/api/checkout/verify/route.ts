import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  activatePaidSubscription,
  getMidtransTransactionStatus,
  isMidtransPaymentSettled,
} from "@/lib/midtrans";

const verifySchema = z.object({
  orderId: z.string().trim().min(5).max(100),
});

/**
 * Endpoint verifikasi server-to-server status order Midtrans
 * setelah modal Snap selesai/ditutup (pelengkap webhook agar UX instan).
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "orderId tidak valid" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: subscription } = await admin
      .from("subscriptions")
      .select("id, user_id, order_id, status")
      .eq("order_id", parsed.data.orderId)
      .maybeSingle();

    if (!subscription || subscription.user_id !== user.id) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan." },
        { status: 404 }
      );
    }

    if (subscription.status === "PAID") {
      return NextResponse.json({
        status: "PAID",
        redirectTo: "/onboarding",
      });
    }

    // Verifikasi status langsung ke Midtrans Core API
    const midtransStatus = await getMidtransTransactionStatus(subscription.order_id);

    if (
      isMidtransPaymentSettled(
        midtransStatus.transaction_status,
        midtransStatus.fraud_status
      )
    ) {
      await activatePaidSubscription({
        orderId: subscription.order_id,
        paymentMethod: midtransStatus.payment_type ?? null,
      });

      return NextResponse.json({
        status: "PAID",
        redirectTo: "/onboarding",
      });
    }

    if (midtransStatus.transaction_status === "expire") {
      await admin
        .from("subscriptions")
        .update({ status: "EXPIRED" })
        .eq("id", subscription.id);
      return NextResponse.json({ status: "EXPIRED" });
    }

    if (
      ["deny", "cancel", "failure"].includes(midtransStatus.transaction_status)
    ) {
      await admin
        .from("subscriptions")
        .update({ status: "FAILED" })
        .eq("id", subscription.id);
      return NextResponse.json({ status: "FAILED" });
    }

    return NextResponse.json({
      status: "PENDING",
      midtransStatus: midtransStatus.transaction_status,
    });
  } catch (err) {
    console.error("[API /api/checkout/verify] Error:", err);
    return NextResponse.json(
      { error: "Gagal memverifikasi status pembayaran." },
      { status: 500 }
    );
  }
}
