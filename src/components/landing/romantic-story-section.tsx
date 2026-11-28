"use client";

import { motion } from "motion/react";
import { Compass, Heart, Mail, Wallet } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

const STORY_CHAPTERS = [
  {
    step: "01",
    title: "Merangkai Impian",
    desc: "Tentukan target dana, estimasi tamu, dan konsep acara impian bersama pasangan sejak hari pertama.",
    icon: Heart,
  },
  {
    step: "02",
    title: "Menjaga Rencana Berdua",
    desc: "Catat vendor, jadwal termin DP, dan kontribusi dua keluarga secara transparan tanpa salah paham.",
    icon: Wallet,
  },
  {
    step: "03",
    title: "Mengabarkan Hari Bahagia",
    desc: "Bagikan undangan digital beriring musik lembut ke WhatsApp tamu dan pantau ucapan doa secara langsung.",
    icon: Mail,
  },
  {
    step: "04",
    title: "Menikmati Bulan Madu",
    desc: "Catat angpao resepsi lalu alokasikan langsung ke dompet perjalanan bulan madu dalam 8 mata uang asing.",
    icon: Compass,
  },
];

export function RomanticStorySection() {
  return (
    <section className="relative px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-5xl space-y-12">
        {/* Heading */}
        <motion.div
          className="mx-auto max-w-xl text-center space-y-2"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: "some" }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <p className="font-script text-3xl text-[#4F6BF6] leading-none">
            Empat Babak Menuju Pelaminan
          </p>
          <h2 className="font-display text-2xl font-bold leading-tight text-[#141618] sm:text-4xl">
            Setiap langkah terasa lebih tenang saat dijalani berdua
          </h2>
        </motion.div>

        {/* 4 Babak Perjalanan */}
        <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Garis penghubung tipis di desktop */}
          <div
            aria-hidden="true"
            className="pointer-events-none hidden lg:block absolute top-11 left-12 right-12 h-px bg-gradient-to-r from-transparent via-[#E09F3E]/45 to-transparent"
          />

          {STORY_CHAPTERS.map((chapter, idx) => {
            const Icon = chapter.icon;
            return (
              <motion.div
                key={chapter.step}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: "some" }}
                transition={{ duration: 0.55, delay: idx * 0.09, ease: EASE }}
                className="relative flex flex-col gap-3 rounded-[1.75rem] border border-black/[0.06] bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F4F5F7] text-[#4F6BF6] border border-black/[0.05]">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <span className="font-script text-2xl text-[#E09F3E] leading-none">
                    {chapter.step}
                  </span>
                </div>
                <div className="space-y-1">
                  <h3 className="font-display text-base font-bold text-[#141618]">
                    {chapter.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-[#5F6978]">
                    {chapter.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Kutipan Puitis Editorial */}
        <motion.blockquote
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: "some" }}
          transition={{ duration: 0.65, ease: EASE }}
          className="mx-auto max-w-2xl text-center space-y-3 pt-2"
        >
          <div
            aria-hidden="true"
            className="mx-auto flex w-28 items-center justify-center gap-2 text-[#E09F3E]"
          >
            <span className="h-px flex-1 bg-[#E09F3E]/40" />
            <span className="text-[10px]">✦</span>
            <span className="h-px flex-1 bg-[#E09F3E]/40" />
          </div>
          <p className="font-script text-3xl sm:text-[2.15rem] leading-snug text-[#181C2E]">
            &ldquo;Karena perjalanan menuju pelaminan seharusnya penuh bahagia,
            bukan penuh drama biaya.&rdquo;
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#727B88]">
            NikahPlan &mdash; From &ldquo;I Do&rdquo; to Honeymoon
          </p>
        </motion.blockquote>
      </div>
    </section>
  );
}
