"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAppStore } from "@/store/use-app-store";

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
    const updateOnlineState = () => {
      if (!navigator.onLine) {
        setSyncStatus("offline");
      } else {
        setSyncStatus("synced");
      }
    };

    updateOnlineState();
    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);
    return () => {
      window.removeEventListener("online", updateOnlineState);
      window.removeEventListener("offline", updateOnlineState);
    };
  }, [setSyncStatus]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
