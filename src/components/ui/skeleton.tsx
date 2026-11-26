import { cn } from "@/lib/utils";

/**
 * Skeleton bernuansa warm sage-cream dengan efek shimmer lembut.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden rounded-xl bg-sage-200/45 before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/55 before:to-transparent",
        className
      )}
      {...props}
    />
  );
}

export function PageHeaderSkeleton({ withAction = false }: { withAction?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="space-y-2">
        <Skeleton className="h-8 w-52 rounded-2xl" />
        <Skeleton className="h-4 w-36 rounded-full" />
      </div>
      {withAction && (
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-32 rounded-full" />
        </div>
      )}
    </div>
  );
}

export function ListRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-40 max-w-[70%]" />
          <Skeleton className="h-3 w-52 max-w-[85%]" />
          <Skeleton className="h-1.5 w-36 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-5 w-5 rounded-full shrink-0" />
    </div>
  );
}
