import { eq } from "drizzle-orm";
import { db } from "@/db";
import { partnerProfiles } from "@/db/schema";
import { fail, ok } from "@/lib/api";
import { partnerReviews } from "@/lib/catalog";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const partner = await db.query.partnerProfiles.findFirst({
    where: eq(partnerProfiles.id, id)
  });

  if (!partner) return fail("Partner not found.", 404);

  const reviews = partnerReviews
    .filter((review) => review.partnerId === id)
    .map((review) => ({
      ...review,
      rating: review.rating,
      partnerName: partner.name
    }));

  return ok({
    partnerId: id,
    reviews
  });
}
