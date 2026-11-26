import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(10),
    auth: z.string().min(6),
  }),
});

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
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
    const parsed = subscribeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Payload push subscription tidak valid." },
        { status: 400 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("active_workspace_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.active_workspace_id) {
      return NextResponse.json(
        { error: "Workspace aktif belum tersedia." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: user.id,
        workspace_id: profile.active_workspace_id,
        endpoint: parsed.data.endpoint,
        p256dh: parsed.data.keys.p256dh,
        auth: parsed.data.keys.auth,
      },
      { onConflict: "endpoint" }
    );

    if (error) {
      return NextResponse.json(
        { error: `Gagal menyimpan langganan notifikasi: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API /api/push/subscribe POST] Error:", err);
    return NextResponse.json(
      { error: "Gagal mengaktifkan notifikasi push." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = unsubscribeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Endpoint tidak valid." },
        { status: 400 }
      );
    }

    await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", user.id)
      .eq("endpoint", parsed.data.endpoint);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API /api/push/subscribe DELETE] Error:", err);
    return NextResponse.json(
      { error: "Gagal menonaktifkan notifikasi push." },
      { status: 500 }
    );
  }
}
