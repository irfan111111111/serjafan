import { db } from "@/db";
import { auditLogs, errorLogs, fraudFlags, orders, paymentIntents, user } from "@/db/schema";
import { createId, fail, ok } from "@/lib/api";
import { ensureRegistrationDatabase } from "@/lib/db-bootstrap";
import { getProductionReadiness } from "@/lib/production-readiness";
import { uploadJsonBackup } from "@/lib/cloud-backup";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) return fail("Cron unauthorized.", 401);

  await ensureRegistrationDatabase();
  const readiness = getProductionReadiness();
  const [users, orderRows, topups, errors, flags] = await Promise.all([
    db.select().from(user),
    db.select().from(orders),
    db.select().from(paymentIntents),
    db.select().from(errorLogs),
    db.select().from(fraudFlags)
  ]);

  const snapshot = {
    readinessScore: readiness.score,
    readinessReady: readiness.ready,
    users: users.length,
    orders: orderRows.length,
    pendingTopups: topups.filter((item) => item.status === "PENDING").length,
    unresolvedErrors: errors.filter((item) => !item.resolved).length,
    openFraudFlags: flags.filter((item) => item.status === "OPEN").length
  };
  const cloudBackup = await uploadJsonBackup({
    name: "daily-checkpoint",
    payload: { snapshot, readiness, createdAt: new Date().toISOString() }
  });

  await db.insert(auditLogs).values({
    id: createId("aud"),
    actorId: null,
    actorRole: "SYSTEM",
    action: cloudBackup ? "DAILY_PRODUCTION_CHECKPOINT_CLOUD_BACKUP" : "DAILY_PRODUCTION_CHECKPOINT",
    entityType: "production",
    entityId: new Date().toISOString().slice(0, 10),
    severity: readiness.ready ? "INFO" : "WARN",
    ipAddress: null,
    userAgent: request.headers.get("user-agent"),
    metadata: JSON.stringify({ ...snapshot, cloudBackupKey: cloudBackup?.key ?? null }),
    createdAt: new Date()
  });

  return ok({ snapshot, readiness, cloudBackup });
}
