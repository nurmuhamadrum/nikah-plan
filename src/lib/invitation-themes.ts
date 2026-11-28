import type { InvitationTheme } from "@/types/database";

export type InvitationLayoutStyle =
  | "botanical"
  | "boho"
  | "royal"
  | "starlight"
  | "editorial"
  | "javanese"
  | "polaroid"
  | "floral";

export interface InvitationThemeConfig {
  id: InvitationTheme;
  name: string;
  /** Label singkat karakter layout (bukan sekadar warna) */
  styleLabel: string;
  tagline: string;
  swatches: [string, string, string];
  layoutStyle: InvitationLayoutStyle;
  /** Teks pembuka khas tiap tema di atas nama mempelai pada Cover */
  coverEyebrow: string;
  /** Sapaan/judul seksi mempelai */
  coupleGreeting: string;
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
    styleLabel: "Organic Arch",
    tagline: "Kartu organik lembut, bingkai kubah arch & ornamen daun sage",
    swatches: ["#F7F5F0", "#3D5245", "#C87D55"],
    layoutStyle: "botanical",
    coverEyebrow: "The Wedding Of",
    coupleGreeting: "Assalamu'alaikum Wr. Wb.",
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
  MINIMAL_EDITORIAL: {
    id: "MINIMAL_EDITORIAL",
    name: "Editorial Magazine",
    styleLabel: "Majalah Vogue",
    tagline: "Gaya majalah cetak minimalis: garis tegas, masthead & foto tajam",
    swatches: ["#FAF9F6", "#171717", "#8A7968"],
    layoutStyle: "editorial",
    coverEyebrow: "VOL. 01 · THE WEDDING ISSUE",
    coupleGreeting: "THE COUPLE",
    pageBg: "bg-[#FAF9F6] text-[#171717]",
    coverBg: "bg-[#141414]",
    coverFallbackBg: "#141414",
    coverText: "text-[#FAF9F6]",
    coverSubText: "text-[#D4CFC7]",
    coverBtn:
      "bg-[#FAF9F6] text-[#141414] hover:bg-[#E7E2D9] rounded-none tracking-[0.18em] uppercase",
    cardBg: "bg-transparent border-[#171717]/20",
    headingText: "text-[#141414]",
    bodyText: "text-[#2E2E2E]",
    mutedText: "text-[#6B665E]",
    accentText: "text-[#8A7968]",
    badgeClass:
      "bg-transparent text-[#141414] border-[#141414]/35 uppercase tracking-[0.18em]",
    primaryBtn: "bg-[#141414] text-[#FAF9F6] hover:bg-[#2E2E2E]",
    outlineBtn: "border-[#141414]/40 text-[#141414] hover:bg-[#141414]/5",
    dividerColor: "border-[#141414]/20",
    isDark: false,
  },
  JAVANESE_HERITAGE: {
    id: "JAVANESE_HERITAGE",
    name: "Javanese Heritage",
    styleLabel: "Adat Jawa & Gunungan",
    tagline: "Ornamen Gunungan Jawa, tekstur Batik Kawung & bingkai keraton emas",
    swatches: ["#1E1711", "#C69C4D", "#F6EFE4"],
    layoutStyle: "javanese",
    coverEyebrow: "Ngaturaken Sugeng Rawuh",
    coupleGreeting: "Assalamu'alaikum Wr. Wb.",
    pageBg: "bg-[#F6EFE4] text-[#2A1F16]",
    coverBg: "bg-gradient-to-b from-[#1A130D] via-[#2B1F14] to-[#140E09]",
    coverFallbackBg: "#1A130D",
    coverText: "text-[#FBF5E9]",
    coverSubText: "text-[#E6D3B3]",
    coverBtn: "bg-[#C69C4D] text-[#1A130D] hover:bg-[#D9B162]",
    cardBg: "bg-[#FBF6EC]/95 border-[#B6893B]/35",
    headingText: "text-[#2A1F16]",
    bodyText: "text-[#473424]",
    mutedText: "text-[#7A5E43]",
    accentText: "text-[#A87A2B]",
    badgeClass: "bg-[#EFE1C6] text-[#3B2A1A] border-[#C69C4D]/45",
    primaryBtn: "bg-[#3B2A1A] text-[#FBF5E9] hover:bg-[#2A1F16]",
    outlineBtn: "border-[#B6893B]/45 text-[#3B2A1A] hover:bg-[#EFE1C6]/70",
    dividerColor: "border-[#C69C4D]/35",
    isDark: false,
  },
  POLAROID_SCRAPBOOK: {
    id: "POLAROID_SCRAPBOOK",
    name: "Polaroid Scrapbook",
    styleLabel: "Album Kenangan",
    tagline: "Kertas catatan titik, bingkai Polaroid miring, washi tape & tiket acara",
    swatches: ["#FBF7F0", "#B4654A", "#4A5D52"],
    layoutStyle: "polaroid",
    coverEyebrow: "A Love Story Worth Remembering",
    coupleGreeting: "Meet The Happy Couple",
    pageBg: "bg-[#FBF7F0] text-[#332B24]",
    coverBg: "bg-gradient-to-b from-[#3E352E] via-[#4D4239] to-[#2F2721]",
    coverFallbackBg: "#3E352E",
    coverText: "text-[#FBF7F0]",
    coverSubText: "text-[#E7DDD0]",
    coverBtn: "bg-[#FBF7F0] text-[#332B24] hover:bg-[#EFE5D6]",
    cardBg: "bg-[#FFFDF9] border-[#8B7765]/25",
    headingText: "text-[#2E2620]",
    bodyText: "text-[#4A3F36]",
    mutedText: "text-[#7B6D60]",
    accentText: "text-[#B4654A]",
    badgeClass: "bg-[#F5E6DC] text-[#7D3F2A] border-[#B4654A]/30",
    primaryBtn: "bg-[#B4654A] text-[#FFFDF9] hover:bg-[#99523A]",
    outlineBtn: "border-[#8B7765]/35 text-[#332B24] hover:bg-[#F3EAE0]",
    dividerColor: "border-[#8B7765]/25",
    isDark: false,
  },
  SAKURA_BLUSH: {
    id: "SAKURA_BLUSH",
    name: "Sakura Blush",
    styleLabel: "Floral Pastel",
    tagline: "Ranting bunga sakura, foto oval medallion & countdown medali pastel",
    swatches: ["#FFF7F8", "#B85D75", "#F2CED8"],
    layoutStyle: "floral",
    coverEyebrow: "With Love & Joy",
    coupleGreeting: "Assalamu'alaikum Wr. Wb.",
    pageBg: "bg-[#FFF7F8] text-[#452430]",
    coverBg: "bg-gradient-to-b from-[#6B3345] via-[#8A445A] to-[#4F2231]",
    coverFallbackBg: "#6B3345",
    coverText: "text-[#FFF9FA]",
    coverSubText: "text-[#FCE4EB]",
    coverBtn: "bg-[#FFF9FA] text-[#6B3345] hover:bg-[#FCE4EB]",
    cardBg: "bg-white/90 border-[#D98DA2]/25 backdrop-blur-md",
    headingText: "text-[#4A2230]",
    bodyText: "text-[#633344]",
    mutedText: "text-[#946072]",
    accentText: "text-[#B85D75]",
    badgeClass: "bg-[#FCECEF] text-[#7D364B] border-[#D98DA2]/35",
    primaryBtn: "bg-[#B85D75] text-white hover:bg-[#9E4A61]",
    outlineBtn: "border-[#D98DA2]/45 text-[#6B3345] hover:bg-[#FCECEF]",
    dividerColor: "border-[#D98DA2]/25",
    isDark: false,
  },
  CLASSIC_GOLD: {
    id: "CLASSIC_GOLD",
    name: "Classic Ivory Gold",
    styleLabel: "Royal Double-Frame",
    tagline: "Bingkai ganda art-deco emas 4 penjuru & monogram inisial mempelai",
    swatches: ["#FCFBF7", "#B68635", "#3A2F1D"],
    layoutStyle: "royal",
    coverEyebrow: "The Royal Wedding",
    coupleGreeting: "Assalamu'alaikum Wr. Wb.",
    pageBg: "bg-[#FCFBF7] text-[#3A2F1D]",
    coverBg: "bg-gradient-to-b from-[#2D2416] via-[#473822] to-[#1F190F]",
    coverFallbackBg: "#2D2416",
    coverText: "text-[#FCFBF7]",
    coverSubText: "text-[#F5E9D3]",
    coverBtn: "bg-[#D4A359] text-[#1F190F] hover:bg-[#E0B56E]",
    cardBg: "bg-white/90 border-[#D4A359]/35 backdrop-blur-md",
    headingText: "text-[#2D2416]",
    bodyText: "text-[#4A3B24]",
    mutedText: "text-[#7D6641]",
    accentText: "text-[#B68635]",
    badgeClass: "bg-[#F5E9D3] text-[#4A3B24] border-[#D4A359]/35",
    primaryBtn: "bg-[#B68635] text-white hover:bg-[#996F29]",
    outlineBtn: "border-[#D4A359]/40 text-[#4A3B24] hover:bg-[#F5E9D3]/60",
    dividerColor: "border-[#D4A359]/25",
    isDark: false,
  },
  WARM_TERRACOTTA: {
    id: "WARM_TERRACOTTA",
    name: "Warm Terracotta",
    styleLabel: "Boho Sunset",
    tagline: "Bingkai kubah boho ganda, aksen garis atas & nuansa linen sunset",
    swatches: ["#FDF6F2", "#C87D55", "#784229"],
    layoutStyle: "boho",
    coverEyebrow: "Together Forever",
    coupleGreeting: "Assalamu'alaikum Wr. Wb.",
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
  MIDNIGHT_GARDEN: {
    id: "MIDNIGHT_GARDEN",
    name: "Midnight Garden",
    styleLabel: "Starlight Night",
    tagline: "Tema malam dramatis berpendar bintang, foto lingkaran & glass gelap",
    swatches: ["#14201A", "#1F3329", "#D4A359"],
    layoutStyle: "starlight",
    coverEyebrow: "Under The Starlight",
    coupleGreeting: "Assalamu'alaikum Wr. Wb.",
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
 * Mengambil monogram inisial mempelai (contoh: "Nur" & "Agnelisa" -> "N & A").
 */
export function getCoupleInitials(groomName: string, brideName: string): string {
  const g = groomName.trim().charAt(0).toUpperCase() || "A";
  const b = brideName.trim().charAt(0).toUpperCase() || "B";
  return `${g} & ${b}`;
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

export type WhatsAppTemplateId = "FORMAL" | "ISLAMI" | "SANTAI";

export interface WhatsAppTemplatePreset {
  id: WhatsAppTemplateId;
  label: string;
  description: string;
  body: string;
}

export const WA_MESSAGE_TEMPLATES: WhatsAppTemplatePreset[] = [
  {
    id: "FORMAL",
    label: "Formal Sopan",
    description: "Cocok untuk keluarga besar, kolega, & tamu VIP",
    body: [
      "Kepada Yth. Bapak/Ibu/Saudara/i *{nama}*,",
      "",
      "Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara pernikahan kami *{mempelai}*.",
      "",
      "Berikut tautan undangan digital kami untuk informasi lengkap acara & konfirmasi kehadiran:",
      "{link}",
      "",
      "Merupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu. Terima kasih banyak!",
    ].join("\n"),
  },
  {
    id: "ISLAMI",
    label: "Islami",
    description: "Dengan salam & doa penuh berkah",
    body: [
      "Assalamu'alaikum Wr. Wb.",
      "Kepada Yth. Bapak/Ibu/Saudara/i *{nama}*,",
      "",
      "Dengan memohon rahmat dan ridho Allah SWT, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara pernikahan kami *{mempelai}*.",
      "",
      "Informasi lengkap acara & konfirmasi kehadiran dapat diakses melalui tautan berikut:",
      "{link}",
      "",
      "Kehadiran serta doa restu Bapak/Ibu/Saudara/i merupakan kebahagiaan yang tak ternilai bagi kami.",
      "Wassalamu'alaikum Wr. Wb.",
    ].join("\n"),
  },
  {
    id: "SANTAI",
    label: "Santai & Akrab",
    description: "Hangat untuk sahabat, teman kuliah, & rekan dekat",
    body: [
      "Halo *{nama}*! 👋",
      "",
      "Kabar bahagia nih — kami *{mempelai}* akan segera menikah! Senang banget kalau kamu bisa ikut hadir dan merayakan hari spesial kami.",
      "",
      "Detail jadwal, lokasi, & RSVP-nya bisa langsung dicek di sini ya:",
      "{link}",
      "",
      "Ditunggu banget kehadirannya & doa terbaiknya. Sampai ketemu di hari H! 🤍",
    ].join("\n"),
  },
];

/**
 * Menormalisasi nomor HP Indonesia ke format internasional WhatsApp (contoh: 0812-3456-7890 -> 6281234567890).
 */
export function normalizeWhatsAppPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.length < 8 || digits.length > 16) return null;
  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }
  if (digits.startsWith("8")) {
    return `62${digits}`;
  }
  return digits;
}

/**
 * Mengisi variabel {nama}, {mempelai}, {link} pada template pesan WhatsApp.
 */
export function renderGuestWhatsAppMessage(
  template: string,
  params: {
    guestName: string;
    coupleLabel: string;
    invitationUrl: string;
  }
): string {
  return template
    .replace(/\{nama\}/gi, params.guestName)
    .replace(/\{mempelai\}/gi, params.coupleLabel)
    .replace(/\{link\}/gi, params.invitationUrl);
}

/**
 * Menghasilkan pesan undangan WhatsApp yang sopan & personal untuk tiap tamu.
 */
export function buildGuestWhatsAppMessage(params: {
  guestName: string;
  coupleLabel: string;
  invitationUrl: string;
}): string {
  return renderGuestWhatsAppMessage(WA_MESSAGE_TEMPLATES[0].body, params);
}
