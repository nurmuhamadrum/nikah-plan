import { cn } from "@/lib/utils";

/**
 * Siluet Gunungan Jawa klasik untuk tema JAVANESE_HERITAGE.
 */
export function JavaneseGunungan({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("pointer-events-none select-none", className)}
      aria-hidden="true"
    >
      <path
        d="M60 6C44 30 22 58 18 96C16 112 24 124 38 128H82C96 124 104 112 102 96C98 58 76 30 60 6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="currentColor"
        fillOpacity="0.1"
      />
      <path
        d="M60 18C48 38 30 62 28 94C27 107 34 116 44 120H76C86 116 93 107 92 94C90 62 72 38 60 18Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeDasharray="3 2"
      />
      {/* Pohon Hayat di tengah Gunungan */}
      <path
        d="M60 32V118M60 54C50 48 44 48 39 53M60 54C70 48 76 48 81 53M60 74C46 68 38 72 34 80M60 74C74 68 82 72 86 80M60 94C48 92 42 98 40 106M60 94C72 92 78 98 80 106"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="60" cy="30" r="3" fill="currentColor" />
      <path
        d="M28 134H92"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Tekstur motif Batik Kawung halus untuk latar belakang tema JAVANESE_HERITAGE.
 */
export function KawungPatternBackdrop({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      style={{
        backgroundImage:
          "radial-gradient(circle at 0 0, rgba(198,156,77,0.14) 22%, transparent 23%), radial-gradient(circle at 100% 0, rgba(198,156,77,0.14) 22%, transparent 23%), radial-gradient(circle at 0 100%, rgba(198,156,77,0.14) 22%, transparent 23%), radial-gradient(circle at 100% 100%, rgba(198,156,77,0.14) 22%, transparent 23%)",
        backgroundSize: "34px 34px",
      }}
    />
  );
}

/**
 * Ornamen 4 sudut Art-Deco / Royal Double-Frame untuk tema CLASSIC_GOLD.
 */
export function RoyalCornerOrnaments({
  className,
}: {
  className?: string;
}) {
  const cornerSvg = (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-7 w-7"
      aria-hidden="true"
    >
      <path
        d="M2 38V6C2 3.8 3.8 2 6 2H38"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M8 32V10C8 8.9 8.9 8 10 8H32"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.7"
      />
      <rect
        x="11"
        y="11"
        width="4"
        height="4"
        transform="rotate(45 13 13)"
        fill="currentColor"
      />
    </svg>
  );

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-3 text-[#C89B45]/75",
        className
      )}
    >
      <span className="absolute top-0 left-0">{cornerSvg}</span>
      <span className="absolute top-0 right-0 rotate-90">{cornerSvg}</span>
      <span className="absolute bottom-0 right-0 rotate-180">{cornerSvg}</span>
      <span className="absolute bottom-0 left-0 -rotate-90">{cornerSvg}</span>
    </div>
  );
}

/**
 * Ranting & kelopak bunga Sakura pastel untuk tema SAKURA_BLUSH.
 */
export function SakuraBranch({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 140 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("pointer-events-none select-none", className)}
      aria-hidden="true"
    >
      <path
        d="M135 8C105 22 76 42 42 74C30 85 18 96 8 108"
        stroke="#B85D75"
        strokeOpacity="0.45"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M94 31C84 22 74 18 60 18"
        stroke="#B85D75"
        strokeOpacity="0.4"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Bunga 1 */}
      <g transform="translate(88 30)">
        <circle cx="0" cy="-7" r="5" fill="#F2B8C6" fillOpacity="0.7" />
        <circle cx="7" cy="-2" r="5" fill="#F2B8C6" fillOpacity="0.7" />
        <circle cx="4" cy="6" r="5" fill="#F2B8C6" fillOpacity="0.7" />
        <circle cx="-4" cy="6" r="5" fill="#F2B8C6" fillOpacity="0.7" />
        <circle cx="-7" cy="-2" r="5" fill="#F2B8C6" fillOpacity="0.7" />
        <circle cx="0" cy="0" r="2.8" fill="#B85D75" fillOpacity="0.7" />
      </g>
      {/* Bunga 2 */}
      <g transform="translate(52 62) scale(0.85)">
        <circle cx="0" cy="-7" r="5" fill="#F6CED8" fillOpacity="0.75" />
        <circle cx="7" cy="-2" r="5" fill="#F6CED8" fillOpacity="0.75" />
        <circle cx="4" cy="6" r="5" fill="#F6CED8" fillOpacity="0.75" />
        <circle cx="-4" cy="6" r="5" fill="#F6CED8" fillOpacity="0.75" />
        <circle cx="-7" cy="-2" r="5" fill="#F6CED8" fillOpacity="0.75" />
        <circle cx="0" cy="0" r="2.8" fill="#B85D75" fillOpacity="0.7" />
      </g>
      {/* Kelopak melayang */}
      <ellipse
        cx="28"
        cy="42"
        rx="4"
        ry="2.2"
        transform="rotate(-25 28 42)"
        fill="#E598AD"
        fillOpacity="0.55"
      />
      <ellipse
        cx="106"
        cy="68"
        rx="3.8"
        ry="2"
        transform="rotate(20 106 68)"
        fill="#E598AD"
        fillOpacity="0.5"
      />
    </svg>
  );
}

/**
 * Efek partikel bintang & cahaya lembut malam untuk tema MIDNIGHT_GARDEN.
 */
export function StarlightGlow({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div className="absolute -top-16 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-[#D4A359]/15 blur-3xl" />
      <svg
        viewBox="0 0 320 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 h-full w-full opacity-55"
      >
        {[
          { x: 36, y: 28, s: 5 },
          { x: 278, y: 40, s: 6 },
          { x: 64, y: 145, s: 4 },
          { x: 252, y: 152, s: 5 },
          { x: 162, y: 18, s: 3.5 },
          { x: 294, y: 102, s: 3 },
          { x: 24, y: 92, s: 3 },
        ].map((star, idx) => (
          <path
            key={idx}
            d={`M${star.x} ${star.y - star.s}L${star.x + star.s * 0.25} ${star.y - star.s * 0.25}L${star.x + star.s} ${star.y}L${star.x + star.s * 0.25} ${star.y + star.s * 0.25}L${star.x} ${star.y + star.s}L${star.x - star.s * 0.25} ${star.y + star.s * 0.25}L${star.x - star.s} ${star.y}L${star.x - star.s * 0.25} ${star.y - star.s * 0.25}Z`}
            fill="#E8C98A"
          />
        ))}
      </svg>
    </div>
  );
}

/**
 * Tekstur kertas dot-grid halus untuk tema POLAROID_SCRAPBOOK.
 */
export function DotPaperBackdrop({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        backgroundImage:
          "radial-gradient(rgba(139, 119, 101, 0.22) 1px, transparent 1px)",
        backgroundSize: "18px 18px",
      }}
    />
  );
}

/**
 * Pita selotip washi tape semi-transparan untuk kartu Polaroid.
 */
export function PolaroidWashiTape({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none block h-5 w-20 bg-[#E5C5A8]/75 border-x border-dashed border-[#B4654A]/35 shadow-sm backdrop-blur-[1px]",
        className
      )}
    />
  );
}

/**
 * Divider boho arch & diamond untuk tema WARM_TERRACOTTA.
 */
export function BohoSunDivider({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-5 w-32 mx-auto", className)}
      aria-hidden="true"
    >
      <path d="M6 12H58M102 12H154" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1" />
      <path
        d="M66 12L80 4L94 12L80 20L66 12Z"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <circle cx="80" cy="12" r="2.5" fill="currentColor" />
    </svg>
  );
}
