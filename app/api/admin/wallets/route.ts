import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications, partnerProfiles, paymentIntents, user, walletTransactions, wallets } from "@/db/schema";
import { createId, fail, ok, readJson, requireRole } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { sendPushToUser } from "@/lib/push";

export const runtime = "nodejs";
const MIN_PARTNER_WORK_BALANCE = 20_000;

type AdjustWalletBody = {
  action?: "ADJUST" | "APPROVE_TOPUP" | "REJECT_TOPUP";
  userId?: string;
  amount?: number;
  description?: string;
  paymentIntentId?: string;
};

async function ensureWallet(userId: string) {
  let wallet = await db.query.wallets.findFirst({ where: eq(wallets.userId, userId) });
  if (wallet) return wallet;

  const now = new Date();
  const id = createId("wal");
  await db.insert(wallets).values({
    id,
    userId,
    balance: 0,
    currency: "IDR",
    createdAt: now,
    updatedAt: now
  });
  wallet = await db.query.wallets.findFirst({ where: eq(wallets.id, id) });
  if (!wallet) throw new Error("Wallet gagal dibuat.");
  return wallet;
}

export async function GET() {
  const { session, response } = await requireRole(["ADMIN"]);
  if (response || !session) return response;

  const walletRows = await db
    .select({
      walletId: wallets.id,
      userId: wallets.userId,
      balance: wallets.balance,
      currency: wallets.currency,
      updatedAt: wallets.updatedAt,
      name: user.name,
      email: user.email,
      role: user.role
    })
    .from(wallets)
    .leftJoin(user, eq(wallets.userId, user.id))
    .orderBy(desc(wallets.updatedAt));

  const transactions = await db.select().from(walletTransactions).orderBy(desc(walletTransactions.createdAt)).limit(30);
  const pendingTopups = await db
    .select({
      id: paymentIntents.id,
      userId: paymentIntents.userId,
      walletId: paymentIntents.walletId,
      provider: paymentIntents.provider,
      channel: paymentIntents.channel,
      amount: paymentIntents.amount,
      status: paymentIntents.status,
      rawPayload: paymentIntents.rawPayload,
      createdAt: paymentIntents.createdAt,
      name: user.name,
      email: user.email,
      role: user.role
    })
    .from(paymentIntents)
    .leftJoin(user, eq(paymentIntents.userId, user.id))
    .where(eq(paymentIntents.status, "PENDING"))
    .orderBy(desc(paymentIntents.createdAt));

  return ok({
    wallets: walletRows,
    transactions,
    pendingTopups,
    summary: {
      totalWallets: walletRows.length,
      totalBalance: walletRows.reduce((sum, item) => sum + item.balance, 0),
      customerWallets: walletRows.filter((item) => item.role === "CUSTOMER").length,
      partnerWallets: walletRows.filter((item) => item.role === "PARTNER").length
    }
  });
}

export async function POST(request: Request) {
  const { session, response } = await requireRole(["ADMIN"]);
  if (response || !session) return response;

  const body = await readJson<AdjustWalletBody>(request);
  if (!body) return fail("Invalid JSON body.");

  if (body.action === "APPROVE_TOPUP" || body.action === "REJECT_TOPUP") {
    const paymentIntentId = body.paymentIntentId?.trim();
    if (!paymentIntentId) return fail("paymentIntentId wajib diisi.");

    const intent = await db.query.paymentIntents.findFirst({ where: eq(paymentIntents.id, paymentIntentId) });
    if (!intent) return fail("Permintaan top up tidak ditemukan.", 404);
    if (intent.status !== "PENDING") return fail("Permintaan top up ini sudah diproses.", 409);

    const targetUser = await db.query.user.findFirst({ where: eq(user.id, intent.userId) });
    if (!targetUser) return fail("User top up tidak ditemukan.", 404);

    const now = new Date();
    if (body.action === "REJECT_TOPUP") {
      await db
        .update(paymentIntents)
        .set({
          status: "FAILED",
          rawPayload: JSON.stringify({
            ...(intent.rawPayload ? JSON.parse(intent.rawPayload) : {}),
            adminNote: body.description?.trim() || "Top up ditolak admin"
          }),
          updatedAt: now
        })
        .where(eq(paymentIntents.id, intent.id));
      await db.insert(notifications).values({
        id: createId("notif"),
        userId: intent.userId,
        kind: "SYSTEM",
        title: "Top Up ditolak",
        body: body.description?.trim() || "Top up manual ditolak. Periksa bukti transfer atau hubungi support.",
        targetUrl: targetUser.role === "PARTNER" ? "/partner?screen=wallet" : "/customer?screen=wallet",
        isRead: false,
        createdAt: now,
        updatedAt: now
      });
      await sendPushToUser(intent.userId, {
        title: "Top Up ditolak",
        body: body.description?.trim() || "Top up manual ditolak. Periksa bukti transfer atau hubungi support.",
        url: targetUser.role === "PARTNER" ? "/partner" : "/customer",
        tag: `topup-${intent.id}`,
        kind: "notification"
      });
      await writeAuditLog({
        session,
        action: "TOPUP_REJECTED",
        entityType: "payment_intent",
        entityId: intent.id,
        severity: "WARN",
        metadata: { userId: intent.userId, amount: intent.amount, note: body.description?.trim() || null }
      });
      return ok({ payment: { ...intent, status: "FAILED" } });
    }

    const wallet = await db.query.wallets.findFirst({ where: eq(wallets.id, intent.walletId) });
    if (!wallet) return fail("Wallet top up tidak ditemukan.", 404);
    const nextBalance = wallet.balance + intent.amount;
    await db.update(wallets).set({ balance: nextBalance, updatedAt: now }).where(eq(wallets.id, wallet.id));
    await db.update(paymentIntents).set({ status: "PAID", updatedAt: now }).where(eq(paymentIntents.id, intent.id));
    await db.insert(walletTransactions).values({
      id: createId("wtx"),
      walletId: wallet.id,
      type: "TOPUP",
      amount: intent.amount,
      description: body.description?.trim() || `Top up manual ${intent.channel} disetujui admin`,
      createdAt: now
    });
    if (targetUser.role === "PARTNER" && nextBalance >= MIN_PARTNER_WORK_BALANCE) {
      await db
        .update(partnerProfiles)
        .set({ status: "ONLINE", updatedAt: now })
        .where(eq(partnerProfiles.userId, targetUser.id));
    }
    await db.insert(notifications).values({
      id: createId("notif"),
      userId: intent.userId,
      kind: "SYSTEM",
      title: "Top Up berhasil diverifikasi",
      body: `Saldo bertambah Rp ${new Intl.NumberFormat("id-ID").format(intent.amount)}. ${targetUser.role === "PARTNER" ? "Jika akun sudah disetujui, partner bisa menerima pelanggan." : ""}`,
      targetUrl: targetUser.role === "PARTNER" ? "/partner?screen=wallet" : "/customer?screen=wallet",
      isRead: false,
      createdAt: now,
      updatedAt: now
    });
    await sendPushToUser(intent.userId, {
      title: "Top Up berhasil diverifikasi",
      body: `Saldo bertambah Rp ${new Intl.NumberFormat("id-ID").format(intent.amount)}.`,
      url: targetUser.role === "PARTNER" ? "/partner" : "/customer",
      tag: `topup-${intent.id}`,
      kind: "notification"
    });
    await writeAuditLog({
      session,
      action: "TOPUP_APPROVED",
      entityType: "payment_intent",
      entityId: intent.id,
      metadata: { userId: intent.userId, amount: intent.amount, walletId: wallet.id, nextBalance }
    });
    return ok({ wallet: { ...wallet, balance: nextBalance, updatedAt: now }, payment: { ...intent, status: "PAID" } });
  }

  const userId = body.userId?.trim();
  const amount = Math.round(Number(body.amount ?? 0));
  const description = body.description?.trim() || "Penyesuaian saldo oleh admin";
  if (!userId) return fail("userId wajib diisi.");
  if (!Number.isFinite(amount) || amount === 0) return fail("Nominal penyesuaian tidak boleh nol.");

  const targetUser = await db.query.user.findFirst({ where: eq(user.id, userId) });
  if (!targetUser) return fail("User tidak ditemukan.", 404);

  const wallet = await ensureWallet(userId);
  const nextBalance = wallet.balance + amount;
  if (nextBalance < 0) return fail("Saldo tidak boleh menjadi minus.");

  const now = new Date();
  await db.update(wallets).set({ balance: nextBalance, updatedAt: now }).where(eq(wallets.id, wallet.id));
  if (targetUser.role === "PARTNER") {
    await db
      .update(partnerProfiles)
      .set({ status: nextBalance >= MIN_PARTNER_WORK_BALANCE ? "ONLINE" : "OFFLINE", updatedAt: now })
      .where(eq(partnerProfiles.userId, targetUser.id));
  }
  await db.insert(walletTransactions).values({
    id: createId("wtx"),
    walletId: wallet.id,
    type: amount > 0 ? "TOPUP" : "WITHDRAWAL",
    amount,
    description,
    createdAt: now
  });
  await db.insert(notifications).values({
    id: createId("notif"),
    userId,
    kind: "SYSTEM",
    title: "Saldo disesuaikan admin",
    body: `${description}. Nominal: Rp ${new Intl.NumberFormat("id-ID").format(amount)}.`,
    targetUrl: targetUser.role === "PARTNER" ? "/partner" : targetUser.role === "ADMIN" ? "/admin" : "/customer",
    isRead: false,
    createdAt: now,
    updatedAt: now
  });
  await sendPushToUser(userId, {
    title: "Saldo disesuaikan admin",
    body: `${description}. Nominal: Rp ${new Intl.NumberFormat("id-ID").format(amount)}.`,
    url: targetUser.role === "PARTNER" ? "/partner" : targetUser.role === "ADMIN" ? "/admin" : "/customer",
    tag: `wallet-${wallet.id}`,
    kind: "notification"
  });

  await writeAuditLog({
    session,
    action: "WALLET_ADJUSTED",
    entityType: "wallet",
    entityId: wallet.id,
    severity: amount < 0 ? "WARN" : "INFO",
    metadata: { userId, amount, nextBalance, description }
  });

  return ok({
    wallet: { ...wallet, balance: nextBalance, updatedAt: now }
  });
}
