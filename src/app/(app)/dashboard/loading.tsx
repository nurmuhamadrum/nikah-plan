import {
  ListRowSkeleton,
  PageHeaderSkeleton,
  Skeleton,
} from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-5 pb-6" aria-busy="true" aria-label="Memuat dashboard">
      {/* Couple Header + Countdown */}
      <div className="flex items-center justify-between gap-2">
        <PageHeaderSkeleton />
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>

      {/* Mode Switcher (Pernikahan | Honeymoon) */}
      <div className="grid grid-cols-2 gap-1 rounded-full glass p-1">
        <Skeleton className="h-10 rounded-full" />
        <Skeleton className="h-10 rounded-full bg-transparent" />
      </div>

      {/* Hero Budget Card */}
      <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/85 shadow-soft">
        <div className="bg-sage/85 p-5 sm:p-6 space-y-4">
          <div className="flex items-baseline justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-32 bg-white/20" />
              <Skeleton className="h-9 w-52 bg-white/25" />
            </div>
            <Skeleton className="h-6 w-14 rounded-full bg-white/20" />
          </div>
          <Skeleton className="h-2.5 w-full rounded-full bg-white/20" />
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-14 rounded-xl bg-white/15" />
            <Skeleton className="h-14 rounded-xl bg-white/15" />
            <Skeleton className="h-14 rounded-xl bg-white/15" />
          </div>
        </div>
        <div className="p-5 sm:p-6 space-y-2.5">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-full rounded-full" />
          <div className="flex justify-between gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>

      {/* Insight & Decision Support Skeleton */}
      <div className="glass-strong rounded-3xl p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-8 w-8 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      </div>

      {/* Daftar Pos Anggaran */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>
        <ListRowSkeleton />
        <ListRowSkeleton />
        <ListRowSkeleton />
        <ListRowSkeleton />
      </div>
    </div>
  );
}
