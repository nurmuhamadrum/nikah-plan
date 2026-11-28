import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

const PROTECTED_PAID_PREFIXES = [
  "/onboarding",
  "/dashboard",
  "/vendors",
  "/angpao",
  "/undangan",
  "/panduan",
  "/settings",
];

function isProtectedPaidRoute(pathname: string): boolean {
  return PROTECTED_PAID_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export async function updateSessionAndGuard(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Jika env belum dikonfigurasi saat pengembangan awal, lewati guard agar landing page tetap tampil
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options?: CookieOptions }[]
      ) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  }) as unknown as SupabaseClient<Database>;

  // PENTING: Jangan menjalankan logika lain di antara createServerClient dan auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  // 1. Webhook, cron, dan callback auth tidak perlu dialihkan middleware
  if (
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/auth/")
  ) {
    return supabaseResponse;
  }

  // 1b. Halaman Admin memerlukan autentikasi (verifikasi role is_admin dilakukan di server /admin)
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }
    return supabaseResponse;
  }

  // 2. Halaman /checkout memerlukan autentikasi
  if (pathname === "/checkout" || pathname.startsWith("/checkout/")) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }

    const isUpgradeFlow = request.nextUrl.searchParams.get("upgrade") === "1";

    // Jika user sudah membayar dan bukan alur upgrade, arahkan ke /onboarding atau /dashboard
    const { data: profile } = await supabase
      .from("profiles")
      .select("has_paid, active_workspace_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.has_paid) {
      if (isUpgradeFlow && profile.active_workspace_id) {
        const { data: ws } = await supabase
          .from("workspaces")
          .select("plan")
          .eq("id", profile.active_workspace_id)
          .maybeSingle();
        if (ws?.plan === "WEDDING_ONLY") {
          return supabaseResponse;
        }
      }

      let targetPath = "/onboarding";
      if (profile.active_workspace_id) {
        const { data: ws } = await supabase
          .from("workspaces")
          .select("onboarding_completed")
          .eq("id", profile.active_workspace_id)
          .maybeSingle();
        if (ws?.onboarding_completed) {
          targetPath = "/dashboard";
        }
      }
      const targetUrl = request.nextUrl.clone();
      targetUrl.pathname = targetPath;
      targetUrl.search = "";
      return NextResponse.redirect(targetUrl);
    }

    return supabaseResponse;
  }

  // 3. Proteksi Paywall untuk /onboarding, /dashboard/*, /vendors/*, /angpao/*, /settings/*
  if (isProtectedPaidRoute(pathname)) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("has_paid, active_workspace_id")
      .eq("id", user.id)
      .maybeSingle();

    // Paid-First Paywall: user dengan has_paid = false wajib diarahkan ke /checkout
    if (!profile?.has_paid) {
      const checkoutUrl = request.nextUrl.clone();
      checkoutUrl.pathname = "/checkout";
      checkoutUrl.search = "";
      return NextResponse.redirect(checkoutUrl);
    }

    return supabaseResponse;
  }

  // 4. Jika user sudah login & akses /login (tanpa param next ke /join), arahkan sesuai status bayar
  if (pathname === "/login" && user) {
    const nextParam = request.nextUrl.searchParams.get("next");
    if (nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")) {
      try {
        const parsedNext = new URL(nextParam, request.nextUrl.origin);
        if (parsedNext.origin === request.nextUrl.origin) {
          const nextUrl = request.nextUrl.clone();
          nextUrl.pathname = parsedNext.pathname;
          nextUrl.search = parsedNext.search;
          return NextResponse.redirect(nextUrl);
        }
      } catch {
        // fallback ke redirect default jika nextParam tidak valid
      }
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("has_paid, active_workspace_id")
      .eq("id", user.id)
      .maybeSingle();

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.search = "";
    if (!profile?.has_paid) {
      redirectUrl.pathname = "/checkout";
    } else if (profile.active_workspace_id) {
      const { data: ws } = await supabase
        .from("workspaces")
        .select("onboarding_completed")
        .eq("id", profile.active_workspace_id)
        .maybeSingle();
      redirectUrl.pathname = ws?.onboarding_completed ? "/dashboard" : "/onboarding";
    } else {
      redirectUrl.pathname = "/onboarding";
    }
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
