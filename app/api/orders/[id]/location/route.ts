import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { orderTrackingEvents, orders, partnerProfiles } from "@/db/schema";
import { createId, fail, ok, readJson, requireRole } from "@/lib/api";

export const runtime = "nodejs";

type LocationBody = {
  latitude?: number;
  longitude?: number;
  etaMinutes?: number;
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireRole(["PARTNER", "ADMIN"]);
  if (response || !session) return response;

  const partner = await db.query.partnerProfiles.findFirst({
    where: eq(partnerProfiles.userId, session.user.id)
  });
  if (!partner) return fail("Partner profile not found.", 404);

  const { id } = await params;
  const body = await readJson<LocationBody>(request);
  if (body?.latitude === undefined || body?.longitude === undefined) return fail("latitude and longitude are required.");

  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, id), eq(orders.partnerId, partner.id))
  });
  if (!order) return fail("Order not found.", 404);

  await db.insert(orderTrackingEvents).values({
    id: createId("trk"),
    orderId: id,
    status: order.status,
    title: "Lokasi diperbarui",
    description: body.etaMinutes ? `ETA terbaru ${body.etaMinutes} menit.` : "Lokasi mitra diperbarui.",
    latitude: body.latitude,
    longitude: body.longitude
  });

  return ok({
    orderId: id,
    latitude: body.latitude,
    longitude: body.longitude,
    etaMinutes: body.etaMinutes ?? 12
  });
}
