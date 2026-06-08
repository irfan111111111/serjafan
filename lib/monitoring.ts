import { headers } from "next/headers";
import { db } from "@/db";
import { errorLogs, fraudFlags } from "@/db/schema";
import { createId, type ApiSession } from "@/lib/api";
import { ensureRegistrationDatabase } from "@/lib/db-bootstrap";

type Severity = "INFO" | "WARN" | "ERROR" | "CRITICAL";

export async function recordError(input: {
  source: string;
  error: unknown;
  severity?: Severity;
  session?: ApiSession | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    await ensureRegistrationDatabase();
    const requestHeaders = await headers();
    const error = input.error instanceof Error ? input.error : new Error(String(input.error));
    await db.insert(errorLogs).values({
      id: createId("err"),
      source: input.source,
      message: error.message.slice(0, 1000),
      stack: error.stack?.slice(0, 4000) ?? null,
      severity: input.severity ?? "ERROR",
      requestPath: requestHeaders.get("x-invoke-path") ?? null,
      actorId: input.session?.user.id ?? null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      resolved: false,
      createdAt: new Date()
    });
  } catch (loggingError) {
    console.error("SERJAFAN error logging failed", loggingError);
  }
}

export async function recordFraudFlag(input: {
  userId?: string | null;
  entityType: string;
  entityId?: string | null;
  reason: string;
  riskScore: number;
  metadata?: Record<string, unknown>;
}) {
  try {
    await ensureRegistrationDatabase();
    await db.insert(fraudFlags).values({
      id: createId("frd"),
      userId: input.userId ?? null,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      reason: input.reason,
      riskScore: Math.max(0, Math.min(100, Math.round(input.riskScore))),
      status: "OPEN",
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  } catch (error) {
    console.error("SERJAFAN fraud flag logging failed", error);
  }
}
