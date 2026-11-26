import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatIDR } from "@/lib/utils";

function configureVapid(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@nikahplan.id";

  if (!publicKey || !privateKey) {
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

/**
 * Mengirim Web Push Notification untuk seluruh termin vendor belum lunas
 * yang jatuh tempo antara hari ini (H-0) hingga 3 hari ke depan (H-3).
 */
export async function dispatchDueDateReminders(): Promise<{
  configured: boolean;
  duePaymentsFound: number;
  notificationsSent: number;
  expiredRemoved: number;
  failed: number;
}> {
  const configured = configureVapid();
  if (!configured) {
    return {
      configured: false,
      duePaymentsFound: 0,
      notificationsSent: 0,
      expiredRemoved: 0,
      failed: 0,
    };
  }

  const admin = createAdminClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const inThreeDays = new Date(today);
  inThreeDays.setDate(today.getDate() + 3);

  const startStr = today.toISOString().split("T")[0];
  const endStr = inThreeDays.toISOString().split("T")[0];

  const { data: duePayments } = await admin
    .from("item_payments")
    .select("id, workspace_id, item_id, label, amount, due_date")
    .eq("is_paid", false)
    .gte("due_date", startStr)
    .lte("due_date", endStr);

  if (!duePayments || duePayments.length === 0) {
    return {
      configured: true,
      duePaymentsFound: 0,
      notificationsSent: 0,
      expiredRemoved: 0,
      failed: 0,
    };
  }

  const workspaceIds = Array.from(new Set(duePayments.map((p) => p.workspace_id)));
  const itemIds = Array.from(new Set(duePayments.map((p) => p.item_id)));

  const [{ data: items }, { data: subscriptions }] = await Promise.all([
    admin.from("budget_items").select("id, title").in("id", itemIds),
    admin
      .from("push_subscriptions")
      .select("id, workspace_id, endpoint, p256dh, auth")
      .in("workspace_id", workspaceIds),
  ]);

  const itemTitleMap = new Map((items ?? []).map((i) => [i.id, i.title]));
  const subsByWorkspace = new Map<
    string,
    NonNullable<typeof subscriptions>
  >();
  for (const sub of subscriptions ?? []) {
    const arr = subsByWorkspace.get(sub.workspace_id) ?? [];
    arr.push(sub);
    subsByWorkspace.set(sub.workspace_id, arr);
  }

  let notificationsSent = 0;
  let expiredRemoved = 0;
  let failed = 0;

  for (const payment of duePayments) {
    const wsSubs = subsByWorkspace.get(payment.workspace_id);
    if (!wsSubs || wsSubs.length === 0) continue;

    const itemTitle = itemTitleMap.get(payment.item_id) || "Vendor Pernikahan";
    const dueDateObj = new Date(payment.due_date || startStr);
    dueDateObj.setHours(0, 0, 0, 0);
    const diffDays = Math.round(
      (dueDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    const whenText =
      diffDays === 0 ? "hari ini" : `dalam ${diffDays} hari (H-${diffDays})`;

    const payload = JSON.stringify({
      title: `Pengingat Tagihan Vendor (${whenText})`,
      body: `${payment.label} — ${itemTitle} sebesar ${formatIDR(Number(payment.amount))} jatuh tempo ${whenText}.`,
      url: "/vendors",
      tag: `due-${payment.id}`,
    });

    for (const sub of wsSubs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        );
        notificationsSent += 1;
      } catch (err) {
        const statusCode =
          err && typeof err === "object" && "statusCode" in err
            ? Number((err as { statusCode: unknown }).statusCode)
            : 0;
        if (statusCode === 404 || statusCode === 410) {
          await admin.from("push_subscriptions").delete().eq("id", sub.id);
          expiredRemoved += 1;
        } else {
          failed += 1;
        }
      }
    }
  }

  return {
    configured: true,
    duePaymentsFound: duePayments.length,
    notificationsSent,
    expiredRemoved,
    failed,
  };
}
