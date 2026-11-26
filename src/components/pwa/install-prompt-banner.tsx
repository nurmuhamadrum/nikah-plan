"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISS_STORAGE_KEY = "nikahplan_pwa_install_dismissed_at";
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari

export function InstallPromptBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Jangan tampilkan jika sudah terpasang sebagai PWA standalone
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error Safari iOS standalone flag
      Boolean(window.navigator.standalone);
    if (isStandalone) return;

    // Cek masa dismiss 7 hari
    const dismissedAt = Number(localStorage.getItem(DISMISS_STORAGE_KEY) || 0);
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_TTL_MS) {
      return;
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    const isSafari = /safari/.test(ua) && !/crios|fxios|edgios/.test(ua);

    if (isIos && isSafari) {
      setShowIosHint(true);
      setDismissed(false);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setDismissed(false);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setDismissed(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()));
    setDismissed(true);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setDismissed(true);
    }
    setDeferredPrompt(null);
  };

  if (dismissed || (!deferredPrompt && !showIosHint)) {
    return null;
  }

  return (
    <div className="mb-4 rounded-2xl border border-sage/20 bg-sage text-cream-50 p-3.5 shadow-soft flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/12 text-terracotta-200">
          {showIosHint ? (
            <Share className="h-4.5 w-4.5" />
          ) : (
            <Download className="h-4.5 w-4.5" />
          )}
        </span>
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-bold leading-snug">
            Install NikahPlan ke Layar Utama
          </p>
          {showIosHint ? (
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
          {deferredPrompt && (
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
