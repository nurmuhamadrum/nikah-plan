import { NextResponse } from "next/server";
import { z } from "zod";
import {
  calculateUpgradePrice,
  getDynamicPricingPlans,
  validateDynamicPromoCode,
} from "@/lib/dynamic-config";

const promoValidateSchema = z.object({
  code: z.string().trim().min(1).max(32),
  plan: z.enum(["WEDDING_ONLY", "COMPLETE_PASS"]),
  isUpgrade: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = promoValidateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { valid: false, reason: "Format kode promo tidak valid." },
        { status: 400 }
      );
    }

    const plans = await getDynamicPricingPlans();
    const basePrice = parsed.data.isUpgrade
      ? calculateUpgradePrice(plans)
      : plans[parsed.data.plan].price;

    const result = await validateDynamicPromoCode(parsed.data.code, basePrice);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { valid: false, reason: "Gagal memvalidasi kode promo." },
      { status: 500 }
    );
  }
}
