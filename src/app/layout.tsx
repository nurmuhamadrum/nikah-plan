import type { Metadata, Viewport } from "next";
import { Allura, Fraunces, Manrope } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import { BackgroundDecor } from "@/components/brand/background-decor";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["SOFT", "opsz"],
  display: "swap",
});

const allura = Allura({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-script",
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
    <html
      lang="id"
      className={`${manrope.variable} ${fraunces.variable} ${allura.variable}`}
    >
      <body className="min-h-screen bg-canvas text-foreground">
        <BackgroundDecor />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
