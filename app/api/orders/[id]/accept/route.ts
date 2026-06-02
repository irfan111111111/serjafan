import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { messages, notifications, orderTrackingEvents, orders, partnerProfiles, walletTransactions, wallets } from "@/db/schema";
import { createId, fail, ok, requireRole } from "@/lib/api";

export const runtime = "nodejs";

const partnerCoordinates: Record<string, { latitude: number; longitude: number }> = {
  default: { latitude: -0.9471, longitude: 100.4172 }
};

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
    .set({ status: "PARTNER_READY", updatedAt: new Date() })
    .where(and(eq(orders.id, id), eq(orders.partnerId, partner.id)))
    .returning();

  if (updated.length === 0) return fail("Order not found.", 404);

  const order = updated[0];
  const now = new Date();

  await db.insert(notifications).values({
    id: createId("notf"),
    userId: order.customerId,
    kind: "ORDER",
    title: "Pesanan diterima mitra",
    body: "Mitra sudah menerima pesanan Anda dan sedang bersiap berangkat.",
    targetUrl: `/orders/${order.id}`,
    createdAt: now,
    updatedAt: now
  });

  await db.insert(messages).values({
    id: createId("msg"),
    userId: order.customerId,
    sender: partner.name,
    title: "Pesanan diterima",
    body: `Pesanan ${order.id} sudah saya terima. Saya segera berangkat.`,
    unread: true,
    createdAt: now,
    updatedAt: now
  });

  await db.insert(orderTrackingEvents).values({
    id: createId("trk"),
    orderId: order.id,
    status: "PARTNER_READY",
    title: "Mitra menerima pesanan",
    description: `${partner.name} sudah mengonfirmasi dan siap memproses pesanan.`,
    latitude: partnerCoordinates[partner.id]?.latitude ?? partnerCoordinates.default.latitude,
    longitude: partnerCoordinates[partner.id]?.longitude ?? partnerCoordinates.default.longitude,
    createdAt: now
  });

  if (order.paymentMethod === "SERJAFAN_PAY") {
    const wallet = await db.query.wallets.findFirst({
      where: eq(wallets.userId, order.customerId)
    });

    if (wallet) {
      await db.insert(walletTransactions).values({
        id: createId("wtx"),
        walletId: wallet.id,
        orderId: order.id,
        type: "PAYMENT",
        amount: -order.total,
        description: `Pembayaran pesanan ${order.id}`,
        createdAt: now
      });
    }
  }

  return ok({ order });
}
