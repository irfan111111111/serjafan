import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { messages, notifications, orders, partnerProfiles, user } from "@/db/schema";
import { createId, fail, ok, readJson, requireSession } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { recordError, recordFraudFlag } from "@/lib/monitoring";
import { ensureMessageThreadColumns } from "@/lib/message-threads";
import { sendPushToUser } from "@/lib/push";

export const runtime = "nodejs";

export async function GET() {
  const { session, response } = await requireSession();
  if (response || !session) return response;
  await ensureMessageThreadColumns();

  const storedMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.userId, session.user.id))
    .orderBy(desc(messages.createdAt))
    .limit(20);

  return ok({
    threads: storedMessages.map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      sender: item.sender,
      orderId: item.orderId,
      partnerId: item.partnerId,
      partnerName: item.partnerName,
      serviceName: item.serviceName,
      attachmentImage: item.attachmentImage,
      unread: item.unread,
      createdAt: item.createdAt
    }))
  });
}

type MessageBody = {
  body?: string;
  attachmentImage?: string;
  orderId?: string;
  recipientRole?: "CUSTOMER" | "PARTNER" | "ADMIN";
};

export async function POST(request: Request) {
  const { session, response } = await requireSession();
  if (response || !session) return response;
  try {
    await ensureMessageThreadColumns();

    const body = await readJson<MessageBody>(request);
    const text = body?.body?.trim();
    const attachmentImage = body?.attachmentImage?.trim();
    const messageText = text || (attachmentImage ? "Foto terkirim" : "");
    if (!text && !attachmentImage) return fail("Isi pesan atau foto wajib diisi.");
    if (text && text.length > 1_000) return fail("Pesan terlalu panjang. Maksimal 1000 karakter.", 422);
    if (attachmentImage && !(attachmentImage.startsWith("data:image/") || attachmentImage.startsWith("https://"))) {
      return fail("Lampiran foto harus berasal dari kamera/galeri atau upload production.", 422);
    }

    const recentMessage = await db.query.messages.findFirst({
      where: and(eq(messages.userId, session.user.id), gt(messages.createdAt, new Date(Date.now() - 2_000)))
    });
    if (recentMessage) {
      await recordFraudFlag({
        userId: session.user.id,
        entityType: "message",
        reason: "Percobaan kirim chat terlalu cepat.",
        riskScore: 35,
        metadata: { role: session.user.role }
      });
      return fail("Tunggu sebentar sebelum mengirim pesan berikutnya.", 429);
    }

  let recipientId: string | undefined;
  let title = "Pesan baru";
  let orderMeta: {
    orderId?: string;
    partnerId?: string;
    partnerName?: string;
    serviceName?: string;
  } = {};

  if (body?.orderId) {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, body.orderId)
    });

    if (order) {
      if (session.user.role === "CUSTOMER") {
        const partner = await db.query.partnerProfiles.findFirst({
          where: eq(partnerProfiles.id, order.partnerId)
        });
        recipientId = partner?.userId ?? undefined;
        title = `${partner?.category ?? "Jasa"} - ${partner?.name ?? "Partner"}`;
        orderMeta = {
          orderId: order.id,
          partnerId: partner?.id,
          partnerName: partner?.name,
          serviceName: partner?.category
        };
      } else {
        const partner = await db.query.partnerProfiles.findFirst({
          where: eq(partnerProfiles.id, order.partnerId)
        });
        if (session.user.role === "PARTNER" && partner?.userId !== session.user.id) {
          return fail("Pesanan ini bukan milik akun partner Anda.", 403);
        }
        recipientId = order.customerId;
        title = `${partner?.category ?? "Jasa"} - ${partner?.name ?? "Partner"}`;
        orderMeta = {
          orderId: order.id,
          partnerId: partner?.id,
          partnerName: partner?.name,
          serviceName: partner?.category
        };
      }
    }
  }

  if (!recipientId) {
    if (session.user.role !== "ADMIN") {
      return fail("Pilih pesanan/jasa dulu sebelum membuka chat, supaya pesan tidak tercampur antar partner.", 400);
    }
    const role = body?.recipientRole ?? "CUSTOMER";
    const recipient = await db.query.user.findFirst({
      where: eq(user.role, role)
    });
    recipientId = recipient?.id;
  }

  if (!recipientId) return fail("Message recipient was not found.", 404);

  const now = new Date();
  await db.insert(messages).values([
    {
      id: createId("msg"),
      userId: recipientId,
      sender: session.user.name,
      title,
      body: messageText,
      orderId: orderMeta.orderId ?? null,
      partnerId: orderMeta.partnerId ?? null,
      partnerName: orderMeta.partnerName ?? null,
      serviceName: orderMeta.serviceName ?? null,
      attachmentImage: attachmentImage || null,
      unread: true,
      createdAt: now,
      updatedAt: now
    },
    {
      id: createId("msg"),
      userId: session.user.id,
      sender: "Saya",
      title,
      body: messageText,
      orderId: orderMeta.orderId ?? null,
      partnerId: orderMeta.partnerId ?? null,
      partnerName: orderMeta.partnerName ?? null,
      serviceName: orderMeta.serviceName ?? null,
      attachmentImage: attachmentImage || null,
      unread: false,
      createdAt: now,
      updatedAt: now
    }
  ]);

  await db.insert(notifications).values({
    id: createId("notif"),
    userId: recipientId,
    kind: "MESSAGE",
    title: "Pesan baru masuk",
    body: `${session.user.name}: ${text ? (text.length > 80 ? `${text.slice(0, 80)}...` : text) : "Mengirim foto"}`,
    targetUrl: "/messages",
    isRead: false,
    createdAt: now,
    updatedAt: now
  });

  await sendPushToUser(recipientId, {
    title: "Pesan baru masuk",
    body: `${session.user.name}: ${text ? (text.length > 80 ? `${text.slice(0, 80)}...` : text) : "Mengirim foto"}`,
    url: "/",
    tag: `message-${orderMeta.orderId ?? recipientId}`,
    kind: "message"
  });

  await writeAuditLog({
    session,
    action: "MESSAGE_SENT",
    entityType: "message_thread",
    entityId: orderMeta.orderId ?? recipientId,
    metadata: { recipientId, hasAttachment: Boolean(attachmentImage), partnerId: orderMeta.partnerId }
  });

    return ok({ sent: true });
  } catch (error) {
    console.error("Send message failed", error);
    await recordError({ source: "messages.post", error, session });
    return fail(error instanceof Error ? error.message : "Pesan gagal dikirim.", 500);
  }
}
