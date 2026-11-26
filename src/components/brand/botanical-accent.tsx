import { cn } from "@/lib/utils";

/**
 * Aksen botani minimalis bernuansa sage & terracotta sesuai referensi visual UI.
 */
export function BotanicalCorner({
  className,
  variant = "sage",
}: {
  className?: string;
  variant?: "sage" | "terracotta";
}) {
  const strokeColor = variant === "sage" ? "#3D5245" : "#C87D55";
  const leafFill = variant === "sage" ? "#729682" : "#E8AE8F";

  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("pointer-events-none select-none opacity-35", className)}
      aria-hidden="true"
    >
      <path
        d="M110 10C88 26 64 56 42 108"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M90 28C82 14 70 10 62 12C68 22 76 30 90 28Z"
        fill={leafFill}
        fillOpacity="0.45"
        stroke={strokeColor}
        strokeWidth="1.2"
      />
      <path
        d="M74 48C88 46 98 54 102 62C90 64 80 58 74 48Z"
        fill={leafFill}
        fillOpacity="0.45"
        stroke={strokeColor}
        strokeWidth="1.2"
      />
      <path
        d="M62 66C50 56 38 56 30 60C38 70 48 74 62 66Z"
        fill={leafFill}
        fillOpacity="0.4"
        stroke={strokeColor}
        strokeWidth="1.2"
      />
      <path
        d="M52 84C66 84 74 92 78 100C66 100 56 94 52 84Z"
        fill={leafFill}
        fillOpacity="0.35"
        stroke={strokeColor}
        strokeWidth="1.2"
      />
    </svg>
  );
}
