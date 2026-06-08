import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { messages, notifications, orders, partnerProfiles } from "@/db/schema";
import { createId, fail, ok, requireRole } from "@/lib/api";
import { sendPushToUser } from "@/lib/push";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireRole(["PARTNER", "ADMIN"]);
  if (response || !session) return response;

  const partner = await db.query.partnerProfiles.findFirst({
    where: eq(partnerProfiles.userId, session.user.id)
  });
  if (!partner) return fail("Partner profile not found.", 404);

  const { id } = await params;
  const updated = await db
    .update(orders)
    .set({ status: "CANCELLED", updatedAt: new Date() })
    .where(and(eq(orders.id, id), eq(orders.partnerId, partner.id)))
    .returning();

  if (updated.length === 0) return fail("Order not found.", 404);

  const order = updated[0];
  const now = new Date();

  await db.insert(notifications).values({
    id: createId("notf"),
    userId: order.customerId,
    kind: "ORDER",
    title: "Pesanan ditolak mitra",
    body: "Pesanan Anda belum bisa diproses oleh mitra ini.",
    targetUrl: `/orders/${order.id}`,
    createdAt: now,
    updatedAt: now
  });
  await sendPushToUser(order.customerId, {
    title: "Pesanan ditolak mitra",
    body: `${partner.name} belum bisa memproses pesanan ini.`,
    url: "/customer",
    tag: `order-${order.id}`,
    kind: "notification"
  });

  await db.insert(messages).values({
    id: createId("msg"),
    userId: order.customerId,
    sender: partner.name,
    title: "Pesanan ditolak",
    body: `Mohon maaf, pesanan ${order.id} belum bisa saya ambil saat ini.`,
    unread: true,
    createdAt: now,
    updatedAt: now
  });

  return ok({ order });
}
