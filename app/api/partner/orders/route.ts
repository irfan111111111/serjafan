import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, partnerProfiles } from "@/db/schema";
import { fail, ok, requireRole } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { session, response } = await requireRole(["PARTNER", "ADMIN"]);
  if (response || !session) return response;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  const partner = await db.query.partnerProfiles.findFirst({
    where: eq(partnerProfiles.userId, session.user.id)
  });
  if (!partner) return fail("Partner profile not found.", 404);

  const conditions = [eq(orders.partnerId, partner.id)];
  if (status === "ASSIGNED") {
    conditions.push(eq(orders.status, "PENDING"));
  } else if (status === "ACTIVE") {
    conditions.push(eq(orders.status, "ON_THE_WAY"));
  } else if (status === "DONE") {
    conditions.push(eq(orders.status, "DONE"));
  }

  const partnerOrders = await db
    .select()
    .from(orders)
    .where(and(...conditions))
    .orderBy(desc(orders.createdAt));

  return ok({ orders: partnerOrders });
}
