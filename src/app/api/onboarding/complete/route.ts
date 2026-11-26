import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  buildDefaultHoneymoonCategories,
  buildDefaultHoneymoonChecklists,
} from "@/lib/budget-allocator";

const onboardingSchema = z.object({
  coupleTitle: z.string().trim().min(2, "Nama pasangan minimal 2 karakter").max(80),
  weddingDate: z.string().trim().optional().nullable(),
  guestEstimate: z.number().int().min(10).max(5000),
  weddingBudgetTarget: z.number().min(1000000).max(10000000000),
  allocations: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        icon: z.string().trim().max(30),
        allocatedAmount: z.number().min(0),
      })
    )
    .min(1)
    .max(20),
  honeymoon: z
    .object({
      skipped: z.boolean(),
      destination: z.string().trim().max(100).optional().nullable(),
      startDate: z.string().trim().optional().nullable(),
      endDate: z.string().trim().optional().nullable(),
      currency: z.string().trim().min(3).max(5).optional(),
      exchangeRate: z.number().positive().optional(),
      budgetTarget: z.number().min(0).optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = onboardingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message || "Data onboarding tidak valid.",
        },
        { status: 400 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("has_paid, active_workspace_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.has_paid || !profile.active_workspace_id) {
      return NextResponse.json(
        { error: "Workspace aktif belum tersedia." },
        { status: 403 }
      );
    }

    const workspaceId = profile.active_workspace_id;

    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id, plan")
      .eq("id", workspaceId)
      .single();

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace tidak ditemukan." },
        { status: 404 }
      );
    }

    const input = parsed.data;
    const isCompletePass = workspace.plan === "COMPLETE_PASS";
    const includeHoneymoon =
      isCompletePass &&
      input.honeymoon &&
      !input.honeymoon.skipped &&
      Boolean(input.honeymoon.destination?.trim());

    // 1. Update Workspace configuration
    const { error: updateWsError } = await supabase
      .from("workspaces")
      .update({
        couple_title: input.coupleTitle,
        wedding_date: input.weddingDate || null,
        guest_estimate: input.guestEstimate,
        wedding_budget_target: input.weddingBudgetTarget,
        honeymoon_destination: includeHoneymoon
          ? input.honeymoon?.destination?.trim() || null
          : null,
        honeymoon_start_date: includeHoneymoon
          ? input.honeymoon?.startDate || null
          : null,
        honeymoon_end_date: includeHoneymoon
          ? input.honeymoon?.endDate || null
          : null,
        honeymoon_currency: includeHoneymoon
          ? input.honeymoon?.currency || "IDR"
          : "IDR",
        honeymoon_exchange_rate: includeHoneymoon
          ? input.honeymoon?.exchangeRate || 1
          : 1,
        honeymoon_budget_target: includeHoneymoon
          ? input.honeymoon?.budgetTarget || 0
          : 0,
        onboarding_completed: true,
      })
      .eq("id", workspaceId);

    if (updateWsError) {
      return NextResponse.json(
        { error: `Gagal menyimpan workspace: ${updateWsError.message}` },
        { status: 500 }
      );
    }

    // 2. Seed kategori pernikahan jika belum ada
    const { count: existingWeddingCats } = await supabase
      .from("budget_categories")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("phase", "WEDDING");

    if (!existingWeddingCats || existingWeddingCats === 0) {
      const weddingRows = input.allocations.map((cat, idx) => ({
        workspace_id: workspaceId,
        phase: "WEDDING" as const,
        name: cat.name,
        icon: cat.icon,
        allocated_amount: Math.round(cat.allocatedAmount),
        sort_order: idx + 1,
      }));

      const { error: catError } = await supabase
        .from("budget_categories")
        .insert(weddingRows);

      if (catError) {
        return NextResponse.json(
          { error: `Gagal membuat kategori pernikahan: ${catError.message}` },
          { status: 500 }
        );
      }
    }

    // 3. Seed kategori & checklist honeymoon jika paket Complete Pass & diisi
    if (includeHoneymoon) {
      const { count: existingHoneymoonCats } = await supabase
        .from("budget_categories")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .in("phase", ["HONEYMOON_PRE", "HONEYMOON_ONTRIP"]);

      if (!existingHoneymoonCats || existingHoneymoonCats === 0) {
        const hmCats = buildDefaultHoneymoonCategories(
          input.honeymoon?.budgetTarget || 0
        ).map((c) => ({
          ...c,
          workspace_id: workspaceId,
        }));
        await supabase.from("budget_categories").insert(hmCats);
      }

      const { count: existingChecklists } = await supabase
        .from("honeymoon_checklists")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId);

      if (!existingChecklists || existingChecklists === 0) {
        const defaultChecklists = buildDefaultHoneymoonChecklists(
          input.honeymoon?.destination || ""
        ).map((item) => ({
          ...item,
          workspace_id: workspaceId,
        }));
        await supabase.from("honeymoon_checklists").insert(defaultChecklists);
      }
    }

    return NextResponse.json({
      success: true,
      redirectTo: "/dashboard",
    });
  } catch (err) {
    console.error("[API /api/onboarding/complete] Error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menyimpan rencana anggaran." },
      { status: 500 }
    );
  }
}
