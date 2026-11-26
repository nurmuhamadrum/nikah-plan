import type { Metadata } from "next";
import { LoginClient } from "./login-client";

export const metadata: Metadata = {
  title: "Masuk atau Daftar",
  description: "Masuk ke NikahPlan dengan Google OAuth atau Email Magic Link.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  return <LoginClient nextPath={params.next} initialError={params.error} />;
}
