import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { partnerProfiles } from "@/db/schema";
import { fail, ok } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const partner = await db.query.partnerProfiles.findFirst({
    where: and(eq(partnerProfiles.id, id), eq(partnerProfiles.verificationStatus, "APPROVED"))
  });

  if (!partner) return fail("Partner not found.", 404);

  return ok({ partner });
}
