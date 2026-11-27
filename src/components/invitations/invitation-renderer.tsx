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
  getCoupleInitials,
} from "@/lib/invitation-themes";
import { BotanicalCorner } from "@/components/brand/botanical-accent";
import {
  BohoSunDivider,
  DotPaperBackdrop,
  JavaneseGunungan,
  KawungPatternBackdrop,
  PolaroidWashiTape,
  RoyalCornerOrnaments,
  SakuraBranch,
  StarlightGlow,
} from "@/components/invitations/theme-ornaments";

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

function formatYearOnly(dateStr: string | null | undefined): string {
  if (!dateStr) return String(new Date().getFullYear());
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(new Date().getFullYear());
  return String(d.getFullYear());
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

export interface InvitationRendererProps {
  invitation: WeddingInvitation;
  initialRsvps: InvitationRsvp[];
  guestNameParam: string;
  isOwnerPreview?: boolean;
  /** "public" untuk halaman penuh /u/[slug], "embedded" untuk Live Phone Preview di /undangan */
  mode?: "public" | "embedded";
  /** Kontrol eksternal state Cover/Isi khusus mode embedded */
  controlledOpened?: boolean;
  onToggleOpened?: (opened: boolean) => void;
}

export function InvitationRenderer({
  invitation,
  initialRsvps,
  guestNameParam,
  isOwnerPreview = false,
  mode = "public",
  controlledOpened,
  onToggleOpened,
}: InvitationRendererProps) {
  const isEmbedded = mode === "embedded";
  const theme =
    INVITATION_THEMES[invitation.theme] ?? INVITATION_THEMES.BOTANICAL_SAGE;
  const layout = theme.layoutStyle;

  const [internalOpened, setInternalOpened] = useState(false);
  const opened =
    controlledOpened !== undefined ? controlledOpened : internalOpened;

  const setOpened = (next: boolean) => {
    if (onToggleOpened) onToggleOpened(next);
    if (controlledOpened === undefined) setInternalOpened(next);
  };

  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [copiedBankIdx, setCopiedBankIdx] = useState<number | null>(null);

  // Kunci scroll halaman di belakang Cover Gate hanya untuk mode publik penuh
  useEffect(() => {
    if (isEmbedded) return;
    const prevOverflow = document.body.style.overflow;
    if (!opened) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = prevOverflow || "";
    }
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [opened, isEmbedded]);

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

  useEffect(() => {
    setRsvps(initialRsvps);
  }, [initialRsvps]);

  useEffect(() => {
    setRsvpName(guestNameParam);
  }, [guestNameParam]);

  const primaryDate = invitation.akad_date || invitation.resepsi_date;
  const countdown = useCountdown(primaryDate);
  const initials = getCoupleInitials(
    invitation.groom_name,
    invitation.bride_name
  );
  const eventYear = formatYearOnly(primaryDate);

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

    if (isEmbedded) {
      setRsvpFeedback({
        type: "success",
        text: "Mode Pratinjau: Di halaman publik, ucapan & konfirmasi tamu akan langsung tersimpan ke daftar RSVP Anda.",
      });
      return;
    }

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

  // =========================================================================
  // STYLE HELPER PER LAYOUT (BUKAN SEKADAR WARNA)
  // =========================================================================
  const isEditorial = layout === "editorial";
  const isJavanese = layout === "javanese";
  const isPolaroid = layout === "polaroid";
  const isRoyal = layout === "royal";
  const isFloral = layout === "floral";
  const isStarlight = layout === "starlight";
  const isBoho = layout === "boho";

  const sectionCardClass = isEditorial
    ? `relative border-y border-[#171717]/20 py-7 px-2 bg-transparent`
    : isJavanese
      ? `relative overflow-hidden rounded-2xl border-double border-4 border-[#C69C4D]/45 bg-[#FBF6EC]/95 p-6 shadow-card`
      : isRoyal
        ? `relative overflow-hidden rounded-lg border border-[#D4A359]/40 ring-1 ring-inset ring-[#D4A359]/20 bg-white/95 p-6 shadow-card`
        : isPolaroid
          ? `relative overflow-hidden rounded-2xl border border-[#8B7765]/25 bg-[#FFFDF9] p-6 shadow-md`
          : isBoho
            ? `relative overflow-hidden rounded-[2rem] border border-[#C87D55]/20 border-t-4 border-t-[#C87D55] bg-white/90 p-6 shadow-card`
            : isFloral
              ? `relative overflow-hidden rounded-[2.25rem] border border-[#D98DA2]/25 bg-white/90 p-6 shadow-soft`
              : `relative overflow-hidden rounded-[2rem] border p-6 shadow-card ${theme.cardBg}`;

  const buttonRadiusClass = isEditorial
    ? "rounded-none uppercase tracking-[0.14em]"
    : isRoyal || isJavanese
      ? "rounded-lg"
      : "rounded-full";

  const coupleTitleClass = isEditorial
    ? `font-display font-medium tracking-tight leading-[1.12] ${isEmbedded ? "text-3xl" : "text-4xl sm:text-5xl"}`
    : isRoyal
      ? `font-display font-semibold tracking-wide leading-[1.18] ${isEmbedded ? "text-3xl" : "text-4xl sm:text-5xl"}`
      : `font-script leading-[1.22] ${isEmbedded ? "text-4xl" : "text-5xl sm:text-6xl"}`;

  const renderSectionOrnaments = () => {
    if (isRoyal) return <RoyalCornerOrnaments />;
    if (isFloral) {
      return (
        <SakuraBranch className="pointer-events-none absolute -top-2 -right-3 h-24 w-28 opacity-65" />
      );
    }
    if (isJavanese) {
      return <KawungPatternBackdrop className="opacity-35" />;
    }
    if (isStarlight) {
      return <StarlightGlow className="opacity-50" />;
    }
    if (layout === "botanical") {
      return (
        <BotanicalCorner
          className="pointer-events-none absolute -top-4 -right-4 h-28 w-28 opacity-25"
          variant="sage"
        />
      );
    }
    return null;
  };

  const renderHeroPhoto = () => {
    if (!invitation.cover_photo_url) return null;

    if (isPolaroid) {
      return (
        <div className="relative mx-auto w-48 sm:w-56 pt-3">
          <PolaroidWashiTape className="absolute top-0.5 left-1/2 -translate-x-1/2 -rotate-2 z-10" />
          <div className="bg-white p-2.5 pb-7 shadow-lg border border-[#8B7765]/25 -rotate-1 transition-transform hover:rotate-0">
            <div className="aspect-[4/5] w-full overflow-hidden bg-[#EFECE4]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={invitation.cover_photo_url}
                alt={`${invitation.groom_name} & ${invitation.bride_name}`}
                className="h-full w-full object-cover"
              />
            </div>
            <p className="font-script text-xl text-[#4A3F36] mt-2.5 leading-none">
              {invitation.groom_name} &amp; {invitation.bride_name}
            </p>
          </div>
        </div>
      );
    }

    if (isEditorial) {
      return (
        <div className="mx-auto w-full max-w-[260px] border border-[#171717]/20 p-1.5 bg-white">
          <div className="aspect-[4/5] w-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={invitation.cover_photo_url}
              alt={`${invitation.groom_name} & ${invitation.bride_name}`}
              className="h-full w-full object-cover grayscale-[15%] contrast-[1.03]"
            />
          </div>
          <div className="flex items-center justify-between pt-1.5 px-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#6B665E]">
            <span>PORTRAIT</span>
            <span>{eventYear}</span>
          </div>
        </div>
      );
    }

    if (isJavanese) {
      return (
        <div className="mx-auto h-56 w-44 overflow-hidden rounded-t-full rounded-b-xl border-4 border-[#C69C4D]/55 p-1 bg-[#FBF6EC] shadow-soft">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={invitation.cover_photo_url}
            alt={`${invitation.groom_name} & ${invitation.bride_name}`}
            className="h-full w-full rounded-t-full rounded-b-lg object-cover"
          />
        </div>
      );
    }

    if (isRoyal) {
      return (
        <div className="mx-auto h-56 w-44 overflow-hidden rounded-md border-2 border-[#D4A359]/60 p-1.5 bg-white shadow-soft">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={invitation.cover_photo_url}
            alt={`${invitation.groom_name} & ${invitation.bride_name}`}
            className="h-full w-full rounded-sm object-cover"
          />
        </div>
      );
    }

    if (isFloral) {
      return (
        <div className="mx-auto h-56 w-44 overflow-hidden rounded-full border-4 border-[#F2CED8] p-1 bg-white shadow-soft">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={invitation.cover_photo_url}
            alt={`${invitation.groom_name} & ${invitation.bride_name}`}
            className="h-full w-full rounded-full object-cover"
          />
        </div>
      );
    }

    if (isStarlight) {
      return (
        <div className="mx-auto h-44 w-44 overflow-hidden rounded-full border-2 border-[#D4A359]/65 p-1 shadow-[0_0_28px_rgba(212,163,89,0.28)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={invitation.cover_photo_url}
            alt={`${invitation.groom_name} & ${invitation.bride_name}`}
            className="h-full w-full rounded-full object-cover"
          />
        </div>
      );
    }

    if (isBoho) {
      return (
        <div className="mx-auto h-56 w-44 overflow-hidden rounded-t-full rounded-b-2xl ring-2 ring-[#C87D55]/45 ring-offset-4 ring-offset-[#FDF6F2] shadow-soft">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={invitation.cover_photo_url}
            alt={`${invitation.groom_name} & ${invitation.bride_name}`}
            className="h-full w-full object-cover"
          />
        </div>
      );
    }

    // Default Botanical Arch
    return (
      <div className="mx-auto h-56 w-44 overflow-hidden rounded-[6rem] border-4 border-white/75 shadow-soft">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={invitation.cover_photo_url}
          alt={`${invitation.groom_name} & ${invitation.bride_name}`}
          className="h-full w-full object-cover"
        />
      </div>
    );
  };

  const renderCountdown = () => {
    if (!countdown) return null;
    const units = [
      { label: "Hari", value: countdown.days },
      { label: "Jam", value: countdown.hours },
      { label: "Menit", value: countdown.minutes },
      { label: "Detik", value: countdown.seconds },
    ];

    if (isEditorial) {
      return (
        <div className="grid grid-cols-4 divide-x divide-[#171717]/20 border-y border-[#171717]/20 py-3">
          {units.map((unit) => (
            <div key={unit.label} className="px-1 text-center">
              <p className="font-display text-2xl font-medium tabular-nums text-[#141414]">
                {String(unit.value).padStart(2, "0")}
              </p>
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#6B665E] mt-0.5">
                {unit.label}
              </p>
            </div>
          ))}
        </div>
      );
    }

    if (isFloral) {
      return (
        <div className="grid grid-cols-4 gap-2 pt-2">
          {units.map((unit) => (
            <div
              key={unit.label}
              className="aspect-square flex flex-col items-center justify-center rounded-full border border-[#D98DA2]/40 bg-[#FFF7F8] shadow-sm"
            >
              <p className={`font-display text-xl font-semibold tabular-nums ${theme.headingText}`}>
                {String(unit.value).padStart(2, "0")}
              </p>
              <p className={`text-[9px] font-semibold ${theme.mutedText}`}>
                {unit.label}
              </p>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-4 gap-2 pt-2">
        {units.map((unit) => (
          <div
            key={unit.label}
            className={`border py-2.5 px-1 ${theme.dividerColor} ${
              isStarlight
                ? "rounded-full bg-[#14201A]/75 border-[#D4A359]/30"
                : isPolaroid
                  ? "rounded-lg border-dashed bg-[#FBF7F0]"
                  : isRoyal || isJavanese
                    ? "rounded-lg bg-black/[0.025]"
                    : "rounded-2xl bg-black/[0.025]"
            }`}
          >
            <p
              className={`font-display text-xl sm:text-2xl font-semibold tabular-nums ${theme.headingText}`}
            >
              {String(unit.value).padStart(2, "0")}
            </p>
            <p className={`text-[10px] font-medium ${theme.mutedText}`}>
              {unit.label}
            </p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      className={`${
        isEmbedded
          ? !opened
            ? "h-full overflow-hidden"
            : "min-h-full"
          : "min-h-screen"
      } ${theme.pageBg} relative overflow-x-clip`}
    >
      {/* Tekstur latar halaman khas per tema */}
      {isJavanese && <KawungPatternBackdrop className="opacity-45" />}
      {isPolaroid && <DotPaperBackdrop className="opacity-65" />}
      {isStarlight && <StarlightGlow className="opacity-60" />}

      {/* Draft Preview Ribbon (hanya halaman publik) */}
      {!isEmbedded && isOwnerPreview && (
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
      {/* FULLSCREEN COVER GATE (AMPLOP PEMBUKA ADAPTIF PER TEMA)           */}
      {/* ================================================================= */}
      <AnimatePresence>
        {!opened && (
          <motion.div
            key="cover-gate"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -28 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{ backgroundColor: theme.coverFallbackBg }}
            className={`${
              isEmbedded
                ? "absolute inset-0 z-20 h-full px-5 py-6"
                : "fixed inset-0 z-40 px-6 py-8"
            } flex flex-col items-center overflow-y-auto text-center ${
              !isEmbedded && isOwnerPreview ? "pt-16" : ""
            } ${theme.coverBg} ${theme.coverText}`}
          >
            {/* Lapisan Latar & Ornamen (terisolasi agar tidak memicu scroll) */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 overflow-hidden"
            >
              {/* Cover Photo Backdrop (kecuali polaroid & editorial yang membingkai foto secara khusus) */}
              {invitation.cover_photo_url && !isPolaroid && !isEditorial && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={invitation.cover_photo_url}
                    alt="Cover Pernikahan"
                    className="absolute inset-0 h-full w-full object-cover opacity-35"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/30 to-black/75" />
                </>
              )}

              {/* Ornamen Cover Khusus Per Tema */}
              {isJavanese && <KawungPatternBackdrop className="opacity-40" />}
              {isRoyal && (
                <RoyalCornerOrnaments
                  className={`${
                    isEmbedded ? "inset-3.5" : "inset-5"
                  } text-[#D4A359]/80`}
                />
              )}
              {isStarlight && <StarlightGlow />}
              {isFloral && (
                <>
                  <SakuraBranch className="pointer-events-none absolute top-0 right-0 h-28 w-32 opacity-50" />
                  <SakuraBranch className="pointer-events-none absolute bottom-0 left-0 h-28 w-32 rotate-180 opacity-45" />
                </>
              )}
              {(layout === "botanical" || isBoho) && (
                <>
                  <BotanicalCorner
                    className="pointer-events-none absolute top-0 right-0 h-32 w-32 opacity-25"
                    variant="terracotta"
                  />
                  <BotanicalCorner
                    className="pointer-events-none absolute bottom-0 left-0 h-32 w-32 rotate-180 opacity-25"
                    variant="sage"
                  />
                </>
              )}
            </div>

            {/* Konten Cover Gate Sesuai Gaya Layout — my-auto memusatkan vertikal tanpa memotong bagian atas saat konten tinggi */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className={`relative z-10 my-auto w-full max-w-sm ${
                isEditorial
                  ? `${isEmbedded ? "space-y-3.5 p-4" : "space-y-5 p-5"} border border-white/25`
                  : isJavanese
                    ? `${isEmbedded ? "space-y-3 px-4 py-5" : "space-y-4 px-5 py-7"} rounded-t-[6rem] rounded-b-2xl border-2 border-[#C69C4D]/45 bg-black/20 backdrop-blur-[2px]`
                    : isEmbedded
                      ? "space-y-3.5"
                      : "space-y-5"
              }`}
            >
              {/* Masthead Editorial */}
              {isEditorial && (
                <div className="flex items-center justify-between border-b border-white/25 pb-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#D4CFC7]">
                  <span>{theme.coverEyebrow}</span>
                  <span>{eventYear}</span>
                </div>
              )}

              {/* Siluet Gunungan Jawa */}
              {isJavanese && (
                <JavaneseGunungan
                  className={`mx-auto ${
                    isEmbedded ? "h-14 w-14" : "h-20 w-20"
                  } text-[#D9B162]`}
                />
              )}

              {/* Monogram Crest Royal */}
              {isRoyal && (
                <div
                  className={`mx-auto flex ${
                    isEmbedded ? "h-12 w-12 text-base" : "h-16 w-16 text-lg"
                  } items-center justify-center rounded-full border-2 border-[#D4A359]/70 bg-[#D4A359]/10 font-display font-semibold tracking-wider text-[#F5E9D3]`}
                >
                  {initials}
                </div>
              )}

              {/* Foto Polaroid Miring di Cover */}
              {isPolaroid && (
                <div
                  className={`relative mx-auto ${
                    isEmbedded ? "w-36 pt-2" : "w-44 pt-2.5"
                  }`}
                >
                  <PolaroidWashiTape className="absolute top-0 left-1/2 -translate-x-1/2 -rotate-3 z-10" />
                  <div className="bg-[#FFFDF9] p-2 pb-4 text-[#332B24] shadow-2xl -rotate-2">
                    {invitation.cover_photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={invitation.cover_photo_url}
                        alt="Cover Polaroid"
                        className="aspect-square w-full object-cover"
                      />
                    ) : (
                      <div className="aspect-square w-full bg-[#EFE5D6] flex flex-col items-center justify-center gap-1 text-[#7B6D60]">
                        <Heart className="h-5 w-5 text-[#B4654A]" />
                        <span className="font-display text-lg font-semibold">
                          {initials}
                        </span>
                      </div>
                    )}
                    <p className="font-mono text-[9.5px] tracking-widest uppercase text-[#7B6D60] mt-1.5">
                      EST. {eventYear}
                    </p>
                  </div>
                </div>
              )}

              {/* Foto Editorial Berbingkai Persegi di Cover */}
              {isEditorial && invitation.cover_photo_url && (
                <div
                  className={`mx-auto ${
                    isEmbedded ? "w-28" : "w-36"
                  } overflow-hidden border border-white/30`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={invitation.cover_photo_url}
                    alt="Cover Editorial"
                    className="aspect-[3/4] w-full object-cover grayscale-[20%]"
                  />
                </div>
              )}

              {!isEditorial && (
                <p
                  className={`text-[10.5px] uppercase tracking-[0.24em] font-semibold ${theme.coverSubText}`}
                >
                  {theme.coverEyebrow}
                </p>
              )}

              <h1
                className={`${coupleTitleClass} ${
                  isEditorial ? "border-y border-white/25 py-2.5" : "py-0.5"
                }`}
              >
                {invitation.groom_name} &amp; {invitation.bride_name}
              </h1>

              {isBoho && <BohoSunDivider className="text-[#FAE9DF]" />}

              {primaryDate && (
                <p className={`text-xs sm:text-sm font-medium ${theme.coverSubText}`}>
                  {formatLongDateID(primaryDate)}
                </p>
              )}

              {guestNameParam && (
                <div
                  className={`mx-auto max-w-xs border ${
                    isEmbedded ? "px-3.5 py-2.5" : "px-4 py-3"
                  } backdrop-blur-md ${
                    isEditorial
                      ? "rounded-none border-white/25 bg-white/5"
                      : "rounded-2xl border-white/20 bg-white/10"
                  }`}
                >
                  <p className="text-[10px] opacity-80">
                    Kepada Yth. Bapak/Ibu/Saudara/i
                  </p>
                  <p className="font-display text-sm sm:text-base font-semibold mt-0.5">
                    {guestNameParam}
                  </p>
                </div>
              )}

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setOpened(true)}
                  className={`inline-flex items-center gap-2 ${
                    isEmbedded ? "px-5 py-2.5 text-xs" : "px-6 py-3 text-xs sm:text-sm"
                  } font-bold shadow-lift transition-transform hover:scale-105 active:scale-95 ${buttonRadiusClass} ${theme.coverBtn}`}
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
      {(!isEmbedded || opened) && (
      <div
        aria-hidden={!opened}
        className={`relative z-10 mx-auto max-w-xl ${
          isEmbedded ? "px-3.5 py-6 space-y-6" : "px-4 py-10 sm:py-14 space-y-8"
        } ${!opened ? "pointer-events-none select-none" : ""}`}
      >
        {/* 1. Hero & Countdown */}
        <section className={`${sectionCardClass} text-center space-y-4`}>
          {renderSectionOrnaments()}

          {isEditorial && (
            <div className="flex items-center justify-between border-b border-[#171717]/20 pb-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#6B665E]">
              <span>THE WEDDING EDITION</span>
              <span>{eventYear}</span>
            </div>
          )}

          {isJavanese && (
            <JavaneseGunungan className="mx-auto h-12 w-12 text-[#B6893B]" />
          )}

          {renderHeroPhoto()}

          <div className="relative z-10 space-y-1.5">
            {isRoyal ? (
              <p className="font-display text-sm font-bold tracking-[0.24em] uppercase text-[#B68635]">
                {initials}
              </p>
            ) : !isEditorial ? (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10.5px] font-semibold ${theme.badgeClass}`}
              >
                <Sparkles className="h-3 w-3" />
                Undangan Pernikahan
              </span>
            ) : null}

            <h2
              className={`${coupleTitleClass} pt-1 ${
                isEditorial ? theme.headingText : theme.accentText
              }`}
            >
              {invitation.groom_name} &amp; {invitation.bride_name}
            </h2>

            {primaryDate && (
              <p className={`text-xs sm:text-sm font-semibold ${theme.bodyText}`}>
                {formatLongDateID(primaryDate)}
              </p>
            )}
          </div>

          <div className="relative z-10">{renderCountdown()}</div>

          {calendarUrl && (
            <div className="relative z-10 pt-1">
              <a
                href={calendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 border px-5 py-2.5 text-xs font-bold transition-colors ${buttonRadiusClass} ${theme.outlineBtn}`}
              >
                <CalendarPlus className="h-4 w-4" />
                Simpan ke Google Calendar
              </a>
            </div>
          )}
        </section>

        {/* 2. Ayat / Kutipan Cinta */}
        {invitation.opening_quote && (
          <section className={`${sectionCardClass} text-center space-y-3`}>
            {isEditorial && (
              <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#6B665E]">
                NOTE &amp; BLESSING
              </p>
            )}
            <p
              className={`font-display italic text-sm leading-relaxed ${theme.bodyText}`}
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
        <section className={`${sectionCardClass} text-center space-y-5`}>
          {isRoyal && <RoyalCornerOrnaments />}
          <div className="relative z-10 space-y-1">
            <p
              className={`text-[10.5px] uppercase tracking-[0.22em] font-semibold ${theme.mutedText}`}
            >
              {theme.coupleGreeting}
            </p>
            <h3 className={`font-display text-xl sm:text-2xl font-semibold ${theme.headingText}`}>
              Mempelai Berbahagia
            </h3>
          </div>

          <div className="relative z-10 space-y-5">
            {/* Mempelai Pria */}
            <div className="space-y-1">
              <p
                className={`${
                  isEditorial
                    ? "font-display text-2xl font-semibold"
                    : "font-script text-4xl"
                } ${theme.accentText}`}
              >
                {invitation.groom_name}
              </p>
              {invitation.groom_full_name && (
                <p className={`font-display text-base sm:text-lg font-semibold ${theme.headingText}`}>
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

            {/* Pembatas Khas Tema */}
            {isBoho ? (
              <BohoSunDivider className={theme.accentText} />
            ) : isJavanese ? (
              <div className="flex items-center justify-center gap-3">
                <span className={`h-px w-12 border-t ${theme.dividerColor}`} />
                <JavaneseGunungan className="h-7 w-7 text-[#C69C4D]" />
                <span className={`h-px w-12 border-t ${theme.dividerColor}`} />
              </div>
            ) : isEditorial ? (
              <p className="font-display italic text-2xl text-[#8A7968]">&amp;</p>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <span className={`h-px w-14 border-t ${theme.dividerColor}`} />
                <Heart className={`h-4 w-4 ${theme.accentText}`} />
                <span className={`h-px w-14 border-t ${theme.dividerColor}`} />
              </div>
            )}

            {/* Mempelai Wanita */}
            <div className="space-y-1">
              <p
                className={`${
                  isEditorial
                    ? "font-display text-2xl font-semibold"
                    : "font-script text-4xl"
                } ${theme.accentText}`}
              >
                {invitation.bride_name}
              </p>
              {invitation.bride_full_name && (
                <p className={`font-display text-base sm:text-lg font-semibold ${theme.headingText}`}>
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
            <p
              className={`${
                isEditorial
                  ? "text-[10px] font-semibold uppercase tracking-[0.24em]"
                  : "font-script text-3xl"
              } ${theme.accentText}`}
            >
              Save The Date
            </p>
            <h3 className={`font-display text-xl sm:text-2xl font-semibold ${theme.headingText}`}>
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
                  className={`${
                    isPolaroid
                      ? "rounded-2xl border-2 border-dashed border-[#8B7765]/40 bg-[#FFFDF9] p-5 text-center space-y-2.5 shadow-sm"
                      : isEditorial
                        ? "border border-[#171717]/20 bg-white p-5 text-left space-y-2.5"
                        : `${sectionCardClass} text-center space-y-2.5`
                  }`}
                >
                  <span
                    className={`inline-block border px-3 py-1 text-[10.5px] font-bold ${
                      isEditorial ? "rounded-none" : "rounded-full"
                    } ${theme.badgeClass}`}
                  >
                    {ev.label}
                  </span>
                  {ev.date && (
                    <p
                      className={`font-display text-base sm:text-lg font-semibold flex items-center ${
                        isEditorial ? "justify-start" : "justify-center"
                      } gap-2 ${theme.headingText}`}
                    >
                      <Calendar className={`h-4 w-4 shrink-0 ${theme.accentText}`} />
                      {formatLongDateID(ev.date)}
                    </p>
                  )}
                  {ev.time && (
                    <p
                      className={`text-xs font-semibold flex items-center ${
                        isEditorial ? "justify-start" : "justify-center"
                      } gap-1.5 ${theme.bodyText}`}
                    >
                      <Clock className={`h-3.5 w-3.5 shrink-0 ${theme.accentText}`} />
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
                      className={`text-xs leading-relaxed ${
                        isEditorial ? "" : "max-w-sm mx-auto"
                      } ${theme.mutedText}`}
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
                        className={`inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold shadow-sm transition-transform hover:scale-105 ${buttonRadiusClass} ${theme.primaryBtn}`}
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
          <section className={`${sectionCardClass} space-y-5`}>
            <div className="text-center space-y-1">
              <p
                className={`${
                  isEditorial
                    ? "text-[10px] font-semibold uppercase tracking-[0.24em]"
                    : "font-script text-3xl"
                } ${theme.accentText}`}
              >
                Our Journey
              </p>
              <h3 className={`font-display text-xl sm:text-2xl font-semibold ${theme.headingText}`}>
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
                    className={`absolute -left-[7px] top-1 h-3 w-3 ${
                      isEditorial ? "rounded-none" : "rounded-full"
                    } ${theme.primaryBtn}`}
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
              <p
                className={`${
                  isEditorial
                    ? "text-[10px] font-semibold uppercase tracking-[0.24em]"
                    : "font-script text-3xl"
                } ${theme.accentText}`}
              >
                Moments
              </p>
              <h3 className={`font-display text-xl sm:text-2xl font-semibold ${theme.headingText}`}>
                Galeri Bahagia
              </h3>
            </div>

            <div
              className={`grid ${
                isEmbedded ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"
              } gap-3`}
            >
              {galleryUrls.map((url, idx) => (
                <button
                  key={`${url}-${idx}`}
                  type="button"
                  onClick={() => setLightboxUrl(url)}
                  className={
                    isPolaroid
                      ? `bg-white p-1.5 pb-5 border border-[#8B7765]/25 shadow-md transition-transform hover:scale-[1.03] ${
                          idx % 2 === 0 ? "-rotate-1" : "rotate-1"
                        }`
                      : `aspect-[4/5] overflow-hidden border border-white/40 shadow-sm transition-transform hover:scale-[1.02] ${
                          isEditorial
                            ? "rounded-none border-[#171717]/20"
                            : isRoyal || isJavanese
                              ? "rounded-lg border-[#D4A359]/35"
                              : "rounded-2xl"
                        }`
                  }
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Momen ${idx + 1}`}
                    className={`${
                      isPolaroid ? "aspect-[4/4]" : "h-full"
                    } w-full object-cover ${isEditorial ? "grayscale-[10%]" : ""}`}
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* 7. Amplop Digital (Wedding Gift) */}
        {invitation.show_gift &&
          (giftAccounts.length > 0 || invitation.gift_address) && (
            <section className={`${sectionCardClass} text-center space-y-4`}>
              <div className="space-y-1">
                <span
                  className={`mx-auto inline-flex h-10 w-10 items-center justify-center border ${
                    isEditorial ? "rounded-none" : "rounded-2xl"
                  } ${theme.badgeClass}`}
                >
                  <Gift className="h-4.5 w-4.5" />
                </span>
                <h3 className={`font-display text-xl sm:text-2xl font-semibold pt-1 ${theme.headingText}`}>
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
                    className={`flex items-center justify-between gap-2.5 border p-3.5 ${
                      isEditorial ? "rounded-none" : "rounded-2xl"
                    } ${theme.dividerColor} ${
                      theme.isDark ? "bg-white/5" : "bg-black/[0.02]"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className={`text-xs font-bold uppercase ${theme.accentText}`}>
                        {acc.bank}
                      </p>
                      <p
                        className={`font-mono text-sm sm:text-base font-bold tracking-wider mt-0.5 truncate ${theme.headingText}`}
                      >
                        {acc.accountNumber}
                      </p>
                      <p className={`text-xs truncate ${theme.mutedText}`}>
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
                      className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-bold shrink-0 transition-colors ${buttonRadiusClass} ${theme.outlineBtn}`}
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
                  className={`border p-3 text-xs ${
                    isEditorial ? "rounded-none" : "rounded-2xl"
                  } ${theme.dividerColor} ${theme.mutedText}`}
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
          <section className={`${sectionCardClass} space-y-5`}>
            <div className="text-center space-y-1">
              <p
                className={`${
                  isEditorial
                    ? "text-[10px] font-semibold uppercase tracking-[0.24em]"
                    : "font-script text-3xl"
                } ${theme.accentText}`}
              >
                Wishes &amp; RSVP
              </p>
              <h3 className={`font-display text-xl sm:text-2xl font-semibold ${theme.headingText}`}>
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
                className={`w-full border border-sage/20 bg-white px-3.5 py-2.5 text-sm text-sage-900 focus:outline-none focus:ring-2 focus:ring-sage/35 ${
                  isEditorial ? "rounded-none" : "rounded-xl"
                }`}
              />

              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { val: "HADIR", label: "Hadir" },
                    { val: "RAGU", label: "Ragu" },
                    { val: "TIDAK_HADIR", label: "Berhalangan" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setRsvpAttendance(opt.val)}
                    className={`border py-2 text-[11px] font-bold transition-all ${
                      isEditorial ? "rounded-none" : "rounded-xl"
                    } ${
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
                <div
                  className={`flex items-center justify-between gap-2 border border-sage/20 bg-white px-3.5 py-2 text-xs text-sage-800 ${
                    isEditorial ? "rounded-none" : "rounded-xl"
                  }`}
                >
                  <span className="font-semibold">Jumlah Tamu</span>
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
                className={`w-full border border-sage/20 bg-white px-3.5 py-2.5 text-sm text-sage-900 focus:outline-none focus:ring-2 focus:ring-sage/35 ${
                  isEditorial ? "rounded-none" : "rounded-xl"
                }`}
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
                className={`w-full inline-flex items-center justify-center gap-2 py-3 text-xs sm:text-sm font-bold shadow-sm transition-opacity disabled:opacity-50 ${buttonRadiusClass} ${theme.primaryBtn}`}
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
              <div className="space-y-2.5 pt-3 border-t border-current/10 max-h-72 overflow-y-auto pr-1">
                {rsvps.map((item) => (
                  <div
                    key={item.id}
                    className={`border p-3 space-y-1 ${
                      isEditorial ? "rounded-none" : "rounded-2xl"
                    } ${theme.dividerColor} ${
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
                            ? "Ragu"
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
          <p
            className={`${
              isEditorial
                ? "font-display text-2xl font-semibold"
                : "font-script text-4xl"
            } ${theme.accentText}`}
          >
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
      )}

      {/* Lightbox Foto Galeri */}
      {lightboxUrl && (
        <div
          className={`${
            isEmbedded ? "absolute" : "fixed"
          } inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm`}
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
            className="max-h-[85%] max-w-full rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
