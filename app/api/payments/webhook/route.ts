import { eq } from "drizzle-orm";
import { db } from "@/db";
import { paymentIntents } from "@/db/schema";
import { fail, ok } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { recordError, recordFraudFlag } from "@/lib/monitoring";
import { settlePaymentIntent } from "@/lib/payments";

export const runtime = "nodejs";

type XenditWebhookPayload = {
  id?: string;
  external_id?: string;
  status?: string;
};

export async function POST(request: Request) {
  const callbackToken = request.headers.get("x-callback-token");
  if (!process.env.XENDIT_CALLBACK_TOKEN && process.env.NODE_ENV === "production") {
    return fail("Xendit callback token belum dikonfigurasi.", 503);
  }
  if (process.env.XENDIT_CALLBACK_TOKEN && callbackToken !== process.env.XENDIT_CALLBACK_TOKEN) {
    await recordFraudFlag({
      entityType: "payment_webhook",
      reason: "Webhook Xendit memakai callback token tidak valid.",
      riskScore: 90,
      metadata: { hasToken: Boolean(callbackToken) }
    });
    return fail("Invalid webhook token.", 401);
  }

  const payload = (await request.json().catch(() => null)) as XenditWebhookPayload | null;
  if (!payload) return fail("Invalid webhook payload.");

  const intentId = payload.external_id;
  if (!intentId) return fail("external_id wajib ada.");

  const paid = ["PAID", "SETTLED", "COMPLETED"].includes(String(payload.status ?? "").toUpperCase());
  if (paid) {
    try {
      await settlePaymentIntent(intentId, payload);
      await writeAuditLog({
        action: "PAYMENT_WEBHOOK_SETTLED",
        entityType: "payment_intent",
        entityId: intentId,
        metadata: { provider: "xendit", status: payload.status, providerId: payload.id }
      });
    } catch (error) {
      await recordError({ source: "payments.webhook.settle", error, metadata: { intentId, providerId: payload.id } });
      throw error;
    }
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
    await writeAuditLog({
      action: "PAYMENT_WEBHOOK_FAILED",
      entityType: "payment_intent",
      entityId: intentId,
      severity: "WARN",
      metadata: { provider: "xendit", status: payload.status, providerId: payload.id }
    });
  }

  return ok({ received: true, settled: false });
}
