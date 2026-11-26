import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateInviteCode } from "@/lib/utils";
import type { PlanType } from "@/types/database";

const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

export const MIDTRANS_SNAP_API_URL = isProduction
  ? "https://app.midtrans.com/snap/v1/transactions"
  : "https://app.sandbox.midtrans.com/snap/v1/transactions";

export const MIDTRANS_CORE_API_URL = isProduction
  ? "https://api.midtrans.com/v2"
  : "https://api.sandbox.midtrans.com/v2";

export const MIDTRANS_SNAP_JS_URL = isProduction
  ? "https://app.midtrans.com/snap/snap.js"
  : "https://app.sandbox.midtrans.com/snap/snap.js";

function getMidtransAuthHeader(): string {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    throw new Error("MIDTRANS_SERVER_KEY is not configured.");
  }
  const encoded = Buffer.from(`${serverKey}:`).toString("base64");
  return `Basic ${encoded}`;
}

export interface CreateSnapParams {
  orderId: string;
  amount: number;
  planName: string;
  planId: PlanType;
  customer: {
    firstName: string;
    email: string;
  };
  finishUrl: string;
}

export async function createMidtransSnapTransaction(params: CreateSnapParams): Promise<{
  token: string;
  redirect_url: string;
}> {
  const payload = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: Math.round(params.amount),
    },
    item_details: [
      {
        id: params.planId,
        price: Math.round(params.amount),
        quantity: 1,
        name: `NikahPlan - ${params.planName}`,
      },
    ],
    customer_details: {
      first_name: params.customer.firstName.slice(0, 50),
      email: params.customer.email,
    },
    callbacks: {
      finish: params.finishUrl,
    },
    expiry: {
      unit: "hour",
      duration: 24,
    },
  };

  const response = await fetch(MIDTRANS_SNAP_API_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getMidtransAuthHeader(),
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Midtrans Snap API error (${response.status}): ${errorBody}`);
  }

  const data = (await response.json()) as { token?: string; redirect_url?: string };
  if (!data.token || !data.redirect_url) {
    throw new Error("Midtrans Snap API did not return token/redirect_url.");
  }

  return { token: data.token, redirect_url: data.redirect_url };
}

export async function getMidtransTransactionStatus(orderId: string): Promise<{
  transaction_status: string;
  fraud_status?: string;
  payment_type?: string;
  status_code?: string;
  gross_amount?: string;
}> {
  const response = await fetch(
    `${MIDTRANS_CORE_API_URL}/${encodeURIComponent(orderId)}/status`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: getMidtransAuthHeader(),
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Midtrans Status API error (${response.status}): ${errorBody}`);
  }

  return response.json();
}

/**
 * Verifikasi signature_key Midtrans:
 * SHA512(order_id + status_code + gross_amount + ServerKey)
 */
export function verifyMidtransSignature(params: {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  signatureKey: string;
}): boolean {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey || !params.signatureKey) {
    return false;
  }

  const expected = crypto
    .createHash("sha512")
    .update(`${params.orderId}${params.statusCode}${params.grossAmount}${serverKey}`)
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "utf8");
  const receivedBuf = Buffer.from(params.signatureKey, "utf8");

  if (expectedBuf.length !== receivedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}

/**
 * Menentukan apakah status Midtrans berarti pembayaran LUNAS.
 */
export function isMidtransPaymentSettled(
  transactionStatus: string,
  fraudStatus?: string
): boolean {
  if (transactionStatus === "settlement") return true;
  if (transactionStatus === "capture") {
    return !fraudStatus || fraudStatus === "accept";
  }
  return false;
}

/**
 * Aktivasi akun & pembuatan workspace secara idempoten setelah pembayaran PAID.
 * Aman dipanggil berkali-kali dari webhook Midtrans maupun verifikasi klien.
 */
export async function activatePaidSubscription(params: {
  orderId: string;
  paymentMethod?: string | null;
}): Promise<{
  activated: boolean;
  workspaceId: string | null;
  alreadyPaid: boolean;
}> {
  const admin = createAdminClient();

  // 1. Ambil transaksi subscription berdasarkan order_id
  const { data: subscription, error: subError } = await admin
    .from("subscriptions")
    .select("*")
    .eq("order_id", params.orderId)
    .single();

  if (subError || !subscription) {
    throw new Error(`Subscription not found for order_id: ${params.orderId}`);
  }

  // 2. Ambil profil user
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("*")
    .eq("id", subscription.user_id)
    .single();

  if (profileError || !profile) {
    throw new Error(`Profile not found for user_id: ${subscription.user_id}`);
  }

  // Jika sudah PAID dan sudah punya workspace, kembalikan secara idempoten
  if (subscription.status === "PAID" && profile.has_paid && profile.active_workspace_id) {
    return {
      activated: true,
      workspaceId: profile.active_workspace_id,
      alreadyPaid: true,
    };
  }

  // 3. Update status subscription -> PAID
  await admin
    .from("subscriptions")
    .update({
      status: "PAID",
      payment_method: params.paymentMethod ?? subscription.payment_method,
      paid_at: new Date().toISOString(),
    })
    .eq("id", subscription.id);

  // 4. Pastikan user punya workspace (jika belum, buat workspace baru + tautkan sebagai OWNER)
  let workspaceId = profile.active_workspace_id;

  if (!workspaceId) {
    // Cek apakah sudah ada keanggotaan workspace milik user ini
    const { data: existingMembership } = await admin
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", profile.id)
      .limit(1)
      .maybeSingle();

    if (existingMembership?.workspace_id) {
      workspaceId = existingMembership.workspace_id;
      // Upgrade plan workspace jika user sebelumnya punya workspace dengan plan lebih rendah
      await admin
        .from("workspaces")
        .update({ plan: subscription.plan })
        .eq("id", workspaceId);
    } else {
      const firstName = profile.full_name.split(" ")[0] || "Kami";
      const coupleTitle = `${firstName} & Pasangan`;

      // Coba buat invite_code unik (hingga 5 kali percobaan)
      let createdWorkspaceId: string | null = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        const inviteCode = generateInviteCode(8);
        const { data: newWorkspace, error: wsError } = await admin
          .from("workspaces")
          .insert({
            couple_title: coupleTitle,
            plan: subscription.plan,
            invite_code: inviteCode,
            guest_estimate: 300,
            wedding_budget_target: 150000000,
            onboarding_completed: false,
          })
          .select("id")
          .single();

        if (!wsError && newWorkspace) {
          createdWorkspaceId = newWorkspace.id;
          break;
        }
      }

      if (!createdWorkspaceId) {
        throw new Error("Gagal membuat workspace baru setelah beberapa percobaan.");
      }

      workspaceId = createdWorkspaceId;

      // Tautkan user sebagai OWNER di workspace_members
      const { error: memberError } = await admin.from("workspace_members").insert({
        workspace_id: workspaceId,
        user_id: profile.id,
        role: "OWNER",
      });

      if (memberError) {
        throw new Error(`Gagal menambahkan OWNER ke workspace_members: ${memberError.message}`);
      }
    }
  } else {
    // Jika workspace sudah ada (misal upgrade paket), update plan-nya
    await admin
      .from("workspaces")
      .update({ plan: subscription.plan })
      .eq("id", workspaceId);
  }

  // 5. Aktifkan has_paid = true dan set active_workspace_id di profiles
  const { error: updateProfileError } = await admin
    .from("profiles")
    .update({
      has_paid: true,
      active_workspace_id: workspaceId,
    })
    .eq("id", profile.id);

  if (updateProfileError) {
    throw new Error(`Gagal memperbarui status has_paid profil: ${updateProfileError.message}`);
  }

  return {
    activated: true,
    workspaceId,
    alreadyPaid: false,
  };
}
