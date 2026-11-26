import { PageHeaderSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="space-y-5 pb-8" aria-busy="true" aria-label="Memuat pengaturan">
      <PageHeaderSkeleton />

      {/* Info Akun & Paket */}
      <div className="glass-strong rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-6 w-32 rounded-full" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3.5 w-36" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-36 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
      </div>

      {/* Undangan Pasangan */}
      <div className="glass-strong rounded-3xl p-5 sm:p-6 space-y-3">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-10 w-full rounded-full" />
      </div>

      {/* Ekspor & Notifikasi */}
      <div className="glass-strong rounded-3xl p-5 sm:p-6 space-y-3">
        <Skeleton className="h-5 w-36" />
        <div className="grid grid-cols-2 gap-2.5">
          <Skeleton className="h-11 rounded-full" />
          <Skeleton className="h-11 rounded-full" />
        </div>
      </div>
    </div>
  );
}
