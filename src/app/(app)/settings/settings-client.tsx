"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRightLeft,
  BookOpen,
  Check,
  Copy,
  FileSpreadsheet,
  FileText,
  HardDrive,
  Headphones,
  HeartHandshake,
  Loader2,
  LogOut,
  MessageCircle,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import type { Profile } from "@/types/database";
import type { WorkspaceBundle } from "@/lib/workspace-data";
import { formatIDR } from "@/lib/utils";
import { fetchWorkspaceBundleOfflineFirst } from "@/lib/offline/query-helpers";
import {
  clearOfflineCache,
  executeOfflineFirstMutation,
  flushSyncQueue,
  saveWorkspaceSnapshot,
} from "@/lib/offline/sync-engine";
import { useWorkspaceRealtime } from "@/hooks/use-workspace-realtime";
import { useAppStore } from "@/store/use-app-store";
import {
  getCurrencyOption,
  HONEYMOON_CURRENCIES,
} from "@/lib/budget-allocator";
import {
  exportBudgetToExcel,
  exportBudgetToPDF,
  exportFamilyMeetingPDF,
} from "@/lib/export-reports";
import { SyncStatusBadge } from "@/components/dashboard/sync-status-badge";
import { PushNotificationCard } from "@/components/settings/push-notification-card";
import { SupportFeedbackDialog } from "@/components/support/support-feedback-dialog";
import { useToast } from "@/components/providers/toast-provider";
import { useConfirm } from "@/components/providers/confirm-provider";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SettingsClientProps {
  profile: Profile;
  initialBundle: WorkspaceBundle;
  members: { full_name: string; email: string; role: string }[];
  inviteUrl: string;
  isAdmin?: boolean;
  upgradePrice?: number;
}

export function SettingsClient({
  profile,
  initialBundle,
  members,
  inviteUrl,
  isAdmin = false,
  upgradePrice = 50000,
}: SettingsClientProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const confirm = useConfirm();
  const queuedCount = useAppStore((s) => s.queuedCount);
  const syncStatus = useAppStore((s) => s.syncStatus);

  const workspaceId = initialBundle.workspace.id;
  useWorkspaceRealtime(workspaceId);

  useEffect(() => {
    saveWorkspaceSnapshot(initialBundle);
  }, [initialBundle]);

  const { data: bundle = initialBundle } = useQuery({
    queryKey: ["workspace-data", workspaceId],
    queryFn: () => fetchWorkspaceBundleOfflineFirst(workspaceId, initialBundle),
    initialData: initialBundle,
  });

  const { workspace } = bundle;

  const [copied, setCopied] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  // Currency settings state
  const [currency, setCurrency] = useState(workspace.honeymoon_currency || "JPY");
  const [exchangeRate, setExchangeRate] = useState(
    String(Number(workspace.honeymoon_exchange_rate) || 1)
  );
  const [savingRate, setSavingRate] = useState(false);
  const [rateSavedFeedback, setRateSavedFeedback] = useState<string | null>(null);

  // Export & Sync states
  const [exportingType, setExportingType] = useState<
    "pdf" | "family-pdf" | "xlsx" | null
  >(null);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [syncingNow, setSyncingNow] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    setCurrency(workspace.honeymoon_currency || "IDR");
    setExchangeRate(String(Number(workspace.honeymoon_exchange_rate) || 1));
  }, [workspace.honeymoon_currency, workspace.honeymoon_exchange_rate]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const handleCurrencySelect = (nextCode: string) => {
    setCurrency(nextCode);
    setExchangeRate(String(getCurrencyOption(nextCode).defaultRateToIDR));
    setRateSavedFeedback(null);
  };

  const handleSaveCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    const rateNum =
      currency === "IDR" ? 1 : Math.max(0.01, Number(exchangeRate) || 1);
    const ok = await confirm({
      title: "Simpan Pengaturan Kurs?",
      description: `Simpan mata uang ${currency} dengan kurs ${currency === "IDR" ? "1 IDR" : `1 ${currency} = ${formatIDR(rateNum)}`}?`,
      confirmLabel: "Ya, Simpan Kurs",
    });
    if (!ok) return;

    setSavingRate(true);
    setRateSavedFeedback(null);
    try {
      const { queued } = await executeOfflineFirstMutation({
        workspaceId,
        table: "workspaces",
        operation: "UPDATE",
        recordId: workspaceId,
        payload: {
          honeymoon_currency: currency,
          honeymoon_exchange_rate: rateNum,
        },
        queryClient,
      });
      if (!queued) {
        await queryClient.invalidateQueries({
          queryKey: ["workspace-data", workspaceId],
        });
        toast.success(
          "Kurs mata uang disimpan",
          `Mata uang ${currency} berhasil diperbarui.`
        );
      } else {
        toast.warning(
          "Kurs disimpan di antrean offline",
          "Akan disinkronkan saat kembali online."
        );
      }
      setRateSavedFeedback(
        queued
          ? "Kurs tersimpan di cache lokal & akan disinkronkan saat online."
          : "Kurs mata uang berhasil diperbarui & tersimpan untuk mode offline."
      );
    } catch (err) {
      toast.error(
        "Gagal menyimpan kurs",
        err instanceof Error ? err.message : "Silakan coba lagi."
      );
    } finally {
      setSavingRate(false);
    }
  };

  const handleExportPDF = () => {
    setExportingType("pdf");
    setExportFeedback(null);
    try {
      exportBudgetToPDF(bundle);
      setExportFeedback("Laporan PDF berhasil diunduh.");
      toast.success("Laporan PDF diunduh", "Berkas ringkasan anggaran siap dibuka.");
    } catch {
      setExportFeedback("Gagal membuat file PDF.");
      toast.error("Gagal membuat file PDF");
    } finally {
      setExportingType(null);
    }
  };

  const handleExportFamilyPDF = () => {
    setExportingType("family-pdf");
    setExportFeedback(null);
    try {
      exportFamilyMeetingPDF(bundle);
      const msg =
        "Ringkasan 1–2 halaman 'Siap Rapat Keluarga' (.pdf) berhasil diunduh.";
      setExportFeedback(msg);
      toast.success("PDF Rapat Keluarga diunduh", msg);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Gagal membuat PDF rapat keluarga.";
      setExportFeedback(msg);
      toast.error("Gagal export PDF", msg);
    } finally {
      setExportingType(null);
    }
  };

  const handleExportExcel = () => {
    setExportingType("xlsx");
    setExportFeedback(null);
    try {
      exportBudgetToExcel(bundle);
      setExportFeedback("Laporan Excel (.xlsx) 4 sheet berhasil diunduh.");
      toast.success("Laporan Excel diunduh", "File .xlsx 4 sheet berhasil dibuat.");
    } catch {
      setExportFeedback("Gagal membuat file Excel.");
      toast.error("Gagal membuat file Excel");
    } finally {
      setExportingType(null);
    }
  };

  const handleManualSync = async () => {
    setSyncingNow(true);
    setSyncMessage(null);
    try {
      const result = await flushSyncQueue(queryClient);
      if (result.synced > 0) {
        const msg = `${result.synced} perubahan berhasil disinkronkan ke server.`;
        setSyncMessage(msg);
        toast.success("Sinkronisasi berhasil", msg);
      } else if (syncStatus === "offline") {
        const msg =
          "Perangkat masih offline. Sinkronisasi akan jalan otomatis saat online.";
        setSyncMessage(msg);
        toast.warning("Perangkat offline", msg);
      } else {
        const msg = "Semua data sudah tersinkronisasi dengan server.";
        setSyncMessage(msg);
        toast.info("Data sudah mutakhir", msg);
      }
    } catch {
      toast.error("Gagal menyinkronkan data");
    } finally {
      setSyncingNow(false);
    }
  };

  const handleClearLocalCache = async () => {
    const confirmed = await confirm({
      title: "Bersihkan Cache Lokal?",
      description:
        "Bersihkan snapshot lokal & antrean offline di perangkat ini? Data yang sudah tersimpan di server tetap aman.",
      confirmLabel: "Ya, Bersihkan Cache",
      variant: "destructive",
    });
    if (!confirmed) return;
    try {
      await clearOfflineCache(workspaceId);
      await queryClient.invalidateQueries({
        queryKey: ["workspace-data", workspaceId],
      });
      setSyncMessage("Cache lokal IndexedDB dibersihkan.");
      toast.success("Cache lokal dibersihkan", "IndexedDB perangkat telah direset.");
    } catch {
      toast.error("Gagal membersihkan cache lokal");
    }
  };

  const waText = `Hai sayang! Yuk kelola bareng budget pernikahan kita (${workspace.couple_title}) di NikahPlan. Gabung gratis via tautan ini ya: ${inviteUrl}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(waText)}`;

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-sage-900">
          Profil &amp; Pengaturan
        </h1>
        <SyncStatusBadge />
      </div>

      {/* 1. Info Akun & Paket */}
      <Card className="glass-strong rounded-3xl shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="font-display text-xl">
              {workspace.couple_title}
            </CardTitle>
            <Badge variant="softTerracotta">
              {workspace.plan === "COMPLETE_PASS"
                ? "Complete Couple Pass"
                : "Wedding Only Pass"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-sage-700 space-y-1">
            <p>
              Masuk sebagai:{" "}
              <strong className="text-sage-900">{profile.full_name}</strong>
            </p>
            <p className="text-xs text-sage-600">{profile.email}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {isAdmin && (
              <Button asChild variant="sage" size="sm">
                <Link href="/admin">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Buka Admin Portal
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" size="sm">
              <Link href="/onboarding?edit=1">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Ubah Target Budget &amp; Profil
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/panduan">
                <BookOpen className="h-3.5 w-3.5" />
                Pusat Panduan &amp; Skenario
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/user-guide">
                <FileText className="h-3.5 w-3.5" />
                User Guide Aplikasi
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSupportOpen(true)}
            >
              <Headphones className="h-3.5 w-3.5" />
              Bantuan CS &amp; Masukan
            </Button>
            <form action="/auth/signout" method="post">
              <Button
                variant="ghost"
                size="sm"
                type="submit"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                Keluar Akun
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* 1b. Upgrade Banner khusus Wedding Only Pass */}
      {workspace.plan === "WEDDING_ONLY" && (
        <Card className="rounded-3xl border-terracotta/30 bg-terracotta-50/70 shadow-card">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-bold text-terracotta-800 inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-terracotta" />
                Upgrade ke Complete Couple Pass
              </p>
              <p className="text-xs text-sage-800 leading-relaxed">
                Cukup bayar selisih <strong>{formatIDR(upgradePrice)}</strong>{" "}
                untuk membuka Buat Undangan Online Sendiri, Dompet Honeymoon,
                kalkulator uang jajan harian, multi-mata uang &amp; Angpao Bridge.
              </p>
            </div>
            <Button asChild size="sm" className="shrink-0">
              <Link href="/checkout?upgrade=1">
                Upgrade ({formatIDR(upgradePrice)})
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 1c. Web Push Notifications H-3 */}
      <PushNotificationCard />

      {/* 2. Export Laporan ke PDF & Excel */}
      <Card className="rounded-3xl border-sage/12 bg-white shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base inline-flex items-center gap-2">
            <FileSpreadsheet className="h-4.5 w-4.5 text-terracotta" />
            Export Laporan Anggaran
          </CardTitle>
          <CardDescription>
            Unduh ringkasan kesehatan anggaran, vendor &amp; termin, angpao,
            hingga dompet honeymoon (tetap berfungsi saat offline).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <Button
              type="button"
              className="w-full"
              disabled={exportingType !== null}
              onClick={handleExportFamilyPDF}
            >
              {exportingType === "family-pdf" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              PDF Rapat Keluarga
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={exportingType !== null}
              onClick={handleExportPDF}
            >
              {exportingType === "pdf" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              PDF Lengkap
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={exportingType !== null}
              onClick={handleExportExcel}
            >
              {exportingType === "xlsx" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              Excel (.xlsx)
            </Button>
          </div>
          {exportFeedback && (
            <p className="text-xs font-medium text-sage-700">{exportFeedback}</p>
          )}
        </CardContent>
      </Card>

      {/* 3. Pengaturan Kurs Mata Uang Tersimpan */}
      <Card className="rounded-3xl border-sage/12 bg-white shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base inline-flex items-center gap-2">
            <ArrowRightLeft className="h-4.5 w-4.5 text-sage" />
            Pengaturan Kurs Mata Uang Honeymoon
          </CardTitle>
          <CardDescription>
            Nilai kurs ini di-cache secara lokal agar konversi otomatis ke IDR
            tetap akurat saat traveling tanpa internet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveCurrency} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Mata Uang Tujuan</Label>
                <Select value={currency} onValueChange={handleCurrencySelect}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HONEYMOON_CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.code} ({c.symbol}) — {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="settings-rate">
                  Kurs Tersimpan (1 {currency} → IDR)
                </Label>
                <CurrencyInput
                  id="settings-rate"
                  allowDecimal
                  disabled={currency === "IDR"}
                  value={currency === "IDR" ? "1" : exchangeRate}
                  onValueChange={setExchangeRate}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" size="sm" variant="sage" disabled={savingRate}>
                {savingRate ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Kurs"
                )}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setExchangeRate(
                    String(getCurrencyOption(currency).defaultRateToIDR)
                  )
                }
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Default
              </Button>
            </div>

            {rateSavedFeedback && (
              <p className="text-xs font-medium text-sage-700">
                {rateSavedFeedback}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* 4. Status Offline-First & Sinkronisasi PWA */}
      <Card className="rounded-3xl border-sage/12 bg-white shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base inline-flex items-center gap-2">
            <HardDrive className="h-4.5 w-4.5 text-sage" />
            Penyimpanan Offline &amp; Sinkronisasi
          </CardTitle>
          <CardDescription>
            Seluruh perubahan saat offline disimpan di IndexedDB perangkat dan
            disinkronkan otomatis saat kembali online.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-2xl bg-cream-50 border border-sage/10 p-3.5 flex items-center justify-between text-xs">
            <span className="text-sage-700">Antrean Sinkronisasi Tertunda</span>
            <Badge variant={queuedCount > 0 ? "terracotta" : "softSage"}>
              {queuedCount} item
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={syncingNow}
              onClick={handleManualSync}
            >
              {syncingNow ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Sinkronkan Sekarang
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleClearLocalCache}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Bersihkan Cache Lokal
            </Button>
          </div>

          {syncMessage && (
            <p className="text-xs font-medium text-sage-700">{syncMessage}</p>
          )}
        </CardContent>
      </Card>

      {/* 5. Anggota & Undang Pasangan */}
      <Card className="rounded-3xl border-sage/12 bg-white shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base inline-flex items-center gap-2">
            <Users className="h-4.5 w-4.5 text-sage" />
            Anggota Workspace ({members.length} / 2)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {members.map((m) => (
              <div
                key={m.email}
                className="flex items-center justify-between rounded-xl bg-cream-50 border border-sage/10 px-3.5 py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-sage-900 truncate">
                    {m.full_name}
                  </p>
                  <p className="text-xs text-sage-600 truncate">{m.email}</p>
                </div>
                <Badge variant={m.role === "OWNER" ? "default" : "softSage"}>
                  {m.role}
                </Badge>
              </div>
            ))}
          </div>

          {members.length < 2 && (
            <div className="rounded-2xl border border-sage/15 bg-cream-50 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-xs font-bold text-sage-900">
                  <HeartHandshake className="h-4 w-4 text-terracotta" />
                  Undang Pasangan (Tanpa Bayar Ulang)
                </span>
                <span className="font-mono text-xs font-bold bg-white border border-sage/15 px-2 py-0.5 rounded-lg">
                  {workspace.invite_code}
                </span>
              </div>
              <div className="rounded-xl bg-white border border-sage/10 px-3 py-2 font-mono text-xs text-sage-700 truncate">
                {inviteUrl}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-sage" />
                      Tersalin!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Salin Tautan
                    </>
                  )}
                </Button>
                <Button asChild variant="sage" size="sm">
                  <a href={waUrl} target="_blank" rel="noreferrer">
                    <MessageCircle className="h-3.5 w-3.5" />
                    Share WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <SupportFeedbackDialog
        open={supportOpen}
        onOpenChange={setSupportOpen}
      />
    </div>
  );
}
