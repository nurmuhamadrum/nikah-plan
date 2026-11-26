import { cn } from "@/lib/utils";

type Variant = "sage" | "terracotta" | "amber";

const PALETTE: Record<Variant, { stroke: string; fill: string }> = {
  sage: { stroke: "#3D5245", fill: "#729682" },
  terracotta: { stroke: "#C87D55", fill: "#E8AE8F" },
  amber: { stroke: "#B2853F", fill: "#D4A359" },
};

function Leaf({ variant }: { variant: Variant }) {
  const { stroke, fill } = PALETTE[variant];
  return (
    <svg viewBox="0 0 40 60" fill="none" className="h-full w-full">
      <path
        d="M20 2C32 14 36 32 20 58C4 32 8 14 20 2Z"
        fill={fill}
        fillOpacity="0.35"
        stroke={stroke}
        strokeOpacity="0.55"
        strokeWidth="1.2"
      />
      <path
        d="M20 8V54"
        stroke={stroke}
        strokeOpacity="0.45"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Petal({ variant }: { variant: Variant }) {
  const { stroke, fill } = PALETTE[variant];
  return (
    <svg viewBox="0 0 40 40" fill="none" className="h-full w-full">
      <path
        d="M20 4C28 10 32 20 20 36C8 20 12 10 20 4Z"
        fill={fill}
        fillOpacity="0.4"
        stroke={stroke}
        strokeOpacity="0.4"
        strokeWidth="1"
      />
    </svg>
  );
}

function Sprig({ variant }: { variant: Variant }) {
  const { stroke, fill } = PALETTE[variant];
  return (
    <svg viewBox="0 0 120 120" fill="none" className="h-full w-full">
      <path
        d="M110 10C88 26 64 56 42 108"
        stroke={stroke}
        strokeOpacity="0.6"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M90 28C82 14 70 10 62 12C68 22 76 30 90 28Z"
        fill={fill}
        fillOpacity="0.45"
        stroke={stroke}
        strokeOpacity="0.6"
        strokeWidth="1.2"
      />
      <path
        d="M74 48C88 46 98 54 102 62C90 64 80 58 74 48Z"
        fill={fill}
        fillOpacity="0.45"
        stroke={stroke}
        strokeOpacity="0.6"
        strokeWidth="1.2"
      />
      <path
        d="M62 66C50 56 38 56 30 60C38 70 48 74 62 66Z"
        fill={fill}
        fillOpacity="0.4"
        stroke={stroke}
        strokeOpacity="0.6"
        strokeWidth="1.2"
      />
      <path
        d="M52 84C66 84 74 92 78 100C66 100 56 94 52 84Z"
        fill={fill}
        fillOpacity="0.35"
        stroke={stroke}
        strokeOpacity="0.6"
        strokeWidth="1.2"
      />
    </svg>
  );
}

type Item = {
  kind: "leaf" | "petal" | "sprig";
  variant: Variant;
  className: string;
  rotate: number;
  duration: number;
  delay: number;
};

const PRESETS: Record<"hero" | "page" | "subtle", Item[]> = {
  hero: [
    { kind: "sprig", variant: "sage", className: "top-2 right-[3%] h-32 w-32 lg:h-44 lg:w-44", rotate: 0, duration: 9, delay: 0 },
    { kind: "sprig", variant: "terracotta", className: "bottom-4 left-[-1.5rem] h-28 w-28 lg:h-36 lg:w-36", rotate: 180, duration: 10, delay: -3 },
    { kind: "leaf", variant: "sage", className: "top-[16%] left-[5%] h-8 w-6", rotate: -25, duration: 7, delay: -1 },
    { kind: "petal", variant: "terracotta", className: "top-[28%] right-[44%] h-5 w-5", rotate: 20, duration: 8, delay: -2 },
    { kind: "leaf", variant: "amber", className: "bottom-[18%] right-[6%] h-8 w-5", rotate: 35, duration: 7.5, delay: -4 },
    { kind: "petal", variant: "amber", className: "top-[58%] left-[38%] h-4 w-4", rotate: -15, duration: 6.5, delay: -5 },
    { kind: "petal", variant: "terracotta", className: "top-[8%] left-[44%] h-3.5 w-3.5", rotate: 40, duration: 9, delay: -6 },
  ],
  page: [
    { kind: "sprig", variant: "sage", className: "-top-4 -right-4 h-44 w-44", rotate: 0, duration: 10, delay: 0 },
    { kind: "sprig", variant: "terracotta", className: "-bottom-6 -left-6 h-44 w-44", rotate: 180, duration: 11, delay: -4 },
    { kind: "leaf", variant: "amber", className: "top-[22%] left-[6%] h-9 w-6", rotate: -20, duration: 7, delay: -2 },
    { kind: "petal", variant: "terracotta", className: "bottom-[24%] right-[8%] h-5 w-5", rotate: 25, duration: 8, delay: -3 },
  ],
  subtle: [
    { kind: "sprig", variant: "sage", className: "-top-5 -right-4 h-36 w-36", rotate: 0, duration: 10, delay: 0 },
    { kind: "petal", variant: "terracotta", className: "top-24 right-24 h-4 w-4", rotate: 25, duration: 8, delay: -3 },
  ],
};

/**
 * Ornamen daun & kelopak yang mengambang perlahan (CSS animation, ringan).
 * Bersifat dekoratif murni: aria-hidden & pointer-events-none.
 */
export function FloatingBotanicals({
  preset = "page",
  className,
  fixed = false,
}: {
  preset?: keyof typeof PRESETS;
  className?: string;
  fixed?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none select-none inset-0 overflow-hidden",
        fixed ? "fixed -z-[5]" : "absolute",
        className
      )}
    >
      {PRESETS[preset].map((item, idx) => (
        <div
          key={idx}
          className={cn("absolute animate-float", item.className)}
          style={
            {
              "--float-rotate": `${item.rotate}deg`,
              animationDuration: `${item.duration}s`,
              animationDelay: `${item.delay}s`,
            } as React.CSSProperties
          }
        >
          {item.kind === "leaf" ? (
            <Leaf variant={item.variant} />
          ) : item.kind === "petal" ? (
            <Petal variant={item.variant} />
          ) : (
            <Sprig variant={item.variant} />
          )}
        </div>
      ))}
    </div>
  );
}
