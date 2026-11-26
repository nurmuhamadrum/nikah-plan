"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Sparkles, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { NikahPlanLogo } from "@/components/brand/logo";
import { BotanicalCorner } from "@/components/brand/botanical-accent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface LoginClientProps {
  nextPath?: string;
  initialError?: string;
}

export function LoginClient({ nextPath, initialError }: LoginClientProps) {
  const [email, setEmail] = useState("");
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingMagicLink, setLoadingMagicLink] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    initialError === "auth_callback_failed"
      ? "Tautan masuk tidak valid atau sudah kedaluwarsa. Silakan coba lagi."
      : null
  );

  const buildCallbackUrl = () => {
    const base = `${window.location.origin}/auth/callback`;
    if (nextPath && nextPath.startsWith("/")) {
      return `${base}?next=${encodeURIComponent(nextPath)}`;
    }
    return base;
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setLoadingGoogle(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: buildCallbackUrl(),
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      if (error) {
        setErrorMsg(error.message);
        setLoadingGoogle(false);
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal memulai login Google."
      );
      setLoadingGoogle(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setErrorMsg(null);
    setLoadingMagicLink(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: buildCallbackUrl(),
        },
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setMagicLinkSent(true);
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal mengirim tautan masuk."
      );
    } finally {
      setLoadingMagicLink(false);
    }
  };

  const isInviteFlow = nextPath?.startsWith("/join/");

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-cream px-4 py-8">
      <BotanicalCorner
        className="fixed -top-4 -right-4 h-44 w-44"
        variant="sage"
      />
      <BotanicalCorner
        className="fixed -bottom-6 -left-6 h-44 w-44 rotate-180"
        variant="terracotta"
      />

      <div className="relative z-10 mx-auto w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-sage-700 hover:text-sage-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Beranda
        </Link>

        <Card className="border-sage/15 shadow-soft overflow-hidden">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-3">
              <NikahPlanLogo size="lg" />
            </div>
            <CardTitle className="font-display text-2xl text-sage-900">
              {isInviteFlow
                ? "Masuk untuk Bergabung dengan Pasangan"
                : "Mulai Rencana Bahagiamu"}
            </CardTitle>
            <CardDescription className="text-sage-700/80">
              {isInviteFlow
                ? "Masuk atau daftar akun gratis untuk langsung terhubung ke workspace pasanganmu tanpa bayar ulang."
                : "Masuk dengan Google atau Email Magic Link tanpa perlu menghafal kata sandi."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {errorMsg && (
              <div className="flex items-start gap-2.5 rounded-xl border border-terracotta/30 bg-terracotta-50 p-3.5 text-sm text-terracotta-800">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-terracotta" />
                <span>{errorMsg}</span>
              </div>
            )}

            {magicLinkSent ? (
              <div className="rounded-2xl border border-sage/20 bg-sage-50/70 p-5 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sage text-white">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-sage-900">
                  Cek Kotak Masuk Email Anda
                </h3>
                <p className="text-sm text-sage-700 leading-relaxed">
                  Kami telah mengirimkan tautan masuk sekali klik ke{" "}
                  <span className="font-semibold text-sage-900">{email}</span>.
                  Klik tautan tersebut untuk langsung masuk ke NikahPlan.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMagicLinkSent(false);
                    setEmail("");
                  }}
                >
                  Gunakan Email Lain
                </Button>
              </div>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full h-12 rounded-xl border-sage/25 bg-white hover:bg-cream-50 text-sage-900 font-semibold"
                  onClick={handleGoogleLogin}
                  disabled={loadingGoogle || loadingMagicLink}
                >
                  {loadingGoogle ? (
                    <Loader2 className="h-5 w-5 animate-spin text-sage" />
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                  )}
                  Lanjutkan dengan Google
                </Button>

                <div className="relative flex items-center py-1">
                  <div className="flex-grow border-t border-sage/15" />
                  <span className="mx-3 shrink text-xs font-medium uppercase tracking-wider text-sage-500">
                    atau dengan email
                  </span>
                  <div className="flex-grow border-t border-sage/15" />
                </div>

                <form onSubmit={handleMagicLink} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Alamat Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sage-500" />
                      <Input
                        id="email"
                        type="email"
                        required
                        placeholder="andi.rina@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        disabled={loadingMagicLink || loadingGoogle}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={loadingMagicLink || loadingGoogle || !email.trim()}
                  >
                    {loadingMagicLink ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Mengirim Magic Link...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Kirim Tautan Masuk (Magic Link)
                      </>
                    )}
                  </Button>
                </form>
              </>
            )}

            <p className="text-center text-xs text-muted-foreground leading-relaxed pt-2">
              Satu kali pembayaran berlaku seumur hidup untuk 2 akun (Anda &amp; Pasangan).
              Data Anda dilindungi enkripsi &amp; isolasi workspace pribadi.
            </p>
          </CardContent>
        </Card>
      </div>

      <footer className="relative z-10 text-center text-xs text-sage-600/75 mt-8">
        &copy; {new Date().getFullYear()} NikahPlan &mdash; From &ldquo;I Do&rdquo; to Honeymoon
      </footer>
    </div>
  );
}
