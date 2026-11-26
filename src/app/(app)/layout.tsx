import { redirect } from "next/navigation";
import { getCachedAuthProfile } from "@/lib/workspace-server";
import { AppShell } from "@/components/layout/app-shell";

/**
 * Shared Layout untuk seluruh halaman utama di dalam AppShell
 * (/dashboard, /vendors, /angpao, /panduan, /settings).
 * Dipertahankan tetap mounted oleh Next.js App Router saat berpindah tab.
 */
export default async function AuthenticatedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCachedAuthProfile();

  if (!profile) {
    redirect("/login");
  }

  if (!profile.has_paid) {
    redirect("/checkout");
  }

  return (
    <AppShell userName={profile.full_name} avatarUrl={profile.avatar_url}>
      {children}
    </AppShell>
  );
}
