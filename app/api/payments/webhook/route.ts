import { eq } from "drizzle-orm";
import { db } from "@/db";
import { paymentIntents } from "@/db/schema";
import { fail, ok } from "@/lib/api";
import { settlePaymentIntent } from "@/lib/payments";

export const runtime = "nodejs";

type XenditWebhookPayload = {
  id?: string;
  external_id?: string;
  status?: string;
};

export async function POST(request: Request) {
  const callbackToken = request.headers.get("x-callback-token");
  if (process.env.XENDIT_CALLBACK_TOKEN && callbackToken !== process.env.XENDIT_CALLBACK_TOKEN) {
    return fail("Invalid webhook token.", 401);
  }

  const payload = (await request.json().catch(() => null)) as XenditWebhookPayload | null;
  if (!payload) return fail("Invalid webhook payload.");

  const intentId = payload.external_id;
  if (!intentId) return fail("external_id wajib ada.");

  const paid = ["PAID", "SETTLED", "COMPLETED"].includes(String(payload.status ?? "").toUpperCase());
  if (paid) {
    await settlePaymentIntent(intentId, payload);
    return ok({ received: true, settled: true });
  }

  const failed = ["EXPIRED", "FAILED"].includes(String(payload.status ?? "").toUpperCase());
  if (failed) {
    await db
      .update(paymentIntents)
      .set({
        status: String(payload.status).toUpperCase() === "EXPIRED" ? "EXPIRED" : "FAILED",
        rawPayload: JSON.stringify(payload),
        updatedAt: new Date()
      })
      .where(eq(paymentIntents.id, intentId));
  }

  return ok({ received: true, settled: false });
}
