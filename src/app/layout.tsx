import type { Metadata, Viewport } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "NikahPlan — Wedding & Honeymoon Budget Planner",
    template: "%s | NikahPlan",
  },
  description:
    "Atur anggaran pernikahan, termin DP vendor, pembagian sumber dana keluarga, angpao, hingga dompet bulan madu bersama pasangan dalam satu aplikasi PWA offline-first.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NikahPlan",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  keywords: [
    "wedding budget planner indonesia",
    "perencana anggaran pernikahan",
    "honeymoon budget tracker",
    "aplikasi persiapan nikah",
    "angpao tracker",
  ],
};

export const viewport: Viewport = {
  themeColor: "#3D5245",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${plusJakarta.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-cream text-foreground">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
