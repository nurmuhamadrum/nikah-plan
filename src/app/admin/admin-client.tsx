"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  Check,
  CreditCard,
  FileEdit,
  Headphones,
  LayoutDashboard,
  Loader2,
  MessageSquareHeart,
  Plus,
  Send,
  ShieldCheck,
  Star,
  Tag,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import type { PlanDefinition } from "@/lib/plans";
import type {
  AnnouncementContent,
  HeroContent,
  SupportContactContent,
} from "@/lib/dynamic-config";
import type {
  CustomerFeedbackRow,
  FeedbackCategory,
  FeedbackStatus,
  PlanType,
  PromoCodeRow,
  PromoDiscountType,
  SupportTicketStatus,
  SupportTicketWithMessages,
  SupportTopic,
} from "@/types/database";
import { formatIDR } from "@/lib/utils";
import { NikahPlanLogo } from "@/components/brand/logo";
import { useToast } from "@/components/providers/toast-provider";
import { useConfirm } from "@/components/providers/confirm-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface AdminTransactionItem {
  id: string;
  order_id: string;
  plan: PlanType;
  amount: number;
  promo_code: string | null;
  status: string;
  payment_method: string | null;
  created_at: string;
  user_email: string;
}

interface AdminClientProps {
  adminEmail: string;
  stats: {
    totalUsers: number;
    paidUsers: number;
    totalWorkspaces: number;
    totalRevenue: number;
    pushSubscribers: number;
    dueIn3DaysCount: number;
  };
  recentTransactions: AdminTransactionItem[];
  initialPlans: Record<PlanType, PlanDefinition>;
  initialPromos: PromoCodeRow[];
  initialHero: HeroContent;
  initialAnnouncement: AnnouncementContent;
  initialRates: Record<string, number>;
  initialSupportContact: SupportContactContent;
  initialFeedbacks: CustomerFeedbackRow[];
  initialTickets: SupportTicketWithMessages[];
}

type AdminTab =
  | "overview"
  | "pricing"
  | "promos"
  | "content"
  | "support"
  | "feedback"
  | "push";

const SUPPORT_TOPIC_LABELS: Record<SupportTopic, string> = {
  PEMBAYARAN: "Pembayaran & Paket",
  AKUN_PASANGAN: "Akun & Pasangan",
  UNDANGAN: "Undangan Online",
  TEKNIS: "Kendala Teknis",
  LAINNYA: "Lainnya",
};

const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  SUGGESTION: "Saran",
  FEATURE: "Request Fitur",
  BUG: "Lapor Bug",
  PRAISE: "Apresiasi",
};

export function AdminClient({
  adminEmail,
  stats,
  recentTransactions,
  initialPlans,
  initialPromos,
  initialHero,
  initialAnnouncement,
  initialRates,
  initialSupportContact,
  initialFeedbacks,
  initialTickets,
}: AdminClientProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const globalToast = useToast();
  const confirm = useConfirm();
  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Pricing state
  const [plans, setPlans] = useState<Record<PlanType, PlanDefinition>>(initialPlans);
  const [savingPlanId, setSavingPlanId] = useState<PlanType | null>(null);

  // Promo state
  const [promos, setPromos] = useState<PromoCodeRow[]>(initialPromos);
  const [newCode, setNewCode] = useState("");
  const [newDiscountType, setNewDiscountType] =
    useState<PromoDiscountType>("PERCENT");
  const [newDiscountValue, setNewDiscountValue] = useState("15");
  const [newDescription, setNewDescription] = useState("");
  const [newMaxUses, setNewMaxUses] = useState("");
  const [newExpiresAt, setNewExpiresAt] = useState("");
  const [creatingPromo, setCreatingPromo] = useState(false);

  // Content state
  const [hero, setHero] = useState<HeroContent>(initialHero);
  const [announcement, setAnnouncement] =
    useState<AnnouncementContent>(initialAnnouncement);
  const [rates, setRates] = useState<Record<string, number>>(initialRates);
  const [supportContact, setSupportContact] = useState<SupportContactContent>(
    initialSupportContact
  );
  const [savingContentKey, setSavingContentKey] = useState<string | null>(null);

  // Customer Service Tickets state
  const [tickets, setTickets] =
    useState<SupportTicketWithMessages[]>(initialTickets);
  const [ticketFilter, setTicketFilter] = useState<"ALL" | SupportTicketStatus>(
    "ALL"
  );
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    initialTickets[0]?.id ?? null
  );
  const [adminReplyText, setAdminReplyText] = useState("");
  const [adminReplyNextStatus, setAdminReplyNextStatus] =
    useState<SupportTicketStatus>("IN_PROGRESS");
  const [sendingAdminReply, setSendingAdminReply] = useState(false);
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);

  // Customer Feedback state
  const [feedbacks, setFeedbacks] =
    useState<CustomerFeedbackRow[]>(initialFeedbacks);
  const [fbStatusFilter, setFbStatusFilter] = useState<"ALL" | FeedbackStatus>(
    "ALL"
  );
  const [fbCategoryFilter, setFbCategoryFilter] = useState<
    "ALL" | FeedbackCategory
  >("ALL");
  const [fbReplyDrafts, setFbReplyDrafts] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        initialFeedbacks.map((f) => [f.id, f.admin_reply ?? ""])
      )
  );
  const [fbStatusDrafts, setFbStatusDrafts] = useState<
    Record<string, FeedbackStatus>
  >(() => Object.fromEntries(initialFeedbacks.map((f) => [f.id, f.status])));
  const [savingFeedbackId, setSavingFeedbackId] = useState<string | null>(null);

  // Push dispatch state
  const [dispatchingPush, setDispatchingPush] = useState(false);
  const [pushResult, setPushResult] = useState<string | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4500);
  };

  // --- HANDLERS: PRICING PLANS ---
  const updatePlanField = <K extends keyof PlanDefinition>(
    planId: PlanType,
    field: K,
    value: PlanDefinition[K]
  ) => {
    setPlans((prev) => ({
      ...prev,
      [planId]: { ...prev[planId], [field]: value },
    }));
  };

  const handleSavePlan = async (planId: PlanType) => {
    const target = plans[planId];
    const ok = await confirm({
      title: `Simpan Paket "${target.name}"?`,
      description: `Harga ${formatIDR(Number(target.price))} akan langsung diterapkan ke Landing Page & halaman Checkout.`,
      confirmLabel: "Ya, Simpan Paket",
    });
    if (!ok) return;

    setSavingPlanId(planId);
    try {
      const res = await fetch("/api/admin/plans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: target.id,
          name: target.name,
          tagline: target.tagline,
          price: Number(target.price),
          originalPrice: Number(target.originalPrice),
          badge: target.badge || null,
          recommended: Boolean(target.recommended),
          features: target.features,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || "Gagal menyimpan paket.";
        showToast("error", msg);
        globalToast.error("Gagal menyimpan paket", msg);
      } else {
        const msg = `Paket "${target.name}" berhasil diperbarui ke Landing Page & Checkout!`;
        showToast("success", msg);
        globalToast.success("Paket harga diperbarui", msg);
      }
    } catch {
      const msg = "Kendala jaringan saat menyimpan paket.";
      showToast("error", msg);
      globalToast.error("Gagal menyimpan paket", msg);
    } finally {
      setSavingPlanId(null);
    }
  };

  // --- HANDLERS: PROMO CODES ---
  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;
    const ok = await confirm({
      title: `Buat Kode Promo "${newCode.trim().toUpperCase()}"?`,
      description: "Kode promo baru akan langsung aktif dan dapat digunakan calon pengantin di halaman Checkout.",
      confirmLabel: "Ya, Buat Promo",
    });
    if (!ok) return;

    setCreatingPromo(true);
    try {
      const res = await fetch("/api/admin/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCode.trim().toUpperCase(),
          discountType: newDiscountType,
          discountValue: Number(newDiscountValue) || 0,
          description: newDescription.trim(),
          maxUses: newMaxUses ? Number(newMaxUses) : null,
          expiresAt: newExpiresAt || null,
          isActive: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || "Gagal membuat kode promo.";
        showToast("error", msg);
        globalToast.error("Gagal membuat kode promo", msg);
      } else {
        setPromos((prev) => [data.promo, ...prev]);
        setNewCode("");
        setNewDescription("");
        setNewMaxUses("");
        setNewExpiresAt("");
        const msg = `Kode promo ${data.promo.code} berhasil dibuat.`;
        showToast("success", msg);
        globalToast.success("Kode promo dibuat", msg);
      }
    } catch {
      const msg = "Kendala jaringan saat membuat kode promo.";
      showToast("error", msg);
      globalToast.error("Gagal membuat kode promo", msg);
    } finally {
      setCreatingPromo(false);
    }
  };

  const handleTogglePromoActive = async (promo: PromoCodeRow) => {
    try {
      const res = await fetch("/api/admin/promos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: promo.id, isActive: !promo.is_active }),
      });
      const data = await res.json();
      if (res.ok && data.promo) {
        setPromos((prev) =>
          prev.map((p) => (p.id === promo.id ? data.promo : p))
        );
        const msg = `Promo ${promo.code} ${data.promo.is_active ? "diaktifkan" : "dinonaktifkan"}.`;
        showToast("success", msg);
        globalToast.success("Status promo diperbarui", msg);
      } else {
        globalToast.error("Gagal mengubah status promo");
      }
    } catch {
      showToast("error", "Gagal mengubah status promo.");
      globalToast.error("Gagal mengubah status promo");
    }
  };

  const handleDeletePromo = async (promo: PromoCodeRow) => {
    const ok = await confirm({
      title: `Hapus Kode Promo "${promo.code}"?`,
      description: "Kode promo yang dihapus tidak lagi dapat digunakan pada transaksi baru.",
      confirmLabel: "Ya, Hapus Promo",
      variant: "destructive",
    });
    if (!ok) return;

    try {
      const res = await fetch("/api/admin/promos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: promo.id }),
      });
      if (res.ok) {
        setPromos((prev) => prev.filter((p) => p.id !== promo.id));
        showToast("success", `Promo ${promo.code} dihapus.`);
        globalToast.success("Promo dihapus", `Kode ${promo.code} telah dihapus.`);
      } else {
        globalToast.error("Gagal menghapus kode promo");
      }
    } catch {
      showToast("error", "Gagal menghapus kode promo.");
      globalToast.error("Gagal menghapus kode promo");
    }
  };

  // --- HANDLERS: SITE CONTENTS ---
  const handleSaveContent = async (
    key: "hero" | "announcement" | "default_exchange_rates" | "support_contact",
    value: unknown
  ) => {
    const ok = await confirm({
      title: "Publikasikan Perubahan Konten?",
      description: "Perubahan konten akan langsung diperbarui pada situs publik.",
      confirmLabel: "Ya, Publikasikan",
    });
    if (!ok) return;

    setSavingContentKey(key);
    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || "Gagal menyimpan konten.";
        showToast("error", msg);
        globalToast.error("Gagal menyimpan konten", msg);
      } else {
        const msg = "Perubahan konten berhasil dipublikasikan!";
        showToast("success", msg);
        globalToast.success("Konten dipublikasikan", msg);
      }
    } catch {
      const msg = "Kendala jaringan saat menyimpan konten.";
      showToast("error", msg);
      globalToast.error("Gagal menyimpan konten", msg);
    } finally {
      setSavingContentKey(null);
    }
  };

  // --- HANDLER: MANUAL DISPATCH PUSH H-3 ---
  const handleRunPushReminders = async () => {
    const ok = await confirm({
      title: "Kirim Pengingat Push H-3 Sekarang?",
      description:
        "Sistem akan memeriksa seluruh termin yang jatuh tempo H-3..H-0 dan mengirim notifikasi ke perangkat yang berlangganan.",
      confirmLabel: "Ya, Kirim Sekarang",
    });
    if (!ok) return;

    setDispatchingPush(true);
    setPushResult(null);
    try {
      const res = await fetch("/api/cron/due-reminders", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || "Gagal menjalankan pengiriman push.";
        setPushResult(msg);
        globalToast.error("Gagal mengirim push reminder", msg);
      } else if (!data.configured) {
        const msg =
          "VAPID keys belum dikonfigurasi di .env (NEXT_PUBLIC_VAPID_PUBLIC_KEY & VAPID_PRIVATE_KEY).";
        setPushResult(msg);
        globalToast.warning("VAPID belum dikonfigurasi", msg);
      } else {
        const msg = `Selesai! Ditemukan ${data.duePaymentsFound} tagihan H-3..H-0, terkirim ${data.notificationsSent} notifikasi (${data.expiredRemoved} subscription kedaluwarsa dibersihkan).`;
        setPushResult(msg);
        globalToast.success("Pengingat push selesai dikirim", msg);
      }
    } catch {
      const msg = "Kendala jaringan saat memicu pengingat push.";
      setPushResult(msg);
      globalToast.error("Gagal memicu pengingat push", msg);
    } finally {
      setDispatchingPush(false);
    }
  };

  // --- HANDLERS: CUSTOMER SERVICE TICKETS ---
  const handleSendTicketReply = async (ticketId: string) => {
    const trimmed = adminReplyText.trim();
    if (trimmed.length < 2) return;

    const ok = await confirm({
      title: "Kirim Balasan CS?",
      description:
        "Balasan ini akan langsung tampil pada riwayat tiket pelanggan dan memperbarui status tiket.",
      confirmLabel: "Ya, Kirim Balasan",
    });
    if (!ok) return;

    setSendingAdminReply(true);
    try {
      const res = await fetch("/api/admin/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId,
          message: trimmed,
          nextStatus: adminReplyNextStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || "Gagal mengirim balasan CS.";
        showToast("error", msg);
        globalToast.error("Gagal mengirim balasan", msg);
        return;
      }

      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? {
                ...t,
                status: data.status ?? adminReplyNextStatus,
                last_message_at: data.message.created_at,
                messages: [...t.messages, data.message],
              }
            : t
        )
      );
      setAdminReplyText("");
      showToast("success", "Balasan CS berhasil dikirim ke pelanggan.");
      globalToast.success("Balasan CS terkirim");
    } catch {
      globalToast.error("Kendala jaringan saat mengirim balasan.");
    } finally {
      setSendingAdminReply(false);
    }
  };

  const handleUpdateTicketStatus = async (
    ticketId: string,
    status: SupportTicketStatus
  ) => {
    setUpdatingTicketId(ticketId);
    try {
      const res = await fetch("/api/admin/support", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, status }),
      });
      const data = await res.json();
      if (!res.ok) {
        globalToast.error("Gagal memperbarui status", data.error || "Coba lagi.");
        return;
      }
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status } : t))
      );
      globalToast.success("Status tiket diperbarui");
    } catch {
      globalToast.error("Kendala jaringan saat memperbarui status.");
    } finally {
      setUpdatingTicketId(null);
    }
  };

  const handleDeleteTicket = async (ticket: SupportTicketWithMessages) => {
    const ok = await confirm({
      title: `Hapus Tiket ${ticket.ticket_code}?`,
      description: `Seluruh percakapan pada tiket "${ticket.subject}" akan dihapus permanen.`,
      confirmLabel: "Ya, Hapus Tiket",
      variant: "destructive",
    });
    if (!ok) return;

    try {
      const res = await fetch("/api/admin/support", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: ticket.id }),
      });
      if (!res.ok) {
        globalToast.error("Gagal menghapus tiket");
        return;
      }
      setTickets((prev) => {
        const next = prev.filter((t) => t.id !== ticket.id);
        if (selectedTicketId === ticket.id) {
          setSelectedTicketId(next[0]?.id ?? null);
        }
        return next;
      });
      globalToast.success("Tiket dihapus", `Tiket ${ticket.ticket_code} telah dihapus.`);
    } catch {
      globalToast.error("Kendala jaringan saat menghapus tiket.");
    }
  };

  // --- HANDLERS: CUSTOMER FEEDBACK ---
  const handleSaveFeedback = async (fb: CustomerFeedbackRow) => {
    const nextStatus = fbStatusDrafts[fb.id] ?? fb.status;
    const nextReply = (fbReplyDrafts[fb.id] ?? "").trim();

    const ok = await confirm({
      title: "Simpan Tanggapan Masukan?",
      description:
        "Status dan tanggapan admin akan tersimpan dan terlihat oleh pengguna pada tab Riwayat Masukan.",
      confirmLabel: "Ya, Simpan",
    });
    if (!ok) return;

    setSavingFeedbackId(fb.id);
    try {
      const res = await fetch("/api/admin/feedback", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: fb.id,
          status: nextStatus,
          admin_reply: nextReply || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        globalToast.error("Gagal menyimpan masukan", data.error || "Coba lagi.");
        return;
      }
      setFeedbacks((prev) =>
        prev.map((item) => (item.id === fb.id ? data.feedback : item))
      );
      globalToast.success("Masukan diperbarui", "Status & tanggapan berhasil disimpan.");
    } catch {
      globalToast.error("Kendala jaringan saat menyimpan masukan.");
    } finally {
      setSavingFeedbackId(null);
    }
  };

  const handleDeleteFeedback = async (fb: CustomerFeedbackRow) => {
    const ok = await confirm({
      title: "Hapus Masukan Pelanggan?",
      description: `Masukan dari ${fb.sender_name || "Pengunjung"} akan dihapus permanen.`,
      confirmLabel: "Ya, Hapus",
      variant: "destructive",
    });
    if (!ok) return;

    try {
      const res = await fetch("/api/admin/feedback", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: fb.id }),
      });
      if (!res.ok) {
        globalToast.error("Gagal menghapus masukan");
        return;
      }
      setFeedbacks((prev) => prev.filter((item) => item.id !== fb.id));
      globalToast.success("Masukan dihapus");
    } catch {
      globalToast.error("Kendala jaringan saat menghapus masukan.");
    }
  };

  const openTicketsCount = tickets.filter((t) => t.status === "OPEN").length;
  const newFeedbacksCount = feedbacks.filter((f) => f.status === "NEW").length;
  const ratedFeedbacks = feedbacks.filter((f) => typeof f.rating === "number");
  const avgFeedbackRating =
    ratedFeedbacks.length > 0
      ? (
          ratedFeedbacks.reduce((sum, f) => sum + (f.rating ?? 0), 0) /
          ratedFeedbacks.length
        ).toFixed(1)
      : "-";

  const filteredTickets = tickets.filter(
    (t) => ticketFilter === "ALL" || t.status === ticketFilter
  );
  const selectedTicket =
    tickets.find((t) => t.id === selectedTicketId) ?? filteredTickets[0] ?? null;

  const filteredFeedbacks = feedbacks.filter((f) => {
    if (fbStatusFilter !== "ALL" && f.status !== fbStatusFilter) return false;
    if (fbCategoryFilter !== "ALL" && f.category !== fbCategoryFilter)
      return false;
    return true;
  });

  const upgradeDiff = Math.max(
    10000,
    Number(plans.COMPLETE_PASS.price) - Number(plans.WEDDING_ONLY.price)
  );

  return (
    <div className="min-h-screen pb-16">
      {/* Admin Header */}
      <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 gap-3">
          <div className="flex items-center gap-3">
            <NikahPlanLogo size="sm" />
            <Badge variant="default" className="text-[11px]">
              <ShieldCheck className="h-3 w-3" />
              Admin CMS
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs text-sage-600">
              {adminEmail}
            </span>
            <Button asChild variant="outline" size="sm">
              <Link href="/">Lihat Landing</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard">
                <ArrowLeft className="h-3.5 w-3.5" />
                App
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pt-6 space-y-6">
        {/* Global Feedback Toast */}
        {toast && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-medium shadow-sm ${
              toast.type === "success"
                ? "border-sage/25 bg-sage-50 text-sage-900"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {toast.text}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {(
            [
              {
                id: "overview",
                label: "Ringkasan & Transaksi",
                icon: LayoutDashboard,
                badge: 0,
              },
              {
                id: "pricing",
                label: "Harga & Paket",
                icon: CreditCard,
                badge: 0,
              },
              { id: "promos", label: "Kode Promo", icon: Tag, badge: 0 },
              {
                id: "content",
                label: "Konten & Kurs",
                icon: FileEdit,
                badge: 0,
              },
              {
                id: "support",
                label: "CS Tiket",
                icon: Headphones,
                badge: openTicketsCount,
              },
              {
                id: "feedback",
                label: "Feedback",
                icon: MessageSquareHeart,
                badge: newFeedbacksCount,
              },
              {
                id: "push",
                label: "Notifikasi Push H-3",
                icon: Bell,
                badge: 0,
              },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                  active
                    ? "bg-sage text-cream-50 shadow-sm"
                    : "bg-white border border-sage/15 text-sage-700 hover:bg-sage-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.badge > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                      active
                        ? "bg-terracotta text-cream-50"
                        : "bg-terracotta-100 text-terracotta-800"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* =============================================================== */}
        {/* TAB 1: OVERVIEW & TRANSACTIONS                                  */}
        {/* =============================================================== */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="rounded-2xl">
                <CardContent className="p-5 space-y-1">
                  <p className="text-xs font-medium text-sage-600 inline-flex items-center gap-1.5">
                    <Wallet className="h-3.5 w-3.5 text-sage" />
                    Total Omzet (PAID)
                  </p>
                  <p className="text-2xl font-bold text-sage-900">
                    {formatIDR(stats.totalRevenue)}
                  </p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardContent className="p-5 space-y-1">
                  <p className="text-xs font-medium text-sage-600 inline-flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-terracotta" />
                    Akun Berbayar / Total
                  </p>
                  <p className="text-2xl font-bold text-sage-900">
                    {stats.paidUsers}{" "}
                    <span className="text-sm font-normal text-sage-500">
                      / {stats.totalUsers}
                    </span>
                  </p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardContent className="p-5 space-y-1">
                  <p className="text-xs font-medium text-sage-600">
                    Workspace Pasangan
                  </p>
                  <p className="text-2xl font-bold text-sage-900">
                    {stats.totalWorkspaces}
                  </p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardContent className="p-5 space-y-1">
                  <p className="text-xs font-medium text-sage-600 inline-flex items-center gap-1.5">
                    <Bell className="h-3.5 w-3.5 text-sage" />
                    Subscriber Push
                  </p>
                  <p className="text-2xl font-bold text-sage-900">
                    {stats.pushSubscribers}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle className="font-display text-xl">
                  Transaksi Midtrans Terbaru
                </CardTitle>
                <CardDescription>
                  15 transaksi pembelian &amp; upgrade Couple Pass terakhir.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentTransactions.length === 0 ? (
                  <p className="text-sm text-sage-600 py-6 text-center">
                    Belum ada transaksi tercatat.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-sage/12 text-sage-600">
                          <th className="py-2.5 pr-4 font-semibold">Order ID</th>
                          <th className="py-2.5 pr-4 font-semibold">Email</th>
                          <th className="py-2.5 pr-4 font-semibold">Paket</th>
                          <th className="py-2.5 pr-4 font-semibold">Nominal</th>
                          <th className="py-2.5 pr-4 font-semibold">Promo</th>
                          <th className="py-2.5 pr-4 font-semibold">Status</th>
                          <th className="py-2.5 font-semibold">Tanggal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sage/8">
                        {recentTransactions.map((tx) => (
                          <tr key={tx.id}>
                            <td className="py-3 pr-4 font-mono text-xs text-sage-800">
                              {tx.order_id}
                            </td>
                            <td className="py-3 pr-4 text-sage-700">
                              {tx.user_email}
                            </td>
                            <td className="py-3 pr-4 font-medium text-sage-900">
                              {tx.plan}
                            </td>
                            <td className="py-3 pr-4 font-bold text-sage-900">
                              {formatIDR(tx.amount)}
                            </td>
                            <td className="py-3 pr-4 font-mono text-xs text-terracotta-700">
                              {tx.promo_code || "-"}
                            </td>
                            <td className="py-3 pr-4">
                              <Badge
                                variant={
                                  tx.status === "PAID"
                                    ? "default"
                                    : tx.status === "PENDING"
                                      ? "softTerracotta"
                                      : "outline"
                                }
                              >
                                {tx.status}
                              </Badge>
                            </td>
                            <td className="py-3 text-xs text-sage-600">
                              {new Date(tx.created_at).toLocaleDateString(
                                "id-ID",
                                { day: "numeric", month: "short", year: "numeric" }
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* =============================================================== */}
        {/* TAB 2: HARGA & PAKET                                            */}
        {/* =============================================================== */}
        {activeTab === "pricing" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-sage/15 bg-sage-50/80 px-4 py-3 text-xs text-sage-800 flex flex-wrap items-center justify-between gap-2">
              <span>
                Perubahan harga langsung aktif di <strong>Landing Page</strong>,{" "}
                <strong>Checkout Midtrans</strong>, dan harga{" "}
                <strong>Upgrade In-App</strong>.
              </span>
              <Badge variant="default">
                Harga Selisih Upgrade Saat Ini: {formatIDR(upgradeDiff)}
              </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {(["WEDDING_ONLY", "COMPLETE_PASS"] as PlanType[]).map(
                (planKey) => {
                  const plan = plans[planKey];
                  return (
                    <Card key={planKey} className="rounded-3xl">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="font-display text-xl">
                            {planKey === "WEDDING_ONLY"
                              ? "Paket 1: Wedding Only"
                              : "Paket 2: Complete Pass"}
                          </CardTitle>
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {planKey}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>Nama Paket</Label>
                          <Input
                            value={plan.name}
                            onChange={(e) =>
                              updatePlanField(planKey, "name", e.target.value)
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Tagline</Label>
                          <Input
                            value={plan.tagline}
                            onChange={(e) =>
                              updatePlanField(planKey, "tagline", e.target.value)
                            }
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>Harga Jual (IDR)</Label>
                            <CurrencyInput
                              value={plan.price}
                              onValueChange={(raw) =>
                                updatePlanField(
                                  planKey,
                                  "price",
                                  Number(raw) || 0
                                )
                              }
                              className="font-bold"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Harga Coret (IDR)</Label>
                            <CurrencyInput
                              value={plan.originalPrice}
                              onValueChange={(raw) =>
                                updatePlanField(
                                  planKey,
                                  "originalPrice",
                                  Number(raw) || 0
                                )
                              }
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 items-end">
                          <div className="space-y-2">
                            <Label>Badge Label (Opsional)</Label>
                            <Input
                              placeholder="Contoh: Paling Populer"
                              value={plan.badge || ""}
                              onChange={(e) =>
                                updatePlanField(
                                  planKey,
                                  "badge",
                                  e.target.value || undefined
                                )
                              }
                            />
                          </div>
                          <label className="flex items-center gap-2 h-11 rounded-xl border border-sage/15 bg-cream-50 px-3 cursor-pointer text-xs font-semibold text-sage-800">
                            <input
                              type="checkbox"
                              checked={Boolean(plan.recommended)}
                              onChange={(e) =>
                                updatePlanField(
                                  planKey,
                                  "recommended",
                                  e.target.checked
                                )
                              }
                              className="h-4 w-4 accent-sage"
                            />
                            Highlight Rekomendasi
                          </label>
                        </div>

                        {/* Feature List Editor */}
                        <div className="space-y-2 pt-2 border-t border-sage/10">
                          <div className="flex items-center justify-between">
                            <Label>Daftar Fitur Paket</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() =>
                                updatePlanField(planKey, "features", [
                                  ...plan.features,
                                  { label: "Fitur baru", included: true },
                                ])
                              }
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Tambah Baris
                            </Button>
                          </div>

                          <div className="space-y-2">
                            {plan.features.map((feat, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = [...plan.features];
                                    next[idx] = {
                                      ...next[idx],
                                      included: !next[idx].included,
                                    };
                                    updatePlanField(planKey, "features", next);
                                  }}
                                  title={
                                    feat.included
                                      ? "Termasuk (klik untuk coret)"
                                      : "Tidak termasuk (klik untuk aktifkan)"
                                  }
                                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                                    feat.included
                                      ? "border-sage bg-sage text-white"
                                      : "border-sage/20 bg-cream-100 text-sage-400"
                                  }`}
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <Input
                                  value={feat.label}
                                  onChange={(e) => {
                                    const next = [...plan.features];
                                    next[idx] = {
                                      ...next[idx],
                                      label: e.target.value,
                                    };
                                    updatePlanField(planKey, "features", next);
                                  }}
                                  className="h-9 text-xs"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (plan.features.length <= 1) return;
                                    updatePlanField(
                                      planKey,
                                      "features",
                                      plan.features.filter((_, i) => i !== idx)
                                    );
                                  }}
                                  className="p-1.5 text-sage-400 hover:text-terracotta"
                                  aria-label="Hapus fitur"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Button
                          type="button"
                          size="lg"
                          className="w-full"
                          disabled={savingPlanId === planKey}
                          onClick={() => handleSavePlan(planKey)}
                        >
                          {savingPlanId === planKey ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Menyimpan Perubahan...
                            </>
                          ) : (
                            `Simpan ${plan.name}`
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                }
              )}
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* TAB 3: KODE PROMO                                               */}
        {/* =============================================================== */}
        {activeTab === "promos" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <Card className="lg:col-span-5 rounded-3xl">
              <CardHeader>
                <CardTitle className="font-display text-xl">
                  Buat Kode Promo Baru
                </CardTitle>
                <CardDescription>
                  Otomatis aktif di halaman Checkout &amp; Upgrade.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreatePromo} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="promo-new-code">Kode Promo</Label>
                    <Input
                      id="promo-new-code"
                      required
                      placeholder="Contoh: LEBARAN25"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                      className="uppercase font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Jenis Diskon</Label>
                      <Select
                        value={newDiscountType}
                        onValueChange={(v) =>
                          setNewDiscountType(v as PromoDiscountType)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PERCENT">Persen (%)</SelectItem>
                          <SelectItem value="FIXED">Nominal (Rp)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="promo-val">
                        Nilai ({newDiscountType === "PERCENT" ? "%" : "IDR"})
                      </Label>
                      {newDiscountType === "FIXED" ? (
                        <CurrencyInput
                          id="promo-val"
                          required
                          placeholder="20.000"
                          value={newDiscountValue}
                          onValueChange={setNewDiscountValue}
                        />
                      ) : (
                        <Input
                          id="promo-val"
                          type="number"
                          required
                          min={1}
                          max={90}
                          value={newDiscountValue}
                          onChange={(e) => setNewDiscountValue(e.target.value)}
                        />
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="promo-desc">Deskripsi</Label>
                    <Input
                      id="promo-desc"
                      placeholder="Diskon 15% Spesial Musim Nikah"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="promo-max">Kuota Maks (Opsional)</Label>
                      <Input
                        id="promo-max"
                        type="number"
                        min={1}
                        placeholder="Tanpa batas"
                        value={newMaxUses}
                        onChange={(e) => setNewMaxUses(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="promo-exp">Kedaluwarsa (Opsional)</Label>
                      <Input
                        id="promo-exp"
                        type="date"
                        value={newExpiresAt}
                        onChange={(e) => setNewExpiresAt(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={creatingPromo || !newCode.trim()}
                  >
                    {creatingPromo ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Tambah Kode Promo
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-7 rounded-3xl">
              <CardHeader>
                <CardTitle className="font-display text-xl">
                  Daftar Kode Promo ({promos.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {promos.length === 0 ? (
                  <p className="text-sm text-sage-600 text-center py-6">
                    Belum ada kode promo di database.
                  </p>
                ) : (
                  promos.map((promo) => (
                    <div
                      key={promo.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-sage/12 bg-cream-50/70 p-3.5"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-bold text-sage-900">
                            {promo.code}
                          </span>
                          <Badge
                            variant={promo.is_active ? "default" : "outline"}
                            className="text-[10px]"
                          >
                            {promo.is_active ? "Aktif" : "Nonaktif"}
                          </Badge>
                          <Badge variant="softTerracotta" className="text-[10px]">
                            {promo.discount_type === "PERCENT"
                              ? `-${promo.discount_value}%`
                              : `-${formatIDR(Number(promo.discount_value))}`}
                          </Badge>
                        </div>
                        <p className="text-xs text-sage-700">
                          {promo.description || "Tanpa deskripsi"}
                        </p>
                        <p className="text-[11px] text-sage-500">
                          Terpakai: {promo.used_count}
                          {promo.max_uses ? ` / ${promo.max_uses}` : " (unlimited)"}
                          {promo.expires_at
                            ? ` • Exp: ${new Date(promo.expires_at).toLocaleDateString("id-ID")}`
                            : ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => handleTogglePromoActive(promo)}
                        >
                          {promo.is_active ? "Nonaktifkan" : "Aktifkan"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-sage-500 hover:text-terracotta"
                          onClick={() => handleDeletePromo(promo)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* =============================================================== */}
        {/* TAB 4: KONTEN LANDING & KURS DEFAULT                            */}
        {/* =============================================================== */}
        {activeTab === "content" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            {/* Hero Landing Editor */}
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle className="font-display text-xl">
                  Konten Hero Landing Page
                </CardTitle>
                <CardDescription>
                  Sesuaikan copywriting utama di halaman depan NikahPlan.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label>Badge Atas</Label>
                  <Input
                    value={hero.badge}
                    onChange={(e) => setHero({ ...hero, badge: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Judul Bagian 1</Label>
                  <Input
                    value={hero.headline}
                    onChange={(e) =>
                      setHero({ ...hero, headline: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Teks Aksen Terracotta</Label>
                    <Input
                      value={hero.headlineAccent}
                      onChange={(e) =>
                        setHero({ ...hero, headlineAccent: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Judul Bagian Akhir</Label>
                    <Input
                      value={hero.headlineSuffix}
                      onChange={(e) =>
                        setHero({ ...hero, headlineSuffix: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Subjudul Deskripsi</Label>
                  <textarea
                    rows={3}
                    value={hero.subheadline}
                    onChange={(e) =>
                      setHero({ ...hero, subheadline: e.target.value })
                    }
                    className="w-full rounded-xl border border-sage/20 bg-white px-3.5 py-2.5 text-sm text-sage-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/40"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Tombol CTA Utama</Label>
                    <Input
                      value={hero.primaryCta}
                      onChange={(e) =>
                        setHero({ ...hero, primaryCta: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tombol CTA Sekunder</Label>
                    <Input
                      value={hero.secondaryCta}
                      onChange={(e) =>
                        setHero({ ...hero, secondaryCta: e.target.value })
                      }
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  className="w-full"
                  disabled={savingContentKey === "hero"}
                  onClick={() => handleSaveContent("hero", hero)}
                >
                  {savingContentKey === "hero" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Publikasikan Hero Landing
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-5">
              {/* Announcement Banner */}
              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle className="font-display text-xl">
                    Banner Pengumuman Promo
                  </CardTitle>
                  <CardDescription>
                    Tampil di bagian paling atas Landing Page untuk mendorong
                    konversi.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3.5">
                  <label className="flex items-center gap-2.5 rounded-xl border border-sage/15 bg-cream-50 px-3.5 py-2.5 cursor-pointer text-sm font-semibold text-sage-900">
                    <input
                      type="checkbox"
                      checked={announcement.enabled}
                      onChange={(e) =>
                        setAnnouncement({
                          ...announcement,
                          enabled: e.target.checked,
                        })
                      }
                      className="h-4 w-4 accent-sage"
                    />
                    Tampilkan Banner Pengumuman di Landing Page
                  </label>

                  <div className="space-y-1.5">
                    <Label>Teks Pengumuman</Label>
                    <Input
                      value={announcement.text}
                      onChange={(e) =>
                        setAnnouncement({
                          ...announcement,
                          text: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Highlight Kode Promo (Opsional)</Label>
                    <Input
                      value={announcement.promoCode}
                      onChange={(e) =>
                        setAnnouncement({
                          ...announcement,
                          promoCode: e.target.value.toUpperCase(),
                        })
                      }
                      className="font-mono uppercase"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="sage"
                    className="w-full"
                    disabled={savingContentKey === "announcement"}
                    onClick={() =>
                      handleSaveContent("announcement", announcement)
                    }
                  >
                    {savingContentKey === "announcement" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    Simpan Banner Pengumuman
                  </Button>
                </CardContent>
              </Card>

              {/* Default Exchange Rates */}
              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle className="font-display text-xl">
                    Kurs Default Honeymoon (ke IDR)
                  </CardTitle>
                  <CardDescription>
                    Nilai rujukan default untuk konversi mata uang asing pasangan.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3.5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {Object.entries(rates).map(([code, val]) => (
                      <div key={code} className="space-y-1">
                        <Label className="text-xs font-mono">1 {code}</Label>
                        <CurrencyInput
                          allowDecimal
                          value={val}
                          onValueChange={(raw) =>
                            setRates((prev) => ({
                              ...prev,
                              [code]: Number(raw) || 0,
                            }))
                          }
                          className="h-9 text-xs font-bold"
                        />
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={savingContentKey === "default_exchange_rates"}
                    onClick={() =>
                      handleSaveContent("default_exchange_rates", rates)
                    }
                  >
                    {savingContentKey === "default_exchange_rates" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    Simpan Kurs Default
                  </Button>
                </CardContent>
              </Card>

              {/* Kontak Customer Service */}
              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle className="font-display text-xl flex items-center gap-2">
                    <Headphones className="h-5 w-5 text-sage" />
                    Kontak Customer Service
                  </CardTitle>
                  <CardDescription>
                    Nomor WhatsApp CS, email support, jam operasional &amp;
                    estimasi respons yang tampil di dialog Bantuan CS.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">
                        Nomor WhatsApp CS (format 62...)
                      </Label>
                      <Input
                        value={supportContact.whatsappNumber}
                        onChange={(e) =>
                          setSupportContact({
                            ...supportContact,
                            whatsappNumber: e.target.value,
                          })
                        }
                        placeholder="6281234567890"
                        className="font-mono text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Email Customer Service</Label>
                      <Input
                        type="email"
                        value={supportContact.email}
                        onChange={(e) =>
                          setSupportContact({
                            ...supportContact,
                            email: e.target.value,
                          })
                        }
                        placeholder="support@nikahplan.id"
                        className="text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Jam Operasional</Label>
                      <Input
                        value={supportContact.operationalHours}
                        onChange={(e) =>
                          setSupportContact({
                            ...supportContact,
                            operationalHours: e.target.value,
                          })
                        }
                        placeholder="Setiap hari, 08:00 - 21:00 WIB"
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Estimasi Respons</Label>
                      <Input
                        value={supportContact.responseEstimate}
                        onChange={(e) =>
                          setSupportContact({
                            ...supportContact,
                            responseEstimate: e.target.value,
                          })
                        }
                        placeholder="Rata-rata dibalas < 1 jam"
                        className="text-xs"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="sage"
                    className="w-full"
                    disabled={savingContentKey === "support_contact"}
                    onClick={() =>
                      handleSaveContent("support_contact", supportContact)
                    }
                  >
                    {savingContentKey === "support_contact" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    Simpan Kontak Customer Service
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* TAB 5: CUSTOMER SERVICE TICKETS                                 */}
        {/* =============================================================== */}
        {activeTab === "support" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold text-sage-900">
                  Helpdesk Tiket Customer Service
                </h2>
                <p className="text-xs text-sage-600">
                  Balas kendala pengguna secara langsung (2 arah) dan kelola
                  status penyelesaian tiket.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: "ALL", label: `Semua (${tickets.length})` },
                    {
                      id: "OPEN",
                      label: `Baru (${tickets.filter((t) => t.status === "OPEN").length})`,
                    },
                    {
                      id: "IN_PROGRESS",
                      label: `Diproses (${tickets.filter((t) => t.status === "IN_PROGRESS").length})`,
                    },
                    {
                      id: "RESOLVED",
                      label: `Selesai (${tickets.filter((t) => t.status === "RESOLVED").length})`,
                    },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setTicketFilter(f.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-all ${
                      ticketFilter === f.id
                        ? "border-sage bg-sage text-cream-50"
                        : "border-sage/15 bg-white text-sage-700 hover:bg-sage-50"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredTickets.length === 0 ? (
              <Card className="rounded-3xl">
                <CardContent className="p-10 text-center space-y-2">
                  <Headphones className="h-8 w-8 mx-auto text-sage-400" />
                  <p className="text-sm font-bold text-sage-900">
                    Belum ada tiket Customer Service
                  </p>
                  <p className="text-xs text-sage-600">
                    Tiket baru dari pengguna akan muncul di sini. Pastikan
                    Migration 006 sudah dijalankan di Supabase.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* Daftar Tiket */}
                <div className="lg:col-span-5 space-y-2 max-h-[640px] overflow-y-auto pr-1">
                  {filteredTickets.map((t) => {
                    const isSelected = selectedTicket?.id === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setSelectedTicketId(t.id);
                          setAdminReplyNextStatus(
                            t.status === "RESOLVED" ? "RESOLVED" : "IN_PROGRESS"
                          );
                        }}
                        className={`w-full text-left rounded-2xl border p-3.5 transition-all space-y-1.5 ${
                          isSelected
                            ? "border-sage bg-sage-50/90 shadow-sm"
                            : "border-sage/12 bg-white hover:border-sage/30"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[11px] font-bold text-sage-700">
                            {t.ticket_code}
                          </span>
                          <Badge
                            variant={
                              t.status === "OPEN"
                                ? "softTerracotta"
                                : t.status === "IN_PROGRESS"
                                  ? "outline"
                                  : "softSage"
                            }
                            className="text-[10px]"
                          >
                            {t.status === "OPEN"
                              ? "Baru"
                              : t.status === "IN_PROGRESS"
                                ? "Diproses"
                                : "Selesai"}
                          </Badge>
                        </div>
                        <p className="text-xs font-bold text-sage-900 line-clamp-1">
                          {t.subject}
                        </p>
                        <p className="text-[11px] text-sage-600 truncate">
                          {t.requester_name || "Pengunjung"}
                          {t.requester_email ? ` (${t.requester_email})` : ""}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-sage-500">
                          <span>{SUPPORT_TOPIC_LABELS[t.topic]}</span>
                          <span>
                            {t.messages.length} pesan •{" "}
                            {new Date(t.last_message_at).toLocaleDateString(
                              "id-ID",
                              { day: "numeric", month: "short" }
                            )}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Detail Percakapan Tiket */}
                {selectedTicket && (
                  <Card className="lg:col-span-7 rounded-3xl">
                    <CardHeader className="pb-3 border-b border-sage/10">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-sage-700">
                              {selectedTicket.ticket_code}
                            </span>
                            <Badge variant="outline" className="text-[10.5px]">
                              {SUPPORT_TOPIC_LABELS[selectedTicket.topic]}
                            </Badge>
                          </div>
                          <CardTitle className="font-display text-lg">
                            {selectedTicket.subject}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            Pengirim:{" "}
                            <strong className="text-sage-800">
                              {selectedTicket.requester_name || "Pengunjung"}
                            </strong>
                            {selectedTicket.requester_email
                              ? ` • ${selectedTicket.requester_email}`
                              : ""}
                          </CardDescription>
                        </div>

                        <div className="flex items-center gap-2">
                          <Select
                            value={selectedTicket.status}
                            disabled={updatingTicketId === selectedTicket.id}
                            onValueChange={(val) =>
                              handleUpdateTicketStatus(
                                selectedTicket.id,
                                val as SupportTicketStatus
                              )
                            }
                          >
                            <SelectTrigger className="h-8 w-32 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OPEN">Baru</SelectItem>
                              <SelectItem value="IN_PROGRESS">
                                Diproses
                              </SelectItem>
                              <SelectItem value="RESOLVED">Selesai</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteTicket(selectedTicket)}
                            title="Hapus tiket"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 space-y-4">
                      {/* Thread Chat */}
                      <div className="max-h-72 overflow-y-auto space-y-2.5 rounded-2xl border border-sage/10 bg-cream-50/60 p-3.5">
                        {selectedTicket.messages.map((msg) => {
                          const isAdminMsg = msg.sender_role === "ADMIN";
                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col max-w-[85%] ${
                                isAdminMsg
                                  ? "ml-auto items-end"
                                  : "items-start"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 mb-0.5 px-1">
                                <span className="text-[10.5px] font-bold text-sage-700">
                                  {isAdminMsg
                                    ? msg.sender_name || "Tim CS NikahPlan"
                                    : msg.sender_name || "Pengguna"}
                                </span>
                                <span className="text-[10px] text-sage-500">
                                  {new Date(msg.created_at).toLocaleString(
                                    "id-ID",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </span>
                              </div>
                              <div
                                className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                                  isAdminMsg
                                    ? "bg-sage text-cream-50 rounded-tr-sm"
                                    : "bg-white border border-sage/15 text-sage-900 rounded-tl-sm"
                                }`}
                              >
                                {msg.message}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Form Balas Admin */}
                      <div className="space-y-2.5">
                        <textarea
                          value={adminReplyText}
                          onChange={(e) => setAdminReplyText(e.target.value)}
                          rows={3}
                          placeholder="Tulis balasan Tim CS NikahPlan untuk pelanggan..."
                          className="w-full rounded-2xl border border-sage/20 bg-white px-3.5 py-2.5 text-xs text-sage-900 placeholder:text-sage-400 focus:outline-none focus:ring-2 focus:ring-sage"
                        />
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-sage-600">
                              Status setelah balas:
                            </Label>
                            <Select
                              value={adminReplyNextStatus}
                              onValueChange={(v) =>
                                setAdminReplyNextStatus(
                                  v as SupportTicketStatus
                                )
                              }
                            >
                              <SelectTrigger className="h-8 w-32 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="IN_PROGRESS">
                                  Diproses
                                </SelectItem>
                                <SelectItem value="RESOLVED">
                                  Selesai
                                </SelectItem>
                                <SelectItem value="OPEN">Baru</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            type="button"
                            variant="sage"
                            size="sm"
                            disabled={
                              sendingAdminReply ||
                              adminReplyText.trim().length < 2
                            }
                            onClick={() =>
                              handleSendTicketReply(selectedTicket.id)
                            }
                          >
                            {sendingAdminReply ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Send className="h-3.5 w-3.5" />
                            )}
                            Kirim Balasan CS
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}

        {/* =============================================================== */}
        {/* TAB 6: CUSTOMER FEEDBACK                                        */}
        {/* =============================================================== */}
        {activeTab === "feedback" && (
          <div className="space-y-5">
            {/* Ringkasan Metrik Feedback */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="rounded-2xl">
                <CardContent className="p-4">
                  <p className="text-xs text-sage-600">Total Masukan</p>
                  <p className="text-2xl font-bold text-sage-900 mt-1">
                    {feedbacks.length}
                  </p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardContent className="p-4">
                  <p className="text-xs text-terracotta-700">Belum Ditinjau</p>
                  <p className="text-2xl font-bold text-terracotta-900 mt-1">
                    {newFeedbacksCount}
                  </p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardContent className="p-4">
                  <p className="text-xs text-sage-600">Rata-rata Rating</p>
                  <p className="text-2xl font-bold text-sage-900 mt-1 inline-flex items-center gap-1">
                    <Star className="h-5 w-5 fill-amberwarm text-amberwarm" />
                    {avgFeedbackRating}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Filter Status & Kategori */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: "ALL", label: "Semua Status" },
                    { id: "NEW", label: "Baru" },
                    { id: "REVIEWED", label: "Ditinjau" },
                    { id: "RESOLVED", label: "Selesai" },
                  ] as const
                ).map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setFbStatusFilter(st.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-all ${
                      fbStatusFilter === st.id
                        ? "border-sage bg-sage text-cream-50"
                        : "border-sage/15 bg-white text-sage-700 hover:bg-sage-50"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: "ALL", label: "Semua Kategori" },
                    { id: "SUGGESTION", label: "Saran" },
                    { id: "FEATURE", label: "Request Fitur" },
                    { id: "BUG", label: "Bug" },
                    { id: "PRAISE", label: "Apresiasi" },
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFbCategoryFilter(cat.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-all ${
                      fbCategoryFilter === cat.id
                        ? "border-terracotta bg-terracotta text-cream-50"
                        : "border-sage/15 bg-white text-sage-700 hover:bg-sage-50"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredFeedbacks.length === 0 ? (
              <Card className="rounded-3xl">
                <CardContent className="p-10 text-center space-y-2">
                  <MessageSquareHeart className="h-8 w-8 mx-auto text-sage-400" />
                  <p className="text-sm font-bold text-sage-900">
                    Belum ada masukan sesuai filter
                  </p>
                  <p className="text-xs text-sage-600">
                    Masukan dari pelanggan akan tampil di sini beserta rating
                    dan halaman asal.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredFeedbacks.map((fb) => {
                  const statusDraft = fbStatusDrafts[fb.id] ?? fb.status;
                  const replyDraft = fbReplyDrafts[fb.id] ?? "";
                  return (
                    <Card key={fb.id} className="rounded-3xl">
                      <CardContent className="p-4 sm:p-5 space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Badge variant="outline" className="text-[10.5px]">
                                {FEEDBACK_CATEGORY_LABELS[fb.category]}
                              </Badge>
                              <Badge
                                variant={
                                  fb.status === "NEW"
                                    ? "softTerracotta"
                                    : fb.status === "REVIEWED"
                                      ? "outline"
                                      : "softSage"
                                }
                                className="text-[10.5px]"
                              >
                                {fb.status === "NEW"
                                  ? "Baru"
                                  : fb.status === "REVIEWED"
                                    ? "Ditinjau"
                                    : "Selesai"}
                              </Badge>
                              {fb.rating && (
                                <span className="inline-flex items-center gap-0.5 text-xs font-bold text-sage-900">
                                  <Star className="h-3.5 w-3.5 fill-amberwarm text-amberwarm" />
                                  {fb.rating}/5
                                </span>
                              )}
                              {fb.page_path && (
                                <span className="rounded-full bg-sage-50 px-2 py-0.5 font-mono text-[10px] text-sage-600">
                                  {fb.page_path}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-sage-600">
                              <strong className="text-sage-900">
                                {fb.sender_name || "Pengunjung"}
                              </strong>
                              {fb.sender_email ? ` (${fb.sender_email})` : ""} •{" "}
                              {new Date(fb.created_at).toLocaleString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>

                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteFeedback(fb)}
                            title="Hapus masukan"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <p className="rounded-2xl bg-cream-50/80 border border-sage/10 p-3 text-xs sm:text-sm leading-relaxed text-sage-900 whitespace-pre-wrap">
                          {fb.message}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                          <div className="sm:col-span-3 space-y-1">
                            <Label className="text-[11px]">Status</Label>
                            <Select
                              value={statusDraft}
                              onValueChange={(v) =>
                                setFbStatusDrafts((prev) => ({
                                  ...prev,
                                  [fb.id]: v as FeedbackStatus,
                                }))
                              }
                            >
                              <SelectTrigger className="h-9 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="NEW">Baru</SelectItem>
                                <SelectItem value="REVIEWED">
                                  Ditinjau
                                </SelectItem>
                                <SelectItem value="RESOLVED">
                                  Selesai
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="sm:col-span-7 space-y-1">
                            <Label className="text-[11px]">
                              Tanggapan Admin (tampil di Riwayat pengguna)
                            </Label>
                            <Input
                              value={replyDraft}
                              onChange={(e) =>
                                setFbReplyDrafts((prev) => ({
                                  ...prev,
                                  [fb.id]: e.target.value,
                                }))
                              }
                              placeholder="Tulis ucapan terima kasih atau update tindak lanjut..."
                              className="h-9 text-xs"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <Button
                              type="button"
                              variant="sage"
                              size="sm"
                              className="w-full h-9"
                              disabled={savingFeedbackId === fb.id}
                              onClick={() => handleSaveFeedback(fb)}
                            >
                              {savingFeedbackId === fb.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                              Simpan
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =============================================================== */}
        {/* TAB 5: WEB PUSH REMINDER MONITOR                                */}
        {/* =============================================================== */}
        {activeTab === "push" && (
          <Card className="rounded-3xl max-w-2xl">
            <CardHeader>
              <CardTitle className="font-display text-xl">
                Web Push Notifications (Pengingat Jatuh Tempo H-3)
              </CardTitle>
              <CardDescription>
                Vercel Cron otomatis memanggil{" "}
                <span className="font-mono">/api/cron/due-reminders</span>{" "}
                setiap pagi pukul 08:00 WIB (01:00 UTC). Anda juga dapat memicu
                pengiriman secara manual di bawah ini.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-cream-50 border border-sage/10 p-4">
                  <p className="text-xs text-sage-600">Perangkat Berlangganan</p>
                  <p className="text-2xl font-bold text-sage-900 mt-1">
                    {stats.pushSubscribers}
                  </p>
                </div>
                <div className="rounded-2xl bg-terracotta-50/70 border border-terracotta/20 p-4">
                  <p className="text-xs text-terracotta-800">
                    Termin Jatuh Tempo (H-3..H-0)
                  </p>
                  <p className="text-2xl font-bold text-terracotta-900 mt-1">
                    {stats.dueIn3DaysCount}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                size="lg"
                variant="sage"
                disabled={dispatchingPush}
                onClick={handleRunPushReminders}
              >
                {dispatchingPush ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Mengirim Notifikasi...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Jalankan Pengingat H-3 Sekarang
                  </>
                )}
              </Button>

              {pushResult && (
                <div className="rounded-xl border border-sage/15 bg-sage-50 p-3.5 text-xs text-sage-900">
                  {pushResult}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
