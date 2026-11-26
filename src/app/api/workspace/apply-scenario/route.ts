import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const applyScenarioSchema = z.object({
  totalBudget: z.number().min(1_000_000).max(10_000_000_000),
  guestEstimate: z.number().int().min(10).max(5000).optional(),
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
});

/**
 * Menerapkan skenario anggaran (30 Jt / 50 Jt / 80 Jt / Custom) dalam Mode Aman:
 * - Memperbarui wedding_budget_target workspace.
 * - Memperbarui alokasi kategori yang sudah ada (cocok nama) atau menambahkan kategori baru.
 * - TIDAK menghapus kategori, vendor, maupun riwayat pembayaran pengguna.
 */
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
    const parsed = applyScenarioSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data skenario tidak valid." },
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
    const { totalBudget, guestEstimate, allocations } = parsed.data;

    // 1. Update target budget (dan opsional estimasi tamu) pada workspace
    const wsUpdate: { wedding_budget_target: number; guest_estimate?: number } = {
      wedding_budget_target: totalBudget,
    };
    if (typeof guestEstimate === "number") {
      wsUpdate.guest_estimate = guestEstimate;
    }

    const { error: wsErr } = await supabase
      .from("workspaces")
      .update(wsUpdate)
      .eq("id", workspaceId);

    if (wsErr) {
      return NextResponse.json(
        { error: `Gagal memperbarui target workspace: ${wsErr.message}` },
        { status: 500 }
      );
    }

    // 2. Ambil daftar kategori WEDDING yang sudah ada agar tidak duplikat & tidak menghapus data
    const { data: existingCats, error: fetchErr } = await supabase
      .from("budget_categories")
      .select("id, name, sort_order")
      .eq("workspace_id", workspaceId)
      .eq("phase", "WEDDING");

    if (fetchErr) {
      return NextResponse.json(
        { error: `Gagal membaca kategori: ${fetchErr.message}` },
        { status: 500 }
      );
    }

    const existingMap = new Map(
      (existingCats ?? []).map((c) => [c.name.trim().toLowerCase(), c])
    );

    let nextSort =
      (existingCats ?? []).reduce((max, c) => Math.max(max, c.sort_order), 0) + 1;

    const toInsert: {
      workspace_id: string;
      phase: "WEDDING";
      name: string;
      icon: string;
      allocated_amount: number;
      sort_order: number;
    }[] = [];

    let updatedCount = 0;

    for (const alloc of allocations) {
      const match = existingMap.get(alloc.name.trim().toLowerCase());
      if (match) {
        const { error: upErr } = await supabase
          .from("budget_categories")
          .update({
            allocated_amount: alloc.allocatedAmount,
            icon: alloc.icon,
          })
          .eq("id", match.id);
        if (!upErr) updatedCount++;
      } else {
        toInsert.push({
          workspace_id: workspaceId,
          phase: "WEDDING",
          name: alloc.name,
          icon: alloc.icon,
          allocated_amount: alloc.allocatedAmount,
          sort_order: nextSort++,
        });
      }
    }

    if (toInsert.length > 0) {
      const { error: insErr } = await supabase
        .from("budget_categories")
        .insert(toInsert);
      if (insErr) {
        return NextResponse.json(
          { error: `Gagal menambahkan kategori skenario: ${insErr.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      ok: true,
      updatedCount,
      insertedCount: toInsert.length,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat menerapkan skenario.",
      },
      { status: 500 }
    );
  }
}
