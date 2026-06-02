import { fail, ok, readJson, requireSession } from "@/lib/api";
import { promos } from "@/lib/catalog";
import { getAdminConsoleSettings } from "@/lib/admin-console";
import { getAppSettings } from "@/lib/settings";

export const runtime = "nodejs";

type ValidateBody = {
  code?: string;
  categoryId?: string;
  orderTotal?: number;
};

export async function POST(request: Request) {
  const { session, response } = await requireSession();
  if (response || !session) return response;

  const body = await readJson<ValidateBody>(request);
  const code = body?.code?.trim().toUpperCase();
  if (!code) return fail("Promo code is required.");

  const settings = await getAppSettings();
  const adminPromoCode = settings.promoCode.trim().toUpperCase();
  if (adminPromoCode && code === adminPromoCode) {
    const discount = body?.orderTotal ? Math.min(settings.promoDiscount, body.orderTotal) : settings.promoDiscount;

    return ok({
      promo: {
        code: adminPromoCode,
        title: "Promo Admin SERJAFAN",
        discount
      }
    });
  }

  const consoleSettings = await getAdminConsoleSettings();
  const adminConsolePromo = consoleSettings.promos.find((item) => item.active && item.code.trim().toUpperCase() === code);
  if (adminConsolePromo) {
    const discount = body?.orderTotal ? Math.min(adminConsolePromo.discount, body.orderTotal) : adminConsolePromo.discount;

    return ok({
      promo: {
        code: adminConsolePromo.code.trim().toUpperCase(),
        title: adminConsolePromo.note || "Promo Admin SERJAFAN",
        discount
      }
    });
  }

  const promo = promos.find((item) => item.code === code && item.active);
  if (!promo) return fail("Promo code is invalid.", 404);

  if (body?.categoryId && promo.categoryId !== body.categoryId) {
    return fail("Promo is not valid for this category.", 422);
  }

  const discount = body?.orderTotal ? Math.min(promo.discount, body.orderTotal) : promo.discount;

  return ok({
    promo: {
      code: promo.code,
      title: promo.title,
      discount
    }
  });
}
