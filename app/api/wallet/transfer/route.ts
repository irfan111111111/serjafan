import { eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications, walletTransactions, wallets } from "@/db/schema";
import { createId, fail, ok, readJson, requireRole } from "@/lib/api";

export const runtime = "nodejs";

type TransferBody = {
  target?: string;
  amount?: number;
  note?: string;
};

export async function POST(request: Request) {
  const { session, response } = await requireRole(["CUSTOMER", "PARTNER", "ADMIN"]);
  if (response || !session) return response;

  const body = await readJson<TransferBody>(request);
  if (!body) return fail("Invalid JSON body.");

  const target = body.target?.trim();
  const note = body.note?.trim();
  const amount = Math.round(Number(body.amount ?? 0));
  if (!target) return fail("Tujuan transfer wajib diisi.");
  if (!Number.isFinite(amount) || amount < 10000) return fail("Minimal transfer Rp 10.000.");

  const wallet = await db.query.wallets.findFirst({ where: eq(wallets.userId, session.user.id) });
  if (!wallet) return fail("Dompet belum aktif.", 404);
  if (wallet.balance < amount) return fail("Saldo SERJAFAN Pay tidak cukup.");

  const now = new Date();
  const nextBalance = wallet.balance - amount;
  const description = `Transfer ke ${target}${note ? ` - ${note}` : ""}`;

  await db.update(wallets).set({ balance: nextBalance, updatedAt: now }).where(eq(wallets.id, wallet.id));
  const transactionId = createId("wtx");
  await db.insert(walletTransactions).values({
    id: transactionId,
    walletId: wallet.id,
    type: "WITHDRAWAL",
    amount: -amount,
    description,
    createdAt: now
  });
  await db.insert(notifications).values({
    id: createId("notif"),
    userId: session.user.id,
    kind: "SYSTEM",
    title: "Transfer berhasil",
    body: `Transfer Rp ${new Intl.NumberFormat("id-ID").format(amount)} ke ${target} berhasil diproses.`,
    targetUrl: session.user.role === "PARTNER" ? "/partner?screen=wallet" : session.user.role === "ADMIN" ? "/admin" : "/customer?screen=wallet",
    isRead: false,
    createdAt: now,
    updatedAt: now
  });

  return ok({
    wallet: { ...wallet, balance: nextBalance, updatedAt: now },
    transaction: {
      id: transactionId,
      walletId: wallet.id,
      type: "WITHDRAWAL",
      amount: -amount,
      description,
      createdAt: now
    }
  });
}
