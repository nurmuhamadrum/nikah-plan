import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-[#141618] ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#8994A4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141618]/15 focus-visible:border-[#141618]/40 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
