"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { useAppStore } from "@/store/use-app-store";
import { flushSyncQueue } from "@/lib/offline/sync-engine";

export function SyncStatusBadge() {
  const queryClient = useQueryClient();
  const syncStatus = useAppStore((s) => s.syncStatus);
  const queuedCount = useAppStore((s) => s.queuedCount);

  if (syncStatus === "offline") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-terracotta-700">
        <span className="h-2 w-2 rounded-full bg-terracotta" />
        <CloudOff className="h-3.5 w-3.5" />
        {queuedCount > 0
          ? `Mode Offline • ${queuedCount} perubahan tersimpan lokal`
          : "Mode Offline — Tersimpan di Perangkat"}
      </span>
    );
  }

  if (syncStatus === "syncing") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sage-700">
        <RefreshCw className="h-3 w-3 animate-spin text-terracotta" />
        {queuedCount > 0
          ? `Menyinkronkan (${queuedCount} antrean)...`
          : "Menyinkronkan..."}
      </span>
    );
  }

  if (queuedCount > 0) {
    return (
      <button
        type="button"
        onClick={() => flushSyncQueue(queryClient)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-terracotta-700 hover:underline"
      >
        <RefreshCw className="h-3 w-3" />
        {queuedCount} antrean belum sinkron &bull; Sinkronkan
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sage-600">
      <span className="h-2 w-2 rounded-full bg-emerald-500" />
      <Cloud className="h-3.5 w-3.5 text-sage-500 hidden sm:inline" />
      Online &amp; Tersinkronisasi
    </span>
  );
}
