import { eq } from "drizzle-orm";
import { db } from "@/db";
import { partnerProfiles, wallets } from "@/db/schema";
import { createId, ok, requireRole } from "@/lib/api";

export const runtime = "nodejs";
const MIN_PARTNER_WORK_BALANCE = 20_000;

export async function GET() {
  const { session, response } = await requireRole(["PARTNER", "ADMIN"]);
  if (response || !session) return response;

  let wallet = await db.query.wallets.findFirst({
    where: eq(wallets.userId, session.user.id)
  });

  if (!wallet) {
    const id = createId("wal");
    const now = new Date();
    await db.insert(wallets).values({
      id,
      userId: session.user.id,
      balance: 0,
      currency: "IDR",
      createdAt: now,
      updatedAt: now
    });
    wallet = await db.query.wallets.findFirst({
      where: eq(wallets.id, id)
    });
  }

  if (wallet && wallet.balance < MIN_PARTNER_WORK_BALANCE) {
    await db
      .update(partnerProfiles)
      .set({ status: "OFFLINE", updatedAt: new Date() })
      .where(eq(partnerProfiles.userId, session.user.id));
  }

  return ok({ wallet });
}
