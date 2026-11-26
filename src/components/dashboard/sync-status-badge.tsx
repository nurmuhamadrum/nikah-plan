"use client";

import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { useAppStore } from "@/store/use-app-store";

export function SyncStatusBadge() {
  const syncStatus = useAppStore((s) => s.syncStatus);

  if (syncStatus === "offline") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-terracotta-700">
        <span className="h-2 w-2 rounded-full bg-terracotta" />
        <CloudOff className="h-3.5 w-3.5" />
        Mode Offline &mdash; Tersimpan di Perangkat
      </span>
    );
  }

  if (syncStatus === "syncing") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sage-700">
        <RefreshCw className="h-3 w-3 animate-spin text-terracotta" />
        Menyinkronkan...
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sage-600">
      <span className="h-2 w-2 rounded-full bg-emerald-500" />
      <Cloud className="h-3.5 w-3.5 text-sage-500 hidden sm:inline" />
      Tersinkronisasi
    </span>
  );
}
