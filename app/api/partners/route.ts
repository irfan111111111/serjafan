import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { partnerProfiles } from "@/db/schema";
import { ok } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const partners = await db
    .select()
    .from(partnerProfiles)
    .where(eq(partnerProfiles.verificationStatus, "APPROVED"))
    .orderBy(asc(partnerProfiles.distanceKm));

  return ok({ partners });
}
