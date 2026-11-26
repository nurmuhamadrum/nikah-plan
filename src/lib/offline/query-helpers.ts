"use client";

import { createClient } from "@/lib/supabase/client";
import { fetchWorkspaceBundle, type WorkspaceBundle } from "@/lib/workspace-data";
import {
  loadWorkspaceSnapshot,
  saveWorkspaceSnapshot,
} from "@/lib/offline/sync-engine";

/**
 * Helper client-side untuk TanStack Query:
 * - Online: ambil data segar dari Supabase lalu simpan snapshot ke Dexie IndexedDB.
 * - Offline / Network error: pulihkan data dari snapshot Dexie IndexedDB (atau fallback initialBundle).
 */
export async function fetchWorkspaceBundleOfflineFirst(
  workspaceId: string,
  fallbackBundle?: WorkspaceBundle
): Promise<WorkspaceBundle> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    const cached = await loadWorkspaceSnapshot(workspaceId);
    if (cached) return cached;
    if (fallbackBundle) return fallbackBundle;
    throw new Error("Offline dan belum ada cache lokal untuk workspace ini.");
  }

  try {
    const supabase = createClient();
    const fresh = await fetchWorkspaceBundle(supabase, workspaceId);
    if (fresh) {
      await saveWorkspaceSnapshot(fresh);
      return fresh;
    }
  } catch (err) {
    console.warn("[OfflineFirst] Falling back to IndexedDB snapshot:", err);
  }

  const cached = await loadWorkspaceSnapshot(workspaceId);
  if (cached) return cached;
  if (fallbackBundle) return fallbackBundle;
  throw new Error("Gagal memuat data workspace.");
}
