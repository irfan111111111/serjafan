import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { messages, orders, partnerProfiles, user } from "@/db/schema";
import { createId, fail, ok, readJson, requireSession } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const { session, response } = await requireSession();
  if (response || !session) return response;

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
      unread: item.unread,
      createdAt: item.createdAt
    }))
  });
}

type MessageBody = {
  body?: string;
  orderId?: string;
  recipientRole?: "CUSTOMER" | "PARTNER" | "ADMIN";
};

export async function POST(request: Request) {
  const { session, response } = await requireSession();
  if (response || !session) return response;

  const body = await readJson<MessageBody>(request);
  const text = body?.body?.trim();
  if (!text) return fail("Message body is required.");

  let recipientId: string | undefined;
  let title = "Pesan baru";

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
        title = `Pesan untuk pesanan ${order.id}`;
      } else {
        recipientId = order.customerId;
        title = `Balasan pesanan ${order.id}`;
      }
    }
  }

  if (!recipientId) {
    const role = body?.recipientRole ?? (session.user.role === "CUSTOMER" ? "PARTNER" : "CUSTOMER");
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
      body: text,
      unread: true,
      createdAt: now,
      updatedAt: now
    },
    {
      id: createId("msg"),
      userId: session.user.id,
      sender: "Saya",
      title,
      body: text,
      unread: false,
      createdAt: now,
      updatedAt: now
    }
  ]);

  return ok({ sent: true });
}
