import {
  CalendarClock,
  Coins,
  FileSpreadsheet,
  Gift,
  HeartHandshake,
  MailOpen,
  Plane,
  Receipt,
  Users,
  WifiOff,
} from "lucide-react";

const ITEMS = [
  { icon: CalendarClock, label: "Termin DP & Pelunasan" },
  { icon: MailOpen, label: "Undangan Online Sendiri + RSVP" },
  { icon: HeartHandshake, label: "Split Funding Keluarga" },
  { icon: Gift, label: "Angpao → Dompet Honeymoon" },
  { icon: WifiOff, label: "Offline-First PWA" },
  { icon: Coins, label: "Multi Mata Uang" },
  { icon: Users, label: "Sinkron Real-time Berdua" },
  { icon: Receipt, label: "Simpan Bukti Bayar" },
  { icon: FileSpreadsheet, label: "Ekspor PDF & Excel" },
  { icon: Plane, label: "Checklist Bulan Madu" },
];

/**
 * Strip chip fitur yang bergulir tanpa henti (CSS-only), dengan fade di kedua tepi.
 */
export function FeatureMarquee() {
  const loop = [...ITEMS, ...ITEMS];
  return (
    <div className="relative border-y border-sage/10 bg-white/40 py-4 backdrop-blur-sm">
      <div className="mask-fade-x overflow-hidden">
        <ul className="flex w-max animate-marquee gap-3 hover:[animation-play-state:paused]">
          {loop.map((item, idx) => {
            const Icon = item.icon;
            return (
              <li
                key={`${item.label}-${idx}`}
                aria-hidden={idx >= ITEMS.length ? true : undefined}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-sage/10 bg-white/80 px-4 py-2 text-sm font-semibold text-sage-800 shadow-sm"
              >
                <Icon className="h-4 w-4 text-terracotta" />
                {item.label}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
