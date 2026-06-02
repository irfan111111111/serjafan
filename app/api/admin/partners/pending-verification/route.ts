import { eq } from "drizzle-orm";
import { db } from "@/db";
import { partnerProfiles } from "@/db/schema";
import { ok, requireRole } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const { response } = await requireRole(["ADMIN"]);
  if (response) return response;

  const partners = await db
    .select()
    .from(partnerProfiles)
    .where(eq(partnerProfiles.verificationStatus, "PENDING"));

  return ok({ partners });
}
