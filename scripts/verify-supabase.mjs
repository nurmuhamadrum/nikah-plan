/**
 * NikahPlan - Supabase Connection & Health Diagnostic Tool
 * Run with: npm run db:verify (or node scripts/verify-supabase.mjs)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// 1. Manual simple .env parser so this script runs with zero extra dependencies
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf-8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

const envLocal = loadEnvFile(path.join(rootDir, ".env.local"));
const envMain = loadEnvFile(path.join(rootDir, ".env"));
const mergedEnv = { ...process.env, ...envMain, ...envLocal };

const SUPABASE_URL = mergedEnv.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = mergedEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = mergedEnv.SUPABASE_SERVICE_ROLE_KEY;

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
};

function pass(msg) {
  console.log(`${colors.green}  [OK]${colors.reset} ${msg}`);
}

function fail(msg, hint = null) {
  console.log(`${colors.red}  [FAIL]${colors.reset} ${msg}`);
  if (hint) {
    console.log(`       ${colors.dim}-> ${hint}${colors.reset}`);
  }
}

function warn(msg, hint = null) {
  console.log(`${colors.yellow}  [WARN]${colors.reset} ${msg}`);
  if (hint) {
    console.log(`       ${colors.dim}-> ${hint}${colors.reset}`);
  }
}

async function runDiagnostics() {
  console.log(`\n${colors.bold}${colors.cyan}====================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}   NikahPlan - Supabase Connectivity Diagnostic     ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}\n`);

  let hasErrors = false;

  // Step 1: Environment Variables Check
  console.log(`${colors.bold}1. Memeriksa Konfigurasi Environment:${colors.reset}`);
  if (!SUPABASE_URL || SUPABASE_URL.includes("your-project-id")) {
    fail("NEXT_PUBLIC_SUPABASE_URL belum dikonfigurasi.", "Isi di file .env.local dengan URL proyek Supabase Anda.");
    hasErrors = true;
  } else {
    pass(`NEXT_PUBLIC_SUPABASE_URL: ${SUPABASE_URL}`);
  }

  if (!ANON_KEY || ANON_KEY.includes("your-supabase-anon-key")) {
    fail("NEXT_PUBLIC_SUPABASE_ANON_KEY belum dikonfigurasi.", "Isi dengan Supabase anon public key di .env.local.");
    hasErrors = true;
  } else {
    pass(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${ANON_KEY.slice(0, 15)}... (${ANON_KEY.length} karakter)`);
  }

  if (!SERVICE_ROLE_KEY || SERVICE_ROLE_KEY.includes("your-supabase-service-role-key")) {
    fail("SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi.", "Isi dengan service_role secret key di .env.local.");
    hasErrors = true;
  } else {
    pass(`SUPABASE_SERVICE_ROLE_KEY: ${SERVICE_ROLE_KEY.slice(0, 15)}... (${SERVICE_ROLE_KEY.length} karakter)`);
  }

  if (hasErrors) {
    console.log(`\n${colors.red}${colors.bold}Pemeriksaan dihentikan karena variabel environment belum lengkap.${colors.reset}\n`);
    process.exit(1);
  }

  // Step 2: Supabase Server Reachability
  console.log(`\n${colors.bold}2. Memeriksa Jaringan ke Host Supabase:${colors.reset}`);
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/health`, { method: "GET" });
    if (res.ok || res.status === 200 || res.status === 404 || res.status === 401) {
      pass(`Host Supabase dapat dijangkau (HTTP Status: ${res.status})`);
    } else {
      warn(`Host merespons dengan status HTTP ${res.status}`);
    }
  } catch (err) {
    fail(`Gagal menghubungi host Supabase: ${err.message}`, "Pastikan URL benar dan perangkat terhubung ke internet.");
    hasErrors = true;
  }

  // Step 3: Auth & Anon Client Test
  console.log(`\n${colors.bold}3. Menguji Supabase Anon Client:${colors.reset}`);
  const anonClient = createClient(SUPABASE_URL, ANON_KEY);
  try {
    const { error } = await anonClient.auth.getSession();
    if (error) {
      warn(`Session check: ${error.message}`);
    } else {
      pass("Anon Client berhasil berkomunikasi dengan Supabase Auth");
    }
  } catch (err) {
    fail(`Anon Client error: ${err.message}`);
    hasErrors = true;
  }

  // Step 4: Admin (Service Role) Client Test
  console.log(`\n${colors.bold}4. Menguji Supabase Admin (Service Role) Client:${colors.reset}`);
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const { data: users, error: authErr } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (authErr) {
      fail(`Gagal memverifikasi Service Role Auth: ${authErr.message}`, "Periksa kembali apakah SUPABASE_SERVICE_ROLE_KEY benar.");
      hasErrors = true;
    } else {
      pass(`Service Role Auth valid (Total user terdaftar di auth: ${users?.users?.length || 0})`);
    }
  } catch (err) {
    fail(`Admin Auth error: ${err.message}`);
    hasErrors = true;
  }

  // Step 5: Database Schema & Tables Check
  console.log(`\n${colors.bold}5. Memeriksa Ketersediaan Tabel Database:${colors.reset}`);
  const requiredTables = [
    { name: "workspaces", desc: "Data workspace & target budget pernikahan/honeymoon" },
    { name: "profiles", desc: "Data profil user & status pembayaran" },
    { name: "workspace_members", desc: "Role keanggotaan (Owner & Partner)" },
    { name: "subscriptions", desc: "Riwayat pesanan & pembayaran Midtrans" },
    { name: "budget_categories", desc: "Kategori anggaran wedding & honeymoon" },
    { name: "budget_items", desc: "Vendor & rincian item pengeluaran" },
    { name: "item_payments", desc: "Jadwal termin, DP & pelunasan vendor" },
    { name: "wedding_gifts", desc: "Pencatatan angpao & alokasi dana" },
    { name: "honeymoon_checklists", desc: "Checklist persiapan bulan madu" },
    { name: "pricing_plans", desc: "Daftar paket harga (WEDDING_ONLY, COMPLETE_PASS)" },
    { name: "promo_codes", desc: "Kode promo diskon" },
    { name: "push_subscriptions", desc: "Langganan Web Push reminder termin" },
    { name: "wedding_invitations", desc: "Undangan digital online (Complete Pass)" },
    { name: "invitation_rsvps", desc: "Konfirmasi kehadiran & ucapan tamu undangan" },
    { name: "customer_feedbacks", desc: "Masukan, saran, bug & ulasan rating pengguna" },
    { name: "support_tickets", desc: "Tiket bantuan Customer Service" },
    { name: "support_messages", desc: "Percakapan 2 arah tiket Customer Service" },
  ];

  let missingTables = 0;
  for (const table of requiredTables) {
    try {
      const { error } = await adminClient.from(table.name).select("*", { count: "exact", head: true });
      if (error) {
        if (error.code === "42P01" || error.message.includes("does not exist") || error.code === "PGRST205") {
          fail(`Tabel public.${table.name} belum ada`, `Jalankan migrasi di Supabase SQL Editor.`);
          missingTables++;
        } else {
          warn(`Tabel public.${table.name}: ${error.message}`);
        }
      } else {
        pass(`Tabel public.${table.name} aktif`);
      }
    } catch (err) {
      fail(`Tabel public.${table.name} error: ${err.message}`);
      missingTables++;
    }
  }

  if (missingTables > 0) {
    hasErrors = true;
    console.log(`\n${colors.yellow}${colors.bold}Pemberitahuan:${colors.reset}`);
    console.log(`Terdapat ${missingTables} tabel yang belum ditemukan di database Supabase.`);
    console.log(`Buka Supabase Dashboard > SQL Editor, lalu jalankan isi berkas:`);
    console.log(`${colors.cyan}  supabase/combined_migrations.sql${colors.reset}\n`);
  }

  // Step 5b: Verify Migration 007 columns (music_preset, music_url) on wedding_invitations
  try {
    const { error: musicColErr } = await adminClient
      .from("wedding_invitations")
      .select("music_preset, music_url")
      .limit(1);
    if (musicColErr) {
      fail(
        "Kolom Migrasi 007 (music_preset, music_url) belum ada di public.wedding_invitations",
        "Jalankan supabase/migrations/007_invitation_music.sql di Supabase SQL Editor."
      );
      hasErrors = true;
    } else {
      pass("Kolom Migrasi 007 (music_preset, music_url) pada wedding_invitations aktif");
    }
  } catch (err) {
    warn(`Pengecekan kolom Migrasi 007 gagal: ${err.message}`);
  }

  // Step 6: Supabase Storage Buckets Check
  console.log(`\n${colors.bold}6. Memeriksa Supabase Storage (Bucket Bukti Bayar & Undangan):${colors.reset}`);
  try {
    const { data: buckets, error: storageErr } = await adminClient.storage.listBuckets();
    if (storageErr) {
      warn(`Gagal membaca daftar bucket: ${storageErr.message}`);
    } else {
      for (const bucketName of ["receipts", "invitations"]) {
        const found = buckets.find((b) => b.id === bucketName || b.name === bucketName);
        if (found) {
          pass(`Storage bucket "${bucketName}" ditemukan (Public: ${found.public})`);
        } else {
          warn(
            `Storage bucket "${bucketName}" belum ditemukan.`,
            `Bucket akan dibuat otomatis saat migrasi supabase/combined_migrations.sql dijalankan.`
          );
        }
      }
    }
  } catch (err) {
    warn(`Pengecekan storage gagal: ${err.message}`);
  }

  // Summary
  console.log(`\n${colors.bold}${colors.cyan}====================================================${colors.reset}`);
  if (hasErrors) {
    console.log(`${colors.bold}${colors.red}HASIL: Ada beberapa item yang memerlukan tindakan.${colors.reset}`);
    console.log(`Silakan ikuti instruksi [FAIL] di atas atau panduan di SUPABASE_SETUP.md`);
    process.exit(1);
  } else {
    console.log(`${colors.bold}${colors.green}HASIL: KONEKSI SUPABASE BERHASIL DAN SIAP DIGUNAKAN! 🎉${colors.reset}`);
    console.log(`Semua konfigurasi, autentikasi, tabel database, dan storage terhubung sempurna.`);
    process.exit(0);
  }
}

runDiagnostics().catch((err) => {
  console.error("\nUnexpected error during diagnostics:", err);
  process.exit(1);
});
