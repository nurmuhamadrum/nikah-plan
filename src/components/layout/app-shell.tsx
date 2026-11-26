"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ReceiptText, Gift, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { NikahPlanLogo } from "@/components/brand/logo";
import { InstallPromptBanner } from "@/components/pwa/install-prompt-banner";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Beranda", icon: Home },
  { href: "/vendors", label: "Vendor", icon: ReceiptText },
  { href: "/angpao", label: "Angpao", icon: Gift },
  { href: "/settings", label: "Profil", icon: User },
];

interface AppShellProps {
  children: React.ReactNode;
  userName?: string;
  avatarUrl?: string | null;
}

export function AppShell({ children, userName, avatarUrl }: AppShellProps) {
  const pathname = usePathname();

  const initials = (userName || "NP")
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <div className="min-h-screen bg-cream text-foreground flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-sage/10 bg-cream-50/95 px-4 py-6 z-30">
        <Link href="/dashboard" className="px-2 mb-8">
          <NikahPlanLogo size="md" />
        </Link>

        <nav className="flex-1 space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all",
                  isActive
                    ? "bg-sage text-cream-50 shadow-sm"
                    : "text-sage-700 hover:bg-sage-50 hover:text-sage-900"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <Link
          href="/settings"
          className="mt-auto flex items-center gap-3 rounded-2xl border border-sage/10 bg-white p-3 hover:border-sage/25 transition-colors"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={userName || "Profil"}
              className="h-9 w-9 rounded-full object-cover border border-sage/15"
            />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-100 text-xs font-bold text-sage-800">
              {initials}
            </span>
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold text-sage-900 truncate">
              {userName || "Akun Pasangan"}
            </p>
            <p className="text-[11px] text-sage-600">Kelola profil &amp; undangan</p>
          </div>
        </Link>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:pl-64 pb-24 md:pb-10">
        <div className="mx-auto w-full max-w-3xl px-4 pt-5 sm:px-6 sm:pt-7">
          <InstallPromptBanner />
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar (Matching Reference UI) */}
      <nav
        aria-label="Navigasi utama"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-sage/12 bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto grid max-w-md grid-cols-4 h-16 px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors",
                  isActive ? "text-sage-900" : "text-sage-500 hover:text-sage-800"
                )}
              >
                {isActive && (
                  <span className="absolute top-0 h-0.5 w-8 rounded-full bg-sage" />
                )}
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform",
                    isActive && "stroke-[2.3] text-sage"
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
