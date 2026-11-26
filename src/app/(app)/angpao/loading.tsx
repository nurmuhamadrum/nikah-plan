import {
  ListRowSkeleton,
  PageHeaderSkeleton,
  Skeleton,
} from "@/components/ui/skeleton";

export default function AngpaoLoading() {
  return (
    <div className="space-y-5 pb-6" aria-busy="true" aria-label="Memuat halaman angpao">
      <PageHeaderSkeleton withAction />

      {/* Hero Summary Card */}
      <div className="rounded-3xl bg-sage/85 p-5 sm:p-6 space-y-5 shadow-soft">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-44 bg-white/20" />
            <Skeleton className="h-9 w-48 bg-white/25" />
            <Skeleton className="h-3 w-36 bg-white/15" />
          </div>
          <Skeleton className="h-11 w-11 rounded-2xl bg-white/15" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-16 rounded-2xl bg-white/15" />
          <Skeleton className="h-16 rounded-2xl bg-white/15" />
          <Skeleton className="h-16 rounded-2xl bg-white/15" />
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-20 rounded-full" />
        <Skeleton className="h-9 w-28 rounded-full" />
        <Skeleton className="h-9 w-28 rounded-full" />
      </div>

      {/* Gift Rows */}
      <div className="space-y-2.5">
        <ListRowSkeleton />
        <ListRowSkeleton />
        <ListRowSkeleton />
        <ListRowSkeleton />
      </div>
    </div>
  );
}
