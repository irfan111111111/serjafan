import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { errorLogs, fraudFlags } from "@/db/schema";
import { fail, ok, readJson, requireRole } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

type MonitoringBody = {
  type?: "ERROR" | "FRAUD";
  id?: string;
  action?: "RESOLVE" | "REVIEW" | "DISMISS";
};

export async function GET() {
  const { response } = await requireRole(["ADMIN"]);
  if (response) return response;

  const [errors, flags] = await Promise.all([
    db.select().from(errorLogs).orderBy(desc(errorLogs.createdAt)).limit(100),
    db.select().from(fraudFlags).orderBy(desc(fraudFlags.createdAt)).limit(100)
  ]);

  return ok({
    summary: {
      openErrors: errors.filter((item) => !item.resolved).length,
      criticalErrors: errors.filter((item) => !item.resolved && (item.severity === "CRITICAL" || item.severity === "ERROR")).length,
      openFraudFlags: flags.filter((item) => item.status === "OPEN").length,
      highRiskFlags: flags.filter((item) => item.status === "OPEN" && item.riskScore >= 60).length
    },
    errors,
    fraudFlags: flags
  });
}

export async function POST(request: Request) {
  const { session, response } = await requireRole(["ADMIN"]);
  if (response || !session) return response;

  const body = await readJson<MonitoringBody>(request);
  if (!body?.id || !body.type || !body.action) return fail("type, id, dan action wajib diisi.");

  const now = new Date();
  if (body.type === "ERROR") {
    await db.update(errorLogs).set({ resolved: body.action === "RESOLVE" }).where(eq(errorLogs.id, body.id));
  } else {
    await db
      .update(fraudFlags)
      .set({ status: body.action === "DISMISS" ? "DISMISSED" : "REVIEWED", updatedAt: now })
      .where(eq(fraudFlags.id, body.id));
  }

  await writeAuditLog({
    session,
    action: `MONITORING_${body.action}`,
    entityType: body.type.toLowerCase(),
    entityId: body.id,
    severity: body.type === "FRAUD" ? "WARN" : "INFO"
  });

  return ok({ saved: true });
}
