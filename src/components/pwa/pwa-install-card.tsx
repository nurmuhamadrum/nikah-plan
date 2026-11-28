"use client";

import { useState } from "react";
import {
  ChevronDown,
  Download,
  Loader2,
  Share,
  Smartphone,
} from "lucide-react";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Kartu instalasi Aplikasi PWA pada halaman Profil.
 * Otomatis tersembunyi jika pengguna sudah menjalankan NikahPlan dalam mode PWA standalone.
 */
export function PwaInstallCard() {
  const { ready, isStandalone, isIosSafari, canNativePrompt, installing, promptInstall } =
    usePwaInstall();
  const toast = useToast();
  const [showGuide, setShowGuide] = useState(false);

  if (!ready || isStandalone) {
    return null;
  }

  const handleInstallClick = async () => {
    if (canNativePrompt) {
      const outcome = await promptInstall();
      if (outcome === "accepted") {
        toast.success(
          "Aplikasi sedang dipasang!",
          "Ikon NikahPlan akan segera muncul di layar utama perangkat Anda."
        );
      }
      return;
    }

    setShowGuide((prev) => !prev);
  };

  return (
    <Card className="rounded-3xl border border-[#4F6BF6]/20 bg-gradient-to-br from-[#F7F9FF] via-white to-[#FFFBF2] shadow-card overflow-hidden">
      <CardContent className="p-5 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="flex items-start gap-3 min-w-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-midnight-btn text-[#E09F3E] shadow-sm">
              <Smartphone className="h-5 w-5" />
            </span>
            <div className="min-w-0 space-y-0.5">
              <p className="font-display text-sm sm:text-base font-bold text-[#141618]">
                Pasang Aplikasi NikahPlan (PWA)
              </p>
              <p className="text-xs text-[#5F6978] leading-relaxed">
                Akses layar penuh lebih cepat dari Home Screen &amp; tetap bisa
                mencatat pengeluaran saat offline.
              </p>
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            disabled={installing}
            onClick={handleInstallClick}
            className="w-full sm:w-auto shrink-0"
          >
            {installing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Memasang...
              </>
            ) : canNativePrompt ? (
              <>
                <Download className="h-3.5 w-3.5" />
                Download Aplikasi PWA
              </>
            ) : (
              <>
                {isIosSafari ? (
                  <Share className="h-3.5 w-3.5" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                Cara Install Aplikasi
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${
                    showGuide ? "rotate-180" : ""
                  }`}
                />
              </>
            )}
          </Button>
        </div>

        {showGuide && !canNativePrompt && (
          <div className="rounded-2xl border border-black/[0.06] bg-white/90 p-3.5 text-xs text-[#3F4856] space-y-2">
            {isIosSafari ? (
              <>
                <p className="font-semibold text-[#141618]">
                  Cara pasang di iPhone / iPad (Safari):
                </p>
                <ol className="list-decimal list-inside space-y-1 leading-relaxed">
                  <li>
                    Ketuk ikon <strong>Bagikan (Share)</strong> di bar bawah Safari.
                  </li>
                  <li>
                    Geser ke bawah lalu pilih{" "}
                    <strong>&ldquo;Tambah ke Layar Utama&rdquo;</strong>.
                  </li>
                  <li>
                    Ketuk <strong>Tambah</strong> di pojok kanan atas.
                  </li>
                </ol>
              </>
            ) : (
              <>
                <p className="font-semibold text-[#141618]">
                  Cara pasang dari browser Anda:
                </p>
                <ol className="list-decimal list-inside space-y-1 leading-relaxed">
                  <li>
                    Buka menu browser (ikon <strong>⋮</strong> atau{" "}
                    <strong>Bagikan</strong>).
                  </li>
                  <li>
                    Pilih <strong>&ldquo;Install App&rdquo;</strong> atau{" "}
                    <strong>&ldquo;Tambahkan ke Layar Utama&rdquo;</strong>.
                  </li>
                  <li>
                    Konfirmasi instalasi untuk membuka NikahPlan dalam mode layar penuh.
                  </li>
                </ol>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
