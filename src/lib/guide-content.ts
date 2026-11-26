/**
 * Konten Panduan Interaktif NikahPlan
 * Diadaptasi dari lampiran DOCX ("Panduan Lengkap Pernikahan Impian Tanpa Stres & Tanpa Boros")
 * dan Sheet Panduan Penggunaan XLSX.
 */

export interface WifeItem {
  letter: "W" | "I" | "F" | "E";
  title: string;
  question: string;
  placeholder: string;
  hint: string;
}

export const WIFE_FRAMEWORK: WifeItem[] = [
  {
    letter: "W",
    title: "Witness (Tamu Undangan)",
    question: "Berapa tamu yang benar-benar ingin hadir menyaksikan hari bahagia kalian?",
    placeholder: "Misal: 200 tamu (keluarga inti, sahabat dekat, & rekan kerja inti)",
    hint: "Jumlah tamu adalah penentu utama biaya katering & ukuran gedung.",
  },
  {
    letter: "I",
    title: "Image (Kesan & Visual)",
    question: "Kesan apa yang ingin ditinggalkan? Intim, hangat, elegan, atau rustic?",
    placeholder: "Misal: Intim & hangat bernuansa sage-terracotta, dekorasi minimalis",
    hint: "Konsep yang jelas mencegah Anda tergoda menambah dekorasi tidak perlu.",
  },
  {
    letter: "F",
    title: "Feel (Suasana Acara)",
    question: "Suasana seperti apa yang kalian rasakan di hari H? Santai atau formal?",
    placeholder: "Misal: Santai, banyak waktu ngobrol dengan tamu, musik akustik lembut",
    hint: "Menentukan pilihan MC, musik live/playlist, dan susunan rundown.",
  },
  {
    letter: "E",
    title: "Evidence (Dokumentasi Kenangan)",
    question: "Dokumentasi seperti apa yang ingin kalian kenang seumur hidup?",
    placeholder: "Misal: Foto candid natural + video highlight 3 menit tanpa album cetak tebal",
    hint: "Foto & video bertahan seumur hidup; fokus pada gaya fotografer yang cocok.",
  },
];

export interface PriorityLayer {
  layer: number;
  name: string;
  share: string;
  badgeClass: string;
  barClass: string;
  items: { title: string; note: string }[];
}

export const PRIORITY_PYRAMID: PriorityLayer[] = [
  {
    layer: 1,
    name: "Lapisan 1: Non-Negotiable",
    share: "50 – 60% Budget",
    badgeClass: "bg-sage text-cream-50",
    barClass: "border-sage/30 bg-sage-50/80",
    items: [
      { title: "Venue & Dekorasi", note: "Hal pertama yang dilihat tamu saat tiba." },
      { title: "Catering & Konsumsi", note: "Tamu selalu mengingat kualitas & kecukupan makanan." },
      { title: "Dokumentasi (Foto & Video)", note: "Kenangan visual yang bertahan seumur hidup." },
    ],
  },
  {
    layer: 2,
    name: "Lapisan 2: Important",
    share: "25 – 35% Budget",
    badgeClass: "bg-terracotta text-white",
    barClass: "border-terracotta/25 bg-terracotta-50/70",
    items: [
      { title: "Busana Pengantin", note: "Penampilan terbaik di hari spesial — sewa jauh lebih hemat." },
      { title: "Entertainment & MC", note: "Penentu ritme dan kehangatan suasana acara." },
      { title: "Make Up & Riasan", note: "Kepercayaan diri pengantin & keluarga inti (wajib trial MUA)." },
    ],
  },
  {
    layer: 3,
    name: "Lapisan 3: Nice to Have & Cadangan",
    share: "10 – 15% Budget",
    badgeClass: "bg-amberwarm text-sage-900",
    barClass: "border-amberwarm/35 bg-amberwarm-light/55",
    items: [
      { title: "Undangan & Souvenir", note: "Bisa dihemat hingga 70% dengan strategi digital-first." },
      { title: "Transportasi & Floral", note: "Bisa dibantu kerabat atau gunakan bunga artificial elegan." },
      { title: "Dana Darurat (Wajib 5–10%)", note: "Anggap pos biaya mati; jangan disentuh kecuali darurat." },
    ],
  },
];

export const PRIORITY_STEPS = [
  "Diskusikan berdua: Apa 3 hal terpenting dari pernikahan kalian?",
  "Kunci jumlah tamu terlebih dahulu — ini penentu utama biaya katering & venue.",
  "Tetapkan total anggaran final di awal, bukan mengikuti harga vendor.",
  "Alokasikan dari Lapisan 1 (Non-Negotiable) lebih dulu, lalu turun ke bawah.",
  "Review dan sesuaikan proporsi setelah survei 3 vendor pertama.",
];

export const UNDER_50M_TIPS = [
  {
    category: "Venue & Dekorasi",
    target: "Target: Rp 10 – 14 Juta",
    tips: [
      "Pilih hari Minggu atau hari kerja — harga sering 20–30% lebih murah dari Sabtu.",
      "Aula masjid, gedung komunitas, atau balai serbaguna bisa sangat representatif.",
      "Minta paket bundling venue + dekorasi (biasanya lebih hemat ~15%).",
      "Dekorasi minimalis tapi elegan lebih cepat dikerjakan dan hemat biaya bunga.",
    ],
  },
  {
    category: "Catering & Konsumsi",
    target: "Target: Rp 55.000 – 80.000 / pax",
    tips: [
      "Batasi jumlah tamu — cara paling efektif menekan biaya katering.",
      "Prasmanan (buffet) lebih hemat dibanding terlalu banyak gubukan / live station.",
      "5–7 menu berkualitas jauh lebih berkesan daripada 15 menu biasa saja.",
      "Tanyakan batas minimum order vendor untuk membuka harga per pax terbaik.",
    ],
  },
  {
    category: "Dokumentasi (Foto & Video)",
    target: "Target: Rp 3 – 5 Juta",
    tips: [
      "Fotografer berkembang (pengalaman 2–3 tahun) menawarkan kualitas solid dengan harga kompetitif.",
      "Tanyakan paket bundling prewedding + hari H untuk potongan harga khusus.",
      "Jika budget sangat ketat, prioritaskan foto berkualitas tinggi dibanding paket video sinematik panjang.",
    ],
  },
];

export interface DigitalSavingItem {
  id: string;
  from: string;
  to: string;
  savingLabel: string;
  savingAvg: number;
}

export const DIGITAL_FIRST_CHECKLIST: DigitalSavingItem[] = [
  {
    id: "e_invite",
    from: "Undangan cetak ratusan pcs",
    to: "E-Invitation + cetak terbatas untuk orang tua/sesepuh",
    savingLabel: "Hemat Rp 500rb – 1,5 Jt",
    savingAvg: 1_000_000,
  },
  {
    id: "qr_guestbook",
    from: "Buku tamu fisik & pulpen khusus",
    to: "QR Code Digital Guestbook",
    savingLabel: "Hemat Rp 200rb – 500rb",
    savingAvg: 350_000,
  },
  {
    id: "online_gallery",
    from: "Cetak banyak album kolase tebal",
    to: "Galeri foto online + link download (cetak 1 album utama saja)",
    savingLabel: "Hemat Rp 500rb – 1 Jt",
    savingAvg: 750_000,
  },
  {
    id: "gmaps_link",
    from: "Denah lokasi cetak & petunjuk jalan fisik",
    to: "Share link Google Maps di undangan & WhatsApp",
    savingLabel: "Hemat Rp 150rb – 300rb",
    savingAvg: 225_000,
  },
];

export interface NegotiationScriptTemplate {
  id: string;
  vendorType: string;
  title: string;
  tactic: string;
  buildScript: (params: {
    weddingDateLabel: string;
    guestCount: number;
    targetCateringPerPax: string;
  }) => string;
}

export const NEGOTIATION_SCRIPTS: NegotiationScriptTemplate[] = [
  {
    id: "venue",
    vendorType: "Venue & Gedung",
    title: "Script Pembuka & Early Booking DP",
    tactic: "Tawarkan DP lebih besar (40–50%) atau booking jauh hari untuk membuka diskon 5–10%.",
    buildScript: ({ weddingDateLabel, guestCount }) =>
      `Halo Kak, saya sudah lihat portfolio venue-nya dan sangat tertarik. Kami berencana menikah pada ${weddingDateLabel} untuk sekitar ${guestCount} tamu. Harga yang tertera di pricelist adalah Rp [harga pricelist]. Apakah ada harga terbaik atau bonus fasilitas yang bisa diberikan, mengingat kami booking lebih awal dan bersedia membayar DP lebih besar? Terima kasih Kak!`,
  },
  {
    id: "photo_video",
    vendorType: "Fotografer & Videografer",
    title: "Script Bundling + Referral",
    tactic: "Testimoni jujur & referral ke teman adalah mata uang sosial yang sangat bernilai bagi vendor.",
    buildScript: ({ weddingDateLabel }) =>
      `Halo Kak, saya suka banget gaya fotonya! Kami berencana menikah pada ${weddingDateLabel}. Kalau kami ambil paket foto + video sekaligus (bundling), apakah bisa dapat harga yang lebih menarik atau bonus prioritas editing lebih cepat? Kami juga siap kasih testimoni lengkap dan rekomendasikan ke teman-teman yang mau nikah tahun ini.`,
  },
  {
    id: "catering",
    vendorType: "Catering & Konsumsi",
    title: "Script Optimasi Minimum Order & Menu",
    tactic: "Sesuaikan variasi menu atau naikkan sedikit porsi agar harga satuan per pax turun.",
    buildScript: ({ weddingDateLabel, guestCount, targetCateringPerPax }) =>
      `Halo Kak, kami sedang merencanakan resepsi pada ${weddingDateLabel} untuk estimasi ${guestCount} pax. Jika kami sesuaikan ke ${guestCount + 20} pax, apakah harga per pax-nya bisa turun? Atau adakah kombinasi menu yang bisa kami tukar agar harga lebih sesuai budget kami di sekitar ${targetCateringPerPax}/pax? Terima kasih banyak Kak!`,
  },
];

export const NEGOTIATION_ADDONS = [
  { item: "Jam overtime gratis (+1–2 jam)", value: "Rp 500rb – 2 Jt" },
  { item: "Free backdrop / banner digital", value: "Rp 300rb – 800rb" },
  { item: "Include petugas / tim tambahan", value: "Rp 500rb – 1,5 Jt" },
  { item: "Cicilan termin DP lebih fleksibel", value: "Bantu arus kas" },
  { item: "Prioritas editing lebih cepat", value: "2–4 minggu lebih awal" },
  { item: "Diskon porsi tamu tambahan", value: "Harga per pax lebih murah" },
  { item: "Free jam setup / breakdown", value: "Rp 300rb – 500rb" },
];

export const NEGOTIATION_DOS_DONTS = {
  dos: [
    "Riset harga rata-rata pasar terlebih dahulu sebelum menghubungi vendor.",
    "Tunjukkan antusiasme tulus pada karya dan portfolio vendor.",
    "Tawarkan nilai balik (DP lebih besar, jadwal non-peak, testimoni/referral).",
    "Bandingkan minimal 3 penawaran vendor per kategori.",
    "Tuangkan seluruh kesepakatan & bonus secara tertulis di kontrak.",
    "Tanyakan rincian komponen biaya termasuk pajak, listrik, & overtime.",
  ],
  donts: [
    "Menawar sembarangan tanpa tahu kisaran harga pasar.",
    "Langsung menembak 'harga paling mentok berapa?' di chat pertama.",
    "Meminta diskon besar tanpa alasan atau penawaran balik yang jelas.",
    "Hanya survei 1 vendor lalu langsung deal karena terburu-buru.",
    "Hanya mengandalkan janji lisan di chat tanpa klausul kontrak.",
    "Melewatkan syarat pembatalan, reschedule, dan biaya tersembunyi.",
  ],
};

export interface FatalMistakeItem {
  id: string;
  number: string;
  title: string;
  problem: string;
  solution: string;
}

export const FATAL_MISTAKES: FatalMistakeItem[] = [
  {
    id: "m01",
    number: "01",
    title: "Tidak Menetapkan Total Budget di Awal",
    problem:
      "Langsung survei vendor tanpa angka batas final membuat Anda mudah tergiur paket mahal dan baru sadar kekurangan dana di tengah jalan.",
    solution:
      "Tetapkan total anggaran FINAL bersama pasangan & keluarga terlebih dahulu, kunci di NikahPlan, baru mulai survei vendor.",
  },
  {
    id: "m02",
    number: "02",
    title: "Tidak Punya Dana Darurat",
    problem:
      "Mengalokasikan 100% dana ke vendor tanpa cadangan berisiko memicu stres saat muncul tamu ekstra atau kebutuhan mendadak hari H.",
    solution:
      "Wajib sisihkan minimal 10% dari total budget sebagai pos Dana Darurat. Anggap ini pos biaya, bukan sisa tabungan.",
  },
  {
    id: "m03",
    number: "03",
    title: "Booking Vendor Tanpa Kontrak Tertulis",
    problem:
      "Mengandalkan kenalan atau kepercayaan lisan sangat berisiko bila terjadi perubahan layanan, keterlambatan, atau selisih paham.",
    solution:
      "Selalu minta kontrak tertulis mencantumkan tanggal, jam, rincian layanan, harga final, syarat pembatalan, dan konsekuensi keterlambatan.",
  },
  {
    id: "m04",
    number: "04",
    title: "Terlalu Banyak Tamu karena Tekanan Sosial",
    problem:
      "Merasa 'tidak enak' lalu mengundang semua relasi jauh adalah jebakan biaya terbesar — setiap +50 tamu menambah minimal Rp 3–5 Jt.",
    solution:
      "Buat daftar tamu berdasarkan tingkat kedekatan & kapasitas budget. Ingat: 200 tamu dengan makanan enak lebih berkesan daripada 500 tamu yang kecewa.",
  },
  {
    id: "m05",
    number: "05",
    title: "Tidak Membandingkan Minimal 3 Vendor",
    problem:
      "Langsung deal pada vendor pertama yang ditemui membuat Anda kehilangan pembanding harga, kualitas layanan, dan ruang negosiasi.",
    solution:
      "Kumpulkan minimal 3 proposal per kategori utama (venue, catering, foto), bandingkan estimasi vs fasilitas di menu Vendor sebelum deal.",
  },
  {
    id: "m06",
    number: "06",
    title: "Membeli Bukan Menyewa Busana Pengantin",
    problem:
      "Membeli gaun/jas baru bisa menyedot 5–20% anggaran hanya untuk busana yang dipakai satu hari.",
    solution:
      "Pertimbangkan sewa busana pengantin berkualitas (hemat 60–80%) dan alihkan selisihnya ke katering atau dokumentasi.",
  },
  {
    id: "m07",
    number: "07",
    title: "Lupa Memperhitungkan Biaya Tersembunyi",
    problem:
      "Biaya parkir, tambah daya listrik/genset, charge vendor luar, cleaning fee, dan setup/breakdown sering luput dari hitungan awal.",
    solution:
      "Selalu tanyakan: 'Apakah ada biaya lain di luar proposal ini?' dan masukkan setiap potensi biaya tambahan ke rincian pos vendor.",
  },
  {
    id: "m08",
    number: "08",
    title: "Booking Vendor Utama Terlalu Mepet",
    problem:
      "Mencari vendor 1–2 bulan sebelum hari H membuat vendor favorit sudah penuh dan Anda terpaksa mengambil opsi tersisa yang lebih mahal.",
    solution:
      "Booking venue, katering, dan fotografer minimal 6–12 bulan sebelum hari H; vendor pendukung minimal 3–6 bulan sebelumnya.",
  },
  {
    id: "m09",
    number: "09",
    title: "Tidak Melakukan Trial MUA",
    problem:
      "Deal MUA tanpa sesi trial berisiko membuat hasil riasan kurang sesuai karakter wajah atau kurang tahan lama di hari H.",
    solution:
      "Jadwalkan trial make up 1–2 bulan sebelum hari H untuk memastikan kenyamanan, ketahanan riasan, dan kesesuaian konsep busana.",
  },
  {
    id: "m10",
    number: "10",
    title: "Tidak Tracking Pengeluaran Secara Real-Time",
    problem:
      "Hanya mengandalkan ingatan atau catatan terpisah di chat membuat pasangan tidak sadar saat pengeluaran sudah melewati target.",
    solution:
      "Catat setiap deal vendor, termin DP, dan bukti bayar secara real-time di NikahPlan agar indikator Aman / Hampir Habis / Overbudget selalu akurat.",
  },
];

export const APP_QUICK_STEPS = [
  {
    step: "1",
    title: "Tentukan Target & Skenario",
    desc: "Pilih target budget total atau terapkan salah satu skenario (30 Jt / 50 Jt / 80 Jt) langsung ke workspace.",
  },
  {
    step: "2",
    title: "Isi Daftar Vendor & Sub-Item",
    desc: "Buka menu Vendor, gunakan tombol Template Item (51 sub-item siap pakai) agar tidak perlu mengetik dari nol.",
  },
  {
    step: "3",
    title: "Catat Termin DP & Sumber Dana",
    desc: "Input Booking Fee, DP, hingga Pelunasan lengkap dengan sumber dana (Bersama / Pihak Pria / Pihak Wanita) dan bukti bayar.",
  },
  {
    step: "4",
    title: "Pantau Status & Insight Dashboard",
    desc: "Dashboard otomatis menampilkan Utilization Rate, kategori terbesar, dan peringatan bila ada pos mendekati atau melewati batas.",
  },
  {
    step: "5",
    title: "Hubungkan Angpao ke Honeymoon",
    desc: "Pasca-resepsi, catat angpao di menu Angpao lalu alokasikan dalam 1 klik ke pelunasan vendor atau Dompet Honeymoon.",
  },
];

export const STATUS_COLOR_LEGEND = [
  {
    label: "Aman (< 90%)",
    desc: "Realisasi masih nyaman di bawah target alokasi.",
    dotClass: "bg-emerald-500",
    pillClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  {
    label: "Hampir Habis (90–100%)",
    desc: "Sisa ruang tipis — waspadai biaya tambahan atau overtime.",
    dotClass: "bg-amber-500",
    pillClass: "border-amber-300 bg-amber-50 text-amber-800",
  },
  {
    label: "Overbudget (> 100%)",
    desc: "Melewati batas kategori — segera review atau geser alokasi pos lain.",
    dotClass: "bg-red-500",
    pillClass: "border-red-200 bg-red-50 text-red-700",
  },
];

export const GUIDE_FAQS = [
  {
    q: "Apakah saya bisa menambah kategori atau item vendor sendiri?",
    a: "Tentu! Di menu Vendor Anda bisa menambah kategori baru, mengedit alokasi target, atau memuat sub-item dari Template 51 Item kapan saja. Seluruh total & status kesehatan dihitung otomatis.",
  },
  {
    q: "Apakah menerapkan Skenario (30/50/80 Jt) akan menghapus vendor yang sudah saya catat?",
    a: "Tidak. Penerapan skenario bekerja dalam Mode Aman: hanya memperbarui target budget utama serta menambahkan/menyesuaikan nominal alokasi kategori tanpa menghapus vendor maupun riwayat pembayaran Anda.",
  },
  {
    q: "Bagaimana jika saya tidak ada sinyal saat survei di gedung atau wedding expo?",
    a: "NikahPlan mendukung mode PWA Offline-First. Anda tetap bisa melihat catatan dan menambah vendor/pembayaran saat offline — data tersimpan lokal di perangkat dan otomatis tersinkron ke akun pasangan saat online kembali.",
  },
  {
    q: "Apakah data bisa diekspor ke PDF atau Excel untuk dibagikan ke orang tua?",
    a: "Ya! Buka menu Profil -> Ekspor Laporan untuk mengunduh rekap lengkap anggaran dalam format PDF siap cetak maupun file Excel (.xlsx).",
  },
];
