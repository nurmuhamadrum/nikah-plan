"use client";

import { motion } from "motion/react";
import {
  CheckCircle2,
  Gift,
  Heart,
  Music2,
  Plane,
  WifiOff,
} from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

const METRICS = [
  {
    value: "51+",
    label: "Pos Vendor Siap Pakai",
    desc: "Template lengkap rincian biaya nikah standar Indonesia.",
  },
  {
    value: "8 Tema",
    label: "Undangan Online + Musik",
    desc: "Desain beragam layout lengkap dengan amplop digital & RSVP.",
  },
  {
    value: "2 Akun",
    label: "Sekali Bayar Berdua",
    desc: "Undang pasangan gratis via WhatsApp ke workspace bersama.",
  },
];

const MILESTONES = [
  { label: "Lamaran & Target Dana", status: "Selesai", done: true },
  { label: "DP Gedung & Katering", status: "Lunas", done: true },
  { label: "Fitting Busana & MUA", status: "Terjadwal", done: false },
  { label: "Hari Bahagia & Resepsi", status: "Menuju Hari H", done: false },
];

export function BentoShowcase() {
  return (
    <div className="space-y-16 sm:space-y-20 px-4 py-10 sm:py-14">
      {/* ================================================================= */}
      {/* 1. BENTO 3-KOLOM ROMANTIS & SIMPLE (TANPA BEZEL GADGET)           */}
      {/* ================================================================= */}
      <section id="fitur" className="scroll-mt-20 mx-auto max-w-5xl space-y-10">
        <motion.div
          className="mx-auto max-w-xl text-center space-y-2"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: "some" }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <p className="font-script text-3xl text-[#4F6BF6] leading-none">
            Dari Lamaran ke Bulan Madu
          </p>
          <h2 className="font-display text-2xl font-bold leading-tight text-[#141618] sm:text-4xl">
            Semua Rencana Terjaga Rapi Berdua
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-stretch">
          {/* KOLOM 1: Rencana Berdua & Lini Masa Momen */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: "some" }}
            transition={{ duration: 0.6, delay: 0.05, ease: EASE }}
            className="flex flex-col justify-between gap-5 rounded-[2rem] border border-black/[0.06] bg-white p-6 shadow-card lg:col-span-4"
          >
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#4F6BF6]">
                Split Funding &amp; Termin
              </p>
              <h3 className="font-display text-lg font-bold text-[#141618]">
                Dana Berdua &amp; Dua Keluarga
              </h3>
              <p className="text-xs leading-relaxed text-[#5F6978]">
                Pisahkan tabungan bersama dan kontribusi orang tua tanpa salah
                paham.
              </p>
            </div>

            {/* Visual Proporsi Split Funding */}
            <div className="space-y-2 rounded-2xl bg-[#F4F5F7] p-3.5">
              <div className="flex justify-between text-[11px] font-semibold text-[#141618]">
                <span>Tabungan Berdua 60%</span>
                <span className="text-[#4F6BF6]">Keluarga 40%</span>
              </div>
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-[#E1E4EB]">
                <motion.span
                  className="h-full bg-[#141618]"
                  initial={{ width: 0 }}
                  whileInView={{ width: "60%" }}
                  viewport={{ once: true, amount: "some" }}
                  transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
                />
                <motion.span
                  className="h-full bg-[#4F6BF6]"
                  initial={{ width: 0 }}
                  whileInView={{ width: "40%" }}
                  viewport={{ once: true, amount: "some" }}
                  transition={{ duration: 0.8, delay: 0.35, ease: EASE }}
                />
              </div>
            </div>

            {/* Lini Masa Momen Beranimasi */}
            <div className="space-y-2.5 pt-1">
              {MILESTONES.map((step, idx) => (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: "some" }}
                  transition={{
                    duration: 0.45,
                    delay: 0.15 + idx * 0.08,
                    ease: EASE,
                  }}
                  className="flex items-center justify-between gap-2 text-xs"
                >
                  <span className="inline-flex items-center gap-2 font-medium text-[#141618] truncate">
                    <CheckCircle2
                      className={`h-3.5 w-3.5 shrink-0 ${
                        step.done ? "text-[#4F6BF6]" : "text-[#C7CDD8]"
                      }`}
                    />
                    <span className="truncate">{step.label}</span>
                  </span>
                  <span className="text-[10.5px] text-[#8994A4] shrink-0">
                    {step.status}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* KOLOM 2 (FOCAL POINT): Kartu Undangan Kubah (Arch Stationery — Bukan Bezel HP!) */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: "some" }}
            transition={{ duration: 0.6, delay: 0.14, ease: EASE }}
            className="flex flex-col justify-between overflow-hidden rounded-[2rem] border border-black/[0.06] bg-white px-6 pt-6 pb-0 text-center shadow-card lg:col-span-4"
          >
            <div className="space-y-1.5 pb-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#4F6BF6]">
                Undangan Digital
              </p>
              <h3 className="font-display text-lg font-bold text-[#141618]">
                8 Tema + Musik Ambient
              </h3>
              <p className="text-xs text-[#5F6978]">
                Bagikan tautan personal ke WhatsApp tamu lengkap dengan RSVP.
              </p>
            </div>

            {/* Arched Romantic Invitation Card (Double Gold Hairline Arch + Starlight) */}
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="relative mx-auto w-full max-w-[254px] overflow-hidden rounded-t-[7.75rem] bg-midnight-luxury px-6 pt-11 pb-8 text-white shadow-lift"
            >
              {/* Inner Double Gold Hairline Arch */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-2.5 top-2.5 bottom-0 rounded-t-[7rem] border border-b-0 border-[#E09F3E]/30"
              />

              {/* Starlight Micro Twinkles */}
              {[
                { left: "22%", top: "18%", delay: 0 },
                { left: "78%", top: "24%", delay: 1.1 },
                { left: "16%", top: "64%", delay: 2.0 },
              ].map((star, idx) => (
                <motion.span
                  key={idx}
                  aria-hidden="true"
                  style={{ left: star.left, top: star.top }}
                  className="pointer-events-none absolute h-1 w-1 rounded-full bg-[#F8D28C]"
                  animate={{ opacity: [0.2, 0.95, 0.2], scale: [0.85, 1.35, 0.85] }}
                  transition={{
                    duration: 3.2,
                    delay: star.delay,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              ))}
              {/* Delicate Ink-Draw Corner Botanical inside Invitation Arch */}
              <svg
                viewBox="0 0 120 120"
                fill="none"
                aria-hidden="true"
                className="pointer-events-none absolute -top-2 -right-2 h-24 w-24 text-white/15"
              >
                <motion.path
                  d="M110 10C88 26 64 56 42 108"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true, amount: "some" }}
                  transition={{ duration: 1.1, delay: 0.3, ease: EASE }}
                />
                <motion.path
                  d="M90 28C82 14 70 10 62 12C68 22 76 30 90 28Z"
                  stroke="currentColor"
                  strokeWidth="1.1"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true, amount: "some" }}
                  transition={{ duration: 0.7, delay: 0.55, ease: EASE }}
                />
              </svg>

              <p className="text-[9.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
                The Wedding Of
              </p>
              <p className="mt-2 font-script text-4xl leading-none text-[#E09F3E]">
                Andi &amp; Rina
              </p>
              <p className="mt-2 text-[11px] text-white/70">
                Sabtu, 24 Oktober 2026
              </p>

              <div className="my-4 flex items-center justify-center gap-2 text-white/30">
                <span className="h-px w-8 bg-white/20" />
                <Heart className="h-3 w-3 text-[#818CF8]" />
                <span className="h-px w-8 bg-white/20" />
              </div>

              {/* Indikator Musik Ambient Berdenyut Halus */}
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10.5px] font-medium text-white/90">
                <motion.span
                  animate={{ scale: [1, 1.18, 1] }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Music2 className="h-3 w-3 text-[#818CF8]" />
                </motion.span>
                <span>Romantic Piano · RSVP Live</span>
              </div>
            </motion.div>
          </motion.div>

          {/* KOLOM 3: Angpao ke Bulan Madu & Mode Offline */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: "some" }}
            transition={{ duration: 0.6, delay: 0.22, ease: EASE }}
            className="flex flex-col justify-between gap-5 rounded-[2rem] border border-black/[0.06] bg-white p-6 shadow-card lg:col-span-4"
          >
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#4F6BF6]">
                Angpao &amp; Honeymoon
              </p>
              <h3 className="font-display text-lg font-bold text-[#141618]">
                Dari Amplop ke Bulan Madu
              </h3>
              <p className="text-xs leading-relaxed text-[#5F6978]">
                Catat angpao resepsi lalu alokasikan langsung ke dompet bulan
                madu dalam 8 mata uang asing.
              </p>
            </div>

            {/* Ilustrasi Jalur Kurva Beranimasi (Angpao -> Honeymoon) */}
            <div className="rounded-2xl bg-[#F4F5F7] p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-[#141618]">
                <span className="inline-flex items-center gap-1.5">
                  <Gift className="h-3.5 w-3.5 text-[#E09F3E]" />
                  Angpao
                </span>
                <span className="inline-flex items-center gap-1.5">
                  Honeymoon
                  <Plane className="h-3.5 w-3.5 text-[#4F6BF6]" />
                </span>
              </div>

              <svg
                viewBox="0 0 220 34"
                fill="none"
                aria-hidden="true"
                className="h-8 w-full"
              >
                <motion.path
                  d="M8 26 C58 4, 162 4, 212 26"
                  stroke="#4F6BF6"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0.2 }}
                  whileInView={{ pathLength: 1, opacity: 1 }}
                  viewport={{ once: true, amount: "some" }}
                  transition={{ duration: 1.1, delay: 0.25, ease: EASE }}
                />
                <circle cx="8" cy="26" r="3.5" fill="#141618" />
                <circle cx="212" cy="26" r="3.5" fill="#4F6BF6" />
              </svg>

              <div className="flex items-center justify-between text-[11px] text-[#5F6978]">
                <span>Uang jajan harian</span>
                <span className="font-semibold text-[#141618]">
                  JPY · EUR · SGD · USD
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 rounded-2xl border border-black/[0.06] px-3.5 py-2.5 text-xs">
              <span className="inline-flex items-center gap-2 font-semibold text-[#141618]">
                <WifiOff className="h-3.5 w-3.5 text-[#4F6BF6]" />
                Tetap Jalan Tanpa Sinyal
              </span>
              <span className="text-[10.5px] font-medium text-[#5F6978]">
                Offline PWA
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pembatas Ornamen Romantis */}
      <div
        aria-hidden="true"
        className="mx-auto flex max-w-md items-center justify-center gap-3 text-[#C59B5F]"
      >
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#E09F3E]/40" />
        <span className="text-[10px]">✦</span>
        <Heart className="h-3.5 w-3.5 text-[#E09F3E]" />
        <span className="text-[10px]">✦</span>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#E09F3E]/40" />
      </div>

      {/* ================================================================= */}
      {/* 2. BARIS 3 ANGKA RINGKAS (BERSIH TANPA KOTAK)                     */}
      {/* ================================================================= */}
      <section className="mx-auto max-w-4xl py-2">
        <div className="grid grid-cols-1 gap-8 text-center sm:grid-cols-3">
          {METRICS.map((m, idx) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: "some" }}
              transition={{ duration: 0.55, delay: idx * 0.1, ease: EASE }}
              className="space-y-1.5 px-2"
            >
              <p className="text-xs font-semibold text-[#5F6978]">{m.label}</p>
              <p className="font-display text-4xl font-bold tracking-tight text-[#141618] sm:text-5xl">
                {m.value}
              </p>
              <p className="mx-auto max-w-[220px] text-xs leading-relaxed text-[#727B88]">
                {m.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
