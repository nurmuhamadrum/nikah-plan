import { Skeleton } from "@/components/ui/skeleton";

export default function UndanganLoading() {
  return (
    <div
      className="space-y-5 pb-8"
      aria-busy="true"
      aria-label="Memuat pembuat undangan"
    >
      <div className="rounded-3xl bg-sage/85 p-5 sm:p-6 space-y-3 shadow-soft">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40 rounded-full bg-white/20" />
          <Skeleton className="h-6 w-24 rounded-full bg-white/15" />
        </div>
        <Skeleton className="h-8 w-64 bg-white/25" />
        <Skeleton className="h-10 w-full rounded-2xl bg-white/15" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 rounded-2xl sm:rounded-full glass p-1">
        <Skeleton className="h-9 rounded-xl sm:rounded-full" />
        <Skeleton className="h-9 rounded-xl sm:rounded-full bg-transparent" />
        <Skeleton className="h-9 rounded-xl sm:rounded-full bg-transparent" />
        <Skeleton className="h-9 rounded-xl sm:rounded-full bg-transparent" />
      </div>

      <div className="glass-strong rounded-3xl p-5 sm:p-6 space-y-4">
        <Skeleton className="h-5 w-44" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Skeleton className="h-11 rounded-xl" />
          <Skeleton className="h-11 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
