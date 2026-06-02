import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { orderTrackingEvents, orders, partnerProfiles } from "@/db/schema";
import { createId, fail, ok, readJson, requireRole } from "@/lib/api";

export const runtime = "nodejs";

type StatusBody = {
  status?: "ON_THE_WAY" | "IN_PROGRESS" | "COMPLETED";
  title?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireRole(["PARTNER", "ADMIN"]);
  if (response || !session) return response;

  const partner = await db.query.partnerProfiles.findFirst({
    where: eq(partnerProfiles.userId, session.user.id)
  });
  if (!partner) return fail("Partner profile not found.", 404);

  const { id } = await params;
  const body = await readJson<StatusBody>(request);
  if (!body?.status) return fail("status is required.");

  const nextStatus = body.status === "COMPLETED" ? "DONE" : body.status === "IN_PROGRESS" ? "PARTNER_READY" : "ON_THE_WAY";

  const updated = await db
    .update(orders)
    .set({ status: nextStatus, updatedAt: new Date() })
    .where(and(eq(orders.id, id), eq(orders.partnerId, partner.id)))
    .returning();

  if (updated.length === 0) return fail("Order not found.", 404);

  await db.insert(orderTrackingEvents).values({
    id: createId("trk"),
    orderId: id,
    status: body.status,
    title: body.title ?? body.status.replaceAll("_", " "),
    description: body.description ?? null,
    latitude: body.latitude ?? null,
    longitude: body.longitude ?? null
  });

  return ok({ order: updated[0] });
}
