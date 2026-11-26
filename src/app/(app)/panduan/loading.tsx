import { Skeleton } from "@/components/ui/skeleton";

export default function PanduanLoading() {
  return (
    <div className="space-y-5 pb-8" aria-busy="true" aria-label="Memuat pusat panduan">
      {/* Hero Banner */}
      <div className="rounded-3xl bg-sage/85 p-5 sm:p-6 space-y-3 shadow-soft">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-44 rounded-full bg-white/20" />
          <Skeleton className="h-6 w-32 rounded-full bg-white/15" />
        </div>
        <Skeleton className="h-8 w-72 max-w-[85%] bg-white/25" />
        <Skeleton className="h-4 w-full max-w-lg bg-white/15" />
      </div>

      {/* 4 Tab Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 rounded-2xl sm:rounded-full glass p-1">
        <Skeleton className="h-9 rounded-xl sm:rounded-full" />
        <Skeleton className="h-9 rounded-xl sm:rounded-full bg-transparent" />
        <Skeleton className="h-9 rounded-xl sm:rounded-full bg-transparent" />
        <Skeleton className="h-9 rounded-xl sm:rounded-full bg-transparent" />
      </div>

      {/* Content Card Skeleton */}
      <div className="glass-strong rounded-3xl p-5 sm:p-6 space-y-4">
        <Skeleton className="h-5 w-36 rounded-full" />
        <Skeleton className="h-6 w-64" />
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
