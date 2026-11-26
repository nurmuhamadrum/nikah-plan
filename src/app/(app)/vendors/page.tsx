import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedProfileAndWorkspace } from "@/lib/workspace-server";
import { VendorsClient } from "./vendors-client";

export const metadata: Metadata = {
  title: "Vendor & Termin Pembayaran",
  description:
    "Kelola kategori anggaran, perbandingan estimasi vs harga deal vendor, termin DP, sumber dana, dan bukti bayar.",
};

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; new?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { profile, bundle } =
    await getAuthenticatedProfileAndWorkspace(supabase);

  if (!profile) {
    redirect("/login?next=/vendors");
  }

  if (!profile.has_paid) {
    redirect("/checkout");
  }

  if (!bundle) {
    redirect("/onboarding");
  }

  return (
    <VendorsClient
      initialBundle={bundle}
      initialCategoryId={params.category}
      openNewVendorOnMount={params.new === "1"}
    />
  );
}
