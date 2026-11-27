import Link from "next/link";
import {
  BookOpen,
  Compass,
  Home,
  LayoutDashboard,
  Mail,
} from "lucide-react";
import { NikahPlanLogo } from "@/components/brand/logo";
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
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-72 -z-10 bg-gradient-to-b from-[#E5EAF8] via-[#EFF2FA] to-transparent"
      />

      <div className="relative z-10 w-full max-w-md space-y-4">
        <div className="flex justify-center">
          <Link href="/" aria-label="Kembali ke Beranda NikahPlan">
            <NikahPlanLogo size="md" />
          </Link>
        </div>

        <Card className="rounded-[2rem] border-black/[0.06] bg-white shadow-lift">
          <CardContent className="p-6 sm:p-7 text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-black/[0.06] bg-[#F4F5F7]">
                <Compass className="h-5 w-5 text-[#4F6BF6] stroke-[1.9]" />
              </div>
              <span className="select-none font-display text-4xl sm:text-5xl font-bold leading-none tracking-tight text-[#141618]">
                404
              </span>
            </div>

            <div className="space-y-1.5">
              <h1 className="font-display text-xl sm:text-2xl font-bold text-[#141618] leading-snug">
                Halaman Tidak Ditemukan
              </h1>
              <p className="mx-auto max-w-xs text-xs sm:text-sm leading-relaxed text-[#5F6978]">
                Tautan mungkin salah ketik, sudah berubah, atau undangan digital
                masih berstatus <em>Draft</em>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
              <Button asChild className="w-full sm:w-auto">
                <Link href="/">
                  <Home className="h-4 w-4" />
                  Ke Beranda
                </Link>
              </Button>
              <BackButton className="w-full sm:w-auto" />
            </div>

            <div className="border-t border-black/[0.06] pt-4">
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {QUICK_LINKS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-[#F4F5F7] px-3 py-1.5 text-[11.5px] font-semibold text-[#141618] transition-colors hover:bg-[#ECEEF2]"
                    >
                      <Icon className="h-3.5 w-3.5 text-[#4F6BF6]" />
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
