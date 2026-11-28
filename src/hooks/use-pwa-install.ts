"use client";

import { useEffect, useState } from "react";

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

let cachedPrompt: BeforeInstallPromptEvent | null = null;
let installedFlag = false;
let listenerInitialized = false;
const subscribers = new Set<() => void>();

function notifySubscribers() {
  subscribers.forEach((cb) => cb());
}

/**
 * Daftarkan listener global sekali agar event `beforeinstallprompt` tetap
 * tertangkap meski pengguna berpindah halaman sebelum membuka menu Profil.
 */
export function initPwaInstallListener() {
  if (typeof window === "undefined" || listenerInitialized) return;
  listenerInitialized = true;

  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    cachedPrompt = e as BeforeInstallPromptEvent;
    notifySubscribers();
  });

  window.addEventListener("appinstalled", () => {
    cachedPrompt = null;
    installedFlag = true;
    notifySubscribers();
  });
}

export function usePwaInstall() {
  const [ready, setReady] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIosSafari, setIsIosSafari] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(cachedPrompt);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    initPwaInstallListener();

    const checkStandalone = () => {
      const standalone =
        installedFlag ||
        window.matchMedia("(display-mode: standalone)").matches ||
        Boolean((window.navigator as { standalone?: boolean }).standalone);
      setIsStandalone(standalone);
    };

    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    const isSafari = /safari/.test(ua) && !/crios|fxios|edgios/.test(ua);
    setIsIosSafari(isIos && isSafari);

    checkStandalone();
    setDeferredPrompt(cachedPrompt);
    setReady(true);

    const onChange = () => {
      setDeferredPrompt(cachedPrompt);
      checkStandalone();
    };

    subscribers.add(onChange);
    const mq = window.matchMedia("(display-mode: standalone)");
    mq.addEventListener("change", checkStandalone);

    return () => {
      subscribers.delete(onChange);
      mq.removeEventListener("change", checkStandalone);
    };
  }, []);

  const promptInstall = async (): Promise<"accepted" | "dismissed" | "unavailable"> => {
    if (!cachedPrompt) return "unavailable";
    setInstalling(true);
    try {
      await cachedPrompt.prompt();
      const choice = await cachedPrompt.userChoice;
      if (choice.outcome === "accepted") {
        cachedPrompt = null;
        installedFlag = true;
        notifySubscribers();
        return "accepted";
      }
      return "dismissed";
    } finally {
      setInstalling(false);
    }
  };

  return {
    ready,
    isStandalone,
    isIosSafari,
    canNativePrompt: Boolean(deferredPrompt),
    installing,
    promptInstall,
  };
}
