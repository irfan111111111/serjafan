import { count, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, partnerProfiles, user } from "@/db/schema";
import { ok, requireRole } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const { response } = await requireRole(["ADMIN"]);
  if (response) return response;

  const [revenueRow, ordersRow, partnersRow, customersRow] = await Promise.all([
    db.select({ total: sql<number>`coalesce(sum(${orders.total}), 0)` }).from(orders),
    db.select({ total: count() }).from(orders),
    db.select({ total: count() }).from(partnerProfiles).where(eq(partnerProfiles.verificationStatus, "APPROVED")),
    db.select({ total: count() }).from(user).where(eq(user.role, "CUSTOMER"))
  ]);

  return ok({
    revenueMonth: revenueRow[0]?.total ?? 0,
    totalOrders: ordersRow[0]?.total ?? 0,
    activePartners: partnersRow[0]?.total ?? 0,
    activeCustomers: customersRow[0]?.total ?? 0
  });
}
