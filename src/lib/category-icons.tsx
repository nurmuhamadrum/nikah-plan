import {
  UtensilsCrossed,
  Flower2,
  Camera,
  Shirt,
  Gift,
  ShieldAlert,
  Plane,
  Hotel,
  FileCheck2,
  Sparkles,
  Music,
  Gem,
  Heart,
  Wallet,
  Car,
  Mail,
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_ICON_OPTIONS: {
  key: string;
  label: string;
  icon: LucideIcon;
  bgClass: string;
  textClass: string;
}[] = [
  {
    key: "utensils",
    label: "Katering & Venue",
    icon: UtensilsCrossed,
    bgClass: "bg-sage-50",
    textClass: "text-sage",
  },
  {
    key: "flower",
    label: "Dekorasi",
    icon: Flower2,
    bgClass: "bg-terracotta-50",
    textClass: "text-terracotta",
  },
  {
    key: "camera",
    label: "Dokumentasi",
    icon: Camera,
    bgClass: "bg-cream-200",
    textClass: "text-sage-800",
  },
  {
    key: "shirt",
    label: "Busana & MUA",
    icon: Shirt,
    bgClass: "bg-amberwarm-light",
    textClass: "text-sage-900",
  },
  {
    key: "gift",
    label: "Seserahan & Mahar",
    icon: Gift,
    bgClass: "bg-terracotta-50",
    textClass: "text-terracotta-600",
  },
  {
    key: "shield",
    label: "Dana Darurat",
    icon: ShieldAlert,
    bgClass: "bg-sage-50",
    textClass: "text-sage-700",
  },
  {
    key: "gem",
    label: "Cincin & Perhiasan",
    icon: Gem,
    bgClass: "bg-amberwarm-light",
    textClass: "text-terracotta-700",
  },
  {
    key: "music",
    label: "Hiburan & MC",
    icon: Music,
    bgClass: "bg-cream-200",
    textClass: "text-sage-700",
  },
  {
    key: "mail",
    label: "Undangan & Souvenir",
    icon: Mail,
    bgClass: "bg-terracotta-50",
    textClass: "text-terracotta-700",
  },
  {
    key: "car",
    label: "Transportasi",
    icon: Car,
    bgClass: "bg-sage-50",
    textClass: "text-sage-800",
  },
  {
    key: "sparkles",
    label: "Make Up & Riasan",
    icon: Sparkles,
    bgClass: "bg-amberwarm-light",
    textClass: "text-terracotta-700",
  },
  {
    key: "plane",
    label: "Tiket & Transport",
    icon: Plane,
    bgClass: "bg-sage-50",
    textClass: "text-sage",
  },
  {
    key: "hotel",
    label: "Akomodasi",
    icon: Hotel,
    bgClass: "bg-terracotta-50",
    textClass: "text-terracotta",
  },
  {
    key: "file",
    label: "Dokumen & Visa",
    icon: FileCheck2,
    bgClass: "bg-cream-200",
    textClass: "text-sage-800",
  },
  {
    key: "heart",
    label: "Lainnya",
    icon: Heart,
    bgClass: "bg-sage-50",
    textClass: "text-sage-700",
  },
];

export function getCategoryIconMeta(key: string | null | undefined) {
  return (
    CATEGORY_ICON_OPTIONS.find((opt) => opt.key === key) ?? {
      key: "wallet",
      label: "Kategori",
      icon: Wallet,
      bgClass: "bg-sage-50",
      textClass: "text-sage",
    }
  );
}

export function CategoryIconBadge({
  iconKey,
  className = "h-10 w-10",
}: {
  iconKey?: string | null;
  className?: string;
}) {
  const meta = getCategoryIconMeta(iconKey);
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl shrink-0 ${meta.bgClass} ${meta.textClass} ${className}`}
    >
      <Icon className="h-5 w-5" />
    </span>
  );
}

export const FUNDING_SOURCE_META = {
  JOINT: {
    label: "Bersama",
    fullLabel: "Tabungan Bersama",
    color: "#3D5245",
    badgeClass: "bg-sage-50 text-sage-800 border-sage/20",
  },
  GROOM_FAMILY: {
    label: "Pria",
    fullLabel: "Pihak Pria",
    color: "#C87D55",
    badgeClass: "bg-terracotta-50 text-terracotta-800 border-terracotta/25",
  },
  BRIDE_FAMILY: {
    label: "Wanita",
    fullLabel: "Pihak Wanita",
    color: "#D4A359",
    badgeClass: "bg-amberwarm-light text-sage-900 border-amberwarm/40",
  },
  ANGPAO: {
    label: "Angpao",
    fullLabel: "Dana Angpao",
    color: "#729682",
    badgeClass: "bg-sage-100 text-sage-800 border-sage/25",
  },
} as const;

export { Sparkles };
