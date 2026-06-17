import { and, count, eq, gte, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, partnerProfiles, user } from "@/db/schema";
import { ok, requireRole } from "@/lib/api";

export const runtime = "nodejs";
const SERJAFAN_OPS_PARTNER_ID = "ptr_serjafan_ops";

export async function GET() {
  const { response } = await requireRole(["ADMIN"]);
  if (response) return response;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [revenueRow, ordersRow, partnersRow, customersRow, activeOrdersRow, pendingOrdersRow, completedThisMonthRow, cancelledThisMonthRow] = await Promise.all([
    db.select({ total: sql<number>`coalesce(sum(${orders.total}), 0)` }).from(orders).where(and(gte(orders.createdAt, monthStart), ne(orders.status, "CANCELLED"))),
    db.select({ total: count() }).from(orders),
    db
      .select({ total: count() })
      .from(partnerProfiles)
      .where(and(eq(partnerProfiles.verificationStatus, "APPROVED"), ne(partnerProfiles.id, SERJAFAN_OPS_PARTNER_ID))),
    db.select({ total: count() }).from(user).where(eq(user.role, "CUSTOMER")),
    db.select({ total: count() }).from(orders).where(and(ne(orders.status, "DONE"), ne(orders.status, "CANCELLED"))),
    db.select({ total: count() }).from(orders).where(eq(orders.status, "PENDING")),
    db.select({ total: count() }).from(orders).where(and(gte(orders.createdAt, monthStart), eq(orders.status, "DONE"))),
    db.select({ total: count() }).from(orders).where(and(gte(orders.createdAt, monthStart), eq(orders.status, "CANCELLED")))
  ]);

  return ok({
    revenueMonth: revenueRow[0]?.total ?? 0,
    totalOrders: ordersRow[0]?.total ?? 0,
    activePartners: partnersRow[0]?.total ?? 0,
    activeCustomers: customersRow[0]?.total ?? 0,
    activeOrders: activeOrdersRow[0]?.total ?? 0,
    pendingOrders: pendingOrdersRow[0]?.total ?? 0,
    completedThisMonth: completedThisMonthRow[0]?.total ?? 0,
    cancelledThisMonth: cancelledThisMonthRow[0]?.total ?? 0
  });
}
