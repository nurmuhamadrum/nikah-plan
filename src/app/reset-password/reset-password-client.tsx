"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { NikahPlanLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ResetPasswordClient() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 6) {
      setErrorMsg("Kata sandi baru minimal 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        const lower = error.message.toLowerCase();
        if (lower.includes("session") || lower.includes("auth")) {
          setErrorMsg(
            "Tautan reset kata sandi sudah kedaluwarsa atau belum diverifikasi. Silakan minta tautan baru dari halaman Masuk."
          );
        } else {
          setErrorMsg(error.message);
        }
        return;
      }
      setSuccess(true);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Gagal memperbarui kata sandi. Silakan coba lagi."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-between px-4 py-8 sm:py-12 overflow-x-clip">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-gradient-to-b from-[#E5EAF8]/80 to-transparent" />

      <div className="relative z-10 mx-auto w-full max-w-md flex items-center justify-between">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-sage-700 hover:text-sage-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Masuk
        </Link>
        <NikahPlanLogo size="sm" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-md my-auto py-8">
        <Card className="rounded-3xl border border-black/[0.06] bg-white shadow-card">
          <CardHeader className="text-center pb-4">
            <CardTitle className="font-display text-2xl font-bold text-[#141618]">
              Atur Ulang Kata Sandi
            </CardTitle>
            <CardDescription className="text-sm text-[#5F6978]">
              Masukkan kata sandi baru untuk mengamankan akun NikahPlan Anda.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {errorMsg && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-800">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {success ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 text-center space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h2 className="font-display text-lg font-bold text-emerald-950">
                    Kata Sandi Berhasil Diperbarui
                  </h2>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Anda sekarang dapat langsung melanjutkan ke aplikasi dengan
                    kata sandi baru Anda.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={() => {
                      router.push("/dashboard");
                      router.refresh();
                    }}
                  >
                    Buka Aplikasi
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <Link href="/login">Ke Halaman Masuk</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Kata Sandi Baru</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sage-500" />
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="Minimal 6 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      disabled={submitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword
                          ? "Sembunyikan kata sandi"
                          : "Tampilkan kata sandi"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sage-500 hover:text-sage-800"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Ulangi Kata Sandi Baru</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sage-500" />
                    <Input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="Ketik ulang kata sandi baru"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={submitting || !password || !confirmPassword}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Menyimpan Kata Sandi...
                    </>
                  ) : (
                    "Simpan Kata Sandi Baru"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      <footer className="relative z-10 text-center text-xs text-sage-600/75">
        &copy; {new Date().getFullYear()} NikahPlan
      </footer>
    </div>
  );
}
