"use client";

import Dexie, { type EntityTable } from "dexie";
import type { WorkspaceBundle } from "@/lib/workspace-data";

export type OfflineSyncTable =
  | "workspaces"
  | "budget_categories"
  | "budget_items"
  | "item_payments"
  | "wedding_gifts"
  | "honeymoon_checklists";

export type OfflineSyncOperation = "INSERT" | "UPDATE" | "DELETE";

export interface WorkspaceSnapshotRecord {
  workspaceId: string;
  bundle: WorkspaceBundle;
  updatedAt: number;
}

export interface SyncQueueItem {
  id?: number;
  workspaceId: string;
  table: OfflineSyncTable;
  operation: OfflineSyncOperation;
  recordId: string;
  payload: Record<string, unknown> | null;
  createdAt: number;
  retries: number;
  lastError: string | null;
}

export interface ReceiptOutboxItem {
  id?: number;
  workspaceId: string;
  paymentId: string;
  blob: Blob;
  ext: string;
  contentType: string;
  previousPath: string | null;
  createdAt: number;
}

class NikahPlanOfflineDB extends Dexie {
  workspaceSnapshots!: EntityTable<WorkspaceSnapshotRecord, "workspaceId">;
  syncQueue!: EntityTable<SyncQueueItem, "id">;
  receiptOutbox!: EntityTable<ReceiptOutboxItem, "id">;

  constructor() {
    super("NikahPlanOfflineDB");
    this.version(1).stores({
      workspaceSnapshots: "workspaceId, updatedAt",
      syncQueue: "++id, workspaceId, table, recordId, createdAt",
      receiptOutbox: "++id, workspaceId, paymentId, createdAt",
    });
  }
}

let dbInstance: NikahPlanOfflineDB | null = null;

export function getOfflineDB(): NikahPlanOfflineDB | null {
  if (typeof window === "undefined") return null;
  if (!dbInstance) {
    dbInstance = new NikahPlanOfflineDB();
  }
  return dbInstance;
}
