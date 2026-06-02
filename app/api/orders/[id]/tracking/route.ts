import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orderTrackingEvents, orders } from "@/db/schema";
import { fail, ok, requireSession } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireSession();
  if (response || !session) return response;

  const { id } = await params;
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, id)
  });

  if (!order || order.customerId !== session.user.id) return fail("Order not found.", 404);

  const events = await db
    .select()
    .from(orderTrackingEvents)
    .where(eq(orderTrackingEvents.orderId, id))
    .orderBy(asc(orderTrackingEvents.createdAt));

  return ok({
    orderId: id,
    status: order.status,
    etaMinutes: 12,
    events
  });
}
