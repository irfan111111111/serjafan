import { eq } from "drizzle-orm";
import { db } from "@/db";
import { partnerProfiles } from "@/db/schema";
import { fail, ok, requireRole } from "@/lib/api";
import { partnerReviews } from "@/lib/catalog";

export const runtime = "nodejs";

export async function GET() {
  const { session, response } = await requireRole(["PARTNER", "ADMIN"]);
  if (response || !session) return response;

  const partner = await db.query.partnerProfiles.findFirst({
    where: eq(partnerProfiles.userId, session.user.id)
  });
  if (!partner) return fail("Partner profile not found.", 404);

  const reviews = partnerReviews.filter((review) => review.partnerId === partner.id);
  return ok({ reviews });
}
