"use client";

import { Calendar, CalendarPlus, MessageCircle } from "lucide-react";
import {
  buildPaymentGoogleCalendarUrl,
  buildPaymentWhatsAppReminderUrl,
  downloadPaymentIcsFile,
  type PaymentReminderInput,
} from "@/lib/calendar-reminder";
import { useToast } from "@/components/providers/toast-provider";

interface PaymentReminderButtonsProps {
  reminder: PaymentReminderInput;
  compact?: boolean;
}

/**
 * Tombol 1-klik Smart Payment Reminder:
 * - Google Calendar
 * - Apple Calendar / Outlook (.ics dengan alarm otomatis H-3 & H-1)
 * - WhatsApp pengingat ke pasangan/keluarga
 */
export function PaymentReminderButtons({
  reminder,
  compact = false,
}: PaymentReminderButtonsProps) {
  const toast = useToast();
  const googleCalHref = buildPaymentGoogleCalendarUrl(reminder);
  const waHref = buildPaymentWhatsAppReminderUrl(reminder);

  const handleDownloadIcs = () => {
    downloadPaymentIcsFile(reminder);
    toast.success(
      "File Kalender (.ics) diunduh",
      "Buka file untuk menyimpan pengingat H-3 & H-1 ke Apple Calendar / kalender HP."
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      <a
        href={googleCalHref}
        target="_blank"
        rel="noopener noreferrer"
        title="Tambah pengingat ke Google Calendar"
        className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-2 py-1 text-[10.5px] font-semibold text-[#141618] hover:border-[#4F6BF6] hover:text-[#4F6BF6] transition-colors"
      >
        <CalendarPlus className="h-3 w-3 shrink-0" />
        {!compact && <span>Google Cal</span>}
      </a>

      <button
        type="button"
        onClick={handleDownloadIcs}
        title="Unduh file .ics (Apple Calendar / Outlook — alarm H-3 & H-1)"
        className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-2 py-1 text-[10.5px] font-semibold text-[#141618] hover:border-[#4F6BF6] hover:text-[#4F6BF6] transition-colors"
      >
        <Calendar className="h-3 w-3 shrink-0" />
        <span>.ics</span>
      </button>

      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        title="Kirim pengingat jadwal ini via WhatsApp ke pasangan/keluarga"
        className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10.5px] font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
      >
        <MessageCircle className="h-3 w-3 shrink-0" />
        {!compact && <span>WA</span>}
      </a>
    </div>
  );
}
