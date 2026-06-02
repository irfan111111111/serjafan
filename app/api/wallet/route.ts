import { eq } from "drizzle-orm";
import { db } from "@/db";
import { wallets } from "@/db/schema";
import { createId, ok, requireSession } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const { session, response } = await requireSession();
  if (response || !session) return response;

  let wallet = await db.query.wallets.findFirst({
    where: eq(wallets.userId, session.user.id)
  });

  if (!wallet) {
    const id = createId("wal");
    await db.insert(wallets).values({
      id,
      userId: session.user.id,
      balance: 0,
      currency: "IDR"
    });
    wallet = await db.query.wallets.findFirst({
      where: eq(wallets.id, id)
    });
  }

  return ok({ wallet });
}
