"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  Calendar,
  CalendarPlus,
  Check,
  Clock,
  Copy,
  Gift,
  Heart,
  Instagram,
  Loader2,
  MailOpen,
  MapPin,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import type {
  InvitationRsvp,
  RsvpAttendance,
  WeddingInvitation,
} from "@/types/database";
import {
  INVITATION_THEMES,
  buildGoogleCalendarUrl,
} from "@/lib/invitation-themes";
import { BotanicalCorner } from "@/components/brand/botanical-accent";

function formatLongDateID(dateStr: string | null | undefined): string {
  if (!dateStr) return "Segera diumumkan";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

function useCountdown(targetDateStr: string | null) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (!targetDateStr) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [targetDateStr]);

  if (!targetDateStr || now === null) return null;
  const target = new Date(`${targetDateStr}T09:00:00+07:00`).getTime();
  if (Number.isNaN(target)) return null;
  const diff = Math.max(0, target - now);

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    isPast: diff === 0,
  };
}

export function PublicInvitationClient({
  invitation,
  initialRsvps,
  guestNameParam,
  isOwnerPreview,
}: {
  invitation: WeddingInvitation;
  initialRsvps: InvitationRsvp[];
  guestNameParam: string;
  isOwnerPreview: boolean;
}) {
  const theme =
    INVITATION_THEMES[invitation.theme] ?? INVITATION_THEMES.BOTANICAL_SAGE;

  const [opened, setOpened] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [copiedBankIdx, setCopiedBankIdx] = useState<number | null>(null);

  // Kunci scroll halaman di belakang Cover Gate hingga tombol "Buka Undangan" diklik
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    if (!opened) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = prevOverflow || "";
    }
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [opened]);

  // RSVP state
  const [rsvps, setRsvps] = useState<InvitationRsvp[]>(initialRsvps);
  const [rsvpName, setRsvpName] = useState(guestNameParam);
  const [rsvpAttendance, setRsvpAttendance] =
    useState<RsvpAttendance>("HADIR");
  const [rsvpCount, setRsvpCount] = useState(1);
  const [rsvpMessage, setRsvpMessage] = useState("");
  const [submittingRsvp, setSubmittingRsvp] = useState(false);
  const [rsvpFeedback, setRsvpFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const primaryDate = invitation.akad_date || invitation.resepsi_date;
  const countdown = useCountdown(primaryDate);

  const calendarUrl = useMemo(
    () =>
      buildGoogleCalendarUrl({
        title: `Pernikahan ${invitation.groom_name} & ${invitation.bride_name}`,
        dateStr: primaryDate,
        details: `Acara pernikahan ${invitation.groom_full_name || invitation.groom_name} & ${invitation.bride_full_name || invitation.bride_name}.`,
        location:
          invitation.resepsi_venue ||
          invitation.akad_venue ||
          invitation.resepsi_address ||
          invitation.akad_address ||
          "",
      }),
    [invitation, primaryDate]
  );

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpName.trim()) return;
    setSubmittingRsvp(true);
    setRsvpFeedback(null);

    try {
      const res = await fetch(`/api/invitations/${invitation.slug}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_name: rsvpName.trim(),
          attendance: rsvpAttendance,
          guest_count: rsvpCount,
          message: rsvpMessage.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRsvpFeedback({
          type: "error",
          text: data.error || "Gagal mengirim konfirmasi kehadiran.",
        });
      } else {
        setRsvps((prev) => [data.rsvp as InvitationRsvp, ...prev]);
        setRsvpMessage("");
        setRsvpFeedback({
          type: "success",
          text: "Terima kasih! Konfirmasi kehadiran & doa restu Anda telah kami terima.",
        });
      }
    } catch {
      setRsvpFeedback({
        type: "error",
        text: "Kendala jaringan. Silakan coba beberapa saat lagi.",
      });
    } finally {
      setSubmittingRsvp(false);
    }
  };

  const loveStories = Array.isArray(invitation.love_stories)
    ? invitation.love_stories
    : [];
  const giftAccounts = Array.isArray(invitation.gift_accounts)
    ? invitation.gift_accounts
    : [];
  const galleryUrls = Array.isArray(invitation.gallery_urls)
    ? invitation.gallery_urls
    : [];

  return (
    <div className={`min-h-screen ${theme.pageBg} relative overflow-x-clip`}>
      {/* Draft Preview Ribbon */}
      {isOwnerPreview && (
        <div className="sticky top-0 z-50 bg-amber-500 text-sage-950 px-4 py-2 text-center text-xs font-bold flex flex-wrap items-center justify-center gap-3">
          <span>
            Mode Pratinjau Draft — Tamu belum bisa membuka link ini sampai Anda
            klik Publikasikan.
          </span>
          <Link
            href="/undangan"
            className="underline decoration-sage-950/60 hover:opacity-80"
          >
            Kembali ke Editor
          </Link>
        </div>
      )}

      {/* ================================================================= */}
      {/* FULLSCREEN COVER GATE (AMPLOP PEMBUKA)                            */}
      {/* ================================================================= */}
      <AnimatePresence>
        {!opened && (
          <motion.div
            key="cover-gate"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -32 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            style={{ backgroundColor: theme.coverFallbackBg }}
            className={`fixed inset-0 z-40 flex flex-col items-center justify-center overflow-y-auto px-6 py-10 text-center ${
              isOwnerPreview ? "pt-16" : ""
            } ${theme.coverBg} ${theme.coverText}`}
          >
            {invitation.cover_photo_url && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={invitation.cover_photo_url}
                  alt="Cover Pernikahan"
                  className="absolute inset-0 h-full w-full object-cover opacity-30"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/75" />
              </>
            )}

            <BotanicalCorner
              className="pointer-events-none absolute top-0 right-0 h-44 w-44 opacity-25"
              variant="terracotta"
            />
            <BotanicalCorner
              className="pointer-events-none absolute bottom-0 left-0 h-44 w-44 rotate-180 opacity-25"
              variant="sage"
            />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="relative z-10 max-w-md space-y-6"
            >
              <p
                className={`text-xs uppercase tracking-[0.28em] font-semibold ${theme.coverSubText}`}
              >
                The Wedding Of
              </p>

              <h1 className="font-script text-5xl sm:text-6xl leading-[1.22] py-1">
                {invitation.groom_name} &amp; {invitation.bride_name}
              </h1>

              {primaryDate && (
                <p className={`text-sm font-medium ${theme.coverSubText}`}>
                  {formatLongDateID(primaryDate)}
                </p>
              )}

              {guestNameParam && (
                <div className="mx-auto max-w-xs rounded-2xl border border-white/20 bg-white/10 px-5 py-3.5 backdrop-blur-md">
                  <p className="text-[11px] opacity-80">
                    Kepada Yth. Bapak/Ibu/Saudara/i
                  </p>
                  <p className="font-display text-lg font-semibold mt-1">
                    {guestNameParam}
                  </p>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setOpened(true)}
                  className={`inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold shadow-lift transition-transform hover:scale-105 active:scale-95 ${theme.coverBtn}`}
                >
                  <MailOpen className="h-4 w-4" />
                  Buka Undangan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================================================================= */}
      {/* KONTEN UTAMA UNDANGAN                                             */}
      {/* ================================================================= */}
      <div
        aria-hidden={!opened}
        className={`mx-auto max-w-xl px-4 py-10 sm:py-14 space-y-8 relative ${
          !opened ? "pointer-events-none select-none" : ""
        }`}
      >
        {/* 1. Hero & Countdown */}
        <section
          className={`relative overflow-hidden rounded-[2rem] border p-7 sm:p-9 text-center space-y-5 shadow-soft ${theme.cardBg}`}
        >
          <BotanicalCorner
            className="pointer-events-none absolute -top-4 -right-4 h-32 w-32 opacity-25"
            variant="sage"
          />

          {invitation.cover_photo_url && (
            <div className="mx-auto h-56 w-44 sm:h-64 sm:w-52 overflow-hidden rounded-[6rem] border-4 border-white/70 shadow-soft">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={invitation.cover_photo_url}
                alt={`${invitation.groom_name} & ${invitation.bride_name}`}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${theme.badgeClass}`}
            >
              <Sparkles className="h-3 w-3" />
              Undangan Pernikahan
            </span>
            <h2
              className={`font-script text-5xl sm:text-6xl leading-[1.22] pt-2 ${theme.accentText}`}
            >
              {invitation.groom_name} &amp; {invitation.bride_name}
            </h2>
            {primaryDate && (
              <p className={`text-sm font-semibold ${theme.bodyText}`}>
                {formatLongDateID(primaryDate)}
              </p>
            )}
          </div>

          {countdown && (
            <div className="grid grid-cols-4 gap-2 pt-2">
              {[
                { label: "Hari", value: countdown.days },
                { label: "Jam", value: countdown.hours },
                { label: "Menit", value: countdown.minutes },
                { label: "Detik", value: countdown.seconds },
              ].map((unit) => (
                <div
                  key={unit.label}
                  className={`rounded-2xl border py-2.5 px-1 ${theme.dividerColor} ${
                    theme.isDark ? "bg-white/5" : "bg-black/[0.025]"
                  }`}
                >
                  <p
                    className={`font-display text-2xl font-semibold tabular-nums ${theme.headingText}`}
                  >
                    {String(unit.value).padStart(2, "0")}
                  </p>
                  <p className={`text-[10px] font-medium ${theme.mutedText}`}>
                    {unit.label}
                  </p>
                </div>
              ))}
            </div>
          )}

          {calendarUrl && (
            <div className="pt-1">
              <a
                href={calendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-xs font-bold transition-colors ${theme.outlineBtn}`}
              >
                <CalendarPlus className="h-4 w-4" />
                Simpan ke Google Calendar
              </a>
            </div>
          )}
        </section>

        {/* 2. Ayat / Kutipan Cinta */}
        {invitation.opening_quote && (
          <section
            className={`rounded-[2rem] border p-6 sm:p-8 text-center space-y-3 shadow-card ${theme.cardBg}`}
          >
            <p
              className={`font-display italic text-sm sm:text-base leading-relaxed ${theme.bodyText}`}
            >
              &ldquo;{invitation.opening_quote}&rdquo;
            </p>
            {invitation.quote_source && (
              <p
                className={`text-xs font-bold tracking-wider uppercase ${theme.accentText}`}
              >
                &mdash; {invitation.quote_source}
              </p>
            )}
          </section>
        )}

        {/* 3. Profil Kedua Mempelai */}
        <section
          className={`rounded-[2rem] border p-6 sm:p-8 text-center space-y-6 shadow-card ${theme.cardBg}`}
        >
          <div className="space-y-1">
            <p
              className={`text-[11px] uppercase tracking-[0.22em] font-semibold ${theme.mutedText}`}
            >
              Assalamu&apos;alaikum Wr. Wb.
            </p>
            <h3 className={`font-display text-2xl font-semibold ${theme.headingText}`}>
              Mempelai Berbahagia
            </h3>
          </div>

          <div className="space-y-5">
            {/* Mempelai Pria */}
            <div className="space-y-1.5">
              <p className={`font-script text-4xl ${theme.accentText}`}>
                {invitation.groom_name}
              </p>
              {invitation.groom_full_name && (
                <p className={`font-display text-lg font-semibold ${theme.headingText}`}>
                  {invitation.groom_full_name}
                </p>
              )}
              {invitation.groom_parents && (
                <p className={`text-xs ${theme.mutedText}`}>
                  Putra dari {invitation.groom_parents}
                </p>
              )}
              {invitation.groom_instagram && (
                <a
                  href={`https://instagram.com/${invitation.groom_instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 text-xs font-semibold pt-1 hover:underline ${theme.accentText}`}
                >
                  <Instagram className="h-3.5 w-3.5" />
                  {invitation.groom_instagram}
                </a>
              )}
            </div>

            <div className="flex items-center justify-center gap-3">
              <span className={`h-px w-16 border-t ${theme.dividerColor}`} />
              <Heart className={`h-4 w-4 ${theme.accentText}`} />
              <span className={`h-px w-16 border-t ${theme.dividerColor}`} />
            </div>

            {/* Mempelai Wanita */}
            <div className="space-y-1.5">
              <p className={`font-script text-4xl ${theme.accentText}`}>
                {invitation.bride_name}
              </p>
              {invitation.bride_full_name && (
                <p className={`font-display text-lg font-semibold ${theme.headingText}`}>
                  {invitation.bride_full_name}
                </p>
              )}
              {invitation.bride_parents && (
                <p className={`text-xs ${theme.mutedText}`}>
                  Putri dari {invitation.bride_parents}
                </p>
              )}
              {invitation.bride_instagram && (
                <a
                  href={`https://instagram.com/${invitation.bride_instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 text-xs font-semibold pt-1 hover:underline ${theme.accentText}`}
                >
                  <Instagram className="h-3.5 w-3.5" />
                  {invitation.bride_instagram}
                </a>
              )}
            </div>
          </div>
        </section>

        {/* 4. Rangkaian Acara (Akad & Resepsi) */}
        <section className="space-y-4">
          <div className="text-center space-y-1">
            <p className={`font-script text-3xl ${theme.accentText}`}>
              Save The Date
            </p>
            <h3 className={`font-display text-2xl font-semibold ${theme.headingText}`}>
              Rangkaian Acara
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {[
              {
                label: "Akad Nikah / Pemberkatan",
                date: invitation.akad_date,
                time: invitation.akad_time,
                venue: invitation.akad_venue,
                address: invitation.akad_address,
                maps: invitation.akad_maps_url,
              },
              {
                label: "Resepsi Pernikahan",
                date: invitation.resepsi_date,
                time: invitation.resepsi_time,
                venue: invitation.resepsi_venue,
                address: invitation.resepsi_address,
                maps: invitation.resepsi_maps_url,
              },
            ]
              .filter((ev) => ev.date || ev.venue || ev.address)
              .map((ev) => (
                <div
                  key={ev.label}
                  className={`rounded-[2rem] border p-6 text-center space-y-3 shadow-card ${theme.cardBg}`}
                >
                  <span
                    className={`inline-block rounded-full border px-3 py-1 text-[11px] font-bold ${theme.badgeClass}`}
                  >
                    {ev.label}
                  </span>
                  {ev.date && (
                    <p
                      className={`font-display text-lg font-semibold flex items-center justify-center gap-2 ${theme.headingText}`}
                    >
                      <Calendar className={`h-4 w-4 ${theme.accentText}`} />
                      {formatLongDateID(ev.date)}
                    </p>
                  )}
                  {ev.time && (
                    <p
                      className={`text-xs font-semibold flex items-center justify-center gap-1.5 ${theme.bodyText}`}
                    >
                      <Clock className={`h-3.5 w-3.5 ${theme.accentText}`} />
                      {ev.time}
                    </p>
                  )}
                  {ev.venue && (
                    <p className={`text-sm font-bold pt-1 ${theme.headingText}`}>
                      {ev.venue}
                    </p>
                  )}
                  {ev.address && (
                    <p
                      className={`text-xs leading-relaxed max-w-sm mx-auto ${theme.mutedText}`}
                    >
                      {ev.address}
                    </p>
                  )}
                  {ev.maps && (
                    <div className="pt-2">
                      <a
                        href={ev.maps}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-bold shadow-sm transition-transform hover:scale-105 ${theme.primaryBtn}`}
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        Buka Google Maps
                      </a>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </section>

        {/* 5. Kisah Cinta (Love Story) */}
        {loveStories.length > 0 && (
          <section
            className={`rounded-[2rem] border p-6 sm:p-8 space-y-5 shadow-card ${theme.cardBg}`}
          >
            <div className="text-center space-y-1">
              <p className={`font-script text-3xl ${theme.accentText}`}>
                Our Journey
              </p>
              <h3
                className={`font-display text-2xl font-semibold ${theme.headingText}`}
              >
                Kisah Cinta Kami
              </h3>
            </div>

            <div className="space-y-4">
              {loveStories.map((story, idx) => (
                <div
                  key={idx}
                  className={`relative pl-5 border-l-2 ${theme.dividerColor}`}
                >
                  <span
                    className={`absolute -left-[7px] top-1 h-3 w-3 rounded-full ${theme.primaryBtn}`}
                  />
                  {story.year && (
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider ${theme.accentText}`}
                    >
                      {story.year}
                    </span>
                  )}
                  <p className={`text-sm font-bold ${theme.headingText}`}>
                    {story.title}
                  </p>
                  {story.description && (
                    <p className={`text-xs leading-relaxed mt-0.5 ${theme.mutedText}`}>
                      {story.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 6. Galeri Foto Prewedding */}
        {galleryUrls.length > 0 && (
          <section className="space-y-4">
            <div className="text-center space-y-1">
              <p className={`font-script text-3xl ${theme.accentText}`}>
                Moments
              </p>
              <h3
                className={`font-display text-2xl font-semibold ${theme.headingText}`}
              >
                Galeri Bahagia
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {galleryUrls.map((url, idx) => (
                <button
                  key={`${url}-${idx}`}
                  type="button"
                  onClick={() => setLightboxUrl(url)}
                  className="aspect-[4/5] overflow-hidden rounded-2xl border border-white/40 shadow-sm transition-transform hover:scale-[1.02]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Momen ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* 7. Amplop Digital (Wedding Gift) */}
        {invitation.show_gift &&
          (giftAccounts.length > 0 || invitation.gift_address) && (
            <section
              className={`rounded-[2rem] border p-6 sm:p-8 text-center space-y-4 shadow-card ${theme.cardBg}`}
            >
              <div className="space-y-1">
                <span
                  className={`mx-auto inline-flex h-11 w-11 items-center justify-center rounded-2xl border ${theme.badgeClass}`}
                >
                  <Gift className="h-5 w-5" />
                </span>
                <h3
                  className={`font-display text-2xl font-semibold pt-1 ${theme.headingText}`}
                >
                  Tanda Kasih &amp; Amplop Digital
                </h3>
                <p className={`text-xs leading-relaxed max-w-sm mx-auto ${theme.mutedText}`}>
                  Doa restu Anda merupakan karunia terindah bagi kami. Namun
                  bila berkenan memberi tanda kasih, dapat disalurkan melalui:
                </p>
              </div>

              <div className="space-y-2.5 text-left">
                {giftAccounts.map((acc, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between gap-3 rounded-2xl border p-4 ${theme.dividerColor} ${
                      theme.isDark ? "bg-white/5" : "bg-black/[0.02]"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className={`text-xs font-bold uppercase ${theme.accentText}`}>
                        {acc.bank}
                      </p>
                      <p
                        className={`font-mono text-base font-bold tracking-wider mt-0.5 ${theme.headingText}`}
                      >
                        {acc.accountNumber}
                      </p>
                      <p className={`text-xs ${theme.mutedText}`}>
                        a.n. {acc.accountHolder}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(acc.accountNumber);
                        setCopiedBankIdx(idx);
                        setTimeout(() => setCopiedBankIdx(null), 2000);
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-bold shrink-0 transition-colors ${theme.outlineBtn}`}
                    >
                      {copiedBankIdx === idx ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          Tersalin
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Salin
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {invitation.gift_address && (
                <div
                  className={`rounded-2xl border p-3.5 text-xs ${theme.dividerColor} ${theme.mutedText}`}
                >
                  <strong className={theme.headingText}>
                    Alamat Kado Fisik:{" "}
                  </strong>
                  {invitation.gift_address}
                </div>
              )}
            </section>
          )}

        {/* 8. RSVP & Dinding Ucapan Doa */}
        {invitation.show_rsvp && (
          <section
            className={`rounded-[2rem] border p-6 sm:p-8 space-y-5 shadow-card ${theme.cardBg}`}
          >
            <div className="text-center space-y-1">
              <p className={`font-script text-3xl ${theme.accentText}`}>
                Wishes &amp; RSVP
              </p>
              <h3
                className={`font-display text-2xl font-semibold ${theme.headingText}`}
              >
                Konfirmasi Kehadiran &amp; Doa
              </h3>
            </div>

            <form onSubmit={handleRsvpSubmit} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Nama Lengkap Anda"
                value={rsvpName}
                onChange={(e) => setRsvpName(e.target.value)}
                className="w-full rounded-xl border border-sage/20 bg-white px-4 py-2.5 text-sm text-sage-900 focus:outline-none focus:ring-2 focus:ring-sage/35"
              />

              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { val: "HADIR", label: "Hadir" },
                    { val: "RAGU", label: "Masih Ragu" },
                    { val: "TIDAK_HADIR", label: "Tidak Hadir" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setRsvpAttendance(opt.val)}
                    className={`rounded-xl border py-2 text-xs font-bold transition-all ${
                      rsvpAttendance === opt.val
                        ? theme.primaryBtn
                        : `${theme.outlineBtn} bg-transparent`
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {rsvpAttendance !== "TIDAK_HADIR" && (
                <div className="flex items-center justify-between gap-2 rounded-xl border border-sage/20 bg-white px-4 py-2 text-xs text-sage-800">
                  <span className="font-semibold">Jumlah Tamu Hadir</span>
                  <select
                    value={rsvpCount}
                    onChange={(e) => setRsvpCount(Number(e.target.value))}
                    className="rounded-lg border border-sage/20 bg-cream-50 px-2.5 py-1 text-xs font-bold text-sage-900"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n} Orang
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <textarea
                rows={3}
                placeholder="Tuliskan ucapan & doa terbaik untuk kedua mempelai..."
                value={rsvpMessage}
                onChange={(e) => setRsvpMessage(e.target.value)}
                className="w-full rounded-xl border border-sage/20 bg-white px-4 py-2.5 text-sm text-sage-900 focus:outline-none focus:ring-2 focus:ring-sage/35"
              />

              {rsvpFeedback && (
                <div
                  className={`rounded-xl px-3.5 py-2.5 text-xs font-medium ${
                    rsvpFeedback.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {rsvpFeedback.text}
                </div>
              )}

              <button
                type="submit"
                disabled={submittingRsvp || !rsvpName.trim()}
                className={`w-full inline-flex items-center justify-center gap-2 rounded-full py-3 text-sm font-bold shadow-sm transition-opacity disabled:opacity-50 ${theme.primaryBtn}`}
              >
                {submittingRsvp ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Kirim Konfirmasi &amp; Doa
                  </>
                )}
              </button>
            </form>

            {/* Dinding Ucapan */}
            {rsvps.length > 0 && (
              <div className="space-y-2.5 pt-3 border-t border-current/10 max-h-80 overflow-y-auto pr-1">
                {rsvps.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-2xl border p-3.5 space-y-1 ${theme.dividerColor} ${
                      theme.isDark ? "bg-white/5" : "bg-black/[0.02]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs font-bold ${theme.headingText}`}>
                        {item.guest_name}
                      </p>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${theme.badgeClass}`}
                      >
                        {item.attendance === "HADIR"
                          ? `Hadir (${item.guest_count})`
                          : item.attendance === "RAGU"
                            ? "Masih Ragu"
                            : "Berhalangan"}
                      </span>
                    </div>
                    {item.message && (
                      <p className={`text-xs leading-relaxed ${theme.mutedText}`}>
                        {item.message}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 9. Penutup & Credit */}
        <footer className="text-center space-y-3 pt-2 pb-6">
          {invitation.closing_message && (
            <p className={`text-xs leading-relaxed max-w-md mx-auto ${theme.mutedText}`}>
              {invitation.closing_message}
            </p>
          )}
          <p className={`font-script text-4xl ${theme.accentText}`}>
            {invitation.groom_name} &amp; {invitation.bride_name}
          </p>
          <p className={`text-[11px] opacity-70 ${theme.mutedText}`}>
            Dibuat dengan cinta menggunakan{" "}
            <Link href="/" className="font-semibold underline">
              NikahPlan
            </Link>
          </p>
        </footer>
      </div>

      {/* Lightbox Foto Galeri */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            aria-label="Tutup foto"
            className="absolute right-4 top-4 rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
            onClick={() => setLightboxUrl(null)}
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Pratinjau Galeri"
            className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
