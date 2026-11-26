import type { Metadata } from "next";
import { LoginClient } from "./login-client";

export const metadata: Metadata = {
  title: "Masuk atau Daftar",
  description:
    "Masuk atau daftar akun NikahPlan menggunakan Google OAuth, Email & Kata Sandi, atau Email Magic Link.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  return <LoginClient nextPath={params.next} initialError={params.error} />;
}
