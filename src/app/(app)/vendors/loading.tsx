import { PageHeaderSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function VendorsLoading() {
  return (
    <div className="space-y-5 pb-6" aria-busy="true" aria-label="Memuat daftar vendor">
      <PageHeaderSkeleton withAction />

      {/* 3 Kartu Ringkasan */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="glass-strong rounded-2xl p-3.5 space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="glass-strong rounded-2xl p-3.5 space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="glass-strong rounded-2xl p-3.5 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-hidden">
        <Skeleton className="h-9 w-24 rounded-full shrink-0" />
        <Skeleton className="h-9 w-32 rounded-full shrink-0" />
        <Skeleton className="h-9 w-28 rounded-full shrink-0" />
        <Skeleton className="h-9 w-28 rounded-full shrink-0" />
      </div>

      {/* Search Bar */}
      <Skeleton className="h-10 w-full rounded-xl" />

      {/* Vendor Cards */}
      <div className="space-y-3">
        {[1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="glass-strong rounded-3xl p-4 sm:p-5 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
