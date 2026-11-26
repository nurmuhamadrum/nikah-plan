import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const updatePlanSchema = z.object({
  id: z.enum(["WEDDING_ONLY", "COMPLETE_PASS"]),
  name: z.string().trim().min(2).max(80),
  tagline: z.string().trim().min(2).max(200),
  price: z.number().min(10000).max(50000000),
  originalPrice: z.number().min(0).max(50000000),
  badge: z.string().trim().max(40).optional().nullable(),
  recommended: z.boolean(),
  features: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(160),
        included: z.boolean(),
      })
    )
    .min(1)
    .max(20),
});

export async function PUT(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const parsed = updatePlanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data paket tidak valid." },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const admin = createAdminClient();

    const { error } = await admin.from("pricing_plans").upsert(
      {
        id: input.id,
        name: input.name,
        tagline: input.tagline,
        price: Math.round(input.price),
        original_price: Math.round(input.originalPrice),
        badge: input.badge?.trim() || null,
        recommended: input.recommended,
        features: input.features,
        is_active: true,
      },
      { onConflict: "id" }
    );

    if (error) {
      return NextResponse.json(
        { error: `Gagal menyimpan harga paket: ${error.message}` },
        { status: 500 }
      );
    }

    revalidatePath("/");
    revalidatePath("/checkout");
    revalidatePath("/admin");

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API /api/admin/plans] Error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menyimpan paket." },
      { status: 500 }
    );
  }
}
