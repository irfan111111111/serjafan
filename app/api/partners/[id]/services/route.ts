import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { partnerProfiles } from "@/db/schema";
import { fail, ok } from "@/lib/api";
import { serviceCategories, serviceMetaByPartnerId } from "@/lib/catalog";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const partner = await db.query.partnerProfiles.findFirst({
    where: and(eq(partnerProfiles.id, id), eq(partnerProfiles.verificationStatus, "APPROVED"))
  });

  if (!partner) return fail("Partner not found.", 404);

  const meta = serviceMetaByPartnerId[id] ?? {
    headline: `Layanan ${partner.category.toLowerCase()} profesional.`,
    description: "Layanan tersedia berdasarkan kategori mitra.",
    serviceCategoryIds: []
  };

  const categories = serviceCategories.filter((category) => meta.serviceCategoryIds.includes(category.id));

  return ok({
    partnerId: id,
    headline: meta.headline,
    description: meta.description,
    services: categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      basePrice: partner.priceFrom
    }))
  });
}
