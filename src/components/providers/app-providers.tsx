"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAppStore } from "@/store/use-app-store";
import { flushSyncQueue, refreshQueuedCount } from "@/lib/offline/sync-engine";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            refetchOnWindowFocus: true,
            retry: 1,
          },
        },
      })
  );

  const setSyncStatus = useAppStore((s) => s.setSyncStatus);

  useEffect(() => {
    const handleOnline = async () => {
      setSyncStatus("syncing");
      await flushSyncQueue(queryClient);
      setSyncStatus("synced");
    };

    const handleOffline = () => {
      setSyncStatus("offline");
    };

    // Inisialisasi status online/offline & cek antrean offline tertunda
    refreshQueuedCount().then((count) => {
      if (!navigator.onLine) {
        setSyncStatus("offline");
      } else if (count > 0) {
        handleOnline();
      } else {
        setSyncStatus("synced");
      }
    });

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [queryClient, setSyncStatus]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
