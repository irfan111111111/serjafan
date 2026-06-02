import { db } from "@/db";
import { partnerProfiles } from "@/db/schema";
import { ok } from "@/lib/api";
import { promos, serviceCategories } from "@/lib/catalog";
import { asc } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim().toLowerCase();

  const partners = await db.select().from(partnerProfiles).orderBy(asc(partnerProfiles.distanceKm));

  const matchedPartners = query
    ? partners.filter((partner) =>
        [partner.name, partner.category, partner.status, partner.verificationStatus].some((value) =>
          String(value).toLowerCase().includes(query)
        )
      )
    : partners;

  const matchedCategories = query
    ? serviceCategories.filter((category) =>
        [category.name, category.description].some((value) => value.toLowerCase().includes(query))
      )
    : serviceCategories;

  const matchedPromos = query
    ? promos.filter((promo) =>
        [promo.code, promo.title, promo.description].some((value) => value.toLowerCase().includes(query))
      )
    : promos;

  return ok({
    query,
    partners: matchedPartners,
    categories: matchedCategories,
    promos: matchedPromos
  });
}
