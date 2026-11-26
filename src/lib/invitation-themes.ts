import type { InvitationTheme } from "@/types/database";

export interface InvitationThemeConfig {
  id: InvitationTheme;
  name: string;
  tagline: string;
  swatches: [string, string, string];
  /** Background halaman undangan publik */
  pageBg: string;
  /** Cover fullscreen */
  coverBg: string;
  coverFallbackBg: string;
  coverText: string;
  coverSubText: string;
  coverBtn: string;
  /** Kartu konten */
  cardBg: string;
  /** Warna heading & aksen */
  headingText: string;
  bodyText: string;
  mutedText: string;
  accentText: string;
  /** Badge & tombol */
  badgeClass: string;
  primaryBtn: string;
  outlineBtn: string;
  dividerColor: string;
  isDark: boolean;
}

export const INVITATION_THEMES: Record<InvitationTheme, InvitationThemeConfig> = {
  BOTANICAL_SAGE: {
    id: "BOTANICAL_SAGE",
    name: "Botanical Sage",
    tagline: "Hangat, natural, bernuansa krem & daun sage khas NikahPlan",
    swatches: ["#F7F5F0", "#3D5245", "#C87D55"],
    pageBg: "bg-[#F7F5F0] text-[#26342B]",
    coverBg: "bg-gradient-to-b from-[#26342B] via-[#3D5245] to-[#1D2821]",
    coverFallbackBg: "#26342B",
    coverText: "text-[#FCFBF9]",
    coverSubText: "text-[#E3EBE6]",
    coverBtn: "bg-[#FCFBF9] text-[#26342B] hover:bg-[#E3EBE6]",
    cardBg: "bg-white/85 border-[#3D5245]/12 backdrop-blur-md",
    headingText: "text-[#1D2821]",
    bodyText: "text-[#314237]",
    mutedText: "text-[#537662]",
    accentText: "text-[#C87D55]",
    badgeClass: "bg-[#E3EBE6] text-[#26342B] border-[#3D5245]/15",
    primaryBtn: "bg-[#3D5245] text-[#FCFBF9] hover:bg-[#314237]",
    outlineBtn: "border-[#3D5245]/25 text-[#26342B] hover:bg-[#E3EBE6]/60",
    dividerColor: "border-[#3D5245]/12",
    isDark: false,
  },
  WARM_TERRACOTTA: {
    id: "WARM_TERRACOTTA",
    name: "Warm Terracotta",
    tagline: "Romantis bergaya sunset terracotta & linen lembut",
    swatches: ["#FDF6F2", "#C87D55", "#784229"],
    pageBg: "bg-[#FDF6F2] text-[#4A2918]",
    coverBg: "bg-gradient-to-b from-[#623723] via-[#935131] to-[#4A2918]",
    coverFallbackBg: "#623723",
    coverText: "text-[#FDF6F2]",
    coverSubText: "text-[#FAE9DF]",
    coverBtn: "bg-[#FDF6F2] text-[#623723] hover:bg-[#FAE9DF]",
    cardBg: "bg-white/90 border-[#C87D55]/20 backdrop-blur-md",
    headingText: "text-[#623723]",
    bodyText: "text-[#784229]",
    mutedText: "text-[#935131]/80",
    accentText: "text-[#C87D55]",
    badgeClass: "bg-[#FAE9DF] text-[#784229] border-[#C87D55]/25",
    primaryBtn: "bg-[#C87D55] text-white hover:bg-[#B2663F]",
    outlineBtn: "border-[#C87D55]/30 text-[#784229] hover:bg-[#FAE9DF]/70",
    dividerColor: "border-[#C87D55]/15",
    isDark: false,
  },
  CLASSIC_GOLD: {
    id: "CLASSIC_GOLD",
    name: "Classic Ivory Gold",
    tagline: "Mewah & timeless bernuansa gading dan emas champagne",
    swatches: ["#FCFBF7", "#B68635", "#3A2F1D"],
    pageBg: "bg-[#FCFBF7] text-[#3A2F1D]",
    coverBg: "bg-gradient-to-b from-[#2D2416] via-[#473822] to-[#1F190F]",
    coverFallbackBg: "#2D2416",
    coverText: "text-[#FCFBF7]",
    coverSubText: "text-[#F5E9D3]",
    coverBtn: "bg-[#D4A359] text-[#1F190F] hover:bg-[#E0B56E]",
    cardBg: "bg-white/90 border-[#D4A359]/25 backdrop-blur-md",
    headingText: "text-[#2D2416]",
    bodyText: "text-[#4A3B24]",
    mutedText: "text-[#7D6641]",
    accentText: "text-[#B68635]",
    badgeClass: "bg-[#F5E9D3] text-[#4A3B24] border-[#D4A359]/35",
    primaryBtn: "bg-[#B68635] text-white hover:bg-[#996F29]",
    outlineBtn: "border-[#D4A359]/40 text-[#4A3B24] hover:bg-[#F5E9D3]/60",
    dividerColor: "border-[#D4A359]/20",
    isDark: false,
  },
  MIDNIGHT_GARDEN: {
    id: "MIDNIGHT_GARDEN",
    name: "Midnight Garden",
    tagline: "Elegan dramatis malam hari dengan emerald gelap & aksen emas",
    swatches: ["#14201A", "#1F3329", "#D4A359"],
    pageBg: "bg-[#14201A] text-[#F7F5F0]",
    coverBg: "bg-gradient-to-b from-[#0C1410] via-[#182820] to-[#0C1410]",
    coverFallbackBg: "#0C1410",
    coverText: "text-[#FCFBF9]",
    coverSubText: "text-[#C5D6CC]",
    coverBtn: "bg-[#D4A359] text-[#14201A] hover:bg-[#E0B56E]",
    cardBg: "bg-[#1D2E25]/85 border-[#D4A359]/20 backdrop-blur-md",
    headingText: "text-[#FCFBF9]",
    bodyText: "text-[#E3EBE6]",
    mutedText: "text-[#9EB9A9]",
    accentText: "text-[#D4A359]",
    badgeClass: "bg-[#D4A359]/15 text-[#F5E9D3] border-[#D4A359]/30",
    primaryBtn: "bg-[#D4A359] text-[#14201A] hover:bg-[#E0B56E]",
    outlineBtn: "border-[#D4A359]/35 text-[#F5E9D3] hover:bg-[#D4A359]/15",
    dividerColor: "border-[#D4A359]/15",
    isDark: true,
  },
};

export const INVITATION_THEME_LIST = Object.values(INVITATION_THEMES);

export const DEFAULT_OPENING_QUOTE =
  "Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan hidup dari jenismu sendiri supaya kamu merasa tenteram kepadanya, dan dijadikan-Nya di antaramu rasa kasih dan sayang.";

export const DEFAULT_QUOTE_SOURCE = "QS. Ar-Rum: 21";

export const DEFAULT_CLOSING_MESSAGE =
  "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu kepada kami.";

export function slugifyInvitation(input: string): string {
  const cleaned = input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " dan ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56);
  return cleaned || "undangan-kami";
}

/**
 * Memisahkan nama pasangan seperti "Andi & Rina" menjadi [groomName, brideName]
 * untuk pre-fill otomatis saat pertama kali membuka builder.
 */
export function splitCoupleNames(coupleTitle: string): [string, string] {
  const parts = coupleTitle
    .split(/&|\bdan\b|\+/i)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) return [parts[0], parts[1]];
  if (parts.length === 1) return [parts[0], "Pasangan"];
  return ["Mempelai Pria", "Mempelai Wanita"];
}

/**
 * Menghasilkan URL Google Calendar siap klik dari tanggal, judul, dan lokasi.
 */
export function buildGoogleCalendarUrl(params: {
  title: string;
  dateStr: string | null;
  details: string;
  location: string;
}): string | null {
  if (!params.dateStr) return null;
  const clean = params.dateStr.replace(/-/g, "");
  if (clean.length !== 8) return null;
  const start = `${clean}T020000Z`; // 09:00 WIB
  const end = `${clean}T070000Z`; // 14:00 WIB
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: params.title,
    dates: `${start}/${end}`,
    details: params.details,
    location: params.location,
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

/**
 * Menghasilkan pesan undangan WhatsApp yang sopan & personal untuk tiap tamu.
 */
export function buildGuestWhatsAppMessage(params: {
  guestName: string;
  coupleLabel: string;
  invitationUrl: string;
}): string {
  return [
    `Kepada Yth. Bapak/Ibu/Saudara/i *${params.guestName}*,`,
    "",
    `Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara pernikahan kami *${params.coupleLabel}*.`,
    "",
    "Berikut tautan undangan digital kami untuk info lengkap acara & konfirmasi kehadiran:",
    params.invitationUrl,
    "",
    "Merupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu. Terima kasih banyak!",
  ].join("\n");
}
