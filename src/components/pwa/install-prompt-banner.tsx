"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { Button } from "@/components/ui/button";

const DISMISS_STORAGE_KEY = "nikahplan_pwa_install_dismissed_at";
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari

export function InstallPromptBanner() {
  const { ready, isStandalone, isIosSafari, canNativePrompt, promptInstall } =
    usePwaInstall();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (!ready || isStandalone) {
      setDismissed(true);
      return;
    }

    const dismissedAt = Number(localStorage.getItem(DISMISS_STORAGE_KEY) || 0);
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_TTL_MS) {
      setDismissed(true);
      return;
    }

    if (canNativePrompt || isIosSafari) {
      setDismissed(false);
    }
  }, [ready, isStandalone, canNativePrompt, isIosSafari]);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()));
    setDismissed(true);
  };

  const handleInstall = async () => {
    const outcome = await promptInstall();
    if (outcome === "accepted") {
      setDismissed(true);
    }
  };

  if (dismissed || isStandalone || (!canNativePrompt && !isIosSafari)) {
    return null;
  }

  return (
    <div className="mb-4 rounded-2xl border border-sage/20 bg-sage text-cream-50 p-3.5 shadow-soft flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/12 text-terracotta-200">
          {isIosSafari ? (
            <Share className="h-4.5 w-4.5" />
          ) : (
            <Download className="h-4.5 w-4.5" />
          )}
        </span>
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-bold leading-snug">
            Install NikahPlan ke Layar Utama
          </p>
          {isIosSafari ? (
            <p className="text-[11px] text-cream-200/90 leading-relaxed">
              Ketuk ikon <strong>Bagikan (Share)</strong> di bawah Safari lalu
              pilih <strong>&ldquo;Tambah ke Layar Utama&rdquo;</strong> untuk
              akses offline penuh.
            </p>
          ) : (
            <p className="text-[11px] text-cream-200/90 leading-relaxed">
              Akses super cepat &amp; tetap lancar mencatat saat sinyal lemah di
              wedding expo atau honeymoon.
            </p>
          )}
          {canNativePrompt && (
            <div className="pt-1">
              <Button
                type="button"
                size="sm"
                variant="default"
                className="h-8 px-3.5 text-xs"
                onClick={handleInstall}
              >
                <Download className="h-3.5 w-3.5" />
                Install Sekarang
              </Button>
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Tutup banner instalasi"
        className="rounded-full p-1 text-cream-200/80 hover:bg-white/10 hover:text-white shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
