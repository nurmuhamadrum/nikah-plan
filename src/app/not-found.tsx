import Link from "next/link";
import {
  BookOpen,
  Compass,
  Home,
  LayoutDashboard,
  Mail,
} from "lucide-react";
import { NikahPlanLogo } from "@/components/brand/logo";
import { BotanicalCorner } from "@/components/brand/botanical-accent";
import { FloatingBotanicals } from "@/components/brand/floating-botanicals";
import { BackButton } from "@/components/layout/back-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const QUICK_LINKS = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/undangan", label: "Undangan", icon: Mail },
  { href: "/user-guide", label: "User Guide", icon: BookOpen },
];

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-x-clip px-4 py-6">
      <FloatingBotanicals preset="page" fixed />

      <div className="relative z-10 w-full max-w-md space-y-4">
        {/* Brand Logo */}
        <div className="flex justify-center">
          <Link href="/" aria-label="Kembali ke Beranda NikahPlan">
            <NikahPlanLogo size="md" />
          </Link>
        </div>

        {/* Compact 404 Card */}
        <Card className="relative overflow-hidden rounded-[2rem] glass-strong border-white/75 shadow-lift">
          <BotanicalCorner
            className="pointer-events-none absolute -top-4 -right-4 h-28 w-28 opacity-25"
            variant="sage"
          />
          <BotanicalCorner
            className="pointer-events-none absolute -bottom-4 -left-4 h-28 w-28 rotate-180 opacity-20"
            variant="terracotta"
          />

          <CardContent className="relative z-10 p-6 sm:p-7 text-center space-y-4">
            {/* Inline Icon + 404 */}
            <div className="flex items-center justify-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sage/15 bg-gradient-to-br from-cream-50 via-white to-sage-50 shadow-soft animate-float-soft">
                <Compass className="h-5 w-5 text-terracotta stroke-[1.9]" />
              </div>
              <span className="select-none font-display text-4xl sm:text-5xl font-bold leading-none tracking-tight text-sage-900">
                404
              </span>
            </div>

            <div className="space-y-1.5">
              <h1 className="font-display text-xl sm:text-2xl font-semibold text-sage-900 leading-snug">
                Halaman Tidak Ditemukan
              </h1>
              <p className="mx-auto max-w-xs text-xs sm:text-sm leading-relaxed text-sage-600">
                Tautan mungkin salah ketik, sudah berubah, atau undangan digital
                masih berstatus <em>Draft</em>.
              </p>
            </div>

            {/* Compact Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
              <Button asChild className="w-full sm:w-auto">
                <Link href="/">
                  <Home className="h-4 w-4" />
                  Ke Beranda
                </Link>
              </Button>
              <BackButton className="w-full sm:w-auto" />
            </div>

            {/* Compact Quick-Link Pills */}
            <div className="border-t border-sage/10 pt-4">
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {QUICK_LINKS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="inline-flex items-center gap-1.5 rounded-full border border-sage/15 bg-white/85 px-3 py-1.5 text-[11.5px] font-semibold text-sage-800 transition-colors hover:border-sage/35 hover:bg-sage-50"
                    >
                      <Icon className="h-3.5 w-3.5 text-terracotta" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
