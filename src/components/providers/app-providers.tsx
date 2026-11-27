"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { useAppStore } from "@/store/use-app-store";
import { flushSyncQueue, refreshQueuedCount } from "@/lib/offline/sync-engine";
import { ToastProvider, useToast } from "@/components/providers/toast-provider";
import { ConfirmProvider } from "@/components/providers/confirm-provider";

function OfflineSyncWatcher({ queryClient }: { queryClient: QueryClient }) {
  const setSyncStatus = useAppStore((s) => s.setSyncStatus);
  const toast = useToast();

  useEffect(() => {
    const handleOnline = async () => {
      setSyncStatus("syncing");
      const res = await flushSyncQueue(queryClient);
      setSyncStatus("synced");
      if (res.synced > 0) {
        toast.success(
          "Sinkronisasi selesai",
          `${res.synced} perubahan offline berhasil disimpan ke server.`
        );
      }
    };

    const handleOffline = () => {
      setSyncStatus("offline");
      toast.warning(
        "Perangkat sedang offline",
        "Perubahan tetap disimpan di perangkat dan akan sinkron otomatis saat online."
      );
    };

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
  }, [queryClient, setSyncStatus, toast]);

  return null;
}

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

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().catch(() => {});
        }
      })
      .catch(() => {});

    if ("caches" in window) {
      caches
        .keys()
        .then((keys) => {
          for (const key of keys) {
            caches.delete(key).catch(() => {});
          }
        })
        .catch(() => {});
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <ToastProvider>
          <ConfirmProvider>
            <OfflineSyncWatcher queryClient={queryClient} />
            {children}
          </ConfirmProvider>
        </ToastProvider>
      </MotionConfig>
    </QueryClientProvider>
  );
}
