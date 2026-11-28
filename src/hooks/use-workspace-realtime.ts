"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

/**
 * Berlangganan pembaruan real-time Supabase pada workspace aktif
 * agar perubahan yang dibuat Owner & Partner langsung muncul tanpa refresh.
 */
export function useWorkspaceRealtime(workspaceId: string | null | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!workspaceId) return;

    const supabase = createClient();
    const invalidate = () => {
      queryClient.invalidateQueries({
        queryKey: ["workspace-data", workspaceId],
      });
    };

    const channel = supabase
      .channel(`workspace-sync-${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "workspaces",
          filter: `id=eq.${workspaceId}`,
        },
        invalidate
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "budget_categories",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        invalidate
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "budget_items",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        invalidate
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "item_payments",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        invalidate
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wedding_gifts",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        invalidate
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "honeymoon_checklists",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        invalidate
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "savings_entries",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        invalidate
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "workspace_activities",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        invalidate
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient]);
}
