/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();

// Web Push Notification handler (Pengingat H-3 Jatuh Tempo Termin Vendor)
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload: {
    title?: string;
    body?: string;
    url?: string;
    tag?: string;
  } = {};

  try {
    payload = event.data.json();
  } catch {
    payload = { body: event.data.text() };
  }

  const title = payload.title || "Pengingat Tagihan NikahPlan";
  const options: NotificationOptions = {
    body: payload.body || "Ada termin pembayaran vendor yang segera jatuh tempo.",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: payload.tag || "nikahplan-due-reminder",
    data: { url: payload.url || "/vendors" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl =
    (event.notification.data as { url?: string } | undefined)?.url ||
    "/vendors";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if ("focus" in client && client.url.includes(targetUrl)) {
            return client.focus();
          }
        }
        return self.clients.openWindow(targetUrl);
      })
  );
});
