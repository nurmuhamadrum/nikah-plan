"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  Home,
  ReceiptText,
  Gift,
  BookOpen,
  Mail,
  User,
  Headphones,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NikahPlanLogo } from "@/components/brand/logo";
import { BotanicalCorner } from "@/components/brand/botanical-accent";
import { InstallPromptBanner } from "@/components/pwa/install-prompt-banner";
import { SupportFeedbackDialog } from "@/components/support/support-feedback-dialog";

const DESKTOP_NAV_ITEMS = [
  { href: "/dashboard", label: "Beranda", icon: Home },
  { href: "/vendors", label: "Vendor", icon: ReceiptText },
  { href: "/undangan", label: "Undangan", icon: Mail },
  { href: "/angpao", label: "Angpao", icon: Gift },
  { href: "/panduan", label: "Panduan", icon: BookOpen },
  { href: "/settings", label: "Profil", icon: User },
];

const MOBILE_NAV_ITEMS = [
  { href: "/dashboard", label: "Beranda", icon: Home },
  { href: "/vendors", label: "Vendor", icon: ReceiptText },
  { href: "/undangan", label: "Undangan", icon: Mail },
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
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [supportOpen, setSupportOpen] = useState(false);

  // Reset optimistic pending state begitu route tujuan selesai termuat
  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  const activePath = pendingHref ?? pathname;

  const handleNavClick = (href: string) => {
    const alreadyActive = pathname === href || pathname.startsWith(`${href}/`);
    if (!alreadyActive) {
      setPendingHref(href);
    }
  };

  const initials = (userName || "NP")
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <div className="min-h-screen text-foreground flex flex-col md:flex-row">
      {/* Slim Top Progress Bar saat berpindah menu */}
      {pendingHref && (
        <div
          aria-hidden="true"
          className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-sage-100/80"
        >
          <div className="h-full w-1/2 animate-shimmer bg-gradient-to-r from-sage via-terracotta to-amberwarm" />
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-white/60 bg-cream-50/75 backdrop-blur-xl px-4 py-6 z-30 overflow-hidden shadow-soft">
        <BotanicalCorner
          className="absolute -bottom-6 -left-6 h-36 w-36 rotate-180 opacity-20"
          variant="sage"
        />

        <Link
          href="/dashboard"
          prefetch={true}
          onClick={() => handleNavClick("/dashboard")}
          className="relative z-10 px-2 mb-8"
        >
          <NikahPlanLogo size="md" />
        </Link>

        <nav className="relative z-10 flex-1 space-y-1.5">
          {DESKTOP_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              activePath === item.href || activePath.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onClick={() => handleNavClick(item.href)}
                className={cn(
                  "relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors",
                  isActive
                    ? "text-cream-50"
                    : "text-sage-700 hover:bg-white/70 hover:text-sage-900"
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="desktop-nav-pill"
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-sage-600 to-sage shadow-sm"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  />
                )}
                <Icon className="relative h-4 w-4" />
                <span className="relative">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => setSupportOpen(true)}
          className="relative z-10 mt-auto mb-2.5 flex items-center gap-2.5 rounded-2xl border border-sage/15 bg-sage-50/80 px-3.5 py-2.5 text-left text-xs font-semibold text-sage-800 hover:bg-sage-100/80 hover:border-sage/30 transition-all"
        >
          <Headphones className="h-4 w-4 shrink-0 text-sage" />
          <span className="truncate">Bantuan CS &amp; Masukan</span>
        </button>

        <Link
          href="/settings"
          prefetch={true}
          onClick={() => handleNavClick("/settings")}
          className="relative z-10 flex items-center gap-3 rounded-2xl border border-white/70 bg-white/80 backdrop-blur-sm p-3 hover:border-sage/25 hover:bg-white transition-all shadow-sm"
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
        <div
          className={cn(
            "mx-auto w-full px-4 pt-5 sm:px-6 sm:pt-7",
            pathname === "/undangan" ? "max-w-6xl" : "max-w-3xl"
          )}
        >
          <InstallPromptBanner />
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Navigasi utama"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/60 bg-white/85 backdrop-blur-xl shadow-soft pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 h-16 px-1">
          {MOBILE_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              activePath === item.href || activePath.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onClick={() => handleNavClick(item.href)}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 text-[10.5px] font-semibold transition-colors",
                  isActive ? "text-sage-900" : "text-sage-500 hover:text-sage-800"
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="mobile-nav-indicator"
                    className="absolute top-0 h-0.5 w-8 rounded-full bg-sage"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  />
                )}
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform",
                    isActive && "stroke-[2.3] text-sage scale-105"
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      <SupportFeedbackDialog
        open={supportOpen}
        onOpenChange={setSupportOpen}
      />
    </div>
  );
}
