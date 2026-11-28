"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HeartHandshake,
  CheckCircle2,
  AlertCircle,
  Users,
  Loader2,
  Sparkles,
  LogIn,
} from "lucide-react";
import { NikahPlanLogo } from "@/components/brand/logo";
import { useToast } from "@/components/providers/toast-provider";
import { useConfirm } from "@/components/providers/confirm-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface JoinClientProps {
  code: string;
  workspace: {
    id: string;
    coupleTitle: string;
    plan: "WEDDING_ONLY" | "COMPLETE_PASS";
    memberCount: number;
  } | null;
  isLoggedIn: boolean;
  userEmail?: string;
  alreadyMember: boolean;
}

export function JoinClient({
  code,
  workspace,
  isLoggedIn,
  userEmail,
  alreadyMember,
}: JoinClientProps) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [joining, setJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isFull = workspace ? workspace.memberCount >= 2 && !alreadyMember : false;

  const handleJoin = async () => {
    const ok = await confirm({
      title: "Gabung ke Workspace Pasangan?",
      description: workspace
        ? `Akun Anda akan terhubung ke workspace "${workspace.coupleTitle}" secara gratis tanpa bayar ulang.`
        : "Hubungkan akun Anda ke workspace pasangan ini?",
      confirmLabel: "Ya, Gabung Sekarang",
    });
    if (!ok) return;

    setErrorMsg(null);
    setJoining(true);
    try {
      const response = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: code }),
      });

      const data = await response.json();
      if (!response.ok) {
        const msg = data.error || "Gagal bergabung ke workspace.";
        setErrorMsg(msg);
        toast.error("Gagal bergabung", msg);
        setJoining(false);
        return;
      }

      toast.success(
        "Berhasil bergabung!",
        workspace ? `Selamat datang di workspace ${workspace.coupleTitle}.` : undefined
      );
      router.push(data.redirectTo || "/dashboard");
      router.refresh();
    } catch {
      const msg = "Terjadi kendala jaringan. Silakan coba lagi.";
      setErrorMsg(msg);
      toast.error("Gagal bergabung", msg);
      setJoining(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-72 -z-10 bg-gradient-to-b from-[#E5EAF8] via-[#EFF2FA] to-transparent"
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Link href="/">
            <NikahPlanLogo size="lg" />
          </Link>
        </div>

        <Card className="glass-strong rounded-[2rem] shadow-lift">
          {!workspace ? (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-terracotta-50 text-terracotta">
                  <AlertCircle className="h-7 w-7" />
                </div>
                <CardTitle className="font-display text-2xl">
                  Kode Undangan Tidak Valid
                </CardTitle>
                <CardDescription>
                  Tautan undangan dengan kode{" "}
                  <span className="font-mono font-semibold text-sage-900">
                    {code}
                  </span>{" "}
                  tidak ditemukan. Pastikan tautan dari pasangan Anda sudah benar.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button asChild variant="sage">
                  <Link href="/">Kembali ke Beranda</Link>
                </Button>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="text-center pb-3">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-sage-50 text-sage shadow-sm animate-pulse">
                  <HeartHandshake className="h-7 w-7" />
                </div>
                <div className="flex justify-center mb-2">
                  <Badge variant="softTerracotta">
                    <Sparkles className="h-3.5 w-3.5" />
                    Undangan Pasangan — Gratis Tanpa Bayar Ulang
                  </Badge>
                </div>
                <CardTitle className="font-display text-2xl text-sage-900">
                  {workspace.coupleTitle}
                </CardTitle>
                <CardDescription className="text-sage-700/85">
                  Anda diundang untuk berkolaborasi mengelola anggaran pernikahan
                  {workspace.plan === "COMPLETE_PASS" ? " & bulan madu" : ""} di
                  workspace bersama.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="rounded-xl border border-sage/10 bg-cream-50 p-4 flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-2 text-sage-700">
                    <Users className="h-4 w-4 text-sage" />
                    Kuota Anggota
                  </span>
                  <span className="font-semibold text-sage-900">
                    {workspace.memberCount} / 2 Pasangan
                  </span>
                </div>

                {errorMsg && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-800">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-600" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {alreadyMember ? (
                  <div className="space-y-3 text-center">
                    <div className="inline-flex items-center gap-1.5 text-sm font-medium text-sage-700">
                      <CheckCircle2 className="h-4 w-4 text-sage" />
                      Anda sudah terhubung di workspace ini!
                    </div>
                    <Button asChild size="lg" variant="sage" className="w-full">
                      <Link href="/dashboard">Buka Dashboard Bersama</Link>
                    </Button>
                  </div>
                ) : isFull ? (
                  <div className="space-y-3 text-center">
                    <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3.5">
                      Workspace ini sudah terisi penuh oleh 2 anggota (Owner &amp;
                      Partner).
                    </p>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/">Kembali ke Beranda</Link>
                    </Button>
                  </div>
                ) : !isLoggedIn ? (
                  <div className="space-y-3">
                    <Button asChild size="lg" className="w-full">
                      <Link href={`/login?next=${encodeURIComponent(`/join/${code}`)}`}>
                        <LogIn className="h-4 w-4" />
                        Masuk / Daftar untuk Terima Undangan
                      </Link>
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      Setelah masuk, akun Anda otomatis aktif tanpa perlu checkout.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-center text-xs text-sage-700">
                      Masuk sebagai <span className="font-semibold">{userEmail}</span>
                    </p>
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={handleJoin}
                      disabled={joining}
                    >
                      {joining ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Menghubungkan Workspace...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Terima Undangan &amp; Gabung Gratis
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
