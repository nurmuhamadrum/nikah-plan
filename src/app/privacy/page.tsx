import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Lock, Mail, MessageCircle, ShieldCheck } from "lucide-react";
import { getDynamicSiteContents } from "@/lib/dynamic-config";
import { NikahPlanLogo } from "@/components/brand/logo";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description:
    "Kebijakan privasi dan perlindungan data pribadi pengguna NikahPlan, termasuk isolasi workspace, enkripsi, dan penyimpanan offline.",
};

function formatWaLink(rawNumber: string, text: string): string {
  const digits = rawNumber.replace(/[^\d]/g, "");
  const normalized = digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}

export default async function PrivacyPage() {
  const { supportContact } = await getDynamicSiteContents();
  const waHref = formatWaLink(
    supportContact.whatsappNumber,
    "Halo Tim CS NikahPlan, saya ingin bertanya terkait Kebijakan Privasi & data akun."
  );

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-[#141618]">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-gradient-to-b from-[#E5EAF8]/80 to-transparent" />

      <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <Link href="/" aria-label="NikahPlan Beranda">
            <NikahPlanLogo size="md" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/terms"
              className="text-xs font-semibold text-[#5F6978] hover:text-[#141618] transition-colors"
            >
              Syarat &amp; Ketentuan
            </Link>
            <Link
              href="/"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-midnight-btn px-4 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Beranda
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl px-4 py-10 sm:py-14 space-y-8">
        <div className="rounded-3xl bg-midnight-luxury p-7 sm:p-10 text-white shadow-card">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-white/90 mb-4">
            <Lock className="h-3.5 w-3.5 text-[#E09F3E]" />
            Perlindungan Data Pasangan
          </div>
          <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight">
            Kebijakan Privasi
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-white/75 leading-relaxed">
            Privasi rencana keuangan pernikahan Anda adalah prioritas utama kami. Dokumen
            ini menjelaskan bagaimana NikahPlan mengumpulkan, menyimpan, melindungi, dan
            mengelola data Anda.
          </p>
          <p className="mt-4 text-xs text-white/55">
            Terakhir diperbarui: November 2026
          </p>
        </div>

        <article className="rounded-3xl border border-black/[0.06] bg-white p-6 sm:p-9 shadow-card space-y-7 text-sm leading-relaxed text-[#3B4351]">
          <section className="space-y-2">
            <h2 className="font-display text-lg font-bold text-[#141618]">
              1. Data yang Kami Kumpulkan
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Data Akun:</strong> Nama lengkap, alamat email, serta foto profil
                (jika masuk melalui Google OAuth) untuk keperluan autentikasi dan kolaborasi
                workspace.
              </li>
              <li>
                <strong>Data Perencanaan Pernikahan:</strong> Nama pasangan, target anggaran,
                daftar vendor, jadwal termin pembayaran, bukti bayar yang diunggah, catatan
                angpao, pengeluaran bulan madu, serta konfigurasi undangan digital.
              </li>
              <li>
                <strong>Data RSVP Tamu:</strong> Nama tamu, status kehadiran, jumlah pax,
                dan ucapan doa yang dikirimkan melalui tautan undangan publik milik Anda.
              </li>
              <li>
                <strong>Data Transaksi:</strong> Order ID, jenis paket, nominal pembayaran,
                kode promo, dan status pembayaran dari Midtrans. Kami{" "}
                <strong>tidak pernah menyimpan</strong> nomor kartu kredit, CVV, maupun PIN
                rekening bank Anda.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-lg font-bold text-[#141618]">
              2. Isolasi Workspace &amp; Keamanan Data
            </h2>
            <p>
              Seluruh data anggaran, vendor, bukti pembayaran, dan angpao dilindungi oleh
              kebijakan <strong>Row-Level Security (RLS)</strong> di level basis data.
              Hanya Anda dan pasangan yang tergabung dalam workspace yang sama yang dapat
              membaca atau mengubah data tersebut. Komunikasi data dilindungi enkripsi HTTPS
              (TLS).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-lg font-bold text-[#141618]">
              3. Penyimpanan Lokal (Offline-First IndexedDB) &amp; Cookie
            </h2>
            <p>
              Untuk mendukung penggunaan saat sinyal lemah atau tanpa internet, NikahPlan
              menyimpan salinan terenkripsi browser di <strong>IndexedDB</strong> perangkat
              Anda dan memakai cookie sesi autentikasi esensial. Anda dapat membersihkan
              cache lokal kapan saja melalui menu <strong>Profil → Bersihkan Cache Lokal</strong>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-lg font-bold text-[#141618]">
              4. Mitra Infrastruktur Pihak Ketiga
            </h2>
            <p>
              Kami tidak pernah menjual atau menyewakan data pribadi Anda kepada pihak
              ketiga atau pengiklan. Pemrosesan infrastruktur hanya menggunakan mitra
              terpercaya:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Supabase:</strong> Autentikasi akun, basis data PostgreSQL, dan
                penyimpanan file (bukti pembayaran &amp; galeri undangan).
              </li>
              <li>
                <strong>Midtrans:</strong> Pemrosesan pembayaran transaksi Couple Pass secara
                terstandarisasi.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-lg font-bold text-[#141618]">
              5. Hak Akses, Ekspor &amp; Penghapusan Data
            </h2>
            <p>
              Anda memiliki kendali penuh atas data Anda:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                Mengunduh salinan lengkap data anggaran, vendor, angpao, bulan madu, dan
                rekap RSVP dalam format <strong>PDF</strong> maupun <strong>Excel (.xlsx)</strong>{" "}
                kapan saja.
              </li>
              <li>
                Menonaktifkan atau menghapus tautan undangan publik kapan pun dari menu
                Undangan.
              </li>
              <li>
                Meminta penghapusan akun beserta seluruh data workspace secara permanen
                melalui email atau tiket Customer Service di bawah ini.
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-[#4F6BF6]/20 bg-[#F4F5F7] p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[#141618]">
              <ShieldCheck className="h-4 w-4 text-[#4F6BF6]" />
              Pertanyaan Privasi &amp; Permintaan Hapus Data
            </div>
            <p className="text-xs text-[#5F6978]">
              Jam operasional: <strong>{supportContact.operationalHours}</strong> &bull;{" "}
              {supportContact.responseEstimate}
            </p>
            <div className="flex flex-wrap gap-2.5 pt-1">
              <a
                href={`mailto:${supportContact.email}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold text-[#141618] hover:border-black/25 transition-colors"
              >
                <Mail className="h-3.5 w-3.5 text-[#4F6BF6]" />
                {supportContact.email}
              </a>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-midnight-btn px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
              >
                <MessageCircle className="h-3.5 w-3.5 text-[#E09F3E]" />
                WhatsApp Customer Service
              </a>
            </div>
          </section>
        </article>
      </main>
    </div>
  );
}
