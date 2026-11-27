export type UserGuideCategory =
  | "ALL"
  | "PEMULA"
  | "KEUANGAN"
  | "COMPLETE_PASS"
  | "TEKNIS";

export type UserGuideIconKey =
  | "rocket"
  | "dashboard"
  | "vendors"
  | "angpao"
  | "honeymoon"
  | "undangan"
  | "panduan"
  | "offline"
  | "shield";

export interface UserGuideStep {
  title: string;
  detail: string;
}

export interface UserGuideSection {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  category: Exclude<UserGuideCategory, "ALL">;
  planBadge: "Semua Paket" | "Eksklusif Complete Pass";
  iconKey: UserGuideIconKey;
  routeHref: string;
  routeLabel: string;
  overview: string;
  steps: UserGuideStep[];
  highlights: string[];
  proTip: string;
  keywords: string[];
}

export interface UserGuideFaq {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
}

export const USER_GUIDE_CATEGORIES: {
  id: UserGuideCategory;
  label: string;
}[] = [
  { id: "ALL", label: "Semua Fitur" },
  { id: "PEMULA", label: "Mulai Cepat" },
  { id: "KEUANGAN", label: "Anggaran & Vendor" },
  { id: "COMPLETE_PASS", label: "Complete Pass" },
  { id: "TEKNIS", label: "Offline, PWA & Keamanan" },
];

export const QUICK_START_JOURNEY = [
  {
    step: "01",
    title: "Aktivasi & Setup",
    desc: "Pilih Couple Pass 1x bayar, isi wizard target budget, lalu undang pasangan gratis via WhatsApp.",
    targetId: "onboarding-pasangan",
  },
  {
    step: "02",
    title: "Susun Vendor & DP",
    desc: "Muat template 51 sub-item nikah, catat harga deal vendor, jadwalkan termin DP & unggah bukti bayar.",
    targetId: "vendor-termin",
  },
  {
    step: "03",
    title: "Buat Undangan Online",
    desc: "Pilih 8 tema beragam layout, lihat live preview, bagikan link personal tamu & pantau RSVP.",
    targetId: "undangan-online",
  },
  {
    step: "04",
    title: "Angpao & Honeymoon",
    desc: "Catat amplop pasca-resepsi, tutup sisa vendor atau transfer ke Dompet Honeymoon multi-mata uang.",
    targetId: "angpao-bridge",
  },
];

export const USER_GUIDE_SECTIONS: UserGuideSection[] = [
  {
    id: "onboarding-pasangan",
    number: "01",
    title: "Mulai Cepat, Onboarding & Undang Pasangan",
    subtitle: "Aktivasi 1x bayar seumur hidup untuk 2 akun pasangan dalam 1 workspace bersama",
    category: "PEMULA",
    planBadge: "Semua Paket",
    iconKey: "rocket",
    routeHref: "/onboarding",
    routeLabel: "Buka Setup Profil & Budget",
    overview:
      "NikahPlan dirancang agar Anda dan pasangan bekerja di satu workspace yang sama secara real-time. Cukup 1 kali pembayaran untuk berdua — pasangan Anda masuk gratis melalui tautan undangan WhatsApp.",
    steps: [
      {
        title: "Masuk & Pilih Paket Couple Pass",
        detail:
          "Daftar atau masuk menggunakan email/Google di halaman /login, lalu pilih Wedding Only Pass (fokus anggaran, vendor, & angpao) atau Complete Couple Pass (termasuk Undangan Online 8 Tema & Honeymoon Planner) di /checkout.",
      },
      {
        title: "Selesaikan Pembayaran 1x Seumur Hidup",
        detail:
          "Gunakan kode promo jika tersedia, selesaikan pembayaran via Midtrans (QRIS, VA Bank, E-Wallet). Begitu terverifikasi, akun langsung diarahkan ke Wizard Onboarding.",
      },
      {
        title: "Isi Wizard 4 Langkah (Smart Allocator)",
        detail:
          "Masukkan nama pasangan, tanggal pernikahan, estimasi jumlah tamu, dan target anggaran (otomatis terformat ribuan seperti 150.000.000). Sistem otomatis membagi pos kategori ideal yang tetap bisa Anda ubah persentasenya.",
      },
      {
        title: "Undang Pasangan Gratis via WhatsApp",
        detail:
          "Buka menu Profil (/settings) lalu gulir ke kartu Anggota Workspace. Salin tautan /join/[kode] atau klik Share WhatsApp. Pasangan cukup klik tautan tersebut dan login untuk langsung bergabung tanpa bayar ulang.",
      },
    ],
    highlights: [
      "1x bayar untuk seumur hidup (tidak ada biaya langganan bulanan).",
      "Sinkronisasi real-time: setiap perubahan di HP Anda otomatis muncul di HP pasangan.",
      "Pengaturan target budget dan tanggal tetap bisa diubah kapan saja lewat /onboarding?edit=1.",
    ],
    proTip:
      "Undang pasangan segera setelah selesai onboarding agar kalian bisa langsung membagi tugas pencatatan vendor (misalnya Anda mencatat katering & gedung, pasangan mencatat dokumentasi & busana).",
    keywords: [
      "daftar",
      "login",
      "checkout",
      "bayar",
      "onboarding",
      "undang pasangan",
      "whatsapp",
      "join",
      "gratis",
      "workspace",
      "mulai",
    ],
  },
  {
    id: "dashboard-kesehatan",
    number: "02",
    title: "Beranda & Kesehatan Anggaran",
    subtitle: "Pantau status budget 3 warna, grafik target vs realisasi, split funding & jatuh tempo",
    category: "KEUANGAN",
    planBadge: "Semua Paket",
    iconKey: "dashboard",
    routeHref: "/dashboard",
    routeLabel: "Buka Beranda Dashboard",
    overview:
      "Halaman Beranda (/dashboard) adalah pusat kendali keuangan pernikahan Anda. Semua angka dihitung otomatis dari daftar kategori, harga deal vendor, dan termin pembayaran yang sudah dicatat.",
    steps: [
      {
        title: "Baca Banner Kesehatan Anggaran 3 Warna",
        detail:
          "Sistem otomatis menilai kondisi anggaran Anda: Hijau (Aman, terpakai < 90%), Kuning/Amber (Hampir Habis, 90%–100%), dan Merah (Overbudget, > 100%).",
      },
      {
        title: "Analisis Grafik & Rekomendasi Keputusan",
        detail:
          "Buka kartu Insight & Decision Support untuk melihat Utilization Rate, efisiensi penghematan estimasi vs deal, kategori terbesar, serta klik tampilkan grafik batang Target vs Realisasi per kategori.",
      },
      {
        title: "Pantau Pembagian Sumber Dana (Split Funding)",
        detail:
          "Kartu Split Funding otomatis memisahkan berapa dana yang sudah dibayarkan dari Tabungan Bersama, Keluarga Pria, Keluarga Wanita, dan dana Angpao agar transparansi keluarga tetap terjaga.",
      },
      {
        title: "Tandai Termin Jatuh Tempo dalam 1 Klik",
        detail:
          "Pada bagian Jadwal Termin Terdekat, Anda bisa langsung klik tombol Tandai Lunas begitu transfer selesai tanpa perlu membuka halaman Vendor terlebih dahulu.",
      },
    ],
    highlights: [
      "Hitung mundur otomatis menuju Hari H pernikahan di bagian atas dashboard.",
      "Badge warna status di setiap baris kategori sehingga pos yang mulai membengkak langsung terlihat.",
      "Switch cepat antara Mode Wedding dan Mode Honeymoon (untuk paket Complete Pass).",
    ],
    proTip:
      "Cek Beranda minimal seminggu sekali bersama pasangan untuk memastikan tidak ada kategori yang diam-diam menyentuh zona kuning (> 90%) sebelum tanda tangan kontrak vendor baru.",
    keywords: [
      "dashboard",
      "beranda",
      "kesehatan",
      "grafik",
      "chart",
      "overbudget",
      "split funding",
      "keluarga",
      "jatuh tempo",
      "countdown",
      "ringkasan",
    ],
  },
  {
    id: "vendor-termin",
    number: "03",
    title: "Vendor, Kategori, Template 51 Item & Termin DP",
    subtitle: "Kelola 51 rincian sub-item nikah, harga deal, jadwal DP & bukti bayar terkompresi",
    category: "KEUANGAN",
    planBadge: "Semua Paket",
    iconKey: "vendors",
    routeHref: "/vendors",
    routeLabel: "Buka Halaman Vendor",
    overview:
      "Di halaman Vendor (/vendors), Anda dapat mencatat seluruh vendor maupun rincian kebutuhan pernikahan per kategori, membandingkan estimasi awal dengan harga deal final, hingga melacak setiap tahap termin DP beserta bukti transfernya.",
    steps: [
      {
        title: "Atur Kategori atau Muat Template 51 Sub-Item",
        detail:
          "Tambah/edit kategori anggaran dengan ikon & target dana. Agar tidak repot mengetik dari nol, klik tombol Template Item untuk memilih dari 51 sub-item standar pernikahan Indonesia (Katering, Gedung, MUA, Dokumentasi, dll.).",
      },
      {
        title: "Catat Vendor (Estimasi vs Harga Deal)",
        detail:
          "Klik Tambah Vendor, masukkan Estimasi Awal dan Harga Deal Final (terformat otomatis seperti 25.000.000), kontak WhatsApp PIC, catatan bonus/loading, lalu centang Sudah Fix/Booked jika sudah deal.",
      },
      {
        title: "Buat Multi-Termin (Booking Fee, DP 30%, Pelunasan)",
        detail:
          "Klik Tambah Termin pada kartu vendor, pilih preset label (Booking Fee / DP 30% / Termin 2 / Pelunasan H-14), masukkan nominal, sumber dana (Split Funding), dan tanggal jatuh tempo.",
      },
      {
        title: "Unggah Bukti Bayar (Kompresi Otomatis)",
        detail:
          "Lampirkan foto struk (JPG/PNG/WebP) atau dokumen PDF. Foto otomatis dikompresi instan ke ≤ 350 KB lengkap dengan thumbnail pratinjau & informasi % hemat ukuran. Anda bisa melihat struk kembali kapan saja lewat tombol Bukti.",
      },
    ],
    highlights: [
      "Perbandingan otomatis selisih Estimasi Awal vs Harga Deal untuk mengukur hasil negosiasi.",
      "Tombol pintasan WhatsApp langsung ke nomor PIC vendor dari kartu item.",
      "Kompresi gambar bukti bayar mendukung antrean offline bila sinyal di lokasi wedding expo lemah.",
    ],
    proTip:
      "Selalu isi tanggal jatuh tempo pada setiap termin DP dan aktifkan Notifikasi H-3 di Pengaturan agar Anda tidak pernah lupa melunasi vendor menjelang hari H.",
    keywords: [
      "vendor",
      "kategori",
      "template",
      "51 item",
      "termin",
      "dp",
      "pelunasan",
      "booking fee",
      "bukti bayar",
      "kwitansi",
      "struk",
      "kompres",
      "pdf",
      "whatsapp",
    ],
  },
  {
    id: "angpao-bridge",
    number: "04",
    title: "Angpao & Gift Bridge",
    subtitle: "Catat amplop tunai/transfer/kado fisik & alokasikan 1-klik ke Vendor atau Honeymoon",
    category: "KEUANGAN",
    planBadge: "Semua Paket",
    iconKey: "angpao",
    routeHref: "/angpao",
    routeLabel: "Buka Angpao Tracker",
    overview:
      "Pasca resepsi, halaman Angpao (/angpao) memudahkan Anda mencatat seluruh amplop tunai, transfer rekening, dan kado fisik, lalu langsung menghubungkannya ke pelunasan sisa tagihan vendor atau tabungan bulan madu.",
    steps: [
      {
        title: "Catat Setiap Amplop atau Kado Fisik",
        detail:
          "Klik Catat Angpao, masukkan nama pemberi/grup tamu, pilih jenis (Tunai, Transfer, atau Kado Fisik), lalu ketik nominal atau klik tombol preset cepat (Rp100rb, Rp200rb, Rp500rb, Rp1jt, Rp2jt).",
      },
      {
        title: "Saring & Cari Daftar Pemberi Hadiah",
        detail:
          "Gunakan kotak pencarian dan filter jenis/alokasi untuk mengecek siapa saja yang sudah dicatat — sangat membantu saat ingin mengirim pesan terima kasih pasca acara.",
      },
      {
        title: "Tutup Sisa Tagihan Vendor via Angpao Bridge",
        detail:
          "Klik Alokasikan ke Tagihan Vendor untuk memilih termin vendor yang belum lunas dan langsung menandainya lunas menggunakan sumber dana Angpao.",
      },
      {
        title: "Kirim Saldo Bebas ke Dompet Honeymoon",
        detail:
          "Bagi pengguna Complete Couple Pass, klik Pindahkan ke Dompet Honeymoon (atau ubah alokasi per item) agar saldo angpao otomatis menambah total dana perjalanan bulan madu Anda.",
      },
    ],
    highlights: [
      "Ringkasan real-time: Total Tunai/Transfer, Saldo Bebas, Dana Tutup Vendor, Dana Honeymoon, & Jumlah Kado Fisik.",
      "Dapat dicatat secara offline saat membuka amplop bersama keluarga di rumah atau kamar hotel.",
      "Integrasi langsung dengan grafik Split Funding di Dashboard & saldo Dompet Honeymoon.",
    ],
    proTip:
      "Buka halaman Angpao di 2 HP (milik Anda & pasangan) saat menghitung amplop bersama — satu orang membacakan nama & nominal, yang lain menginput; semua langsung tersinkronisasi.",
    keywords: [
      "angpao",
      "amplop",
      "kado",
      "hadiah",
      "gift",
      "bridge",
      "alokasi",
      "tunai",
      "transfer",
      "honeymoon",
      "vendor",
    ],
  },
  {
    id: "honeymoon-planner",
    number: "05",
    title: "Dompet Honeymoon & Multi-Mata Uang",
    subtitle: "Kalkulator uang jajan harian, kurs tersimpan offline & checklist persiapan bulan madu",
    category: "COMPLETE_PASS",
    planBadge: "Eksklusif Complete Pass",
    iconKey: "honeymoon",
    routeHref: "/dashboard",
    routeLabel: "Buka Mode Honeymoon",
    overview:
      "Khusus pemegang Complete Couple Pass, switch ke tab Honeymoon di halaman Beranda (/dashboard) untuk mengelola anggaran bulan madu lengkap dengan konversi kurs mata uang asing dan jatah uang saku harian.",
    steps: [
      {
        title: "Atur Destinasi, Tanggal & Kurs Mata Uang",
        detail:
          "Klik tombol Pengaturan Honeymoon, isi destinasi (mis. Jepang / Bali / Eropa), tanggal berangkat–pulang, target dana awal (IDR), dan pilih mata uang tujuan (JPY, EUR, USD, SGD, THB, KRW, AUD, MYR, atau IDR) beserta nilai kursnya.",
      },
      {
        title: "Pantau Kalkulator Uang Jajan Harian",
        detail:
          "Sistem otomatis menjumlahkan Target Awal + Tambahan dari Angpao, dikurangi pengeluaran tiket/hotel (Pre-Trip) dan belanja harian (On-Trip), lalu membagi sisa dana dengan jumlah hari perjalanan dalam IDR & mata uang tujuan.",
      },
      {
        title: "Catat Pengeluaran Pre-Trip & On-Trip",
        detail:
          "Klik Catat Pengeluaran, pilih fase (Pre-Trip seperti tiket/visa/hotel atau On-Trip seperti makan/transport/oleh-oleh), masukkan nominal dalam mata uang lokal (mendukung desimal koma seperti 120,5) — konversi IDR langsung tampil otomatis.",
      },
      {
        title: "Kelola Checklist Persiapan Travel",
        detail:
          "Tambahkan item checklist seperti Paspor, Visa, eSIM, Asuransi Travel, atau Tukar Uang. Anda bisa mencentang item yang selesai atau langsung mencatat pengeluarannya dari item checklist tersebut.",
      },
    ],
    highlights: [
      "Kurs tersimpan secara lokal di perangkat sehingga konversi valas tetap akurat saat traveling tanpa internet.",
      "Pemisahan jelas antara biaya pra-keberangkatan (Pre-Trip) dan uang jajan di lokasi (On-Trip).",
      "Terhubung otomatis dengan saldo Angpao Bridge yang dialokasikan ke Dompet Honeymoon.",
    ],
    proTip:
      "Sebelum terbang, perbarui kurs mata uang di Pengaturan sesuai kurs money changer atau kartu debit/kredit Anda agar perhitungan jatah jajan harian di luar negeri benar-benar presisi.",
    keywords: [
      "honeymoon",
      "bulan madu",
      "valas",
      "mata uang",
      "kurs",
      "jpy",
      "usd",
      "eur",
      "uang jajan",
      "harian",
      "checklist",
      "travel",
      "complete pass",
    ],
  },
  {
    id: "undangan-online",
    number: "06",
    title: "Buat Undangan Online Sendiri (8 Tema + Live Preview)",
    subtitle: "Desain website undangan nikah di /u/[slug], 8 gaya layout unik, WA personal & RSVP",
    category: "COMPLETE_PASS",
    planBadge: "Eksklusif Complete Pass",
    iconKey: "undangan",
    routeHref: "/undangan",
    routeLabel: "Buka Builder Undangan",
    overview:
      "Hemat Rp 500rb–1,5 Jt biaya jasa undangan digital! Di menu Undangan (/undangan), pemegang Complete Couple Pass dapat merancang website undangan pribadi lengkap dengan 8 tema berarsitektur layout berbeda, pratinjau langsung di mockup ponsel, dan buku tamu RSVP.",
    steps: [
      {
        title: "Pilih Alamat Tautan (/u/slug) & 1 dari 8 Tema Unik",
        detail:
          "Di Tab Tema & Mempelai, tentukan slug tautan pribadi Anda lalu pilih dari 8 tema yang berbeda struktur layout & ornamennya: Botanical Sage, Editorial Magazine (gaya majalah Vogue), Javanese Heritage (Gunungan & Batik Kawung), Polaroid Scrapbook (bingkai polaroid & washi tape), Sakura Blush, Classic Ivory Gold, Warm Terracotta, dan Midnight Garden.",
      },
      {
        title: "Pantau Perubahan Real-Time di Live Preview",
        detail:
          "Di desktop, mockup ponsel di sisi kanan langsung menampilkan perubahan nama, foto, dan tema secara real-time (di mobile, klik tombol Pratinjau Live). Gunakan toggle Sampul Depan ↔ Isi Undangan dan kotak simulasi nama tamu (?to=...) untuk memeriksa hasil sebelum disimpan.",
      },
      {
        title: "Isi Acara, Kisah Cinta, Foto & Amplop Digital",
        detail:
          "Lengkapi jadwal Akad & Resepsi (beserta link Google Maps), unggah Foto Cover & hingga 6 foto Galeri sekaligus (multi-upload dengan kompresi otomatis ≤ 300–450 KB), tambahkan timeline Kisah Cinta, serta rekening/e-wallet Amplop Digital (salin 1-klik bagi tamu).",
      },
      {
        title: "Publikasikan, Kirim Link WA Personal & Pantau RSVP",
        detail:
          "Klik Simpan & Publikasikan agar tautan /u/[slug] aktif untuk tamu. Buka Tab Bagikan & RSVP, masukkan daftar nama tamu (1 nama per baris) untuk menghasilkan tautan personal ?to=Nama+Tamu + tombol kirim WhatsApp 1-klik, serta pantau statistik hadir & moderasi ucapan doa.",
      },
    ],
    highlights: [
      "8 tema dengan perbedaan nyata pada ornamen SVG, bingkai foto, tipografi, countdown, & struktur kartu — bukan sekadar ganti warna.",
      "Tamu bisa langsung klik Simpan ke Google Calendar, Buka Google Maps, Salin Nomor Rekening, & kirim RSVP tanpa perlu login.",
      "Mode Draft memungkinkan Anda merancang & melihat pratinjau privat terlebih dahulu sebelum dipublikasikan ke umum.",
    ],
    proTip:
      "Gunakan fitur daftar tamu massal di Tab Bagikan & RSVP untuk menempel daftar tamu dari catatan/Excel Anda — setiap tamu otomatis mendapat sapaan personal di sampul depan undangan.",
    keywords: [
      "undangan",
      "online",
      "digital",
      "tema",
      "preview",
      "live preview",
      "slug",
      "rsvp",
      "ucapan",
      "doa",
      "galeri",
      "cover",
      "amplop digital",
      "whatsapp",
      "tamu",
      "editorial",
      "jawa",
      "polaroid",
      "sakura",
    ],
  },
  {
    id: "panduan-strategi",
    number: "07",
    title: "Pusat Panduan Strategi & Skenario Budget",
    subtitle: "Framework WIFE, skenario siap pakai 30/50/80 Jt, script negosiasi & 10 kesalahan fatal",
    category: "KEUANGAN",
    planBadge: "Semua Paket",
    iconKey: "panduan",
    routeHref: "/panduan",
    routeLabel: "Buka Pusat Panduan",
    overview:
      "Selain alat pencatatan, NikahPlan menyediakan modul strategi persiapan nikah di /panduan yang terhubung langsung dengan data workspace Anda.",
    steps: [
      {
        title: "Tentukan Prioritas dengan Framework WIFE",
        detail:
          "Di Tab Prioritas, isi refleksi WIFE (Wishes, Income, Family, Essentials) bersama pasangan dan pelajari Piramida Prioritas 3 Lapisan agar dana terfokus pada pos yang paling penting.",
      },
      {
        title: "Simulasikan & Terapkan Skenario 30 / 50 / 80 Jt",
        detail:
          "Di Tab Skenario, bandingkan pembagian ideal 10 kategori untuk budget 30 Jt, 50 Jt, 80 Jt, atau angka custom. Klik Terapkan ke Workspace untuk memperbarui target & alokasi kategori secara aman tanpa menghapus vendor yang sudah Anda catat.",
      },
      {
        title: "Gunakan Script Negosiasi Vendor Auto-Fill",
        detail:
          "Di Tab Negosiasi, pilih template chat penawaran/negosiasi bonus vendor. Tanggal nikah & estimasi tamu otomatis terisi — cukup klik Salin atau Kirim WhatsApp.",
      },
      {
        title: "Audit Checklist 10 Kesalahan Fatal & Hemat Digital",
        detail:
          "Centang potensi penghematan Digital-First dan pastikan kalian menghindari 10 kesalahan umum calon pengantin. Progres checklist otomatis tersimpan per workspace.",
      },
    ],
    highlights: [
      "Menerapkan skenario di /panduan bersifat aman (upsert kategori tanpa menghapus data vendor/termin existing).",
      "Dilengkapi panduan tips menikah nyaman di bawah Rp 50 Juta & daftar 7 nilai tambah negosiasi.",
      "Tersedia cepat di Sidebar Desktop maupun tombol pintasan di halaman Profil (/settings) pada perangkat mobile.",
    ],
    proTip:
      "Isi Tab Prioritas & WIFE sebelum survei gedung atau wedding expo pertama kali agar kalian punya batas anggaran yang disepakati berdua dan tidak mudah tergoda upgrade impulsif.",
    keywords: [
      "panduan",
      "strategi",
      "wife",
      "prioritas",
      "skenario",
      "30 juta",
      "50 juta",
      "80 juta",
      "negosiasi",
      "script",
      "kesalahan fatal",
      "hemat",
    ],
  },
  {
    id: "offline-pwa-ekspor",
    number: "08",
    title: "Mode Offline PWA, Notifikasi H-3 & Ekspor PDF/Excel",
    subtitle: "Tetap lancar tanpa internet, pengingat jatuh tempo otomatis & unduh laporan 4 sheet",
    category: "TEKNIS",
    planBadge: "Semua Paket",
    iconKey: "offline",
    routeHref: "/settings",
    routeLabel: "Buka Pengaturan & Ekspor",
    overview:
      "NikahPlan dibangun sebagai Progressive Web App (PWA) Offline-First. Seluruh fitur pencatatan, ekspor laporan, dan pengaturan sinkronisasi dikelola dari halaman Profil & Pengaturan (/settings).",
    steps: [
      {
        title: "Install NikahPlan ke Layar Utama (PWA)",
        detail:
          "Di Chrome Android, ketuk banner Install atau menu Browser → Tambahkan ke Layar Utama. Di Safari iPhone/iPad, ketuk ikon Share → Add to Home Screen agar NikahPlan tampil layar penuh layaknya aplikasi native.",
      },
      {
        title: "Catat Data Saat Offline & Sinkronisasi Otomatis",
        detail:
          "Saat sinyal hilang di basement gedung atau luar negeri, Anda tetap bisa menambah vendor, termin, foto struk, maupun angpao. Data masuk ke antrean lokal IndexedDB dan otomatis tersinkronisasi begitu internet kembali (atau klik Sinkronkan Sekarang di /settings).",
      },
      {
        title: "Aktifkan Notifikasi Pengingat H-3 Jatuh Tempo",
        detail:
          "Pada kartu Notifikasi Jatuh Tempo Vendor (H-3) di /settings, klik Aktifkan Pengingat lalu izinkan notifikasi browser agar perangkat menerima pengingat 3 hari sebelum termin DP/pelunasan jatuh tempo.",
      },
      {
        title: "Ekspor Laporan PDF & Excel (.xlsx) Kapan Saja",
        detail:
          "Klik Unduh Laporan PDF untuk ringkasan siap cetak/kirim ke orang tua, atau Unduh Excel (.xlsx) untuk file spreadsheet lengkap berisi 4 sheet (Ringkasan, Vendor & Termin, Angpao, & Honeymoon) — keduanya tetap berfungsi saat offline.",
      },
    ],
    highlights: [
      "Badge status sinkronisasi real-time (Tersinkronisasi / Offline / Antrean Tertunda) di bagian atas setiap halaman.",
      "Tombol Bersihkan Cache Lokal tersedia di /settings bila ingin menyegarkan penyimpanan perangkat tanpa menghapus data server.",
      "Ekspor laporan diproses 100% di perangkat sehingga cepat dan menjaga privasi data keuangan Anda.",
    ],
    proTip:
      "Gunakan Unduh Laporan PDF sebelum rapat keluarga besar agar orang tua kedua belah pihak dapat melihat rincian anggaran & porsi Split Funding secara rapi dan transparan.",
    keywords: [
      "offline",
      "pwa",
      "install",
      "ios",
      "android",
      "sinkronisasi",
      "indexeddb",
      "notifikasi",
      "push",
      "reminder",
      "h-3",
      "ekspor",
      "export",
      "pdf",
      "excel",
      "xlsx",
      "cache",
    ],
  },
  {
    id: "keamanan-kenyamanan",
    number: "09",
    title: "Keamanan Transaksi & Kenyamanan Input Nominal",
    subtitle: "Popup konfirmasi di semua aksi, alert sukses/gagal real-time & format ribuan otomatis",
    category: "TEKNIS",
    planBadge: "Semua Paket",
    iconKey: "shield",
    routeHref: "/dashboard",
    routeLabel: "Kembali ke Aplikasi",
    overview:
      "Setiap transaksi penting di NikahPlan dilengkapi lapisan pengaman antarmuka untuk mencegah salah ketik angka nol, salah hapus data, atau keraguan apakah perubahan sudah tersimpan.",
    steps: [
      {
        title: "Format Pemisah Ribuan Otomatis (2.000.000)",
        detail:
          "Seluruh kolom nominal anggaran, harga vendor, termin DP, angpao, target honeymoon, hingga kurs otomatis memformat angka dengan titik ribuan saat Anda mengetik maupun menempel teks (paste).",
      },
      {
        title: "Popup Konfirmasi Sebelum Simpan atau Hapus",
        detail:
          "Setiap kali Anda menekan tombol Simpan/Publikasikan atau Hapus di fitur mana pun, muncul dialog konfirmasi halus yang merangkum nama item & nominalnya. Menekan Batal atau Esc menutup konfirmasi tanpa menghilangkan isian form Anda.",
      },
      {
        title: "Alert Notifikasi Sukses, Gagal & Antrean Offline",
        detail:
          "Setelah transaksi selesai, notifikasi toast muncul di pojok atas layar: Hijau (berhasil tersimpan ke server), Kuning/Amber (tersimpan aman di antrean offline), atau Merah (gagal beserta pesan penyebabnya).",
      },
    ],
    highlights: [
      "Kompresi gambar otomatis (≤ 300–450 KB) menjaga kuota internet hemat & halaman undangan cepat dibuka tamu.",
      "Keamanan data dilindungi Row Level Security (RLS) Supabase sehingga hanya Anda dan pasangan yang dapat mengakses data workspace.",
      "Halaman undangan publik (/u/[slug]) hanya menampilkan data yang Anda publikasikan; data anggaran & vendor tetap 100% privat.",
    ],
    proTip:
      "Anda bisa langsung copy-paste angka seperti 'Rp 12.500.000' dari chat penawaran vendor ke kolom harga deal di NikahPlan — kolom nominal akan otomatis membersihkannya menjadi 12.500.000.",
    keywords: [
      "keamanan",
      "konfirmasi",
      "popup",
      "alert",
      "toast",
      "sukses",
      "gagal",
      "nominal",
      "ribuan",
      "format",
      "privasi",
      "rls",
    ],
  },
];

export const USER_GUIDE_FAQS: UserGuideFaq[] = [
  {
    id: "faq-upgrade",
    question: "Saya sudah beli Wedding Only Pass, apakah bisa upgrade ke Complete Couple Pass?",
    answer:
      "Bisa! Buka menu Profil & Pengaturan (/settings) lalu klik tombol Upgrade ke Complete Couple Pass (atau buka /undangan / tab Honeymoon). Anda hanya perlu membayar selisih harga saja (bukan harga penuh), dan seluruh data anggaran serta vendor yang sudah dicatat tetap utuh.",
    keywords: ["upgrade", "wedding only", "complete pass", "selisih", "paket"],
  },
  {
    id: "faq-partner-join",
    question: "Apakah pasangan saya harus bayar lagi untuk ikut memakai aplikasi?",
    answer:
      "Tidak perlu! Satu Couple Pass berlaku untuk 2 akun (Owner & Partner). Cukup kirim tautan undangan /join/[kode] dari menu Profil (/settings) lewat WhatsApp. Setelah pasangan login melalui tautan tersebut, akunnya langsung aktif dan tersambung ke workspace bersama.",
    keywords: ["pasangan", "bayar", "gratis", "join", "undang", "partner"],
  },
  {
    id: "faq-draft-undangan",
    question: "Mengapa tautan undangan /u/[slug] saya belum bisa dibuka oleh tamu?",
    answer:
      "Pastikan Anda sudah mengklik tombol Simpan & Publikasikan (bukan hanya Simpan Draft) di halaman /undangan dan status di header berubah menjadi 'Live Publik'. Selama masih berstatus Draft, hanya Anda dan pasangan yang sedang login yang bisa melihat pratinjaunya.",
    keywords: ["undangan", "draft", "publik", "tamu", "tidak bisa dibuka", "slug"],
  },
  {
    id: "faq-tema-undangan",
    question: "Apakah tema undangan bisa diganti-ganti setelah dipublikasikan?",
    answer:
      "Ya, Anda bebas berganti antara ke-8 tema (Botanical Sage, Editorial Magazine, Javanese Heritage, Polaroid Scrapbook, Sakura Blush, Classic Ivory Gold, Warm Terracotta, dan Midnight Garden) kapan saja. Cek hasilnya di Live Preview lalu klik Simpan & Publikasikan — tautan /u/[slug] tetap sama.",
    keywords: ["tema", "ganti", "undangan", "layout", "preview"],
  },
  {
    id: "faq-foto-besar",
    question: "Foto prewedding atau struk saya berukuran besar (5–10 MB), apakah bisa diunggah?",
    answer:
      "Bisa! NikahPlan memiliki mesin kompresi gambar otomatis di browser (maksimal file mentah 25 MB). Foto akan otomatis disesuaikan resolusinya dan dikompresi ke WebP/JPEG ringan (≤ 300–450 KB) sebelum diunggah agar hemat penyimpanan dan cepat dibuka di HP tamu.",
    keywords: ["foto", "gambar", "besar", "kompres", "upload", "struk", "galeri"],
  },
  {
    id: "faq-offline-sync",
    question: "Bagaimana jika saya mencatat pengeluaran saat tidak ada sinyal internet?",
    answer:
      "Semua perubahan tetap berhasil dicatat dan disimpan di penyimpanan lokal perangkat (IndexedDB) dengan notifikasi kuning 'disimpan di antrean offline'. Begitu HP kembali terhubung internet, aplikasi otomatis menyinkronkannya ke server — atau Anda bisa menekan 'Sinkronkan Sekarang' di /settings.",
    keywords: ["offline", "sinyal", "internet", "antrean", "sinkronisasi", "indexeddb"],
  },
  {
    id: "faq-musik-undangan",
    question: "Bagaimana cara membuat Tautan Langsung File Audio (.mp3) untuk musik kustom di Undangan Online?",
    answer:
      "Selain 4 preset musik ambient bawaan (Romantic Piano, Celesta Music Box, Botanical Harp, Soft Pelog Heritage), Anda bisa memakai lagu sendiri dengan cara mengunggah file .mp3 (disarankan ≤ 5 MB) ke catbox.moe (gratis tanpa login, langsung mendapat link https://files.catbox.moe/xxxx.mp3) atau ke Dropbox lalu salin tautan Share-nya (tempel di kolom URL Audio Kustom lalu klik tombol konversi 1-klik untuk mengubah ?dl=0 menjadi ?raw=1). Hindari link halaman YouTube atau Spotify karena tidak bisa diputar langsung oleh pemutar audio browser.",
    keywords: [
      "musik",
      "audio",
      "mp3",
      "backsound",
      "lagu",
      "tautan",
      "dropbox",
      "catbox",
      "google drive",
      "undangan",
    ],
  },
  {
    id: "faq-reset-budget",
    question: "Apakah menerapkan Skenario di /panduan akan menghapus data vendor saya?",
    answer:
      "Tidak. Menerapkan Skenario (30/50/80 Jt atau custom) hanya memperbarui target anggaran workspace dan menambah/memperbarui alokasi kategori. Seluruh item vendor, termin pembayaran, dan bukti bayar yang sudah Anda catat tetap aman.",
    keywords: ["skenario", "panduan", "hapus", "vendor", "aman", "reset"],
  },
];
