import {
  ListRowSkeleton,
  PageHeaderSkeleton,
  Skeleton,
} from "@/components/ui/skeleton";

export default function AppSectionLoading() {
  return (
    <div className="space-y-5 pb-8" aria-busy="true" aria-label="Memuat halaman">
      <PageHeaderSkeleton />
      <Skeleton className="h-44 w-full rounded-3xl" />
      <div className="space-y-2.5">
        <ListRowSkeleton />
        <ListRowSkeleton />
        <ListRowSkeleton />
      </div>
    </div>
  );
}
