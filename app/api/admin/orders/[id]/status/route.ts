import { eq } from "drizzle-orm";
import { db } from "@/db";
import { messages, notifications, orderTrackingEvents, orders } from "@/db/schema";
import { createId, fail, ok, readJson, requireRole } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { ensureOrderPaymentColumns } from "@/lib/order-payments";
import { sendPushToUser } from "@/lib/push";

export const runtime = "nodejs";

type AdminOrderStatus = "CONFIRMED" | "PARTNER_READY" | "ON_THE_WAY" | "DONE" | "CANCELLED";

type StatusBody = {
  status?: AdminOrderStatus;
  title?: string;
  description?: string;
};

const statusCopy: Record<AdminOrderStatus, { title: string; body: string; tracking: string }> = {
  CONFIRMED: {
    title: "Pesanan dikonfirmasi SERJAFAN",
    body: "Pesanan Anda sudah diterima admin SERJAFAN dan sedang diproses.",
    tracking: "Admin SERJAFAN sudah mengonfirmasi pesanan customer."
  },
  PARTNER_READY: {
    title: "Teknisi SERJAFAN disiapkan",
    body: "Tim SERJAFAN sedang menyiapkan teknisi lapangan untuk pesanan Anda.",
    tracking: "Operasional SERJAFAN menyiapkan teknisi lapangan."
  },
  ON_THE_WAY: {
    title: "Teknisi menuju lokasi",
    body: "Teknisi lapangan SERJAFAN sedang menuju lokasi Anda.",
    tracking: "Teknisi lapangan menuju alamat customer."
  },
  DONE: {
    title: "Pesanan selesai",
    body: "Pesanan Anda sudah selesai. Mohon beri rating dan ulasan untuk membantu SERJAFAN menjaga kualitas layanan.",
    tracking: "Pekerjaan selesai dan menunggu ulasan customer."
  },
  CANCELLED: {
    title: "Pesanan dibatalkan",
    body: "Pesanan Anda dibatalkan oleh admin SERJAFAN. Silakan hubungi bantuan jika membutuhkan tindak lanjut.",
    tracking: "Pesanan dibatalkan oleh operasional SERJAFAN."
  }
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireRole(["ADMIN"]);
  if (response || !session) return response;
  await ensureOrderPaymentColumns();

  const { id } = await params;
  const body = await readJson<StatusBody>(request);
  if (!body?.status) return fail("Status wajib diisi.");

  const copy = statusCopy[body.status];
  if (!copy) return fail("Status admin tidak valid.");

  const existing = await db.query.orders.findFirst({ where: eq(orders.id, id) });
  if (!existing) return fail("Order tidak ditemukan.", 404);
  if (["DONE", "CANCELLED"].includes(existing.status) && existing.status !== body.status) {
    return fail("Pesanan final tidak bisa diproses ulang.", 409);
  }

  const now = new Date();
  const paymentStatus =
    body.status === "CANCELLED"
      ? existing.paymentStatus
      : existing.paymentMethod === "DIRECT_TRANSFER" && ["CONFIRMED", "PARTNER_READY", "ON_THE_WAY", "DONE"].includes(body.status)
        ? "VERIFIED"
        : existing.paymentMethod === "CASH"
          ? "CASH_ON_DELIVERY"
          : existing.paymentStatus;
  const updated = await db
    .update(orders)
    .set({ status: body.status, paymentStatus, updatedAt: now })
    .where(eq(orders.id, id))
    .returning();

  await db.insert(orderTrackingEvents).values({
    id: createId("trk"),
    orderId: id,
    status: body.status,
    title: body.title ?? copy.title,
    description: body.description ?? copy.tracking,
    latitude: null,
    longitude: null,
    createdAt: now
  });

  await db.insert(notifications).values({
    id: createId("notif"),
    userId: existing.customerId,
    kind: "ORDER",
    title: copy.title,
    body: copy.body,
    targetUrl: "/customer?screen=orders",
    isRead: false,
    createdAt: now,
    updatedAt: now
  });

  await db.insert(messages).values({
    id: createId("msg"),
    userId: existing.customerId,
    sender: "SERJAFAN Admin",
    title: copy.title,
    body: copy.body,
    unread: true,
    orderId: existing.id,
    partnerId: existing.partnerId,
    createdAt: now,
    updatedAt: now
  });

  await writeAuditLog({
    session,
    action: "ADMIN_ORDER_STATUS_UPDATED",
    entityType: "order",
    entityId: id,
    metadata: { from: existing.status, to: body.status, paymentMethod: existing.paymentMethod, total: existing.total }
  });

  await sendPushToUser(existing.customerId, {
    title: copy.title,
    body: copy.body,
    url: "/customer",
    tag: `order-${existing.id}`,
    kind: "notification"
  });

  return ok({ order: updated[0] });
}
