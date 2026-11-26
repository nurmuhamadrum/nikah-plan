import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  BudgetCategory,
  BudgetItem,
  Database,
  HoneymoonChecklist,
  ItemPayment,
  WeddingGift,
  Workspace,
} from "@/types/database";

export interface WorkspaceBundle {
  workspace: Workspace;
  categories: BudgetCategory[];
  items: BudgetItem[];
  payments: ItemPayment[];
  gifts: WeddingGift[];
  checklists: HoneymoonChecklist[];
}

export async function fetchWorkspaceBundle(
  supabase: SupabaseClient<Database>,
  workspaceId: string
): Promise<WorkspaceBundle | null> {
  const [wsRes, catRes, itemRes, payRes, giftRes, checkRes] = await Promise.all([
    supabase.from("workspaces").select("*").eq("id", workspaceId).maybeSingle(),
    supabase
      .from("budget_categories")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("budget_items")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true }),
    supabase
      .from("item_payments")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true }),
    supabase
      .from("wedding_gifts")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false }),
    supabase
      .from("honeymoon_checklists")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("sort_order", { ascending: true }),
  ]);

  if (!wsRes.data) return null;

  return {
    workspace: wsRes.data,
    categories: catRes.data ?? [],
    items: itemRes.data ?? [],
    payments: payRes.data ?? [],
    gifts: giftRes.data ?? [],
    checklists: checkRes.data ?? [],
  };
}
