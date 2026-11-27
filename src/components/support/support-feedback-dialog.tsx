"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Bug,
  CheckCircle2,
  Clock,
  Headphones,
  Heart,
  History,
  Lightbulb,
  Loader2,
  Mail,
  MessageCircle,
  MessageSquareHeart,
  Plus,
  Send,
  Sparkles,
  Star,
  Ticket,
} from "lucide-react";
import type {
  CustomerFeedbackRow,
  FeedbackCategory,
  FeedbackStatus,
  SupportTicketStatus,
  SupportTicketWithMessages,
  SupportTopic,
} from "@/types/database";
import {
  DEFAULT_SUPPORT_CONTACT,
  type SupportContactContent,
} from "@/lib/dynamic-config";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/providers/toast-provider";
import { useConfirm } from "@/components/providers/confirm-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export type SupportFeedbackTab = "support" | "feedback" | "history";

interface SupportFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: SupportFeedbackTab;
}

const SUPPORT_TOPICS: { id: SupportTopic; label: string }[] = [
  { id: "PEMBAYARAN", label: "Pembayaran & Paket" },
  { id: "AKUN_PASANGAN", label: "Akun & Pasangan" },
  { id: "UNDANGAN", label: "Undangan Online" },
  { id: "TEKNIS", label: "Kendala Teknis" },
  { id: "LAINNYA", label: "Lainnya" },
];

const FEEDBACK_CATEGORIES: {
  id: FeedbackCategory;
  label: string;
  icon: typeof Lightbulb;
}[] = [
  { id: "SUGGESTION", label: "Saran", icon: Lightbulb },
  { id: "FEATURE", label: "Request Fitur", icon: Sparkles },
  { id: "BUG", label: "Lapor Bug", icon: Bug },
  { id: "PRAISE", label: "Apresiasi", icon: Heart },
];

const RATING_LABELS: Record<number, string> = {
  1: "Sangat Kurang",
  2: "Perlu Perbaikan",
  3: "Cukup Baik",
  4: "Memuaskan",
  5: "Sangat Memuaskan!",
};

function getTicketStatusMeta(status: SupportTicketStatus) {
  switch (status) {
    case "OPEN":
      return { label: "Baru", variant: "softTerracotta" as const };
    case "IN_PROGRESS":
      return { label: "Diproses CS", variant: "outline" as const };
    case "RESOLVED":
      return { label: "Selesai", variant: "softSage" as const };
  }
}

function getFeedbackStatusMeta(status: FeedbackStatus) {
  switch (status) {
    case "NEW":
      return { label: "Diterima", variant: "softTerracotta" as const };
    case "REVIEWED":
      return { label: "Ditinjau", variant: "outline" as const };
    case "RESOLVED":
      return { label: "Selesai", variant: "softSage" as const };
  }
}

function getCategoryLabel(category: FeedbackCategory): string {
  return (
    FEEDBACK_CATEGORIES.find((c) => c.id === category)?.label ?? category
  );
}

function getTopicLabel(topic: SupportTopic): string {
  return SUPPORT_TOPICS.find((t) => t.id === topic)?.label ?? topic;
}

function formatShortDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function SupportFeedbackDialog({
  open,
  onOpenChange,
  defaultTab = "support",
}: SupportFeedbackDialogProps) {
  const pathname = usePathname();
  const toast = useToast();
  const confirm = useConfirm();

  const [activeTab, setActiveTab] = useState<SupportFeedbackTab>(defaultTab);
  const [loadingData, setLoadingData] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [migrationMissing, setMigrationMissing] = useState(false);

  // Support CS states
  const [supportContact, setSupportContact] = useState<SupportContactContent>(
    DEFAULT_SUPPORT_CONTACT
  );
  const [tickets, setTickets] = useState<SupportTicketWithMessages[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [showCreateTicket, setShowCreateTicket] = useState(false);

  const [ticketTopic, setTicketTopic] = useState<SupportTopic>("PEMBAYARAN");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketName, setTicketName] = useState("");
  const [ticketEmail, setTicketEmail] = useState("");
  const [submittingTicket, setSubmittingTicket] = useState(false);

  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // Feedback states
  const [feedbacks, setFeedbacks] = useState<CustomerFeedbackRow[]>([]);
  const [fbCategory, setFbCategory] = useState<FeedbackCategory>("SUGGESTION");
  const [fbRating, setFbRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [fbMessage, setFbMessage] = useState("");
  const [fbName, setFbName] = useState("");
  const [fbEmail, setFbEmail] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const loadData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [supportRes, feedbackRes] = await Promise.all([
        fetch("/api/support/tickets"),
        fetch("/api/feedback"),
      ]);
      const [supportJson, feedbackJson] = await Promise.all([
        supportRes.json(),
        feedbackRes.json(),
      ]);

      if (supportRes.ok) {
        if (supportJson.supportContact) {
          setSupportContact(supportJson.supportContact);
        }
        const loadedTickets =
          (supportJson.tickets as SupportTicketWithMessages[] | undefined) ?? [];
        setTickets(loadedTickets);
        setIsLoggedIn(Boolean(supportJson.isLoggedIn));
        if (!supportJson.isLoggedIn || loadedTickets.length === 0) {
          setShowCreateTicket(true);
        }
        if (supportJson.migrationMissing) {
          setMigrationMissing(true);
        }
      }

      if (feedbackRes.ok) {
        setFeedbacks(
          (feedbackJson.feedbacks as CustomerFeedbackRow[] | undefined) ?? []
        );
        if (feedbackJson.migrationMissing) {
          setMigrationMissing(true);
        }
      }
    } catch {
      // Tetap gunakan default state jika offline
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
      setActiveTicketId(null);
      loadData();
    }
  }, [open, defaultTab, loadData]);

  const activeTicket =
    tickets.find((t) => t.id === activeTicketId) ?? null;

  const cleanWaDigits = supportContact.whatsappNumber.replace(/\D/g, "");
  const waHref = cleanWaDigits
    ? `https://wa.me/${cleanWaDigits}?text=${encodeURIComponent(
        `Halo Tim CS NikahPlan, saya butuh bantuan terkait halaman ${pathname}.`
      )}`
    : null;
  const mailHref = supportContact.email
    ? `mailto:${supportContact.email}?subject=${encodeURIComponent(
        "[Bantuan NikahPlan]"
      )}`
    : null;

  // --- HANDLER: CREATE SUPPORT TICKET ---
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ticketSubject.trim().length < 4) {
      toast.warning("Subjek terlalu singkat", "Minimal 4 karakter.");
      return;
    }
    if (ticketMessage.trim().length < 6) {
      toast.warning("Detail kendala terlalu singkat", "Minimal 6 karakter.");
      return;
    }

    const ok = await confirm({
      title: "Kirim Tiket Customer Service?",
      description: `Tiket dengan topik "${getTopicLabel(ticketTopic)}" akan dikirim ke tim CS NikahPlan.`,
      confirmLabel: "Ya, Kirim Tiket",
    });
    if (!ok) return;

    setSubmittingTicket(true);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: ticketTopic,
          subject: ticketSubject.trim(),
          message: ticketMessage.trim(),
          requester_name: !isLoggedIn ? ticketName.trim() : undefined,
          requester_email: !isLoggedIn ? ticketEmail.trim() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Gagal membuat tiket", data.error || "Silakan coba lagi.");
        return;
      }

      const created = data.ticket as SupportTicketWithMessages;
      setTickets((prev) => [created, ...prev]);
      setTicketSubject("");
      setTicketMessage("");
      setShowCreateTicket(false);
      if (isLoggedIn) {
        setActiveTicketId(created.id);
      }
      toast.success(
        `Tiket ${created.ticket_code} terkirim!`,
        `Tim CS kami akan segera membalas (${supportContact.responseEstimate}).`
      );
    } catch {
      toast.error(
        "Kendala jaringan",
        "Tidak dapat mengirim tiket saat ini. Pastikan koneksi internet aktif."
      );
    } finally {
      setSubmittingTicket(false);
    }
  };

  // --- HANDLER: REPLY TO TICKET ---
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || replyText.trim().length < 2) return;

    setSendingReply(true);
    try {
      const res = await fetch(`/api/support/tickets/${activeTicket.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Gagal mengirim balasan", data.error || "Coba lagi.");
        return;
      }

      setTickets((prev) =>
        prev.map((t) =>
          t.id === activeTicket.id
            ? {
                ...t,
                status: data.status ?? t.status,
                last_message_at: data.message.created_at,
                messages: [...t.messages, data.message],
              }
            : t
        )
      );
      setReplyText("");
      toast.success("Balasan terkirim", "Pesan Anda telah diteruskan ke tim CS.");
    } catch {
      toast.error("Kendala jaringan", "Gagal mengirim balasan.");
    } finally {
      setSendingReply(false);
    }
  };

  // --- HANDLER: SUBMIT FEEDBACK ---
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fbMessage.trim().length < 5) {
      toast.warning("Pesan terlalu singkat", "Tulis minimal 5 karakter.");
      return;
    }

    const ok = await confirm({
      title: "Kirim Masukan Anda?",
      description: `Masukan kategori "${getCategoryLabel(fbCategory)}" dengan rating ${fbRating}/5 bintang akan dikirim ke tim NikahPlan.`,
      confirmLabel: "Ya, Kirim Masukan",
    });
    if (!ok) return;

    setSubmittingFeedback(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: fbCategory,
          rating: fbRating,
          page_path: pathname,
          message: fbMessage.trim(),
          sender_name: !isLoggedIn ? fbName.trim() : undefined,
          sender_email: !isLoggedIn ? fbEmail.trim() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Gagal mengirim masukan", data.error || "Coba lagi.");
        return;
      }

      const created = data.feedback as CustomerFeedbackRow;
      setFeedbacks((prev) => [created, ...prev]);
      setFbMessage("");
      setFbRating(5);
      toast.success(
        "Terima kasih atas masukan Anda!",
        "Setiap saran sangat berarti untuk membuat NikahPlan makin nyaman."
      );
      if (isLoggedIn) {
        setActiveTab("history");
      }
    } catch {
      toast.error(
        "Kendala jaringan",
        "Tidak dapat mengirim masukan saat ini."
      );
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const displayRating = hoverRating || fbRating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sage-100 text-sage">
              <Headphones className="h-4 w-4" />
            </span>
            Pusat Bantuan CS &amp; Masukan
          </DialogTitle>
          <DialogDescription>
            Butuh bantuan cepat, kendala pembayaran/undangan, atau ingin berbagi
            saran untuk NikahPlan? Kami siap membantu.
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-cream-100/90 p-1">
          {(
            [
              { id: "support", label: "Customer Service", icon: Headphones },
              {
                id: "feedback",
                label: "Kirim Masukan",
                icon: MessageSquareHeart,
              },
              { id: "history", label: "Riwayat", icon: History },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id !== "support") setActiveTicketId(null);
                }}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition-all",
                  active
                    ? "bg-white text-sage-900 shadow-sm"
                    : "text-sage-600 hover:text-sage-900"
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {migrationMissing && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-amberwarm/40 bg-amberwarm-light/50 p-3 text-xs text-sage-900">
            <AlertTriangle className="h-4 w-4 shrink-0 text-terracotta mt-0.5" />
            <span>
              Tabel CS &amp; Feedback belum diaktifkan di database. Jalankan{" "}
              <strong className="font-mono">Migration 006</strong> di Supabase
              SQL Editor agar tiket &amp; masukan dapat tersimpan.
            </span>
          </div>
        )}

        {/* =============================================================== */}
        {/* TAB 1: CUSTOMER SERVICE                                         */}
        {/* =============================================================== */}
        {activeTab === "support" && (
          <div className="space-y-4">
            {/* Kontak Cepat WhatsApp & Email */}
            <div className="rounded-2xl border border-sage/15 bg-cream-50/80 p-3.5 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold text-sage-900">
                  Kontak Cepat Customer Service
                </p>
                <span className="inline-flex items-center gap-1 text-[11px] text-sage-600">
                  <Clock className="h-3 w-3 text-terracotta" />
                  {supportContact.operationalHours} •{" "}
                  {supportContact.responseEstimate}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {waHref && (
                  <Button asChild size="sm" variant="sage" className="h-8 text-xs">
                    <a href={waHref} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-3.5 w-3.5" />
                      Chat WhatsApp CS
                    </a>
                  </Button>
                )}
                {mailHref && (
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs bg-white"
                  >
                    <a href={mailHref}>
                      <Mail className="h-3.5 w-3.5" />
                      {supportContact.email}
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {loadingData ? (
              <div className="flex items-center justify-center py-8 text-xs text-sage-600 gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-sage" />
                Memuat layanan Customer Service...
              </div>
            ) : activeTicket ? (
              /* ---- DETAIL CHAT TIKET 2 ARAH ---- */
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-sage/10 pb-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveTicketId(null)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-sage-700 hover:text-sage-900"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Daftar Tiket
                  </button>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-bold text-sage-600">
                      {activeTicket.ticket_code}
                    </span>
                    <Badge
                      variant={getTicketStatusMeta(activeTicket.status).variant}
                      className="text-[10.5px]"
                    >
                      {getTicketStatusMeta(activeTicket.status).label}
                    </Badge>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-terracotta">
                    {getTopicLabel(activeTicket.topic)}
                  </p>
                  <h4 className="text-sm font-bold text-sage-900">
                    {activeTicket.subject}
                  </h4>
                </div>

                {/* Thread Percakapan */}
                <div className="max-h-60 overflow-y-auto space-y-2.5 rounded-2xl border border-sage/10 bg-cream-50/50 p-3">
                  {activeTicket.messages.length === 0 ? (
                    <p className="text-xs text-sage-500 text-center py-4">
                      Belum ada pesan pada tiket ini.
                    </p>
                  ) : (
                    activeTicket.messages.map((msg) => {
                      const isAdminMsg = msg.sender_role === "ADMIN";
                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex flex-col max-w-[85%]",
                            isAdminMsg ? "items-start" : "ml-auto items-end"
                          )}
                        >
                          <div className="flex items-center gap-1.5 mb-0.5 px-1">
                            <span className="text-[10.5px] font-bold text-sage-700">
                              {isAdminMsg
                                ? msg.sender_name || "Tim CS NikahPlan"
                                : "Anda"}
                            </span>
                            <span className="text-[10px] text-sage-500">
                              {formatShortDateTime(msg.created_at)}
                            </span>
                          </div>
                          <div
                            className={cn(
                              "rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap",
                              isAdminMsg
                                ? "bg-white border border-sage/15 text-sage-900 rounded-tl-sm"
                                : "bg-sage text-cream-50 rounded-tr-sm"
                            )}
                          >
                            {msg.message}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Form Balas */}
                <form onSubmit={handleSendReply} className="space-y-2">
                  {activeTicket.status === "RESOLVED" && (
                    <p className="text-[11px] text-sage-600">
                      Tiket ini ditandai selesai. Mengirim balasan baru akan
                      membuka kembali tiket secara otomatis.
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Tulis balasan untuk tim CS..."
                      disabled={sendingReply}
                      className="text-xs"
                    />
                    <Button
                      type="submit"
                      variant="sage"
                      size="sm"
                      disabled={sendingReply || replyText.trim().length < 2}
                    >
                      {sendingReply ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      Kirim
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              /* ---- DAFTAR TIKET & FORM BUAT TIKET ---- */
              <div className="space-y-3.5">
                {isLoggedIn && tickets.length > 0 && (
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-sage-900 flex items-center gap-1.5">
                      <Ticket className="h-3.5 w-3.5 text-sage" />
                      Tiket Bantuan Anda ({tickets.length})
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant={showCreateTicket ? "ghost" : "outline"}
                      className="h-7 text-xs"
                      onClick={() => setShowCreateTicket((v) => !v)}
                    >
                      {showCreateTicket ? (
                        "Tutup Form"
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" />
                          Buat Tiket Baru
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {showCreateTicket && (
                  <form
                    onSubmit={handleCreateTicket}
                    className="space-y-3 rounded-2xl border border-sage/15 bg-white p-4"
                  >
                    <div className="space-y-1.5">
                      <Label className="text-xs">Topik Bantuan</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {SUPPORT_TOPICS.map((t) => {
                          const active = ticketTopic === t.id;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setTicketTopic(t.id)}
                              className={cn(
                                "rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all border",
                                active
                                  ? "border-sage bg-sage text-cream-50"
                                  : "border-sage/15 bg-cream-50/70 text-sage-700 hover:border-sage/35"
                              )}
                            >
                              {t.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {!isLoggedIn && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <Label className="text-xs">Nama Anda</Label>
                          <Input
                            value={ticketName}
                            onChange={(e) => setTicketName(e.target.value)}
                            placeholder="Contoh: Nadia & Raka"
                            className="h-9 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Email (untuk balasan)</Label>
                          <Input
                            type="email"
                            value={ticketEmail}
                            onChange={(e) => setTicketEmail(e.target.value)}
                            placeholder="nama@email.com"
                            className="h-9 text-xs"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <Label className="text-xs">Subjek Kendala</Label>
                      <Input
                        value={ticketSubject}
                        onChange={(e) => setTicketSubject(e.target.value)}
                        placeholder="Contoh: Pembayaran sudah berhasil tapi paket belum aktif"
                        required
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Ceritakan Detail Kendala</Label>
                      <textarea
                        value={ticketMessage}
                        onChange={(e) => setTicketMessage(e.target.value)}
                        rows={3}
                        required
                        placeholder="Jelaskan kendala, order ID (jika ada), atau langkah yang sudah dicoba..."
                        className="w-full rounded-xl border border-sage/20 bg-white px-3 py-2 text-xs text-sage-900 placeholder:text-sage-400 focus:outline-none focus:ring-2 focus:ring-sage"
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="sage"
                      className="w-full"
                      disabled={submittingTicket}
                    >
                      {submittingTicket ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Kirim Tiket Customer Service
                    </Button>
                  </form>
                )}

                {isLoggedIn && tickets.length > 0 && (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
                    {tickets.map((t) => {
                      const st = getTicketStatusMeta(t.status);
                      const lastMsg = t.messages[t.messages.length - 1];
                      const hasAdminReply = t.messages.some(
                        (m) => m.sender_role === "ADMIN"
                      );
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setActiveTicketId(t.id)}
                          className="w-full text-left rounded-2xl border border-sage/12 bg-cream-50/70 hover:bg-white hover:border-sage/30 p-3.5 transition-all space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-mono text-[10.5px] font-bold text-sage-600">
                                {t.ticket_code}
                              </span>
                              <span className="text-[10.5px] text-terracotta font-semibold truncate">
                                • {getTopicLabel(t.topic)}
                              </span>
                            </div>
                            <Badge variant={st.variant} className="text-[10px]">
                              {st.label}
                            </Badge>
                          </div>
                          <p className="text-xs font-bold text-sage-900 line-clamp-1">
                            {t.subject}
                          </p>
                          {lastMsg && (
                            <p className="text-[11px] text-sage-600 line-clamp-1">
                              {lastMsg.sender_role === "ADMIN"
                                ? "Balasan CS: "
                                : "Anda: "}
                              {lastMsg.message}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-[10px] text-sage-500 pt-0.5">
                            <span>
                              {t.messages.length} pesan
                              {hasAdminReply ? " • Ada balasan CS" : ""}
                            </span>
                            <span>{formatShortDateTime(t.last_message_at)}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* =============================================================== */}
        {/* TAB 2: KIRIM MASUKAN (FEEDBACK)                                 */}
        {/* =============================================================== */}
        {activeTab === "feedback" && (
          <form onSubmit={handleSubmitFeedback} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Kategori Masukan</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {FEEDBACK_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const active = fbCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFbCategory(cat.id)}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-2xl border px-3 py-2.5 text-xs font-semibold transition-all",
                        active
                          ? "border-sage bg-sage text-cream-50 shadow-sm"
                          : "border-sage/15 bg-cream-50/70 text-sage-700 hover:border-sage/35"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rating Bintang */}
            <div className="rounded-2xl border border-sage/12 bg-cream-50/70 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-sage-900">
                  Seberapa puas dengan NikahPlan?
                </p>
                <p className="text-[11px] text-sage-600">
                  {RATING_LABELS[displayRating] || "Pilih rating"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = star <= displayRating;
                  return (
                    <button
                      key={star}
                      type="button"
                      aria-label={`Beri ${star} bintang`}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setFbRating(star)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={cn(
                          "h-6 w-6 transition-colors",
                          filled
                            ? "fill-amberwarm text-amberwarm"
                            : "text-sage-300"
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {!isLoggedIn && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-xs">Nama Anda (Opsional)</Label>
                  <Input
                    value={fbName}
                    onChange={(e) => setFbName(e.target.value)}
                    placeholder="Contoh: Dinda"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email (Opsional)</Label>
                  <Input
                    type="email"
                    value={fbEmail}
                    onChange={(e) => setFbEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Tulis Masukan Anda</Label>
                <span className="rounded-full bg-sage-50 px-2 py-0.5 font-mono text-[10px] text-sage-600">
                  Halaman: {pathname}
                </span>
              </div>
              <textarea
                value={fbMessage}
                onChange={(e) => setFbMessage(e.target.value)}
                rows={4}
                maxLength={1500}
                required
                placeholder="Bagikan ide fitur baru, pengalaman Anda, atau detail bug yang ditemui..."
                className="w-full rounded-2xl border border-sage/20 bg-white px-3.5 py-2.5 text-xs text-sage-900 placeholder:text-sage-400 focus:outline-none focus:ring-2 focus:ring-sage"
              />
              <div className="flex justify-end text-[10.5px] text-sage-500">
                {fbMessage.length}/1500 karakter
              </div>
            </div>

            <Button
              type="submit"
              variant="sage"
              className="w-full"
              disabled={submittingFeedback}
            >
              {submittingFeedback ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Kirim Masukan ke Tim NikahPlan
            </Button>
          </form>
        )}

        {/* =============================================================== */}
        {/* TAB 3: RIWAYAT MASUKAN                                          */}
        {/* =============================================================== */}
        {activeTab === "history" && (
          <div className="space-y-3">
            {loadingData ? (
              <div className="flex items-center justify-center py-8 text-xs text-sage-600 gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-sage" />
                Memuat riwayat masukan...
              </div>
            ) : !isLoggedIn ? (
              <div className="rounded-2xl border border-sage/12 bg-cream-50/70 p-6 text-center space-y-2">
                <History className="h-7 w-7 mx-auto text-sage-400" />
                <p className="text-xs font-bold text-sage-900">
                  Masuk untuk Melihat Riwayat &amp; Balasan
                </p>
                <p className="text-[11.5px] text-sage-600 max-w-sm mx-auto">
                  Anda tetap bisa mengirim masukan atau tiket CS tanpa login,
                  namun riwayat status &amp; balasan tim hanya tampil untuk akun
                  yang sedang masuk.
                </p>
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="rounded-2xl border border-sage/12 bg-cream-50/70 p-6 text-center space-y-2.5">
                <MessageSquareHeart className="h-7 w-7 mx-auto text-sage-400" />
                <p className="text-xs font-bold text-sage-900">
                  Belum Ada Riwayat Masukan
                </p>
                <p className="text-[11.5px] text-sage-600">
                  Punya ide fitur atau saran perbaikan? Kirim masukan pertama
                  Anda sekarang.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="sage"
                  onClick={() => setActiveTab("feedback")}
                >
                  Tulis Masukan Sekarang
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-0.5">
                {feedbacks.map((fb) => {
                  const st = getFeedbackStatusMeta(fb.status);
                  return (
                    <div
                      key={fb.id}
                      className="rounded-2xl border border-sage/12 bg-cream-50/70 p-3.5 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px]">
                            {getCategoryLabel(fb.category)}
                          </Badge>
                          <Badge variant={st.variant} className="text-[10px]">
                            {st.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {fb.rating && (
                            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-sage-800">
                              <Star className="h-3 w-3 fill-amberwarm text-amberwarm" />
                              {fb.rating}/5
                            </span>
                          )}
                          <span className="text-[10px] text-sage-500">
                            {formatShortDateTime(fb.created_at)}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs leading-relaxed text-sage-800 whitespace-pre-wrap">
                        {fb.message}
                      </p>

                      {fb.admin_reply && (
                        <div className="rounded-xl border border-sage/20 bg-white p-2.5 space-y-1">
                          <p className="text-[10.5px] font-bold text-sage-800 inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-sage" />
                            Tanggapan Tim NikahPlan
                          </p>
                          <p className="text-xs text-sage-700 leading-relaxed whitespace-pre-wrap">
                            {fb.admin_reply}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
