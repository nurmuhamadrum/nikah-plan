import type { Metadata, Viewport } from "next";
import { Allura, Inter, Plus_Jakarta_Sans } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import { BackgroundDecor } from "@/components/brand/background-decor";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
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
      { url: "/icons/icon.svg", type: "image/svg+xml" },
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
  themeColor: "#141726",
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
      className={`${inter.variable} ${plusJakarta.variable} ${allura.variable}`}
      suppressHydrationWarning
    >
      <body
        className="min-h-screen bg-canvas text-foreground"
        suppressHydrationWarning
      >
        <BackgroundDecor />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
