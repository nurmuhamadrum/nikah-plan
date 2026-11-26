import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

/**
 * Logo NikahPlan mengikuti referensi UI:
 * Ikon cincin kembar bernuansa terracotta + tipografi serif warm sage green.
 */
export function NikahPlanLogo({
  className,
  size = "md",
  showIcon = true,
}: LogoProps) {
  const iconDims =
    size === "sm" ? "h-5 w-6" : size === "lg" ? "h-7 w-9" : "h-6 w-7";
  const textSize =
    size === "sm" ? "text-lg" : size === "lg" ? "text-3xl" : "text-2xl";

  return (
    <div className={cn("inline-flex items-center gap-2 select-none", className)}>
      {showIcon && (
        <svg
          viewBox="0 0 36 26"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={cn("shrink-0", iconDims)}
          aria-hidden="true"
        >
          {/* Left Ring */}
          <circle
            cx="12.5"
            cy="15.5"
            r="7.5"
            stroke="#C87D55"
            strokeWidth="2"
          />
          {/* Right Ring */}
          <circle
            cx="23.5"
            cy="15.5"
            r="7.5"
            stroke="#C87D55"
            strokeWidth="2"
          />
          {/* Minimalist diamond accent */}
          <path
            d="M18 3.5L21 6.8L18 10L15 6.8L18 3.5Z"
            stroke="#3D5245"
            strokeWidth="1.6"
            fill="#F7F5F0"
          />
        </svg>
      )}
      <span
        className={cn(
          "font-display font-bold tracking-tight text-sage",
          textSize
        )}
      >
        NikahPlan
      </span>
    </div>
  );
}
