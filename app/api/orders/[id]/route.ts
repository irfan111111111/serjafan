import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { fail, ok, requireSession } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireSession();
  if (response || !session) return response;

  const { id } = await params;
  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, id), eq(orders.customerId, session.user.id)),
    with: {
      partner: true,
      trackingEvents: true
    }
  });

  if (!order) return fail("Order not found.", 404);

  return ok({ order });
}
