"use client";

import type { QueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { WorkspaceBundle } from "@/lib/workspace-data";
import {
  getOfflineDB,
  type OfflineSyncOperation,
  type OfflineSyncTable,
} from "@/lib/offline/db";
import { useAppStore } from "@/store/use-app-store";

function isNetworkFailure(error: unknown): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  if (error instanceof TypeError) return true;
  if (error && typeof error === "object" && "message" in error) {
    const msg = String((error as { message: unknown }).message).toLowerCase();
    return (
      msg.includes("failed to fetch") ||
      msg.includes("network") ||
      msg.includes("load failed") ||
      msg.includes("fetch")
    );
  }
  return false;
}

export async function saveWorkspaceSnapshot(bundle: WorkspaceBundle) {
  const db = getOfflineDB();
  if (!db) return;
  try {
    await db.workspaceSnapshots.put({
      workspaceId: bundle.workspace.id,
      bundle,
      updatedAt: Date.now(),
    });
  } catch (err) {
    console.warn("[OfflineDB] Failed saving workspace snapshot:", err);
  }
}

export async function loadWorkspaceSnapshot(
  workspaceId: string
): Promise<WorkspaceBundle | null> {
  const db = getOfflineDB();
  if (!db) return null;
  try {
    const record = await db.workspaceSnapshots.get(workspaceId);
    return record?.bundle ?? null;
  } catch (err) {
    console.warn("[OfflineDB] Failed loading workspace snapshot:", err);
    return null;
  }
}

export async function refreshQueuedCount(): Promise<number> {
  const db = getOfflineDB();
  if (!db) return 0;
  try {
    const [qCount, rCount] = await Promise.all([
      db.syncQueue.count(),
      db.receiptOutbox.count(),
    ]);
    const total = qCount + rCount;
    useAppStore.getState().setQueuedCount(total);
    return total;
  } catch {
    return 0;
  }
}

export async function clearOfflineCache(workspaceId?: string) {
  const db = getOfflineDB();
  if (!db) return;
  if (workspaceId) {
    await db.workspaceSnapshots.delete(workspaceId);
    await db.syncQueue.where("workspaceId").equals(workspaceId).delete();
    await db.receiptOutbox.where("workspaceId").equals(workspaceId).delete();
  } else {
    await db.workspaceSnapshots.clear();
    await db.syncQueue.clear();
    await db.receiptOutbox.clear();
  }
  await refreshQueuedCount();
}

/**
 * Terapkan mutasi secara optimistis ke WorkspaceBundle snapshot lokal
 * sehingga tampilan langsung terupdate bahkan saat offline.
 */
function applyMutationToBundle(
  bundle: WorkspaceBundle,
  table: OfflineSyncTable,
  operation: OfflineSyncOperation,
  recordId: string,
  payload: Record<string, unknown> | null
): WorkspaceBundle {
  const nowIso = new Date().toISOString();

  if (table === "workspaces" && operation === "UPDATE" && payload) {
    return {
      ...bundle,
      workspace: {
        ...bundle.workspace,
        ...payload,
        updated_at: nowIso,
      },
    };
  }

  const keyMap: Record<
    Exclude<OfflineSyncTable, "workspaces">,
    keyof Omit<WorkspaceBundle, "workspace">
  > = {
    budget_categories: "categories",
    budget_items: "items",
    item_payments: "payments",
    wedding_gifts: "gifts",
    honeymoon_checklists: "checklists",
  };

  if (table === "workspaces") return bundle;
  const bundleKey = keyMap[table];
  const list = [...(bundle[bundleKey] as Array<Record<string, unknown>>)];

  if (operation === "INSERT" && payload) {
    const newRow = {
      created_at: nowIso,
      updated_at: nowIso,
      ...payload,
      id: recordId,
    };
    const existsIdx = list.findIndex((r) => r.id === recordId);
    if (existsIdx >= 0) {
      list[existsIdx] = { ...list[existsIdx], ...newRow };
    } else {
      list.push(newRow);
    }
  } else if (operation === "UPDATE" && payload) {
    const idx = list.findIndex((r) => r.id === recordId);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...payload, updated_at: nowIso };
    }
  } else if (operation === "DELETE") {
    const filtered = list.filter((r) => r.id !== recordId);
    // Cascade lokal untuk hapus kategori / item agar UI tetap konsisten offline
    if (table === "budget_categories") {
      const removedItemIds = new Set(
        bundle.items
          .filter((i) => i.category_id === recordId)
          .map((i) => i.id)
      );
      return {
        ...bundle,
        categories: filtered as WorkspaceBundle["categories"],
        items: bundle.items.filter((i) => i.category_id !== recordId),
        payments: bundle.payments.filter((p) => !removedItemIds.has(p.item_id)),
      };
    }
    if (table === "budget_items") {
      return {
        ...bundle,
        items: filtered as WorkspaceBundle["items"],
        payments: bundle.payments.filter((p) => p.item_id !== recordId),
      };
    }
    return {
      ...bundle,
      [bundleKey]: filtered,
    };
  }

  return {
    ...bundle,
    [bundleKey]: list,
  };
}

/**
 * Eksekusi 1 mutasi terhadap tabel Supabase secara aman dengan dukungan Offline Queue.
 * - Online: langsung kirim ke Supabase; bila gagal karena jaringan, otomatis masuk syncQueue.
 * - Offline: langsung simpan ke syncQueue & update snapshot IndexedDB + TanStack Query cache.
 */
export async function executeOfflineFirstMutation(params: {
  workspaceId: string;
  table: OfflineSyncTable;
  operation: OfflineSyncOperation;
  recordId?: string;
  payload?: Record<string, unknown> | null;
  queryClient?: QueryClient;
}): Promise<{ id: string; queued: boolean }> {
  const { workspaceId, table, operation, queryClient } = params;
  const recordId = params.recordId || crypto.randomUUID();
  const payload = params.payload ?? null;
  const store = useAppStore.getState();

  store.startSync();

  // 1. Optimistic update pada snapshot lokal + TanStack Query cache
  const cachedBundle =
    queryClient?.getQueryData<WorkspaceBundle>(["workspace-data", workspaceId]) ??
    (await loadWorkspaceSnapshot(workspaceId));

  if (cachedBundle) {
    const nextBundle = applyMutationToBundle(
      cachedBundle,
      table,
      operation,
      recordId,
      payload
    );
    await saveWorkspaceSnapshot(nextBundle);
    queryClient?.setQueryData(["workspace-data", workspaceId], nextBundle);
  }

  const enqueueLocally = async () => {
    const db = getOfflineDB();
    if (!db) return;
    await db.syncQueue.add({
      workspaceId,
      table,
      operation,
      recordId,
      payload:
        operation === "INSERT" && payload
          ? { ...payload, id: recordId }
          : payload,
      createdAt: Date.now(),
      retries: 0,
      lastError: null,
    });
    await refreshQueuedCount();
  };

  try {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      await enqueueLocally();
      return { id: recordId, queued: true };
    }

    const supabase = createClient();
    const client = supabase as unknown as {
      from: (t: string) => {
        insert: (v: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
        update: (v: Record<string, unknown>) => {
          eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
        };
        delete: () => {
          eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
        };
      };
    };

    let error: { message: string } | null = null;

    if (operation === "INSERT" && payload) {
      const res = await client.from(table).insert({ ...payload, id: recordId });
      error = res.error;
    } else if (operation === "UPDATE" && payload) {
      const res = await client.from(table).update(payload).eq("id", recordId);
      error = res.error;
    } else if (operation === "DELETE") {
      const res = await client.from(table).delete().eq("id", recordId);
      error = res.error;
    }

    if (error) {
      if (isNetworkFailure(error)) {
        await enqueueLocally();
        return { id: recordId, queued: true };
      }
      throw new Error(error.message);
    }

    return { id: recordId, queued: false };
  } catch (err) {
    if (isNetworkFailure(err)) {
      await enqueueLocally();
      return { id: recordId, queued: true };
    }
    throw err;
  } finally {
    store.endSync();
  }
}

export async function queueReceiptUploadOffline(params: {
  workspaceId: string;
  paymentId: string;
  blob: Blob;
  ext: string;
  contentType: string;
  previousPath: string | null;
}) {
  const db = getOfflineDB();
  if (!db) return;
  await db.receiptOutbox.add({
    workspaceId: params.workspaceId,
    paymentId: params.paymentId,
    blob: params.blob,
    ext: params.ext,
    contentType: params.contentType,
    previousPath: params.previousPath,
    createdAt: Date.now(),
  });
  await refreshQueuedCount();
}

let isFlushing = false;

/**
 * Mengirim seluruh antrean mutasi lokal (`syncQueue`) dan lampiran bukti bayar (`receiptOutbox`)
 * ke Supabase secara FIFO saat koneksi kembali online.
 */
export async function flushSyncQueue(
  queryClient?: QueryClient
): Promise<{ synced: number; failed: number }> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }
  if (isFlushing) return { synced: 0, failed: 0 };

  const db = getOfflineDB();
  if (!db) return { synced: 0, failed: 0 };

  isFlushing = true;
  const store = useAppStore.getState();
  let synced = 0;
  let failed = 0;
  const touchedWorkspaces = new Set<string>();

  try {
    const pendingItems = await db.syncQueue.orderBy("createdAt").toArray();
    const pendingReceipts = await db.receiptOutbox.orderBy("createdAt").toArray();

    if (pendingItems.length === 0 && pendingReceipts.length === 0) {
      await refreshQueuedCount();
      return { synced: 0, failed: 0 };
    }

    store.startSync();
    const supabase = createClient();
    const client = supabase as unknown as {
      from: (t: string) => {
        upsert: (
          v: Record<string, unknown>,
          opts?: { onConflict?: string }
        ) => Promise<{ error: { message: string } | null }>;
        update: (v: Record<string, unknown>) => {
          eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
        };
        delete: () => {
          eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
        };
      };
    };

    // 1. Flush data mutations FIFO
    for (const item of pendingItems) {
      if (typeof navigator !== "undefined" && !navigator.onLine) break;
      try {
        let error: { message: string } | null = null;
        if (item.operation === "INSERT" && item.payload) {
          const res = await client
            .from(item.table)
            .upsert({ ...item.payload, id: item.recordId }, { onConflict: "id" });
          error = res.error;
        } else if (item.operation === "UPDATE" && item.payload) {
          const res = await client
            .from(item.table)
            .update(item.payload)
            .eq("id", item.recordId);
          error = res.error;
        } else if (item.operation === "DELETE") {
          const res = await client
            .from(item.table)
            .delete()
            .eq("id", item.recordId);
          error = res.error;
        }

        if (error) {
          failed += 1;
          if (item.id !== undefined) {
            await db.syncQueue.update(item.id, {
              retries: item.retries + 1,
              lastError: error.message,
            });
          }
          if (isNetworkFailure(error)) break;
        } else {
          synced += 1;
          touchedWorkspaces.add(item.workspaceId);
          if (item.id !== undefined) {
            await db.syncQueue.delete(item.id);
          }
        }
      } catch (err) {
        failed += 1;
        if (item.id !== undefined) {
          await db.syncQueue.update(item.id, {
            retries: item.retries + 1,
            lastError: err instanceof Error ? err.message : "Network error",
          });
        }
        if (isNetworkFailure(err)) break;
      }
    }

    // 2. Flush offline receipt image/PDF uploads
    for (const rItem of pendingReceipts) {
      if (typeof navigator !== "undefined" && !navigator.onLine) break;
      try {
        const storagePath = `${rItem.workspaceId}/${rItem.paymentId}-${Date.now()}.${rItem.ext}`;
        const { error: upErr } = await supabase.storage
          .from("receipts")
          .upload(storagePath, rItem.blob, {
            contentType: rItem.contentType,
            upsert: true,
          });

        if (upErr) {
          failed += 1;
          if (isNetworkFailure(upErr)) break;
          continue;
        }

        if (rItem.previousPath && rItem.previousPath !== storagePath) {
          await supabase.storage.from("receipts").remove([rItem.previousPath]);
        }

        await supabase
          .from("item_payments")
          .update({ receipt_url: storagePath })
          .eq("id", rItem.paymentId);

        synced += 1;
        touchedWorkspaces.add(rItem.workspaceId);
        if (rItem.id !== undefined) {
          await db.receiptOutbox.delete(rItem.id);
        }
      } catch {
        failed += 1;
        break;
      }
    }

    if (queryClient) {
      for (const wsId of touchedWorkspaces) {
        await queryClient.invalidateQueries({
          queryKey: ["workspace-data", wsId],
        });
      }
    }
  } finally {
    await refreshQueuedCount();
    store.endSync();
    isFlushing = false;
  }

  return { synced, failed };
}
