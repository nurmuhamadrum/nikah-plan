import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const updateContentSchema = z.object({
  key: z.enum([
    "hero",
    "announcement",
    "default_exchange_rates",
    "support_contact",
  ]),
  value: z.record(z.unknown()),
});

export async function PUT(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const parsed = updateContentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Format konten tidak valid." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { error } = await admin.from("site_contents").upsert(
      {
        key: parsed.data.key,
        value: parsed.data.value,
      },
      { onConflict: "key" }
    );

    if (error) {
      return NextResponse.json(
        { error: `Gagal menyimpan konten: ${error.message}` },
        { status: 500 }
      );
    }

    revalidatePath("/");
    revalidatePath("/admin");

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API /api/admin/content] Error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menyimpan konten." },
      { status: 500 }
    );
  }
}
