import { formatIDR } from "@/lib/utils";
import { FUNDING_SOURCE_META } from "@/lib/category-icons";
import type { FundingSource } from "@/types/database";

export interface PaymentReminderInput {
  paymentId: string;
  label: string;
  vendorTitle: string;
  amount: number;
  funding: FundingSource;
  dueDate: string; // YYYY-MM-DD
}

function formatIcsDateOnly(dateStr: string): string {
  return dateStr.replace(/-/g, "").slice(0, 8);
}

function addOneDay(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/**
 * Menghasilkan tautan Google Calendar siap klik untuk pengingat jatuh tempo termin vendor.
 */
export function buildPaymentGoogleCalendarUrl(
  params: PaymentReminderInput
): string {
  const start = formatIcsDateOnly(params.dueDate);
  const end = formatIcsDateOnly(addOneDay(params.dueDate));
  const fundingLabel = FUNDING_SOURCE_META[params.funding].fullLabel;

  const title = `[NikahPlan] Jatuh Tempo ${params.label} — ${params.vendorTitle}`;
  const details = [
    `Jadwal pembayaran vendor pernikahan dari NikahPlan:`,
    `• Pos/Vendor: ${params.vendorTitle}`,
    `• Termin: ${params.label}`,
    `• Nominal: ${formatIDR(params.amount)}`,
    `• Sumber Dana: ${fundingLabel}`,
    "",
    "Tandai Lunas di aplikasi NikahPlan setelah transfer selesai.",
  ].join("\n");

  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${start}/${end}`,
    details,
  });

  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

/**
 * Mengunduh file .ics (Apple Calendar iOS/macOS, Outlook, Android)
 * lengkap dengan 2 alarm pengingat otomatis: H-3 dan H-1!
 */
export function downloadPaymentIcsFile(params: PaymentReminderInput): void {
  const start = formatIcsDateOnly(params.dueDate);
  const end = formatIcsDateOnly(addOneDay(params.dueDate));
  const nowStamp =
    new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const fundingLabel = FUNDING_SOURCE_META[params.funding].fullLabel;

  const summary = `[NikahPlan] Jatuh Tempo ${params.label} — ${params.vendorTitle}`;
  const description = [
    `Pos/Vendor: ${params.vendorTitle}`,
    `Termin: ${params.label}`,
    `Nominal: ${formatIDR(params.amount)}`,
    `Sumber Dana: ${fundingLabel}`,
  ].join("\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NikahPlan//Payment Reminder//ID",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:nikahplan-pay-${params.paymentId}@nikahplan.id`,
    `DTSTAMP:${nowStamp}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    "BEGIN:VALARM",
    "TRIGGER:-P3D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcsText(`H-3 Jatuh Tempo: ${params.label} ${params.vendorTitle} (${formatIDR(params.amount)})`)}`,
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcsText(`Besok Jatuh Tempo: ${params.label} ${params.vendorTitle} (${formatIDR(params.amount)})`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  const blob = new Blob([lines.join("\r\n")], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `NikahPlan-${params.vendorTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 32)}-${params.dueDate}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Menghasilkan tautan pesan WhatsApp pengingat tagihan siap kirim ke pasangan/keluarga.
 */
export function buildPaymentWhatsAppReminderUrl(
  params: PaymentReminderInput
): string {
  const fundingLabel = FUNDING_SOURCE_META[params.funding].fullLabel;
  const formattedDate = new Date(`${params.dueDate}T00:00:00`).toLocaleDateString(
    "id-ID",
    { day: "numeric", month: "long", year: "numeric" }
  );

  const message = [
    `Halo, pengingat jadwal pembayaran pernikahan dari *NikahPlan* 📅`,
    "",
    `• Vendor: *${params.vendorTitle}*`,
    `• Termin: *${params.label}*`,
    `• Nominal: *${formatIDR(params.amount)}*`,
    `• Sumber Dana: ${fundingLabel}`,
    `• Jatuh Tempo: *${formattedDate}*`,
    "",
    "Jangan lupa tandai lunas & simpan bukti bayarnya di aplikasi ya!",
  ].join("\n");

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
