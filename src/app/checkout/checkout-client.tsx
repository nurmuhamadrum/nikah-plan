"use client";

import { useEffect, useState, useCallback } from "react";
import Script from "next/script";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Tag,
  ShieldCheck,
  Loader2,
  AlertCircle,
  LogOut,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import type { PlanDefinition } from "@/lib/plans";
import { formatIDR } from "@/lib/utils";
import type { PlanType } from "@/types/database";
import { NikahPlanLogo } from "@/components/brand/logo";
import { useToast } from "@/components/providers/toast-provider";
import { useConfirm } from "@/components/providers/confirm-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

declare global {
  interface Window {
    snap?: {
      pay: (
        snapToken: string,
        callbacks?: {
          onSuccess?: (result: Record<string, unknown>) => void;
          onPending?: (result: Record<string, unknown>) => void;
          onError?: (result: Record<string, unknown>) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

interface CheckoutClientProps {
  userEmail: string;
  userName: string;
  initialPlan: PlanType;
  plans: Record<PlanType, PlanDefinition>;
  isUpgrade?: boolean;
  upgradePrice?: number;
  snapJsUrl: string;
  midtransClientKey: string;
  callbackOrderId?: string;
}

export function CheckoutClient({
  userEmail,
  userName,
  initialPlan,
  plans,
  isUpgrade = false,
  upgradePrice = 50000,
  snapJsUrl,
  midtransClientKey,
  callbackOrderId,
}: CheckoutClientProps) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(
    isUpgrade ? "COMPLETE_PASS" : initialPlan
  );
  const [promoInput, setPromoInput] = useState("");
  const [checkingPromo, setCheckingPromo] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountAmount: number;
    description?: string;
  } | null>(null);
  const [promoFeedback, setPromoFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [snapLoaded, setSnapLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pendingOrder, setPendingOrder] = useState<{
    orderId: string;
    redirectUrl?: string;
  } | null>(callbackOrderId ? { orderId: callbackOrderId } : null);

  const planDef = plans[selectedPlan];
  const basePrice = isUpgrade ? upgradePrice : planDef.price;
  const discountAmount = appliedPromo?.discountAmount ?? 0;
  const finalAmount = Math.max(10000, basePrice - discountAmount);

  // Reset promo discount calculation when plan changes
  const revalidateAppliedPromo = useCallback(
    async (code: string, plan: PlanType) => {
      try {
        const res = await fetch("/api/promo/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, plan, isUpgrade }),
        });
        const data = await res.json();
        if (data.valid && data.code) {
          setAppliedPromo({
            code: data.code,
            discountAmount: data.discountAmount,
            description: data.description,
          });
          setPromoFeedback({
            type: "success",
            text: `${data.description || data.code} (-${formatIDR(data.discountAmount)})`,
          });
        } else {
          setAppliedPromo(null);
          setPromoFeedback({
            type: "error",
            text: data.reason || "Kode promo tidak valid.",
          });
        }
      } catch {
        setAppliedPromo(null);
      }
    },
    [isUpgrade]
  );

  const handlePlanChange = (nextPlan: PlanType) => {
    setSelectedPlan(nextPlan);
    if (appliedPromo?.code) {
      revalidateAppliedPromo(appliedPromo.code, nextPlan);
    }
  };

  const verifyOrderStatus = useCallback(
    async (orderId: string) => {
      setVerifying(true);
      setErrorMsg(null);
      try {
        const res = await fetch("/api/checkout/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });
        const data = await res.json();
        if (res.ok && data.status === "PAID") {
          toast.success(
            "Pembayaran terverifikasi!",
            "Akun Couple Pass Anda sudah aktif."
          );
          router.push(isUpgrade ? "/dashboard" : data.redirectTo || "/onboarding");
          router.refresh();
          return;
        }
        if (data.status === "PENDING") {
          setPendingOrder((prev) => ({
            orderId,
            redirectUrl: prev?.redirectUrl,
          }));
          const msg =
            "Pembayaran Anda masih menunggu penyelesaian. Selesaikan pembayaran lalu klik 'Periksa Status Pembayaran'.";
          setErrorMsg(msg);
          toast.warning("Pembayaran menunggu", msg);
        } else if (data.status === "FAILED" || data.status === "EXPIRED") {
          setPendingOrder(null);
          const msg =
            "Transaksi dibatalkan atau kedaluwarsa. Silakan buat transaksi baru.";
          setErrorMsg(msg);
          toast.error("Transaksi gagal / kedaluwarsa", msg);
        } else if (data.error) {
          setErrorMsg(data.error);
          toast.error("Verifikasi pembayaran gagal", data.error);
        }
      } catch {
        const msg =
          "Gagal memeriksa status pembayaran. Coba beberapa saat lagi.";
        setErrorMsg(msg);
        toast.error("Gagal memeriksa status", msg);
      } finally {
        setVerifying(false);
      }
    },
    [router, isUpgrade, toast]
  );

  useEffect(() => {
    if (callbackOrderId) {
      verifyOrderStatus(callbackOrderId);
    }
  }, [callbackOrderId, verifyOrderStatus]);

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) {
      setAppliedPromo(null);
      setPromoFeedback(null);
      return;
    }
    setCheckingPromo(true);
    setPromoFeedback(null);
    try {
      await revalidateAppliedPromo(promoInput.trim(), selectedPlan);
    } finally {
      setCheckingPromo(false);
    }
  };

  const handleCheckout = async () => {
    const ok = await confirm({
      title: isUpgrade
        ? "Lanjutkan Upgrade ke Complete Couple Pass?"
        : `Lanjutkan Pembayaran ${planDef.name}?`,
      description: `Total pembayaran ${formatIDR(finalAmount)} (1x bayar untuk seumur hidup & 2 akun pasangan).`,
      confirmLabel: "Ya, Lanjut Bayar",
    });
    if (!ok) return;

    setErrorMsg(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          promoCode: appliedPromo?.code ?? null,
          isUpgrade,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.alreadyPaid) {
          router.push(isUpgrade ? "/dashboard" : "/onboarding");
          router.refresh();
          return;
        }
        setErrorMsg(data.error || "Gagal membuat transaksi pembayaran.");
        setSubmitting(false);
        return;
      }

      const { orderId, snapToken, redirectUrl } = data as {
        orderId: string;
        snapToken: string;
        redirectUrl: string;
      };

      setPendingOrder({ orderId, redirectUrl });

      if (typeof window !== "undefined" && window.snap && snapToken) {
        setSubmitting(false);
        window.snap.pay(snapToken, {
          onSuccess: () => {
            verifyOrderStatus(orderId);
          },
          onPending: () => {
            setErrorMsg(
              "Instruksi pembayaran telah dibuat. Selesaikan pembayaran lalu klik 'Periksa Status Pembayaran'."
            );
          },
          onError: () => {
            setErrorMsg("Pembayaran gagal diproses. Silakan coba metode lain.");
          },
          onClose: () => {
            verifyOrderStatus(orderId);
          },
        });
      } else if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        setErrorMsg("Midtrans Snap belum siap. Muat ulang halaman dan coba lagi.");
        setSubmitting(false);
      }
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan saat menghubungi server pembayaran.");
      setSubmitting(false);
    }
  };

  return (
    <>
      {midtransClientKey && (
        <Script
          src={snapJsUrl}
          data-client-key={midtransClientKey}
          strategy="afterInteractive"
          onLoad={() => setSnapLoaded(true)}
        />
      )}

      <div className="relative min-h-screen px-4 py-8 overflow-x-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-72 -z-10 bg-gradient-to-b from-[#E5EAF8] via-[#EFF2FA] to-transparent"
        />

        <div className="relative z-10 mx-auto max-w-4xl">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              {isUpgrade && (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard">
                    <ArrowLeft className="h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
              )}
              <NikahPlanLogo size="md" />
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-semibold text-sage-900">{userName}</p>
                <p className="text-[11px] text-sage-600">{userEmail}</p>
              </div>
              <form action="/auth/signout" method="post">
                <Button variant="outline" size="sm" type="submit">
                  <LogOut className="h-3.5 w-3.5" />
                  Keluar
                </Button>
              </form>
            </div>
          </div>

          <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
            <p className="font-script text-3xl text-[#4F6BF6] leading-none">
              {isUpgrade
                ? "Lengkapi Perjalanan Berdua"
                : "Investasi Kecil untuk Hari Terindah"}
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#141618]">
              {isUpgrade
                ? "Buka Modul Honeymoon & Undangan"
                : "Aktifkan Workspace Pernikahanmu"}
            </h1>
            <p className="text-sm text-[#5F6978] leading-relaxed">
              {isUpgrade
                ? "Cukup bayar selisih paket untuk langsung membuka Dompet Honeymoon multi-mata uang, Angpao Bridge, dan Undangan Pernikahan Online."
                : "Sekali bayar untuk seumur hidup. Setelah pembayaran terverifikasi, workspace bersama langsung aktif dan Anda bisa mengundang pasangan gratis."}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Plan Selector */}
            <div className="lg:col-span-7 space-y-4">
              {(isUpgrade
                ? (["COMPLETE_PASS"] as PlanType[])
                : (["COMPLETE_PASS", "WEDDING_ONLY"] as PlanType[])
              ).map((key) => {
                const item = plans[key];
                const isSelected = selectedPlan === key;
                const displayPrice = isUpgrade ? upgradePrice : item.price;

                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => handlePlanChange(key)}
                    className={`relative overflow-hidden w-full text-left rounded-[2rem] border p-6 sm:p-7 transition-all duration-300 ${
                      isSelected
                        ? "border-[#E09F3E]/35 bg-midnight-luxury text-white shadow-lift"
                        : "border-black/[0.07] bg-white text-[#141618] shadow-[0_2px_16px_rgba(0,0,0,0.03)] hover:border-black/20 hover:-translate-y-0.5"
                    }`}
                  >
                    {/* Ornamen botani monoline halus pada kartu terpilih */}
                    {isSelected && (
                      <svg
                        viewBox="0 0 180 180"
                        fill="none"
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-4 -right-4 h-36 w-36 text-white/[0.08]"
                      >
                        <path
                          d="M168 12C136 38 106 82 78 164"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M142 34C128 18 108 16 96 22C108 36 126 42 142 34Z"
                          stroke="currentColor"
                          strokeWidth="1.1"
                        />
                        <path
                          d="M124 62C142 58 158 66 164 80C146 82 132 74 124 62Z"
                          stroke="currentColor"
                          strokeWidth="1.1"
                        />
                        <path
                          d="M106 94C90 82 72 84 60 94C74 106 92 108 106 94Z"
                          stroke="currentColor"
                          strokeWidth="1.1"
                        />
                      </svg>
                    )}

                    <div className="relative z-10">
                      {/* Header Paket + Indikator Radio + Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span
                            className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                              isSelected
                                ? "border-[#E09F3E] bg-[#E09F3E] text-[#141618]"
                                : "border-black/20 bg-white"
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                          </span>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-display text-lg sm:text-xl font-bold">
                                {isUpgrade
                                  ? `Upgrade ke ${item.name}`
                                  : item.name}
                              </span>
                            </div>
                            <p
                              className={`mt-1 text-xs leading-relaxed ${
                                isSelected ? "text-white/70" : "text-[#5F6978]"
                              }`}
                            >
                              {item.tagline}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          {item.badge && (
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                                isSelected
                                  ? "bg-white/15 text-[#E09F3E]"
                                  : "bg-[#F4F5F7] text-[#141618]"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                          {isSelected && (
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" />
                              Dipilih
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Blok Harga + Harga Coret */}
                      <div
                        className={`mt-4 border-y py-3.5 flex flex-wrap items-baseline justify-between gap-2 ${
                          isSelected ? "border-white/10" : "border-black/[0.06]"
                        }`}
                      >
                        <div className="flex items-baseline gap-2.5">
                          <span className="font-display text-2xl sm:text-3xl font-bold tracking-tight tabular-nums">
                            {formatIDR(displayPrice)}
                          </span>
                          {!isUpgrade && item.originalPrice > item.price && (
                            <span
                              className={`text-xs sm:text-sm line-through tabular-nums ${
                                isSelected ? "text-white/40" : "text-[#9AA29D]"
                              }`}
                            >
                              {formatIDR(item.originalPrice)}
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[11px] font-medium ${
                            isSelected ? "text-white/65" : "text-[#5F6978]"
                          }`}
                        >
                          {isUpgrade
                            ? "Bayar selisih paket"
                            : "1× bayar · Seumur hidup (2 akun)"}
                        </span>
                      </div>

                      {/* Daftar Fitur Utama */}
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                        {item.features
                          .filter((f) => f.included)
                          .slice(0, 6)
                          .map((feat) => (
                            <div
                              key={feat.label}
                              className={`flex items-start gap-2 text-xs ${
                                isSelected ? "text-white/90" : "text-[#2E3531]"
                              }`}
                            >
                              <Check
                                className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${
                                  isSelected
                                    ? "text-emerald-400"
                                    : "text-[#4F6BF6]"
                                }`}
                              />
                              <span>{feat.label}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </button>
                );
              })}

              {!isUpgrade && (
                <div className="rounded-2xl border border-black/[0.06] bg-white p-4 text-xs text-[#5F6978] leading-relaxed shadow-sm">
                  <p className="font-semibold text-[#141618] mb-1">
                    Pasanganmu sudah membeli paket NikahPlan?
                  </p>
                  <p>
                    Anda tidak perlu membayar ulang! Minta pasangan Anda
                    mengirimkan tautan undangan (
                    <span className="font-mono text-[#141618]">/join/KODE</span>
                    ) dari halaman Onboarding atau Profil, lalu klik tautan
                    tersebut untuk langsung bergabung gratis.
                  </p>
                </div>
              )}
            </div>

            {/* Order Summary & Midtrans Pay Button */}
            <Card className="lg:col-span-5 rounded-[2rem] border border-black/[0.06] bg-white shadow-card sticky top-6">
              <CardHeader className="pb-4">
                <CardTitle className="font-display text-xl text-[#141618]">
                  Ringkasan Pembayaran
                </CardTitle>
                <CardDescription className="text-[#5F6978]">
                  Aktivasi otomatis via Midtrans Snap
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Promo Code Input */}
                <div className="space-y-2">
                  <label
                    htmlFor="promo-code"
                    className="text-xs font-semibold text-[#141618] inline-flex items-center gap-1.5"
                  >
                    <Tag className="h-3.5 w-3.5 text-[#4F6BF6]" />
                    Kode Promo (Opsional)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="promo-code"
                      placeholder="Contoh: NIKAH2026"
                      value={promoInput}
                      onChange={(e) =>
                        setPromoInput(e.target.value.toUpperCase())
                      }
                      className="uppercase font-mono text-xs h-10"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 px-4 shrink-0"
                      disabled={checkingPromo}
                      onClick={handleApplyPromo}
                    >
                      {checkingPromo ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Pakai"
                      )}
                    </Button>
                  </div>
                  {promoFeedback && (
                    <p
                      className={`text-xs ${
                        promoFeedback.type === "success"
                          ? "text-emerald-700 font-medium"
                          : "text-red-600"
                      }`}
                    >
                      {promoFeedback.text}
                    </p>
                  )}
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-[#5F6978]">
                    <span>
                      {isUpgrade ? "Selisih Upgrade Complete" : planDef.name}
                    </span>
                    <span className="font-semibold text-[#141618] tabular-nums">
                      {formatIDR(basePrice)}
                    </span>
                  </div>
                  {discountAmount > 0 && appliedPromo && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Diskon ({appliedPromo.code})</span>
                      <span className="font-semibold tabular-nums">
                        -{formatIDR(discountAmount)}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="font-semibold text-[#141618]">
                      Total Bayar
                    </span>
                    <span className="font-display text-2xl font-bold text-[#141618] tabular-nums">
                      {formatIDR(finalAmount)}
                    </span>
                  </div>
                </div>

                {errorMsg && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleCheckout}
                  disabled={submitting || verifying}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Menyiapkan Pembayaran...
                    </>
                  ) : (
                    <>
                      {isUpgrade ? "Upgrade Sekarang" : "Bayar Sekarang"} &bull;{" "}
                      {formatIDR(finalAmount)}
                    </>
                  )}
                </Button>

                {pendingOrder && (
                  <div className="rounded-xl border border-sage/20 bg-cream-50 p-3.5 space-y-2.5">
                    <p className="text-xs text-sage-800">
                      Order aktif:{" "}
                      <span className="font-mono font-semibold">
                        {pendingOrder.orderId}
                      </span>
                    </p>
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="sage"
                        size="sm"
                        className="w-full"
                        onClick={() => verifyOrderStatus(pendingOrder.orderId)}
                        disabled={verifying}
                      >
                        {verifying ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Memverifikasi Status...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Periksa Status Pembayaran
                          </>
                        )}
                      </Button>
                      {pendingOrder.redirectUrl && (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <a
                            href={pendingOrder.redirectUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Buka Halaman Pembayaran Midtrans
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-sage-600 pt-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-sage" />
                  <span>
                    QRIS, Virtual Account, GoPay &amp; Kartu via Midtrans
                    {snapLoaded ? " • Snap Siap" : ""}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
