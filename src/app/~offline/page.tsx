import Link from "next/link";
import { WifiOff, RefreshCw, Home } from "lucide-react";
import { NikahPlanLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function OfflineFallbackPage() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <NikahPlanLogo size="lg" />
        </div>

        <Card className="rounded-3xl border-sage/15 bg-white shadow-soft">
          <CardContent className="p-7 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-terracotta-50 text-terracotta">
              <WifiOff className="h-7 w-7" />
            </div>

            <div className="space-y-1.5">
              <h1 className="font-display text-2xl font-bold text-sage-900">
                Sedang dalam Mode Offline
              </h1>
              <p className="text-sm text-sage-600 leading-relaxed">
                Halaman yang Anda buka belum tersimpan di cache perangkat.
                Kembali ke Dashboard untuk tetap melihat dan mencatat transaksi
                dari penyimpanan lokal IndexedDB.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <Button asChild variant="sage" className="flex-1">
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
