import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  tone?: "sage" | "terracotta" | "amber";
  className?: string;
  compact?: boolean;
}

const TONE_CLASSES: Record<NonNullable<EmptyStateProps["tone"]>, string> = {
  sage: "from-sage-50 via-cream-100 to-sage-100/70 text-sage border-sage/15",
  terracotta:
    "from-terracotta-50 via-cream-100 to-terracotta-100/70 text-terracotta border-terracotta/20",
  amber:
    "from-amberwarm-light/90 via-cream-100 to-amberwarm-light/50 text-sage-900 border-amberwarm/30",
};

/**
 * Komponen Empty State ("Belum ada data") yang konsisten di seluruh NikahPlan
 * dengan padding atas-bawah lega dan medali ikon bernuansa warm botanical.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = "sage",
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-dashed border-sage/25 bg-white/80 backdrop-blur-sm text-center shadow-sm",
        compact ? "px-5 py-8 sm:py-9" : "px-6 py-10 sm:py-12",
        className
      )}
    >
      <div
        className={cn(
          "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border bg-gradient-to-br shadow-sm",
          TONE_CLASSES[tone]
        )}
      >
        <Icon className="h-6 w-6" />
      </div>

      <div className="mt-4 space-y-1.5">
        <p className="font-display text-base sm:text-lg font-semibold text-sage-900">
          {title}
        </p>
        {description && (
          <p className="mx-auto max-w-sm text-xs sm:text-sm leading-relaxed text-sage-600">
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {action}
        </div>
      )}
    </div>
  );
}
