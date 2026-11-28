"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { NikahPlanLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function GlobalAppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[NikahPlan ErrorBoundary]", error);
  }, [error]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-x-clip px-4 py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-72 -z-10 bg-gradient-to-b from-[#E5EAF8] via-[#EFF2FA] to-transparent"
      />

      <div className="relative z-10 w-full max-w-md space-y-4">
        <div className="flex justify-center">
          <Link href="/" aria-label="NikahPlan Beranda">
            <NikahPlanLogo size="md" />
          </Link>
        </div>

        <Card className="rounded-[2rem] border-black/[0.06] bg-white shadow-lift">
          <CardContent className="p-6 sm:p-7 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-600">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="space-y-1.5">
              <h1 className="font-display text-xl sm:text-2xl font-bold text-[#141618]">
                Terjadi Kendala Sementara
              </h1>
              <p className="mx-auto max-w-xs text-xs sm:text-sm leading-relaxed text-[#5F6978]">
                Halaman mengalami gangguan saat dimuat. Data Anda tetap aman —
                silakan muat ulang atau kembali ke beranda.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
              <Button
                type="button"
                onClick={() => reset()}
                className="w-full sm:w-auto"
              >
                <RefreshCw className="h-4 w-4" />
                Coba Muat Ulang
              </Button>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href="/">
                  <Home className="h-4 w-4" />
                  Ke Beranda
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
