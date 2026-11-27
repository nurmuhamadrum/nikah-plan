import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { UserGuideClient } from "@/app/user-guide/user-guide-client";

export const metadata: Metadata = {
  title: "User Guide & Cara Pakai Aplikasi",
  description:
    "Panduan lengkap langkah demi langkah menggunakan seluruh fitur NikahPlan: Onboarding & Undang Pasangan, Kesehatan Anggaran, Vendor & Termin DP, Angpao Bridge, Honeymoon Multi-Mata Uang, Undangan Online 8 Tema, Mode Offline PWA, hingga Ekspor PDF/Excel.",
};

export default async function UserGuidePage() {
  let isLoggedIn = false;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isLoggedIn = Boolean(user);
  } catch {
    isLoggedIn = false;
  }

  return <UserGuideClient isLoggedIn={isLoggedIn} />;
}
