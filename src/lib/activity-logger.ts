"use client";

import type { QueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { WorkspaceBundle } from "@/lib/workspace-data";
import type { WorkspaceActivity } from "@/types/database";

export interface LogActivityParams {
  workspaceId: string;
  actorName?: string;
  actionType:
    | "VENDOR_ADD"
    | "VENDOR_UPDATE"
    | "VENDOR_DEAL"
    | "PAYMENT_ADD"
    | "PAYMENT_PAID"
    | "SAVING_ADD"
    | "QUICK_EXPENSE"
    | "GIFT_ADD"
    | "UPDATE";
  summary: string;
  entityPath?: string;
  queryClient?: QueryClient;
}

/**
 * Mencatat aktivitas kolaborasi pasangan ke tabel `workspace_activities`
 * secara non-blocking & optimistis (aman jika offline atau sebelum Migrasi 008).
 */
export async function logWorkspaceActivity(
  params: LogActivityParams
): Promise<void> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let actorName = params.actorName?.trim();
    if (!actorName && user) {
      const metaName =
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined);
      actorName = metaName?.trim() || user.email?.split("@")[0] || "Pasangan";
    }
    const finalActorName = actorName || "Pasangan";

    const optimistic: WorkspaceActivity = {
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `act-${Date.now()}`,
      workspace_id: params.workspaceId,
      actor_id: user?.id ?? null,
      actor_name: finalActorName,
      action_type: params.actionType,
      summary: params.summary,
      entity_path: params.entityPath ?? null,
      created_at: new Date().toISOString(),
    };

    if (params.queryClient) {
      params.queryClient.setQueryData<WorkspaceBundle | undefined>(
        ["workspace-data", params.workspaceId],
        (prev) => {
          if (!prev) return prev;
          const existing = prev.activities ?? [];
          return {
            ...prev,
            activities: [optimistic, ...existing].slice(0, 40),
          };
        }
      );
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return;
    }

    await supabase.from("workspace_activities").insert({
      id: optimistic.id,
      workspace_id: optimistic.workspace_id,
      actor_id: optimistic.actor_id,
      actor_name: optimistic.actor_name,
      action_type: optimistic.action_type,
      summary: optimistic.summary,
      entity_path: optimistic.entity_path,
    });
  } catch {
    // Non-blocking: jangan gagalkan mutasi utama jika log aktivitas gagal
  }
}

/**
 * Memformat ISO timestamp menjadi waktu relatif natural dalam Bahasa Indonesia.
 */
export function formatRelativeTimeID(iso: string): string {
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return "";
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return "Baru saja";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} jam lalu`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return "Kemarin";
  if (diffDay < 7) return `${diffDay} hari lalu`;
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}
