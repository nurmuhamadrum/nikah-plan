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
  Sparkles,
  LogOut,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import type { PlanDefinition } from "@/lib/plans";
import { formatIDR } from "@/lib/utils";
import type { PlanType } from "@/types/database";
import { NikahPlanLogo } from "@/components/brand/logo";
import { BotanicalCorner } from "@/components/brand/botanical-accent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
          router.push(isUpgrade ? "/dashboard" : data.redirectTo || "/onboarding");
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
    [router, isUpgrade]
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

      <div className="relative min-h-screen bg-cream px-4 py-8 overflow-x-hidden">
        <BotanicalCorner
          className="fixed -top-6 -right-6 h-44 w-44 opacity-25"
          variant="sage"
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
            <Badge variant="softTerracotta">
              <Sparkles className="h-3.5 w-3.5" />
              {isUpgrade
                ? "Upgrade ke Complete Couple Pass"
                : "Langkah Aktivasi Akses Couple Pass"}
            </Badge>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-sage-900">
              {isUpgrade
                ? "Buka Modul Honeymoon Planner"
                : "Aktifkan Workspace Pernikahanmu"}
            </h1>
            <p className="text-sm text-sage-700/85">
              {isUpgrade
                ? "Cukup bayar selisih paket untuk langsung membuka Dompet Honeymoon, kalkulator uang jajan harian, multi-mata uang, dan Angpao Bridge."
                : "Sekali bayar untuk seumur hidup. Setelah pembayaran terverifikasi, workspace bersama langsung aktif dan Anda bisa mengundang pasangan secara gratis."}
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
                    onClick={() => handlePlanChange(key)}
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
                            {isUpgrade ? `Upgrade ke ${item.name}` : item.name}
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
                          {formatIDR(displayPrice)}
                        </p>
                        {!isUpgrade && item.originalPrice > item.price && (
                          <p className="text-xs text-muted-foreground line-through">
                            {formatIDR(item.originalPrice)}
                          </p>
                        )}
                        {isUpgrade && (
                          <p className="text-[11px] text-sage-600">
                            Selisih paket
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {item.features
                        .filter((f) => f.included)
                        .slice(0, 6)
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

              {!isUpgrade && (
                <div className="rounded-2xl border border-sage/15 bg-sage-50/70 p-4 text-xs text-sage-800 leading-relaxed">
                  <p className="font-semibold text-sage-900 mb-1">
                    Pasanganmu sudah membeli paket NikahPlan?
                  </p>
                  <p>
                    Anda tidak perlu membayar ulang! Minta pasangan Anda
                    mengirimkan tautan undangan (
                    <span className="font-mono">/join/KODE</span>) dari halaman
                    Onboarding atau Profil, lalu klik tautan tersebut untuk
                    langsung bergabung gratis.
                  </p>
                </div>
              )}
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
                    <span>
                      {isUpgrade ? "Selisih Upgrade Complete" : planDef.name}
                    </span>
                    <span className="font-medium">{formatIDR(basePrice)}</span>
                  </div>
                  {discountAmount > 0 && appliedPromo && (
                    <div className="flex justify-between text-terracotta-700">
                      <span>Diskon ({appliedPromo.code})</span>
                      <span className="font-medium">
                        -{formatIDR(discountAmount)}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="font-semibold text-sage-900">
                      Total Bayar
                    </span>
                    <span className="text-2xl font-bold text-sage-900">
                      {formatIDR(finalAmount)}
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
