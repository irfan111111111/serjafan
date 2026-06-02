import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications, orders } from "@/db/schema";
import { ok, requireSession } from "@/lib/api";
import { promos } from "@/lib/catalog";

export const runtime = "nodejs";

export async function GET() {
  const { session, response } = await requireSession();
  if (response || !session) return response;

  const storedNotifications = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, session.user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(20);

  const recentOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.customerId, session.user.id))
    .orderBy(desc(orders.createdAt))
    .limit(5);

  const fallbackNotifications = [
    ...recentOrders.map((order) => ({
      id: `notif-order-${order.id}`,
      title: `Pesanan ${order.id}`,
      body: `Status terbaru: ${order.status.replaceAll("_", " ").toLowerCase()}`,
      kind: "order",
      createdAt: order.createdAt
    })),
    ...promos.slice(0, 3).map((promo) => ({
      id: `notif-promo-${promo.code}`,
      title: promo.title,
      body: promo.description,
      kind: "promo",
      createdAt: new Date().toISOString()
    }))
  ];

  return ok({
    notifications:
      storedNotifications.length > 0
        ? storedNotifications.map((item) => ({
            id: item.id,
            title: item.title,
            body: item.body,
            kind: item.kind.toLowerCase(),
            createdAt: item.createdAt,
            isRead: item.isRead,
            targetUrl: item.targetUrl
          }))
        : fallbackNotifications
  });
}
