import type { Metadata } from "next";
import { LoginClient } from "./login-client";

export const metadata: Metadata = {
  title: "Masuk atau Daftar",
  description:
    "Masuk atau daftar akun NikahPlan menggunakan Google OAuth, Email & Kata Sandi, atau Email Magic Link.",
};

async function checkGoogleProviderEnabled(): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return false;

  try {
    const res = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: anonKey },
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return true;
    const data = (await res.json()) as { external?: { google?: boolean } };
    return Boolean(data.external?.google);
  } catch {
    return true;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const [params, googleAuthEnabled] = await Promise.all([
    searchParams,
    checkGoogleProviderEnabled(),
  ]);
  return (
    <LoginClient
      nextPath={params.next}
      initialError={params.error}
      googleAuthEnabled={googleAuthEnabled}
    />
  );
}
