"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationCard() {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      return;
    }

    setSupported(true);

    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        setSubscribed(Boolean(sub));
      })
      .catch(() => {
        setSubscribed(false);
      });
  }, []);

  const handleEnable = async () => {
    if (!vapidPublicKey) {
      setStatusMsg(
        "VAPID Public Key belum diset oleh Admin (NEXT_PUBLIC_VAPID_PUBLIC_KEY)."
      );
      return;
    }

    setBusy(true);
    setStatusMsg(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatusMsg(
          "Izin notifikasi ditolak browser. Aktifkan izin notifikasi pada pengaturan browser Anda."
        );
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const appServerKey = urlBase64ToUint8Array(vapidPublicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey.buffer as ArrayBuffer,
      });

      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error("Subscription browser tidak lengkap.");
      }

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan langganan.");
      }

      setSubscribed(true);
      setStatusMsg(
        "Notifikasi pengingat H-3 jatuh tempo berhasil diaktifkan di perangkat ini!"
      );
    } catch (err) {
      setStatusMsg(
        err instanceof Error
          ? err.message
          : "Gagal mengaktifkan Web Push (pastikan build production/HTTPS aktif)."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    setBusy(true);
    setStatusMsg(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setSubscribed(false);
      setStatusMsg("Pengingat notifikasi perangkat ini dinonaktifkan.");
    } catch {
      setStatusMsg("Gagal menonaktifkan notifikasi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="rounded-3xl border-sage/12 bg-white shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base inline-flex items-center gap-2">
            <Bell className="h-4.5 w-4.5 text-terracotta" />
            Notifikasi Jatuh Tempo Vendor (H-3)
          </CardTitle>
          <Badge variant={subscribed ? "default" : "outline"}>
            {subscribed ? "Aktif" : "Nonaktif"}
          </Badge>
        </div>
        <CardDescription>
          Terima pengingat otomatis H-3 sebelum tanggal jatuh tempo termin DP
          atau pelunasan vendor langsung di HP Anda.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {!supported ? (
          <p className="text-xs text-sage-600">
            Browser ini belum mendukung Web Push API (di iOS, install NikahPlan
            ke Layar Utama terlebih dahulu).
          </p>
        ) : subscribed ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={handleDisable}
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <BellOff className="h-3.5 w-3.5" />
            )}
            Nonaktifkan di Perangkat Ini
          </Button>
        ) : (
          <Button
            type="button"
            variant="sage"
            size="sm"
            disabled={busy}
            onClick={handleEnable}
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Bell className="h-3.5 w-3.5" />
            )}
            Aktifkan Pengingat H-3
          </Button>
        )}

        {statusMsg && (
          <p className="text-xs font-medium text-sage-700">{statusMsg}</p>
        )}
      </CardContent>
    </Card>
  );
}
