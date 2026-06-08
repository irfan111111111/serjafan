import { eq } from "drizzle-orm";
import { client, db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { createId } from "@/lib/api";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  kind?: "notification" | "message" | "phone";
};

let tableReady: Promise<void> | null = null;

export function getVapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY ?? "";
}

function getVapidPrivateKey() {
  return process.env.VAPID_PRIVATE_KEY ?? "";
}

export function ensurePushSubscriptionTable() {
  tableReady ??= (async () => {
    await client.batch(
      [
        `CREATE TABLE IF NOT EXISTS push_subscriptions (
          id text PRIMARY KEY NOT NULL,
          user_id text NOT NULL,
          endpoint text NOT NULL,
          p256dh text NOT NULL,
          auth text NOT NULL,
          user_agent text,
          created_at integer NOT NULL,
          updated_at integer NOT NULL,
          FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE cascade
        )`,
        "CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON push_subscriptions (user_id)",
        "CREATE UNIQUE INDEX IF NOT EXISTS push_subscriptions_endpoint_unique ON push_subscriptions (endpoint)"
      ],
      "write"
    );
  })();
  return tableReady;
}

export async function savePushSubscription(input: {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string | null;
}) {
  await ensurePushSubscriptionTable();
  const existing = await db.query.pushSubscriptions.findFirst({
    where: eq(pushSubscriptions.endpoint, input.endpoint)
  });
  const now = new Date();
  if (existing) {
    await db
      .update(pushSubscriptions)
      .set({
        userId: input.userId,
        p256dh: input.p256dh,
        auth: input.auth,
        userAgent: input.userAgent ?? null,
        updatedAt: now
      })
      .where(eq(pushSubscriptions.id, existing.id));
    return existing.id;
  }

  const id = createId("psh");
  await db.insert(pushSubscriptions).values({
    id,
    userId: input.userId,
    endpoint: input.endpoint,
    p256dh: input.p256dh,
    auth: input.auth,
    userAgent: input.userAgent ?? null,
    createdAt: now,
    updatedAt: now
  });
  return id;
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const publicKey = getVapidPublicKey();
  const privateKey = getVapidPrivateKey();
  if (!publicKey || !privateKey) return { sent: 0, skipped: true };

  await ensurePushSubscriptionTable();
  const rows = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  if (!rows.length) return { sent: 0, skipped: false };

  const webPush = await import("web-push");
  webPush.default.setVapidDetails("mailto:support@serjafan.id", publicKey, privateKey);

  let sent = 0;
  await Promise.all(
    rows.map(async (row) => {
      try {
        await webPush.default.sendNotification(
          {
            endpoint: row.endpoint,
            keys: {
              p256dh: row.p256dh,
              auth: row.auth
            }
          },
          JSON.stringify(payload)
        );
        sent += 1;
      } catch (error) {
        const statusCode = typeof error === "object" && error && "statusCode" in error ? Number((error as { statusCode?: number }).statusCode) : 0;
        if (statusCode === 404 || statusCode === 410) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, row.id));
        }
      }
    })
  );

  return { sent, skipped: false };
}
