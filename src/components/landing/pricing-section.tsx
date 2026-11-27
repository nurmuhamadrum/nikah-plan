import Link from "next/link";
import { ArrowUpRight, Check, Minus } from "lucide-react";
import { PLANS, type PlanDefinition } from "@/lib/plans";
import type { PlanType } from "@/types/database";
import { formatIDR } from "@/lib/utils";

export function PricingSection({
  plans = PLANS,
}: {
  plans?: Record<PlanType, PlanDefinition>;
}) {
  const planList = [plans.WEDDING_ONLY, plans.COMPLETE_PASS];

  return (
    <section id="harga" className="scroll-mt-16 px-4 pt-8 pb-20 sm:pb-24">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto mb-10 max-w-xl text-center space-y-2">
          <h2 className="font-display text-2xl font-semibold leading-tight text-[#161917] sm:text-4xl">
            Sekali bayar untuk 2 akun pasangan.
          </h2>
          <p className="text-sm text-[#5E6762]">
            Tanpa biaya langganan bulanan. Aktivasi otomatis via Midtrans.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2">
          {planList.map((plan) => {
            const isPrimary = Boolean(plan.recommended);
            return (
              <div
                key={plan.id}
                className={`flex flex-col justify-between rounded-[2rem] border p-6 sm:p-8 ${
                  isPrimary
                    ? "border-[#2B3352] bg-midnight-luxury text-white shadow-lift"
                    : "border-black/[0.06] bg-white text-[#161917] shadow-[0_2px_16px_rgba(0,0,0,0.03)]"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-xl font-semibold">
                        {plan.name}
                      </h3>
                      <p
                        className={`mt-1 text-xs ${
                          isPrimary ? "text-white/65" : "text-[#6B746F]"
                        }`}
                      >
                        {plan.tagline}
                      </p>
                    </div>
                    {plan.badge && (
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          isPrimary
                            ? "bg-white/15 text-amberwarm"
                            : "bg-[#F3F3F1] text-[#161917]"
                        }`}
                      >
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  <div
                    className={`mt-5 border-y py-4 ${
                      isPrimary ? "border-white/10" : "border-black/[0.06]"
                    }`}
                  >
                    <div className="flex items-baseline gap-2.5">
                      <span className="font-display text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">
                        {formatIDR(plan.price)}
                      </span>
                      {plan.originalPrice > plan.price && (
                        <span
                          className={`text-sm line-through tabular-nums ${
                            isPrimary ? "text-white/40" : "text-[#9AA29D]"
                          }`}
                        >
                          {formatIDR(plan.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  <ul className="mt-5 space-y-2.5">
                    {plan.features.map((feat) => (
                      <li
                        key={feat.label}
                        className="flex items-start gap-2.5 text-sm"
                      >
                        {feat.included ? (
                          <Check
                            className={`mt-0.5 h-4 w-4 shrink-0 ${
                              isPrimary ? "text-emerald-400" : "text-sage"
                            }`}
                          />
                        ) : (
                          <Minus
                            className={`mt-0.5 h-4 w-4 shrink-0 ${
                              isPrimary ? "text-white/25" : "text-black/20"
                            }`}
                          />
                        )}
                        <span
                          className={
                            feat.included
                              ? isPrimary
                                ? "text-white/90"
                                : "text-[#2E3531]"
                              : isPrimary
                                ? "text-white/35 line-through"
                                : "text-[#9AA29D] line-through"
                          }
                        >
                          {feat.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-7">
                  <Link
                    href={`/login?next=${encodeURIComponent(`/checkout?plan=${plan.id}`)}`}
                    className={`group flex w-full items-center justify-between rounded-full py-2 pl-5 pr-2 text-sm font-semibold transition-all ${
                      isPrimary
                        ? "bg-white text-[#161917] hover:bg-[#EFEFED]"
                        : "bg-midnight-btn text-white hover:opacity-90"
                    }`}
                  >
                    <span>Pilih {plan.name}</span>
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                        isPrimary ? "bg-black/10" : "bg-white/15"
                      }`}
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
