"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  LogIn,
  UserPlus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { NikahPlanLogo } from "@/components/brand/logo";
import { BotanicalCorner } from "@/components/brand/botanical-accent";
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

interface LoginClientProps {
  nextPath?: string;
  initialError?: string;
}

function mapSupabaseAuthError(rawMessage: string): string {
  const lower = rawMessage.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "Email atau kata sandi salah. Periksa kembali atau daftar akun baru.";
  }
  if (lower.includes("email not confirmed")) {
    return "Email belum dikonfirmasi. Silakan cek inbox email Anda (atau nonaktifkan 'Confirm email' di Supabase Auth untuk testing lokal).";
  }
  if (lower.includes("user already registered")) {
    return "Email sudah terdaftar. Silakan gunakan tab Masuk.";
  }
  if (lower.includes("password should be at least")) {
    return "Kata sandi minimal 6 karakter.";
  }
  if (lower.includes("rate limit")) {
    return "Terlalu banyak permintaan email dalam waktu singkat. Gunakan metode Email & Sandi agar lebih cepat.";
  }
  return rawMessage;
}

export function LoginClient({ nextPath, initialError }: LoginClientProps) {
  const router = useRouter();
  const [authMethod, setAuthMethod] = useState<"password" | "magiclink">(
    "password"
  );
  const [passwordMode, setPasswordMode] = useState<"signin" | "signup">(
    "signin"
  );

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [emailSentInfo, setEmailSentInfo] = useState<{
    title: string;
    description: string;
  } | null>(null);
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

  const redirectAfterAuth = async (userId: string) => {
    if (nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")) {
      router.push(nextPath);
      router.refresh();
      return;
    }

    try {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("has_paid, active_workspace_id")
        .eq("id", userId)
        .maybeSingle();

      if (!profile?.has_paid) {
        router.push("/checkout");
        router.refresh();
        return;
      }

      if (profile.active_workspace_id) {
        const { data: ws } = await supabase
          .from("workspaces")
          .select("onboarding_completed")
          .eq("id", profile.active_workspace_id)
          .maybeSingle();

        router.push(ws?.onboarding_completed ? "/dashboard" : "/onboarding");
        router.refresh();
        return;
      }

      router.push("/onboarding");
      router.refresh();
    } catch {
      router.push("/checkout");
      router.refresh();
    }
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
        setErrorMsg(mapSupabaseAuthError(error.message));
        setLoadingGoogle(false);
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal memulai login Google."
      );
      setLoadingGoogle(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setErrorMsg(null);
    setLoadingSubmit(true);

    try {
      const supabase = createClient();

      if (passwordMode === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setErrorMsg(mapSupabaseAuthError(error.message));
          setLoadingSubmit(false);
          return;
        }

        if (data.user) {
          await redirectAfterAuth(data.user.id);
          return;
        }
      } else {
        if (password.length < 6) {
          setErrorMsg("Kata sandi minimal 6 karakter.");
          setLoadingSubmit(false);
          return;
        }

        const derivedName =
          fullName.trim() || email.trim().split("@")[0] || "Pengguna";

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: derivedName },
            emailRedirectTo: buildCallbackUrl(),
          },
        });

        if (error) {
          setErrorMsg(mapSupabaseAuthError(error.message));
          setLoadingSubmit(false);
          return;
        }

        // Jika Confirm Email dimatikan di Supabase, session langsung aktif
        if (data.session && data.user) {
          await redirectAfterAuth(data.user.id);
          return;
        }

        // Jika Confirm Email masih aktif di Supabase
        setEmailSentInfo({
          title: "Akun Terdaftar — Konfirmasi Email Anda",
          description: `Kami telah mengirimkan tautan konfirmasi ke ${email.trim()}. Klik tautan tersebut untuk mengaktifkan akun (untuk testing lokal tanpa verifikasi email, matikan 'Confirm email' di Supabase Auth → Providers → Email).`,
        });
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal memproses autentikasi."
      );
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setErrorMsg(null);
    setLoadingSubmit(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: buildCallbackUrl(),
        },
      });

      if (error) {
        setErrorMsg(mapSupabaseAuthError(error.message));
      } else {
        setEmailSentInfo({
          title: "Cek Kotak Masuk Email Anda",
          description: `Kami telah mengirimkan tautan masuk sekali klik ke ${email.trim()}. Klik tautan tersebut untuk langsung masuk ke NikahPlan.`,
        });
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal mengirim tautan masuk."
      );
    } finally {
      setLoadingSubmit(false);
    }
  };

  const isInviteFlow = nextPath?.startsWith("/join/");
  const isAdminFlow = nextPath?.startsWith("/admin");

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
              {isAdminFlow
                ? "Masuk Admin Portal"
                : isInviteFlow
                  ? "Masuk untuk Bergabung dengan Pasangan"
                  : "Mulai Rencana Bahagiamu"}
            </CardTitle>
            <CardDescription className="text-sage-700/80">
              {isAdminFlow
                ? "Gunakan akun email Admin Anda untuk mengelola harga paket, promo, dan konten."
                : isInviteFlow
                  ? "Masuk atau daftar akun gratis untuk langsung terhubung ke workspace pasanganmu tanpa bayar ulang."
                  : "Masuk dengan Google, Email & Sandi, atau Magic Link sekali klik."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {errorMsg && (
              <div className="flex items-start gap-2.5 rounded-xl border border-terracotta/30 bg-terracotta-50 p-3.5 text-sm text-terracotta-800">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-terracotta" />
                <span>{errorMsg}</span>
              </div>
            )}

            {emailSentInfo ? (
              <div className="rounded-2xl border border-sage/20 bg-sage-50/70 p-5 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sage text-white">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-sage-900">
                  {emailSentInfo.title}
                </h3>
                <p className="text-sm text-sage-700 leading-relaxed">
                  {emailSentInfo.description}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEmailSentInfo(null);
                    setErrorMsg(null);
                  }}
                >
                  Kembali ke Form Masuk
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
                  disabled={loadingGoogle || loadingSubmit}
                >
                  {loadingGoogle ? (
                    <Loader2 className="h-5 w-5 animate-spin text-sage" />
                  ) : (
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
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

                <div className="relative flex items-center py-0.5">
                  <div className="flex-grow border-t border-sage/15" />
                  <span className="mx-3 shrink text-xs font-medium uppercase tracking-wider text-sage-500">
                    atau dengan email
                  </span>
                  <div className="flex-grow border-t border-sage/15" />
                </div>

                {/* Method Switcher: Email & Sandi vs Magic Link */}
                <div className="grid grid-cols-2 rounded-full bg-cream-200/90 p-1 border border-sage/10">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethod("password");
                      setErrorMsg(null);
                    }}
                    className={`rounded-full py-2 text-xs font-semibold transition-all ${
                      authMethod === "password"
                        ? "bg-sage text-cream-50 shadow-sm"
                        : "text-sage-700 hover:text-sage-900"
                    }`}
                  >
                    Email &amp; Sandi
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethod("magiclink");
                      setErrorMsg(null);
                    }}
                    className={`rounded-full py-2 text-xs font-semibold transition-all ${
                      authMethod === "magiclink"
                        ? "bg-sage text-cream-50 shadow-sm"
                        : "text-sage-700 hover:text-sage-900"
                    }`}
                  >
                    Magic Link
                  </button>
                </div>

                {authMethod === "password" ? (
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    {passwordMode === "signup" && (
                      <div className="space-y-2">
                        <Label htmlFor="full-name">Nama Lengkap</Label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sage-500" />
                          <Input
                            id="full-name"
                            type="text"
                            required
                            placeholder="Contoh: Andi Pratama"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="pl-10"
                            disabled={loadingSubmit || loadingGoogle}
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email-pw">Alamat Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sage-500" />
                        <Input
                          id="email-pw"
                          type="email"
                          required
                          placeholder="andi.rina@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          disabled={loadingSubmit || loadingGoogle}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Kata Sandi</Label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sage-500" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          required
                          minLength={6}
                          placeholder="Minimal 6 karakter"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10"
                          disabled={loadingSubmit || loadingGoogle}
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

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={
                        loadingSubmit ||
                        loadingGoogle ||
                        !email.trim() ||
                        !password
                      }
                    >
                      {loadingSubmit ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {passwordMode === "signin"
                            ? "Memeriksa Akun..."
                            : "Mendaftarkan Akun..."}
                        </>
                      ) : passwordMode === "signin" ? (
                        <>
                          <LogIn className="h-4 w-4" />
                          Masuk Sekarang
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4" />
                          Daftar Akun Baru
                        </>
                      )}
                    </Button>

                    <div className="text-center text-xs text-sage-700 pt-1">
                      {passwordMode === "signin" ? (
                        <>
                          Belum punya akun?{" "}
                          <button
                            type="button"
                            onClick={() => {
                              setPasswordMode("signup");
                              setErrorMsg(null);
                            }}
                            className="font-semibold text-terracotta hover:underline"
                          >
                            Daftar di sini
                          </button>
                        </>
                      ) : (
                        <>
                          Sudah punya akun?{" "}
                          <button
                            type="button"
                            onClick={() => {
                              setPasswordMode("signin");
                              setErrorMsg(null);
                            }}
                            className="font-semibold text-terracotta hover:underline"
                          >
                            Masuk di sini
                          </button>
                        </>
                      )}
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleMagicLink} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email-magic">Alamat Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sage-500" />
                        <Input
                          id="email-magic"
                          type="email"
                          required
                          placeholder="andi.rina@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          disabled={loadingSubmit || loadingGoogle}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={loadingSubmit || loadingGoogle || !email.trim()}
                    >
                      {loadingSubmit ? (
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
                )}
              </>
            )}

            <p className="text-center text-xs text-muted-foreground leading-relaxed pt-2">
              Satu kali pembayaran berlaku seumur hidup untuk 2 akun (Anda &amp;
              Pasangan). Data Anda dilindungi enkripsi &amp; isolasi workspace
              pribadi.
            </p>
          </CardContent>
        </Card>
      </div>

      <footer className="relative z-10 text-center text-xs text-sage-600/75 mt-8">
        &copy; {new Date().getFullYear()} NikahPlan &mdash; From &ldquo;I
        Do&rdquo; to Honeymoon
      </footer>
    </div>
  );
}
