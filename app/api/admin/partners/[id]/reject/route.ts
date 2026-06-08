import { eq } from "drizzle-orm";
import { db } from "@/db";
import { partnerProfiles, partnerRegistrationDocuments, verificationAuditLogs } from "@/db/schema";
import { createId, fail, ok, readJson, requireRole } from "@/lib/api";

export const runtime = "nodejs";

type RejectBody = {
  reason?: string;
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireRole(["ADMIN"]);
  if (response || !session) return response;

  const { id } = await params;
  const body = await readJson<RejectBody>(request);
  const updated = await db
    .update(partnerProfiles)
    .set({
      verificationStatus: "REJECTED",
      verified: false,
      updatedAt: new Date()
    })
    .where(eq(partnerProfiles.id, id))
    .returning();

  if (updated.length === 0) return fail("Partner not found.", 404);

  await db
    .update(partnerRegistrationDocuments)
    .set({ status: "REJECTED", updatedAt: new Date() })
    .where(eq(partnerRegistrationDocuments.partnerId, id));

  await db.insert(verificationAuditLogs).values({
    id: createId("aud"),
    partnerId: id,
    adminId: session.user.id,
    action: "REJECTED",
    reason: body?.reason ?? null
  });

  return ok({ partner: updated[0] });
}
