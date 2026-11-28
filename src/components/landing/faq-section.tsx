"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";

const FAQ_ITEMS = [
  {
    q: "Apakah benar cukup 1× bayar untuk berdua (2 akun)?",
    a: "Benar. Setelah Anda mengaktifkan Couple Pass, Anda langsung mendapatkan kode undangan (invite code) untuk pasangan. Pasangan cukup masuk lewat tautan undangan tersebut dan langsung terhubung ke workspace yang sama tanpa perlu membayar ulang.",
  },
  {
    q: "Apakah ada biaya langganan bulanan atau perpanjangan tahunan?",
    a: "Tidak ada. Seluruh paket NikahPlan bersifat satu kali bayar untuk seumur hidup — tidak ada tagihan otomatis, tidak ada biaya tersembunyi, dan seluruh data tetap bisa diakses bahkan setelah acara selesai.",
  },
  {
    q: "Apakah saya bisa upgrade dari Wedding Only ke Complete Pass nanti?",
    a: "Bisa kapan saja. Jika Anda memulai dari Wedding Only Pass, Anda tinggal membayar selisih harga saja melalui menu Profil untuk membuka Dompet Honeymoon dan Undangan Pernikahan Online.",
  },
  {
    q: "Apakah laporan anggaran dan daftar RSVP tamu bisa diunduh?",
    a: "Ya. Anda dapat mengekspor laporan anggaran lengkap (vendor, termin, sumber dana keluarga, angpao, dan bulan madu) ke format PDF maupun Excel (.xlsx), serta mengunduh daftar konfirmasi RSVP tamu ke Excel untuk kebutuhan katering atau WO.",
  },
  {
    q: "Bagaimana jika saya mengalami kendala pembayaran atau butuh bantuan?",
    a: "Tim Customer Service kami siap membantu melalui fitur Tiket Bantuan 2 arah di dalam aplikasi maupun lewat WhatsApp & Email resmi. Untuk kendala transaksi ganda atau aktivasi, berlaku garansi pengembalian dana penuh sesuai Syarat & Ketentuan.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-16 sm:py-24 px-4">
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-10 space-y-2.5">
          <p className="font-script text-2xl sm:text-3xl text-[#4F6BF6]">
            Pertanyaan Umum
          </p>
          <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#141618]">
            Sering ditanyakan sebelum memulai
          </h2>
          <p className="text-sm text-[#5F6978] max-w-xl mx-auto">
            Transparan sejak awal, tanpa biaya tersembunyi.
          </p>
        </div>

        <div className="space-y-2.5">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={item.q}
                className="rounded-2xl border border-black/[0.06] bg-white shadow-sm transition-colors hover:border-black/15"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm sm:text-[15px] font-semibold text-[#141618]">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-[#5F6978] transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-[#4F6BF6]" : ""
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-4.5 pt-0.5 text-xs sm:text-sm leading-relaxed text-[#5F6978]">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
