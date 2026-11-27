import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const updateFeedbackSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["NEW", "REVIEWED", "RESOLVED"]).optional(),
  admin_reply: z.string().trim().max(1500).nullable().optional(),
  is_public_testimonial: z.boolean().optional(),
});

const deleteFeedbackSchema = z.object({
  id: z.string().uuid(),
});

export async function PUT(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const parsed = updateFeedbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data pembaruan feedback tidak valid." },
        { status: 400 }
      );
    }

    const { id, ...updates } = parsed.data;
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("customer_feedbacks")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { error: `Gagal memperbarui feedback: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ feedback: data });
  } catch (err) {
    console.error("[API PUT /api/admin/feedback] Error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memperbarui feedback." },
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
    const parsed = deleteFeedbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("customer_feedbacks")
      .delete()
      .eq("id", parsed.data.id);

    if (error) {
      return NextResponse.json(
        { error: `Gagal menghapus feedback: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API DELETE /api/admin/feedback] Error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menghapus feedback." },
      { status: 500 }
    );
  }
}
