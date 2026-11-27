import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { requireAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getDynamicPricingPlans,
  getDynamicSiteContents,
} from "@/lib/dynamic-config";
import type {
  CustomerFeedbackRow,
  PromoCodeRow,
  SupportMessageRow,
  SupportTicketRow,
  SupportTicketWithMessages,
} from "@/types/database";
import { AdminClient, type AdminTransactionItem } from "./admin-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Admin CMS & Pricing Portal",
  description:
    "Kelola harga paket, kode promo, konten Landing Page, kurs default, transaksi, dan notifikasi Web Push NikahPlan.",
};

export default async function AdminPage() {
  const auth = await requireAdminSession();

  if (!auth.authorized) {
    if (auth.status === 401) {
      redirect("/login?next=/admin");
    }

    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="glass-strong max-w-md w-full rounded-3xl border-terracotta/25 shadow-lift">
          <CardContent className="p-7 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-terracotta-50 text-terracotta">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <h1 className="font-display text-2xl font-bold text-sage-900">
              Akses Khusus Admin
            </h1>
            <p className="text-sm text-sage-600">
              Akun Anda tidak memiliki izin Administrator. Tambahkan email Anda
              ke <span className="font-mono">ADMIN_EMAILS</span> di environment
              atau set <span className="font-mono">profiles.is_admin = true</span>{" "}
              di Supabase.
            </p>
            <Button asChild variant="sage">
              <Link href="/dashboard">Kembali ke Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const admin = createAdminClient();
  const [plans, contents] = await Promise.all([
    getDynamicPricingPlans(),
    getDynamicSiteContents(),
  ]);

  // Ambil metrik & data admin dengan fallback aman jika migrasi 003 belum dijalankan
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const inThreeDays = new Date(today);
  inThreeDays.setDate(today.getDate() + 3);
  const startStr = today.toISOString().split("T")[0];
  const endStr = inThreeDays.toISOString().split("T")[0];

  const [
    totalUsersRes,
    paidUsersRes,
    totalWsRes,
    paidSubsRes,
    recentSubsRes,
    promosRes,
    pushCountRes,
    dueCountRes,
    feedbacksRes,
    ticketsRes,
    ticketMessagesRes,
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("has_paid", true),
    admin.from("workspaces").select("id", { count: "exact", head: true }),
    admin.from("subscriptions").select("amount").eq("status", "PAID"),
    admin
      .from("subscriptions")
      .select("id, user_id, order_id, plan, amount, promo_code, status, payment_method, created_at")
      .order("created_at", { ascending: false })
      .limit(15),
    admin
      .from("promo_codes")
      .select("*")
      .order("created_at", { ascending: false }),
    admin.from("push_subscriptions").select("id", { count: "exact", head: true }),
    admin
      .from("item_payments")
      .select("id", { count: "exact", head: true })
      .eq("is_paid", false)
      .gte("due_date", startStr)
      .lte("due_date", endStr),
    admin
      .from("customer_feedbacks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("support_tickets")
      .select("*")
      .order("last_message_at", { ascending: false })
      .limit(100),
    admin
      .from("support_messages")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(500),
  ]);

  const initialFeedbacks: CustomerFeedbackRow[] = feedbacksRes.error
    ? []
    : ((feedbacksRes.data as CustomerFeedbackRow[] | null) ?? []);

  const rawTickets: SupportTicketRow[] = ticketsRes.error
    ? []
    : ((ticketsRes.data as SupportTicketRow[] | null) ?? []);

  const rawMessages: SupportMessageRow[] = ticketMessagesRes.error
    ? []
    : ((ticketMessagesRes.data as SupportMessageRow[] | null) ?? []);

  const messagesByTicket = new Map<string, SupportMessageRow[]>();
  for (const m of rawMessages) {
    const list = messagesByTicket.get(m.ticket_id) ?? [];
    list.push(m);
    messagesByTicket.set(m.ticket_id, list);
  }

  const initialTickets: SupportTicketWithMessages[] = rawTickets.map((t) => ({
    ...t,
    messages: messagesByTicket.get(t.id) ?? [],
  }));

  const recentSubs = recentSubsRes.data ?? [];
  const subUserIds = Array.from(new Set(recentSubs.map((s) => s.user_id)));
  const { data: subProfiles } =
    subUserIds.length > 0
      ? await admin.from("profiles").select("id, email").in("id", subUserIds)
      : { data: [] };

  const emailMap = new Map((subProfiles ?? []).map((p) => [p.id, p.email]));

  const recentTransactions: AdminTransactionItem[] = recentSubs.map((s) => ({
    id: s.id,
    order_id: s.order_id,
    plan: s.plan,
    amount: Number(s.amount) || 0,
    promo_code: s.promo_code,
    status: s.status,
    payment_method: s.payment_method,
    created_at: s.created_at,
    user_email: emailMap.get(s.user_id) || "-",
  }));

  const totalRevenue = (paidSubsRes.data ?? []).reduce(
    (sum, s) => sum + (Number(s.amount) || 0),
    0
  );

  return (
    <AdminClient
      adminEmail={auth.email}
      stats={{
        totalUsers: totalUsersRes.count ?? 0,
        paidUsers: paidUsersRes.count ?? 0,
        totalWorkspaces: totalWsRes.count ?? 0,
        totalRevenue,
        pushSubscribers: pushCountRes.count ?? 0,
        dueIn3DaysCount: dueCountRes.count ?? 0,
      }}
      recentTransactions={recentTransactions}
      initialPlans={plans}
      initialPromos={(promosRes.data as PromoCodeRow[] | null) ?? []}
      initialHero={contents.hero}
      initialAnnouncement={contents.announcement}
      initialRates={contents.defaultExchangeRates}
      initialSupportContact={contents.supportContact}
      initialFeedbacks={initialFeedbacks}
      initialTickets={initialTickets}
    />
  );
}
