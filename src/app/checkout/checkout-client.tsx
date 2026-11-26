"use client";

import { useEffect, useState, useCallback } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import {
  Check,
  Tag,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Sparkles,
  LogOut,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { PLANS, validatePromoCode } from "@/lib/plans";
import { formatIDR } from "@/lib/utils";
import type { PlanType } from "@/types/database";
import { NikahPlanLogo } from "@/components/brand/logo";
import { BotanicalCorner } from "@/components/brand/botanical-accent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  snapJsUrl: string;
  midtransClientKey: string;
  callbackOrderId?: string;
}

export function CheckoutClient({
  userEmail,
  userName,
  initialPlan,
  snapJsUrl,
  midtransClientKey,
  callbackOrderId,
}: CheckoutClientProps) {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(initialPlan);
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
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

  const planDef = PLANS[selectedPlan];
  const pricing = validatePromoCode(appliedPromo, planDef.price);

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
          router.push(data.redirectTo || "/onboarding");
          router.refresh();
          return;
        }
        if (data.status === "PENDING") {
          setPendingOrder((prev) => ({
            orderId,
            redirectUrl: prev?.redirectUrl,
          }));
          setErrorMsg(
            "Pembayaran Anda masih menunggu penyelesaian. Selesaikan pembayaran lalu klik 'Periksa Status Pembayaran'."
          );
        } else if (data.status === "FAILED" || data.status === "EXPIRED") {
          setPendingOrder(null);
          setErrorMsg(
            "Transaksi dibatalkan atau kedaluwarsa. Silakan buat transaksi baru."
          );
        } else if (data.error) {
          setErrorMsg(data.error);
        }
      } catch {
        setErrorMsg("Gagal memeriksa status pembayaran. Coba beberapa saat lagi.");
      } finally {
        setVerifying(false);
      }
    },
    [router]
  );

  // Jika user kembali dari halaman redirect Midtrans (?order_id=...), verifikasi otomatis
  useEffect(() => {
    if (callbackOrderId) {
      verifyOrderStatus(callbackOrderId);
    }
  }, [callbackOrderId, verifyOrderStatus]);

  const handleApplyPromo = () => {
    if (!promoInput.trim()) {
      setAppliedPromo(null);
      setPromoFeedback(null);
      return;
    }
    const result = validatePromoCode(promoInput, planDef.price);
    if (result.valid && result.code) {
      setAppliedPromo(result.code);
      setPromoFeedback({
        type: "success",
        text: `${result.description} (-${formatIDR(result.discountAmount)})`,
      });
    } else {
      setAppliedPromo(null);
      setPromoFeedback({
        type: "error",
        text: "Kode promo tidak ditemukan. Coba kode NIKAH2026 atau COUPLE20.",
      });
    }
  };

  const handleCheckout = async () => {
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          promoCode: appliedPromo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.alreadyPaid) {
          router.push("/onboarding");
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

      // Buka Midtrans Snap embedded modal di dalam web jika script sudah siap
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
            // Cek status siapa tahu user sudah transfer sebelum menutup modal
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

      <div className="relative min-h-screen bg-cream px-4 py-8 overflow-x-hidden">
        <BotanicalCorner
          className="fixed -top-6 -right-6 h-44 w-44 opacity-25"
          variant="sage"
        />

        <div className="relative z-10 mx-auto max-w-4xl">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-8">
            <NikahPlanLogo size="md" />
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
            <Badge variant="softTerracotta">
              <Sparkles className="h-3.5 w-3.5" />
              Langkah Aktivasi Akses Couple Pass
            </Badge>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-sage-900">
              Aktifkan Workspace Pernikahanmu
            </h1>
            <p className="text-sm text-sage-700/85">
              Sekali bayar untuk seumur hidup. Setelah pembayaran terverifikasi,
              workspace bersama langsung aktif dan Anda bisa mengundang pasangan
              secara gratis.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Plan Selector */}
            <div className="lg:col-span-7 space-y-4">
              {(["COMPLETE_PASS", "WEDDING_ONLY"] as PlanType[]).map((key) => {
                const item = PLANS[key];
                const isSelected = selectedPlan === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedPlan(key)}
                    className={`w-full text-left rounded-2xl border-2 p-5 transition-all bg-white ${
                      isSelected
                        ? "border-sage shadow-soft ring-2 ring-sage/10"
                        : "border-sage/15 hover:border-sage/35"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-display text-xl font-bold text-sage-900">
                            {item.name}
                          </span>
                          {item.badge && (
                            <Badge variant="terracotta" className="text-[11px]">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-sage-700/85">
                          {item.tagline}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xl font-bold text-sage-900">
                          {formatIDR(item.price)}
                        </p>
                        <p className="text-xs text-muted-foreground line-through">
                          {formatIDR(item.originalPrice)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {item.features
                        .filter((f) => f.included)
                        .slice(0, 4)
                        .map((feat) => (
                          <div
                            key={feat.label}
                            className="flex items-start gap-1.5 text-xs text-sage-700"
                          >
                            <Check className="h-3.5 w-3.5 text-sage shrink-0 mt-0.5" />
                            <span>{feat.label}</span>
                          </div>
                        ))}
                    </div>
                  </button>
                );
              })}

              <div className="rounded-2xl border border-sage/15 bg-sage-50/70 p-4 text-xs text-sage-800 leading-relaxed">
                <p className="font-semibold text-sage-900 mb-1">
                  Pasanganmu sudah membeli paket NikahPlan?
                </p>
                <p>
                  Anda tidak perlu membayar ulang! Minta pasangan Anda mengirimkan
                  tautan undangan (<span className="font-mono">/join/KODE</span>)
                  dari halaman Onboarding atau Profil, lalu klik tautan tersebut
                  untuk langsung bergabung gratis.
                </p>
              </div>
            </div>

            {/* Order Summary & Midtrans Pay Button */}
            <Card className="lg:col-span-5 rounded-3xl border-sage/15 shadow-soft sticky top-6">
              <CardHeader className="pb-4">
                <CardTitle className="font-display text-xl">
                  Ringkasan Pembayaran
                </CardTitle>
                <CardDescription>
                  Aktivasi otomatis via Midtrans Snap
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Promo Code Input */}
                <div className="space-y-2">
                  <label
                    htmlFor="promo-code"
                    className="text-xs font-semibold text-sage-800 inline-flex items-center gap-1.5"
                  >
                    <Tag className="h-3.5 w-3.5 text-terracotta" />
                    Kode Promo (Opsional)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="promo-code"
                      placeholder="Contoh: NIKAH2026"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      className="uppercase font-mono text-xs h-10"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 px-4 shrink-0"
                      onClick={handleApplyPromo}
                    >
                      Pakai
                    </Button>
                  </div>
                  {promoFeedback && (
                    <p
                      className={`text-xs ${
                        promoFeedback.type === "success"
                          ? "text-sage-700 font-medium"
                          : "text-terracotta-700"
                      }`}
                    >
                      {promoFeedback.text}
                    </p>
                  )}
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-sage-700">
                    <span>{planDef.name}</span>
                    <span className="font-medium">{formatIDR(planDef.price)}</span>
                  </div>
                  {pricing.discountAmount > 0 && (
                    <div className="flex justify-between text-terracotta-700">
                      <span>Diskon ({pricing.code})</span>
                      <span className="font-medium">
                        -{formatIDR(pricing.discountAmount)}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="font-semibold text-sage-900">
                      Total Bayar
                    </span>
                    <span className="text-2xl font-bold text-sage-900">
                      {formatIDR(pricing.finalAmount)}
                    </span>
                  </div>
                </div>

                {errorMsg && (
                  <div className="flex items-start gap-2 rounded-xl border border-terracotta/30 bg-terracotta-50 p-3 text-xs text-terracotta-800">
                    <AlertCircle className="h-4 w-4 shrink-0 text-terracotta mt-0.5" />
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
                      Bayar Sekarang &bull; {formatIDR(pricing.finalAmount)}
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
