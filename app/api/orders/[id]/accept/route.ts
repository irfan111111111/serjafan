import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { messages, notifications, orderTrackingEvents, orders, partnerProfiles, user, walletTransactions, wallets } from "@/db/schema";
import { createId, fail, ok, requireRole } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { sendPushToUser } from "@/lib/push";

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
  if (!partner) return fail("Profil teknisi SERJAFAN tidak ditemukan.", 404);

  const { id } = await params;
  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, id), eq(orders.partnerId, partner.id))
  });
  if (!order) return fail("Order not found.", 404);
  if (order.status !== "PENDING") return fail("Pesanan sudah pernah diproses.", 409);

  const now = new Date();

  if (order.paymentMethod === "SERJAFAN_PAY") {
    const wallet = await db.query.wallets.findFirst({
      where: eq(wallets.userId, order.customerId)
    });
    if (!wallet || wallet.balance < order.total) {
      return fail("Saldo SERJAFAN Pay customer tidak cukup saat tugas teknisi diterima.", 422);
    }

    await db.update(wallets).set({ balance: wallet.balance - order.total, updatedAt: now }).where(eq(wallets.id, wallet.id));
    await db.insert(walletTransactions).values({
      id: createId("wtx"),
      walletId: wallet.id,
      orderId: order.id,
      type: "PAYMENT",
      amount: -order.total,
      description: `Pembayaran pesanan ${order.id}`,
      createdAt: now
    });
    const commission = Math.ceil(order.total * 0.2);
    const payout = Math.max(0, order.total - commission);
    const admins = await db.select().from(user).where(eq(user.role, "ADMIN"));
    if (admins.length) {
      await db.insert(notifications).values(
        admins.map((admin) => ({
          id: createId("notif"),
          userId: admin.id,
          kind: "SYSTEM" as const,
          title: "Pembayaran SERJAFAN Pay diterima",
          body: `Customer membayar pesanan ${order.id} Rp ${new Intl.NumberFormat("id-ID").format(order.total)} dari saldo. Estimasi komisi 20% Rp ${new Intl.NumberFormat("id-ID").format(commission)}, payout teknisi Rp ${new Intl.NumberFormat("id-ID").format(payout)} setelah pesanan selesai.`,
          targetUrl: "/admin",
          isRead: false,
          createdAt: now,
          updatedAt: now
        }))
      );
    }
    if (partner.userId) {
      await db.insert(notifications).values({
        id: createId("notif"),
        userId: partner.userId,
        kind: "SYSTEM",
        title: "Customer sudah bayar SERJAFAN Pay",
        body: `Pesanan ${order.id} sudah dibayar ke admin melalui saldo SERJAFAN Pay. Payout teknisi diproses admin setelah pekerjaan selesai.`,
        targetUrl: "/partner",
        isRead: false,
        createdAt: now,
        updatedAt: now
      });
    }
  }

  const updated = await db
    .update(orders)
    .set({ status: "PARTNER_READY", updatedAt: now })
    .where(and(eq(orders.id, id), eq(orders.partnerId, partner.id)))
    .returning();

  await db.insert(notifications).values({
    id: createId("notf"),
    userId: order.customerId,
    kind: "ORDER",
    title: "Teknisi SERJAFAN ditugaskan",
    body: "SERJAFAN sudah menugaskan teknisi internal dan sedang mempersiapkan layanan Anda.",
    targetUrl: `/orders/${order.id}`,
    createdAt: now,
    updatedAt: now
  });
  await sendPushToUser(order.customerId, {
    title: "Teknisi SERJAFAN ditugaskan",
    body: `Pesanan ${order.id} sedang diproses oleh tim SERJAFAN.`,
    url: "/customer",
    tag: `order-${order.id}`,
    kind: "notification"
  });

  await db.insert(messages).values({
    id: createId("msg"),
    userId: order.customerId,
    sender: "SERJAFAN",
    title: "Pesanan diproses SERJAFAN",
    body: `Pesanan ${order.id} sudah diterima operasional. Teknisi internal sedang dipersiapkan.`,
    unread: true,
    createdAt: now,
    updatedAt: now
  });

  await db.insert(orderTrackingEvents).values({
    id: createId("trk"),
    orderId: order.id,
    status: "PARTNER_READY",
    title: "Teknisi SERJAFAN siap",
    description: "Operasional SERJAFAN sudah mengonfirmasi dan teknisi internal siap memproses pesanan.",
    latitude: partnerCoordinates[partner.id]?.latitude ?? partnerCoordinates.default.latitude,
    longitude: partnerCoordinates[partner.id]?.longitude ?? partnerCoordinates.default.longitude,
    createdAt: now
  });

  await writeAuditLog({
    session,
    action: "ORDER_ACCEPTED",
    entityType: "order",
    entityId: order.id,
    metadata: { partnerId: partner.id, customerId: order.customerId, paymentMethod: order.paymentMethod, total: order.total }
  });

  return ok({ order: updated[0] });
}
