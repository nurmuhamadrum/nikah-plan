import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { dispatchDueDateReminders } from "@/lib/web-push";

async function authorizeCronOrAdmin(request: Request): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  const adminAuth = await requireAdminSession();
  return adminAuth.authorized;
}

export async function GET(request: Request) {
  const allowed = await authorizeCronOrAdmin(request);
  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await dispatchDueDateReminders();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[Cron due-reminders GET] Error:", err);
    return NextResponse.json(
      { error: "Gagal menjalankan pengiriman pengingat." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
