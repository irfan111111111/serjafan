import { eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications, walletTransactions, wallets } from "@/db/schema";
import { createId, fail, ok, readJson, requireRole } from "@/lib/api";

export const runtime = "nodejs";

type TopUpBody = {
  amount?: number;
  method?: string;
};

async function ensureWallet(userId: string) {
  let wallet = await db.query.wallets.findFirst({ where: eq(wallets.userId, userId) });
  if (wallet) return wallet;

  const id = createId("wal");
  const now = new Date();
  await db.insert(wallets).values({
    id,
    userId,
    balance: 0,
    currency: "IDR",
    createdAt: now,
    updatedAt: now
  });
  wallet = await db.query.wallets.findFirst({ where: eq(wallets.id, id) });
  if (!wallet) throw new Error("Dompet gagal dibuat.");
  return wallet;
}

export async function POST(request: Request) {
  const { session, response } = await requireRole(["CUSTOMER", "PARTNER", "ADMIN"]);
  if (response || !session) return response;

  const body = await readJson<TopUpBody>(request);
  if (!body) return fail("Invalid JSON body.");

  const amount = Math.round(Number(body.amount ?? 0));
  const method = body.method?.trim() || "Virtual Account";
  if (!Number.isFinite(amount) || amount < 10000) return fail("Minimal top up Rp 10.000.");
  if (amount > 10_000_000) return fail("Maksimal top up Rp 10.000.000 per transaksi.");

  const now = new Date();
  const wallet = await ensureWallet(session.user.id);
  const nextBalance = wallet.balance + amount;

  await db.update(wallets).set({ balance: nextBalance, updatedAt: now }).where(eq(wallets.id, wallet.id));
  const transactionId = createId("wtx");
  await db.insert(walletTransactions).values({
    id: transactionId,
    walletId: wallet.id,
    type: "TOPUP",
    amount,
    description: `Top Up ${method}`,
    createdAt: now
  });
  await db.insert(notifications).values({
    id: createId("notif"),
    userId: session.user.id,
    kind: "SYSTEM",
    title: "Top Up berhasil",
    body: `Saldo SERJAFAN Pay bertambah Rp ${new Intl.NumberFormat("id-ID").format(amount)}.`,
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
      type: "TOPUP",
      amount,
      description: `Top Up ${method}`,
      createdAt: now
    }
  });
}
