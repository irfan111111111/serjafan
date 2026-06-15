import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications, orderTrackingEvents, orders, partnerProfiles, user, walletTransactions, wallets } from "@/db/schema";
import { createId, fail, ok, readJson, requireRole } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { sendPushToUser } from "@/lib/push";

export const runtime = "nodejs";
const PLATFORM_COMMISSION_RATE = 0.2;
const MIN_PARTNER_WORK_BALANCE = 20_000;

type StatusBody = {
  status?: "ON_THE_WAY" | "IN_PROGRESS" | "COMPLETED";
  title?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireRole(["PARTNER", "ADMIN"]);
  if (response || !session) return response;

  const partner = await db.query.partnerProfiles.findFirst({
    where: eq(partnerProfiles.userId, session.user.id)
  });
  if (!partner) return fail("Partner profile not found.", 404);

  const { id } = await params;
  const body = await readJson<StatusBody>(request);
  if (!body?.status) return fail("status is required.");

  const nextStatus = body.status === "COMPLETED" ? "DONE" : body.status === "IN_PROGRESS" ? "PARTNER_READY" : "ON_THE_WAY";
  const now = new Date();

  if (body.status === "COMPLETED") {
    const existingOrder = await db.query.orders.findFirst({
      where: and(eq(orders.id, id), eq(orders.partnerId, partner.id))
    });
    if (!existingOrder) return fail("Order not found.", 404);
    if (existingOrder.status === "DONE") return fail("Pesanan sudah selesai dan komisi sudah diproses.", 409);

    const commission = Math.ceil(existingOrder.total * PLATFORM_COMMISSION_RATE);
    const partnerPayout = Math.max(0, existingOrder.total - commission);

    if (existingOrder.paymentMethod === "SERJAFAN_PAY") {
      const admins = await db.select().from(user).where(eq(user.role, "ADMIN"));
      if (admins.length) {
        await db.insert(notifications).values(
          admins.map((admin) => ({
            id: createId("notif"),
            userId: admin.id,
            kind: "SYSTEM" as const,
            title: "Payout teknisi perlu diproses",
            body: `Pesanan ${existingOrder.id} dibayar lewat saldo customer. Potong biaya platform 20% Rp ${new Intl.NumberFormat("id-ID").format(commission)}, lalu proses pembayaran teknisi lapangan Rp ${new Intl.NumberFormat("id-ID").format(partnerPayout)} sesuai data operasional.`,
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
          title: "Payout menunggu admin",
          body: `Pesanan ${existingOrder.id} selesai. Admin akan memproses transfer payout Rp ${new Intl.NumberFormat("id-ID").format(partnerPayout)} setelah komisi 20%.`,
          targetUrl: "/partner",
          isRead: false,
          createdAt: now,
          updatedAt: now
        });
      }
    } else {
      const partnerWallet = await db.query.wallets.findFirst({
        where: eq(wallets.userId, session.user.id)
      });
      if (!partnerWallet || partnerWallet.balance < commission) {
        return fail(`Saldo deposit teknisi tidak cukup untuk biaya platform 20% Rp ${new Intl.NumberFormat("id-ID").format(commission)}. Top up dulu agar pesanan bisa diselesaikan.`, 422);
      }

      const nextBalance = partnerWallet.balance - commission;
      await db.update(wallets).set({ balance: nextBalance, updatedAt: now }).where(eq(wallets.id, partnerWallet.id));
      if (nextBalance < MIN_PARTNER_WORK_BALANCE) {
        await db
          .update(partnerProfiles)
          .set({ status: "OFFLINE", updatedAt: now })
          .where(eq(partnerProfiles.id, partner.id));
      }
      await db.insert(walletTransactions).values({
        id: createId("wtx"),
        walletId: partnerWallet.id,
        orderId: existingOrder.id,
        type: "WITHDRAWAL",
        amount: -commission,
        description: `Komisi platform 20% untuk pesanan ${existingOrder.id}`,
        createdAt: now
      });
      await writeAuditLog({
        session,
        action: "PLATFORM_COMMISSION_CHARGED",
        entityType: "order",
        entityId: existingOrder.id,
        metadata: { commission, rate: PLATFORM_COMMISSION_RATE, paymentMethod: existingOrder.paymentMethod, nextBalance }
      });
      await db.insert(notifications).values({
        id: createId("notif"),
        userId: session.user.id,
        kind: "SYSTEM",
        title: "Komisi platform dipotong",
        body: `Biaya platform 20% pesanan ${existingOrder.id} sebesar Rp ${new Intl.NumberFormat("id-ID").format(commission)} dipotong dari deposit teknisi.${nextBalance < MIN_PARTNER_WORK_BALANCE ? " Saldo sekarang di bawah Rp 20.000, akun otomatis offline sampai top up lagi." : ""}`,
        targetUrl: "/partner",
        isRead: false,
        createdAt: now,
        updatedAt: now
      });
    }
    await db.insert(notifications).values({
      id: createId("notif"),
      userId: existingOrder.customerId,
      kind: "ORDER",
      title: "Beri rating layanan SERJAFAN",
      body: `Pesanan ${existingOrder.id} sudah selesai. Mohon isi rating dan ulasan untuk membantu SERJAFAN menjaga kualitas layanan.`,
      targetUrl: "/customer?screen=orders",
      isRead: false,
      createdAt: now,
      updatedAt: now
    });
  }

  const updated = await db
    .update(orders)
    .set({ status: nextStatus, updatedAt: now })
    .where(and(eq(orders.id, id), eq(orders.partnerId, partner.id)))
    .returning();

  if (updated.length === 0) return fail("Order not found.", 404);

  await db.insert(orderTrackingEvents).values({
    id: createId("trk"),
    orderId: id,
    status: body.status,
    title: body.title ?? body.status.replaceAll("_", " "),
    description: body.description ?? null,
    latitude: body.latitude ?? null,
    longitude: body.longitude ?? null
  });

  await writeAuditLog({
    session,
    action: "ORDER_STATUS_UPDATED",
    entityType: "order",
    entityId: id,
    metadata: { requestedStatus: body.status, nextStatus, partnerId: partner.id }
  });

  const updatedOrder = updated[0];
  await sendPushToUser(updatedOrder.customerId, {
    title: nextStatus === "DONE" ? "Pesanan selesai" : "Status pesanan diperbarui",
    body:
      nextStatus === "DONE"
        ? `Pesanan ${updatedOrder.id} selesai. Silakan beri rating layanan SERJAFAN.`
        : `Status pesanan ${updatedOrder.id} diperbarui oleh operasional SERJAFAN.`,
    url: "/customer",
    tag: `order-${updatedOrder.id}`,
    kind: "notification"
  });

  return ok({ order: updated[0] });
}
