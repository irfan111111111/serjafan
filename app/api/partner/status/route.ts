import { eq } from "drizzle-orm";
import { db } from "@/db";
import { partnerProfiles } from "@/db/schema";
import { fail, ok, readJson, requireRole } from "@/lib/api";

export const runtime = "nodejs";

type StatusBody = {
  status?: "ONLINE" | "BUSY" | "OFFLINE";
};

export async function PUT(request: Request) {
  const { session, response } = await requireRole(["PARTNER", "ADMIN"]);
  if (response || !session) return response;

  const body = await readJson<StatusBody>(request);
  if (!body?.status) return fail("status is required.");

  const partner = await db.query.partnerProfiles.findFirst({
    where: eq(partnerProfiles.userId, session.user.id)
  });

  if (!partner) return fail("Partner profile not found.", 404);

  const updated = await db
    .update(partnerProfiles)
    .set({ status: body.status, updatedAt: new Date() })
    .where(eq(partnerProfiles.id, partner.id))
    .returning();

  return ok({ partner: updated[0] });
}
