import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-sage text-cream-50",
        terracotta: "border-transparent bg-terracotta text-white",
        softSage: "border-sage/15 bg-sage-50 text-sage-700",
        softTerracotta: "border-terracotta/25 bg-terracotta-50 text-terracotta-700",
        outline: "border-sage/20 bg-white text-sage-700",
      },
    },
    defaultVariants: {
      variant: "softSage",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
