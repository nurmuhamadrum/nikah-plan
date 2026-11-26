import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function getConfiguredAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS || "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

/**
 * Memeriksa apakah user merupakan Admin sah:
 * 1) Email termasuk dalam env ADMIN_EMAILS, ATAU
 * 2) profiles.is_admin === true di database Supabase.
 */
export async function isUserAdmin(
  userId: string,
  email?: string | null
): Promise<boolean> {
  if (email) {
    const allowedEmails = getConfiguredAdminEmails();
    if (allowedEmails.has(email.trim().toLowerCase())) {
      return true;
    }
  }

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .maybeSingle();

    return Boolean(data?.is_admin);
  } catch {
    return false;
  }
}

export async function requireAdminSession(): Promise<
  | { authorized: true; userId: string; email: string }
  | { authorized: false; status: 401 | 403; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authorized: false, status: 401, error: "Unauthorized" };
  }

  const adminOk = await isUserAdmin(user.id, user.email);
  if (!adminOk) {
    return {
      authorized: false,
      status: 403,
      error: "Akses ditolak. Hanya Admin yang diizinkan.",
    };
  }

  return {
    authorized: true,
    userId: user.id,
    email: user.email || "",
  };
}
