import { and, asc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { partnerProfiles, wallets } from "@/db/schema";
import { ok } from "@/lib/api";
import { ensurePartnerPaymentColumns } from "@/lib/partner-payments";

export const runtime = "nodejs";
const MIN_PARTNER_WORK_BALANCE = 20_000;

export async function GET() {
  await ensurePartnerPaymentColumns();
  let partners: Array<typeof partnerProfiles.$inferSelect> = [];
  try {
    const rows = await db
      .select()
      .from(partnerProfiles)
      .innerJoin(wallets, eq(wallets.userId, partnerProfiles.userId))
      .where(and(eq(partnerProfiles.verificationStatus, "APPROVED"), eq(partnerProfiles.status, "ONLINE"), gte(wallets.balance, MIN_PARTNER_WORK_BALANCE)))
      .orderBy(asc(partnerProfiles.distanceKm));
    partners = rows.map((row) => row.partner_profiles);
  } catch {
    partners = [];
  }

  return ok({ partners });
}
