import { and, asc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { partnerProfiles, wallets } from "@/db/schema";
import { ok } from "@/lib/api";
import { getAdminConsoleSettings } from "@/lib/admin-console";

export const runtime = "nodejs";
const MIN_PARTNER_WORK_BALANCE = 20_000;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const consoleSettings = await getAdminConsoleSettings();
  const categories = consoleSettings.services
    .filter((service) => service.active)
    .map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      basePrice: service.fee
    }));
  const promos = consoleSettings.promos.filter((promo) => promo.active);

  const partnerRows = await db
    .select()
    .from(partnerProfiles)
    .innerJoin(wallets, eq(wallets.userId, partnerProfiles.userId))
    .where(and(eq(partnerProfiles.verificationStatus, "APPROVED"), eq(partnerProfiles.status, "ONLINE"), gte(wallets.balance, MIN_PARTNER_WORK_BALANCE)))
    .orderBy(asc(partnerProfiles.distanceKm));
  const partners = partnerRows.map((row) => row.partner_profiles);

  const matchedPartners = query
    ? partners.filter((partner) =>
        [partner.name, partner.category, partner.status, partner.verificationStatus].some((value) =>
          String(value).toLowerCase().includes(query)
        )
      )
    : partners;

  const matchedCategories = query
    ? categories.filter((category) =>
        [category.name, category.description].some((value) => value.toLowerCase().includes(query))
      )
    : categories;

  const matchedPromos = query
    ? promos.filter((promo) =>
        [promo.code, promo.note].some((value) => value.toLowerCase().includes(query))
      )
    : promos;

  return ok({
    query,
    partners: matchedPartners,
    categories: matchedCategories,
    promos: matchedPromos
  });
}
