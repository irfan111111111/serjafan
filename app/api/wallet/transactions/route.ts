import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { walletTransactions, wallets } from "@/db/schema";
import { fail, ok, requireSession } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const { session, response } = await requireSession();
  if (response || !session) return response;

  const wallet = await db.query.wallets.findFirst({
    where: eq(wallets.userId, session.user.id)
  });

  if (!wallet) return ok({ transactions: [] });

  const transactions = await db
    .select()
    .from(walletTransactions)
    .where(eq(walletTransactions.walletId, wallet.id))
    .orderBy(desc(walletTransactions.createdAt));

  return ok({ transactions });
}
