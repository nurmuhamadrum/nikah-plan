import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PromoCodeRow } from "@/types/database";

const createPromoSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3)
    .max(32)
    .regex(/^[A-Za-z0-9_-]+$/, "Kode promo hanya boleh huruf, angka, -, _"),
  discountType: z.enum(["PERCENT", "FIXED"]),
  discountValue: z.number().positive(),
  description: z.string().trim().max(200).optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().trim().nullable().optional(),
  isActive: z.boolean().optional(),
});

const updatePromoSchema = z.object({
  id: z.string().uuid(),
  isActive: z.boolean().optional(),
  description: z.string().trim().max(200).optional(),
  discountValue: z.number().positive().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().trim().nullable().optional(),
});

const deletePromoSchema = z.object({
  id: z.string().uuid(),
});

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const parsed = createPromoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data promo tidak valid." },
        { status: 400 }
      );
    }

    const input = parsed.data;
    if (input.discountType === "PERCENT" && input.discountValue > 90) {
      return NextResponse.json(
        { error: "Diskon persen maksimal 90%." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("promo_codes")
      .insert({
        code: input.code.toUpperCase(),
        discount_type: input.discountType,
        discount_value: input.discountValue,
        description: input.description || "",
        max_uses: input.maxUses ?? null,
        expires_at: input.expiresAt ? new Date(input.expiresAt).toISOString() : null,
        is_active: input.isActive ?? true,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { error: `Gagal membuat kode promo: ${error.message}` },
        { status: 400 }
      );
    }

    revalidatePath("/admin");
    return NextResponse.json({ promo: data });
  } catch (err) {
    console.error("[API /api/admin/promos POST] Error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat membuat kode promo." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const parsed = updatePromoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data pembaruan promo tidak valid." },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const updateData: Partial<PromoCodeRow> = {};
    if (input.isActive !== undefined) updateData.is_active = input.isActive;
    if (input.description !== undefined)
      updateData.description = input.description;
    if (input.discountValue !== undefined)
      updateData.discount_value = input.discountValue;
    if (input.maxUses !== undefined) updateData.max_uses = input.maxUses;
    if (input.expiresAt !== undefined) {
      updateData.expires_at = input.expiresAt
        ? new Date(input.expiresAt).toISOString()
        : null;
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("promo_codes")
      .update(updateData)
      .eq("id", input.id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { error: `Gagal memperbarui promo: ${error.message}` },
        { status: 400 }
      );
    }

    revalidatePath("/admin");
    return NextResponse.json({ promo: data });
  } catch (err) {
    console.error("[API /api/admin/promos PUT] Error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memperbarui promo." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const parsed = deletePromoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "ID promo tidak valid." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("promo_codes")
      .delete()
      .eq("id", parsed.data.id);

    if (error) {
      return NextResponse.json(
        { error: `Gagal menghapus promo: ${error.message}` },
        { status: 400 }
      );
    }

    revalidatePath("/admin");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API /api/admin/promos DELETE] Error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menghapus promo." },
      { status: 500 }
    );
  }
}
