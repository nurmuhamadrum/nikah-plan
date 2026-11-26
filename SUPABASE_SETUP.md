# Panduan Setup & Koneksi Supabase untuk NikahPlan

Dokumen ini menjelaskan langkah-langkah lengkap untuk menghubungkan aplikasi NikahPlan dengan database Supabase, menjalankan skema migrasi database, mengonfigurasi autentikasi, serta memverifikasi kesiapan koneksi.

---

## 1. Dapatkan Kredensial Proyek Supabase

Jika Anda belum memiliki proyek Supabase:
1. Buka [https://supabase.com](https://supabase.com) dan login / register.
2. Klik tombol **New Project**, pilih nama (misal: `nikahplan-db`), buat Database Password yang kuat, dan pilih region terdekat (misal: `Singapore (ap-southeast-1)`).
3. Setelah proyek dibuat, buka menu **Project Settings** (ikon gerigi di sidebar kiri) &rarr; **API**:
   - Salin **Project URL** (format: `https://[project-ref].supabase.co`)
   - Salin **Project API Keys**:
     - `anon` `public` key
     - `service_role` `secret` key

---

## 2. Konfigurasi Berkas `.env.local`

Buka berkas `.env.local` di root proyek NikahPlan, lalu isi nilai kredensial tersebut:

```env
# App Base URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase Project Credentials
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-public-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-secret-key]

# Admin Portal (Email yang otomatis mendapatkan hak admin CMS)
ADMIN_EMAILS=admin@nikahplan.id

# Secret Keys lokal
CRON_SECRET=nikahplan-local-cron-secret-2026
```

---

## 3. Eksekusi Skema Database & RLS (1 Kali Eksekusi)

Kami telah menyatukan seluruh migrasi database (Tabel, Enum, Trigger Profil Otomatis, Row-Level Security, Storage Buckets, dan Seed Paket Harga) ke dalam satu berkas SQL terpadu:

📁 **`supabase/combined_migrations.sql`**

### Cara Menjalankan:
1. Buka dashboard proyek Supabase Anda di browser.
2. Di sidebar kiri, klik menu **SQL Editor**.
3. Klik **New query**.
4. Buka berkas `supabase/combined_migrations.sql` di editor kode Anda, **salin seluruh isinya (Cmd+A / Ctrl+A &rarr; Cmd+C / Ctrl+C)**, lalu tempel (paste) ke SQL Editor Supabase.
5. Klik tombol **Run** (atau tekan `Ctrl + Enter` / `Cmd + Enter`).
6. Pastikan muncul pesan sukses: `Success. No rows returned` di bagian hasil query.

> **Tabel yang dibuat otomatis:**
> - `workspaces` (Ruang kerja bersama pasangan)
> - `profiles` (Data profil user yang terhubung ke `auth.users`)
> - `subscriptions` (Pencatatan pembayaran & paket)
> - `workspace_members` (Relasi pasangan: Owner & Partner)
> - `budget_categories` (Kategori budget wedding & honeymoon)
> - `budget_items` (Vendor & rincian pengeluaran)
> - `item_payments` (Termin DP & pelunasan vendor)
> - `wedding_gifts` (Pencatatan angpao)
> - `honeymoon_checklists` (Checklist bulan madu)
> - `pricing_plans` (Paket harga Wedding Only & Complete Pass)
> - `promo_codes` (Kode diskon)
> - `push_subscriptions` (Web Push notification reminder)
> - Storage bucket: `receipts` (Upload bukti pembayaran vendor)

---

## 4. Konfigurasi Autentikasi (Supabase Auth)

Di dashboard Supabase, lakukan penyesuaian berikut:

### A. Pengaturan URL (Wajib)
1. Buka **Authentication** &rarr; **URL Configuration**.
2. Di bagian **Site URL**, isi: `http://localhost:3000`
3. Di bagian **Redirect URLs**, tambahkan:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/**`
4. Klik **Save**.

### B. Pengaturan Konfirmasi Email (Direkomendasikan untuk Development)
1. Buka **Authentication** &rarr; **Providers** &rarr; klik **Email**.
2. Nonaktifkan (toggle OFF) pilihan **"Confirm email"**.
   - *Tujuan*: Agar saat user registrasi di lokal, user bisa langsung login tanpa harus membuka inbox email konfirmasi.
3. Klik **Save**.

### C. Google OAuth (Opsional)
Jika ingin mengaktifkan tombol *Login dengan Google*:
1. Di menu **Authentication** &rarr; **Providers** &rarr; klik **Google**.
2. Masukkan `Client ID` dan `Client Secret` dari Google Cloud Console.
3. Masukkan Callback URL Supabase ke Google Cloud Console.

---

## 5. Verifikasi Koneksi Otomatis

Jalankan perintah berikut di terminal proyek:

```bash
npm run db:verify
```

Skrip ini akan secara otomatis:
- Memeriksa kelengkapan variabel `.env.local`
- Menguji jangkauan host Supabase
- Menguji otentikasi Anon Key & Service Role Key
- Memeriksa keberadaan 12 tabel database
- Memeriksa keberadaan Supabase Storage bucket `receipts`

Jika seluruh indikator menampilkan `[OK]`, koneksi database Supabase telah 100% siap digunakan!

---

## 6. Jalankan Aplikasi

Setelah verifikasi sukses, jalankan server pengembangan:

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda untuk mulai menggunakan aplikasi NikahPlan.
