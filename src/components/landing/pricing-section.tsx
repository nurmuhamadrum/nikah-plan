import Link from "next/link";
import { Check, X, Sparkles, ShieldCheck } from "lucide-react";
import { PLANS, type PlanDefinition } from "@/lib/plans";
import type { PlanType } from "@/types/database";
import { formatIDR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Reveal, RevealItem, RevealStagger } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function PricingSection({
  plans = PLANS,
}: {
  plans?: Record<PlanType, PlanDefinition>;
}) {
  const planList = [plans.WEDDING_ONLY, plans.COMPLETE_PASS];

  return (
    <section id="harga" className="scroll-mt-16 py-20 sm:py-28 px-4">
      <div className="mx-auto max-w-5xl">
        <Reveal className="text-center max-w-2xl mx-auto space-y-4 mb-14">
          <Badge variant="softTerracotta" className="mx-auto">
            <Sparkles className="h-3.5 w-3.5" />
            Sekali Bayar &bull; Tanpa Langganan Bulanan
          </Badge>
          <h2 className="font-display text-3xl sm:text-[2.75rem] sm:leading-[1.15] font-semibold text-sage-900">
            Pilih Paket{" "}
            <span className="font-script text-gradient-warm text-[1.25em] font-normal">
              Couple Pass
            </span>{" "}
            Terbaikmu
          </h2>
          <p className="text-sage-700/85 text-sm sm:text-base">
            Satu kali pembayaran sudah mencakup akses penuh untuk 2 akun (Anda &amp;
            Pasangan) dengan sinkronisasi real-time dan mode offline PWA.
          </p>
        </Reveal>

        <RevealStagger className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-stretch" stagger={0.15}>
          {planList.map((plan) => (
            <RevealItem key={plan.id} className="h-full">
            <Card
              className={`relative flex h-full flex-col justify-between rounded-[2rem] transition-all duration-300 hover:-translate-y-1 ${
                plan.recommended
                  ? "border-gradient-warm border-transparent bg-white shadow-glow md:scale-[1.03]"
                  : "border border-white/70 bg-white/75 hover:shadow-lift"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 right-6">
                  <Badge variant="terracotta" className="px-3.5 py-1 shadow-sm">
                    {plan.badge}
                  </Badge>
                </div>
              )}

              <div>
                <CardHeader className="pb-4">
                  <CardTitle className="font-display text-2xl text-sage-900">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="text-sage-700/80">
                    {plan.tagline}
                  </CardDescription>

                  <div className="pt-4 flex items-baseline gap-2.5">
                    <span className="font-display text-4xl sm:text-5xl font-semibold tracking-tight tabular-nums text-sage-900">
                      {formatIDR(plan.price)}
                    </span>
                    {plan.originalPrice > plan.price && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatIDR(plan.originalPrice)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-sage-600">
                    One-time payment &bull; Berlaku untuk 2 akun pasangan
                  </p>
                </CardHeader>

                <CardContent className="space-y-3 pt-2">
                  {plan.features.map((feat) => (
                    <div
                      key={feat.label}
                      className="flex items-start gap-2.5 text-sm"
                    >
                      {feat.included ? (
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage-50 text-sage">
                          <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                        </span>
                      ) : (
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cream-200 text-sage-400">
                          <X className="h-3.5 w-3.5" />
                        </span>
                      )}
                      <span
                        className={
                          feat.included
                            ? "text-sage-800"
                            : "text-muted-foreground/70 line-through"
                        }
                      >
                        {feat.label}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </div>

              <CardFooter className="pt-6">
                <Button
                  asChild
                  size="lg"
                  variant={plan.recommended ? "default" : "sage"}
                  className="w-full"
                >
                  <Link
                    href={`/login?next=${encodeURIComponent(`/checkout?plan=${plan.id}`)}`}
                  >
                    Pilih {plan.name}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            </RevealItem>
          ))}
        </RevealStagger>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-sage-700">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-sage" />
            Pembayaran Aman via Midtrans (QRIS, VA Bank, GoPay, ShopeePay)
          </span>
          <span>&bull;</span>
          <span>Aktivasi Workspace Otomatis Seketika</span>
        </div>
      </div>
    </section>
  );
}
