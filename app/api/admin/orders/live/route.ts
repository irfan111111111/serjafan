import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { addresses, orders, user } from "@/db/schema";
import { ok, requireRole } from "@/lib/api";
import { ensureOrderPaymentColumns } from "@/lib/order-payments";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { response } = await requireRole(["ADMIN"]);
  if (response) return response;
  await ensureOrderPaymentColumns();

  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  const query = db
    .select({
      id: orders.id,
      customerId: orders.customerId,
      customerName: user.name,
      customerEmail: user.email,
      customerPhone: addresses.subtitle,
      customerLocation: addresses.title,
      partnerId: orders.partnerId,
      serviceCategoryId: orders.serviceCategoryId,
      addressTitle: orders.addressTitle,
      addressSubtitle: orders.addressSubtitle,
      scheduleType: orders.scheduleType,
      scheduleTitle: orders.scheduleTitle,
      scheduleSubtitle: orders.scheduleSubtitle,
      note: orders.note,
      paymentMethod: orders.paymentMethod,
      paymentStatus: orders.paymentStatus,
      paymentProofImage: orders.paymentProofImage,
      paymentSenderName: orders.paymentSenderName,
      paymentReference: orders.paymentReference,
      promoCode: orders.promoCode,
      serviceFee: orders.serviceFee,
      platformFee: orders.platformFee,
      discount: orders.discount,
      total: orders.total,
      status: orders.status,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt
    })
    .from(orders)
    .leftJoin(user, eq(user.id, orders.customerId))
    .leftJoin(addresses, and(eq(addresses.userId, orders.customerId), eq(addresses.isDefault, true)));
  const rows = status
    ? await query.where(eq(orders.status, status as never)).orderBy(desc(orders.createdAt))
    : await query.where(and(ne(orders.status, "DONE"), ne(orders.status, "CANCELLED"))).orderBy(desc(orders.createdAt));

  return ok({ orders: rows });
}
