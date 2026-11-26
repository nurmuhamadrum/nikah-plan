import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  activatePaidSubscription,
  isMidtransPaymentSettled,
  verifyMidtransSignature,
} from "@/lib/midtrans";

interface MidtransNotificationPayload {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  fraud_status?: string;
  payment_type?: string;
}

/**
 * Webhook Endpoint Midtrans (`POST /api/webhooks/midtrans`)
 * 1. Memverifikasi SHA-512 signature_key dari Midtrans.
 * 2. Memperbarui status transaksi pada tabel `subscriptions`.
 * 3. Jika PAID -> otomatis membuat `workspaces`, menautkan user sebagai `OWNER`,
 *    dan mengubah `profiles.has_paid = true`.
 */
export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<MidtransNotificationPayload>;

    if (
      !payload.order_id ||
      !payload.status_code ||
      !payload.gross_amount ||
      !payload.signature_key ||
      !payload.transaction_status
    ) {
      return NextResponse.json(
        { error: "Invalid Midtrans notification payload" },
        { status: 400 }
      );
    }

    // 1. Verifikasi signature key Midtrans (SHA-512)
    const isSignatureValid = verifyMidtransSignature({
      orderId: payload.order_id,
      statusCode: payload.status_code,
      grossAmount: payload.gross_amount,
      signatureKey: payload.signature_key,
    });

    if (!isSignatureValid) {
      console.warn(
        "[Midtrans Webhook] Invalid signature for order_id:",
        payload.order_id
      );
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const admin = createAdminClient();
    const { transaction_status, fraud_status, payment_type, order_id } = payload;

    // 2. Jika pembayaran LUNAS (settlement / capture accept)
    if (isMidtransPaymentSettled(transaction_status, fraud_status)) {
      const result = await activatePaidSubscription({
        orderId: order_id,
        paymentMethod: payment_type ?? null,
      });

      return NextResponse.json({
        received: true,
        orderId: order_id,
        status: "PAID",
        workspaceId: result.workspaceId,
      });
    }

    // 3. Tangani status gagal / kedaluwarsa / pending
    if (transaction_status === "expire") {
      await admin
        .from("subscriptions")
        .update({
          status: "EXPIRED",
          payment_method: payment_type ?? null,
        })
        .eq("order_id", order_id);

      return NextResponse.json({ received: true, status: "EXPIRED" });
    }

    if (["cancel", "deny", "failure"].includes(transaction_status)) {
      await admin
        .from("subscriptions")
        .update({
          status: "FAILED",
          payment_method: payment_type ?? null,
        })
        .eq("order_id", order_id);

      return NextResponse.json({ received: true, status: "FAILED" });
    }

    if (transaction_status === "pending") {
      await admin
        .from("subscriptions")
        .update({
          status: "PENDING",
          payment_method: payment_type ?? null,
        })
        .eq("order_id", order_id);

      return NextResponse.json({ received: true, status: "PENDING" });
    }

    return NextResponse.json({ received: true, status: transaction_status });
  } catch (err) {
    console.error("[Midtrans Webhook] Error processing notification:", err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
