import Link from "next/link";
import { WifiOff, RefreshCw, Home } from "lucide-react";
import { NikahPlanLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function OfflineFallbackPage() {
  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#F4F5F7] px-4 py-12">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-gradient-to-b from-[#E5EAF8]/80 to-transparent" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <NikahPlanLogo size="lg" />
        </div>

        <Card className="rounded-3xl border border-black/[0.06] bg-white shadow-card">
          <CardContent className="p-7 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#4F6BF6] border border-[#4F6BF6]/20">
              <WifiOff className="h-7 w-7" />
            </div>

            <div className="space-y-1.5">
              <h1 className="font-display text-2xl font-bold text-[#141618]">
                Sedang dalam Mode Offline
              </h1>
              <p className="text-sm text-[#5F6978] leading-relaxed">
                Halaman yang Anda buka belum tersimpan di cache perangkat.
                Kembali ke Dashboard untuk tetap melihat dan mencatat transaksi
                dari penyimpanan lokal IndexedDB.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <Button asChild className="flex-1">
                <Link href="/dashboard">
                  <Home className="h-4 w-4" />
                  Buka Dashboard
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/vendors">
                  <RefreshCw className="h-4 w-4" />
                  Coba Vendor
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
