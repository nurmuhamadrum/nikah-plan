import type { Metadata, Viewport } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
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
        {children}
      </body>
    </html>
  );
}
