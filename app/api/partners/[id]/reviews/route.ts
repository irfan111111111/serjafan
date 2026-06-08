import { eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications, partnerProfiles } from "@/db/schema";
import { createId, fail, ok, readJson, requireRole } from "@/lib/api";
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

type ReviewBody = {
  rating?: number;
  comment?: string;
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireRole(["CUSTOMER"]);
  if (response || !session) return response;

  const { id } = await params;
  const body = await readJson<ReviewBody>(request);
  const rating = Math.max(1, Math.min(5, Math.round(Number(body?.rating ?? 5))));
  const comment = body?.comment?.trim() || "Customer memberi ulasan tanpa catatan.";

  const partner = await db.query.partnerProfiles.findFirst({ where: eq(partnerProfiles.id, id) });
  if (!partner) return fail("Partner not found.", 404);

  const nextReviewCount = partner.reviewCount + 1;
  const nextRating = Number((((partner.rating * partner.reviewCount) + rating) / nextReviewCount).toFixed(2));
  const now = new Date();

  await db
    .update(partnerProfiles)
    .set({ rating: nextRating, reviewCount: nextReviewCount, updatedAt: now })
    .where(eq(partnerProfiles.id, id));

  if (partner.userId) {
    await db.insert(notifications).values({
      id: createId("notif"),
      userId: partner.userId,
      kind: "SYSTEM",
      title: "Rating customer masuk",
      body: `${session.user.name} memberi rating ${rating}/5. Ulasan: ${comment}`,
      targetUrl: "/partner",
      isRead: false,
      createdAt: now,
      updatedAt: now
    });
  }

  return ok({ rating: nextRating, reviewCount: nextReviewCount });
}
