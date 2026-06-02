import { ok } from "@/lib/api";
import { promos } from "@/lib/catalog";
import { getAdminConsoleSettings } from "@/lib/admin-console";

export const runtime = "nodejs";

export async function GET() {
  const consoleSettings = await getAdminConsoleSettings();
  const adminPromos = consoleSettings.promos
    .filter((promo) => promo.active)
    .map((promo) => ({
      code: promo.code,
      title: promo.note || `Promo ${promo.code}`,
      discount: promo.discount,
      categoryId: "SC-DUPLIKAT",
      active: promo.active
    }));

  return ok({ promos: [...adminPromos, ...promos.filter((promo) => promo.active)] });
}
