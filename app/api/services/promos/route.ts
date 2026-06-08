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
      title: promo.title || promo.note || `Promo ${promo.code}`,
      description: promo.description || promo.note || "Promo aktif dari admin SERJAFAN.",
      note: promo.note,
      discount: promo.discount,
      categoryId: "SC-DUPLIKAT",
      mediaUrl: promo.mediaUrl ?? null,
      mediaType: promo.mediaType ?? null,
      active: promo.active
    }));

  return ok({ promos: [...adminPromos, ...promos.filter((promo) => promo.active)] });
}
