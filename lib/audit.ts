import { headers } from "next/headers";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { createId, type ApiSession } from "@/lib/api";
import { ensureRegistrationDatabase } from "@/lib/db-bootstrap";

type AuditInput = {
  session?: ApiSession | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  severity?: "INFO" | "WARN" | "ERROR" | "CRITICAL";
  metadata?: Record<string, unknown>;
};

export async function writeAuditLog(input: AuditInput) {
  try {
    await ensureRegistrationDatabase();
    const requestHeaders = await headers();
    await db.insert(auditLogs).values({
      id: createId("aud"),
      actorId: input.session?.user.id ?? null,
      actorRole: input.session?.user.role ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      severity: input.severity ?? "INFO",
      ipAddress: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? requestHeaders.get("x-real-ip"),
      userAgent: requestHeaders.get("user-agent"),
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      createdAt: new Date()
    });
  } catch (error) {
    console.error("SERJAFAN audit log failed", error);
  }
}
