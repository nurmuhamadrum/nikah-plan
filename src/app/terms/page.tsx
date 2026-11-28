import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileText, Mail, MessageCircle, ShieldCheck } from "lucide-react";
import { getDynamicSiteContents } from "@/lib/dynamic-config";
import { NikahPlanLogo } from "@/components/brand/logo";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Syarat & Ketentuan",
  description:
    "Syarat dan ketentuan penggunaan layanan NikahPlan Couple Pass, kebijakan pembayaran Midtrans, serta kebijakan pengembalian dana.",
};

function formatWaLink(rawNumber: string, text: string): string {
  const digits = rawNumber.replace(/[^\d]/g, "");
  const normalized = digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}

export default async function TermsPage() {
  const { supportContact } = await getDynamicSiteContents();
  const waHref = formatWaLink(
    supportContact.whatsappNumber,
    "Halo Tim CS NikahPlan, saya ingin bertanya terkait Syarat & Ketentuan layanan."
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
              href="/privacy"
              className="text-xs font-semibold text-[#5F6978] hover:text-[#141618] transition-colors"
            >
              Kebijakan Privasi
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
            <FileText className="h-3.5 w-3.5 text-[#E09F3E]" />
            Dokumen Resmi Layanan
          </div>
          <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight">
            Syarat &amp; Ketentuan Penggunaan
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-white/75 leading-relaxed">
            Ketentuan ini mengatur penggunaan platform perencanaan anggaran pernikahan,
            undangan digital, dan dompet bulan madu NikahPlan. Dengan mendaftar atau
            melakukan transaksi, Anda menyetujui ketentuan di bawah ini.
          </p>
          <p className="mt-4 text-xs text-white/55">
            Terakhir diperbarui: November 2026
          </p>
        </div>

        <article className="rounded-3xl border border-black/[0.06] bg-white p-6 sm:p-9 shadow-card space-y-7 text-sm leading-relaxed text-[#3B4351]">
          <section className="space-y-2">
            <h2 className="font-display text-lg font-bold text-[#141618]">
              1. Ruang Lingkup Layanan Couple Pass
            </h2>
            <p>
              NikahPlan menyediakan perangkat lunak berbasis web (PWA) untuk perencanaan
              anggaran pernikahan, pengelolaan vendor &amp; termin pembayaran, pencatatan
              angpao, undangan pernikahan digital, serta pengelolaan anggaran bulan madu.
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Wedding Only Pass:</strong> Mencakup workspace kolaborasi 2 akun
                pasangan, alokasi anggaran, vendor &amp; termin, pelacakan sumber dana
                keluarga, pencatatan angpao, panduan skenario, serta ekspor laporan PDF &amp;
                Excel.
              </li>
              <li>
                <strong>Complete Couple Pass:</strong> Mencakup seluruh fitur Wedding Only
                Pass ditambah modul Dompet Honeymoon multi-mata uang, Checklist Bulan Madu,
                dan Pembuat Undangan Pernikahan Online (8 tema, musik ambient, RSVP, serta
                buku tamu).
              </li>
              <li>
                Setiap paket berlaku <strong>satu kali bayar tanpa biaya langganan bulanan</strong>{" "}
                untuk 1 workspace bersama yang dapat diakses hingga 2 akun (Pemilik &amp;
                Pasangan).
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-lg font-bold text-[#141618]">
              2. Akun, Keamanan &amp; Kolaborasi Pasangan
            </h2>
            <p>
              Anda bertanggung jawab menjaga kerahasiaan kredensial akun dan kode undangan
              pasangan (<em>invite code</em>). Pemilik workspace dapat mengundang 1 pasangan
              untuk berkolaborasi secara real-time dalam workspace yang sama tanpa biaya
              tambahan.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-lg font-bold text-[#141618]">
              3. Pembayaran, Promo &amp; Upgrade Paket
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                Seluruh transaksi pembayaran diproses secara aman melalui mitra gateway
                pembayaran resmi <strong>Midtrans</strong> (QRIS, Virtual Account, E-Wallet,
                maupun kartu debit/kredit yang didukung).
              </li>
              <li>
                Aktivasi akses Couple Pass berlangsung otomatis segera setelah Midtrans
                mengonfirmasi status pembayaran berhasil (<em>settlement</em>).
              </li>
              <li>
                Pengguna paket <em>Wedding Only Pass</em> dapat melakukan <em>upgrade</em> ke{" "}
                <em>Complete Couple Pass</em> kapan saja dengan membayar selisih harga yang
                berlaku.
              </li>
              <li>
                Kode promo bersifat opsional, tunduk pada batas waktu dan kuota pemakaian,
                serta tidak dapat diuangkan.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-lg font-bold text-[#141618]">
              4. Kebijakan Pengembalian Dana (Refund Policy)
            </h2>
            <p>
              Karena NikahPlan adalah produk digital yang akses penuhnya langsung terbuka
              setelah pembayaran terverifikasi, pembayaran yang telah aktif umumnya bersifat
              final. Namun, kami menjamin pengembalian dana penuh (100%) dalam kondisi
              berikut apabila diajukan dalam waktu <strong>7 hari kalender</strong> sejak
              tanggal transaksi:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                Terjadi transaksi ganda (<em>double charge</em>) untuk akun yang sama akibat
                gangguan jaringan atau payment gateway.
              </li>
              <li>
                Pembayaran telah terpotong/berhasil namun akses workspace gagal diaktifkan
                dan tidak dapat diselesaikan oleh tim teknis kami dalam 2×24 jam.
              </li>
              <li>
                Terjadi kegagalan sistem kritis yang membuat fitur utama paket yang dibeli
                tidak dapat digunakan sama sekali.
              </li>
            </ul>
            <p>
              Pengajuan pengembalian dana dapat dilakukan melalui tiket Customer Service di
              aplikasi atau email resmi dengan menyertakan <strong>Order ID Midtrans</strong>{" "}
              dan email akun terdaftar. Proses verifikasi &amp; pengembalian dana memakan
              waktu 3–7 hari kerja.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-lg font-bold text-[#141618]">
              5. Konten Pengguna &amp; Undangan Publik
            </h2>
            <p>
              Anda memegang penuh hak atas data, foto, dan teks yang diunggah ke workspace
              maupun halaman undangan publik (<code>/u/[slug]</code>). Anda dilarang
              mengunggah materi yang melanggar hukum, hak cipta pihak ketiga, pornografi,
              penipuan, atau spam. NikahPlan berhak menonaktifkan halaman publik yang
              terbukti melanggar ketentuan ini.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-lg font-bold text-[#141618]">
              6. Ketersediaan Layanan &amp; Mode Offline
            </h2>
            <p>
              NikahPlan dirancang dengan arsitektur PWA offline-first agar Anda tetap dapat
              membaca dan mencatat pengeluaran saat sinyal tidak stabil, lalu menyinkronkan
              otomatis saat online kembali. Kami berupaya menjaga ketersediaan server
              setinggi mungkin dan menyediakan fitur ekspor PDF &amp; Excel agar Anda selalu
              memiliki salinan cadangan pribadi.
            </p>
          </section>

          <section className="rounded-2xl border border-[#4F6BF6]/20 bg-[#F4F5F7] p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[#141618]">
              <ShieldCheck className="h-4 w-4 text-[#4F6BF6]" />
              Hubungi Customer Service NikahPlan
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
