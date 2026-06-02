import { eq } from "drizzle-orm";
import { db } from "@/db";
import { walletTransactions, wallets } from "@/db/schema";
import { createId, fail, ok, readJson, requireRole } from "@/lib/api";

export const runtime = "nodejs";

type WithdrawBody = {
  amount?: number;
  description?: string;
};

export async function POST(request: Request) {
  const { session, response } = await requireRole(["PARTNER", "ADMIN"]);
  if (response || !session) return response;

  const body = await readJson<WithdrawBody>(request);
  if (!body?.amount || body.amount <= 0) return fail("amount is required.");

  const wallet = await db.query.wallets.findFirst({
    where: eq(wallets.userId, session.user.id)
  });
  if (!wallet) return fail("Wallet not found.", 404);

  if (wallet.balance < body.amount) return fail("Insufficient wallet balance.", 422);

  const nextBalance = wallet.balance - body.amount;
  await db.update(wallets).set({ balance: nextBalance, updatedAt: new Date() }).where(eq(wallets.id, wallet.id));

  await db.insert(walletTransactions).values({
    id: createId("wtx"),
    walletId: wallet.id,
    type: "WITHDRAWAL",
    amount: -body.amount,
    description: body.description ?? "Withdraw partner balance",
    createdAt: new Date()
  });

  return ok({
    walletId: wallet.id,
    balance: nextBalance
  });
}
