import type { NextRequest } from "next/server";
import { updateSessionAndGuard } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSessionAndGuard(request);
}

export const config = {
  matcher: [
    /*
     * Jalankan middleware di semua rute kecuali file statis, PWA, crawler SEO & aset gambar.
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|sw.js|sw.js.map|opengraph-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
