"use client";

import { create } from "zustand";

export type AppMode = "WEDDING" | "HONEYMOON";
export type SyncStatus = "synced" | "syncing" | "offline";

interface AppState {
  mode: AppMode;
  syncStatus: SyncStatus;
  pendingMutations: number;
  queuedCount: number;
  setMode: (mode: AppMode) => void;
  setSyncStatus: (status: SyncStatus) => void;
  setQueuedCount: (count: number) => void;
  startSync: () => void;
  endSync: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  mode: "WEDDING",
  syncStatus: "synced",
  pendingMutations: 0,
  queuedCount: 0,
  setMode: (mode) => set({ mode }),
  setSyncStatus: (syncStatus) => set({ syncStatus }),
  setQueuedCount: (queuedCount) => set({ queuedCount }),
  startSync: () =>
    set((state) => ({
      pendingMutations: state.pendingMutations + 1,
      syncStatus:
        typeof navigator !== "undefined" && !navigator.onLine
          ? "offline"
          : "syncing",
    })),
  endSync: () =>
    set((state) => {
      const next = Math.max(0, state.pendingMutations - 1);
      const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
      return {
        pendingMutations: next,
        syncStatus: isOffline ? "offline" : next > 0 ? "syncing" : "synced",
      };
    }),
}));
