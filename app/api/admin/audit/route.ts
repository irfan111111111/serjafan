import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, orders, paymentIntents, user, walletTransactions, wallets } from "@/db/schema";
import { ok, requireRole } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const { response } = await requireRole(["ADMIN"]);
  if (response) return response;

  const [recentAuditLogs, transactions, topups, orderRows, walletRows] = await Promise.all([
    db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(80),
    db.select().from(walletTransactions).orderBy(desc(walletTransactions.createdAt)).limit(200),
    db.select().from(paymentIntents).orderBy(desc(paymentIntents.createdAt)).limit(200),
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(500),
    db
      .select({
        walletId: wallets.id,
        userId: wallets.userId,
        balance: wallets.balance,
        role: user.role,
        name: user.name
      })
      .from(wallets)
      .leftJoin(user, eq(wallets.userId, user.id))
  ]);

  const paidTopups = topups.filter((item) => item.status === "PAID");
  const pendingTopups = topups.filter((item) => item.status === "PENDING");
  const commissionTransactions = transactions.filter(
    (item) => item.type === "WITHDRAWAL" && item.description.toLowerCase().includes("komisi platform")
  );
  const customerPayments = transactions.filter((item) => item.type === "PAYMENT");
  const refunds = transactions.filter((item) => item.type === "REFUND");
  const completedOrders = orderRows.filter((item) => item.status === "DONE");

  return ok({
    summary: {
      grossOrderValue: completedOrders.reduce((sum, item) => sum + item.total, 0),
      completedOrders: completedOrders.length,
      paidTopupAmount: paidTopups.reduce((sum, item) => sum + item.amount, 0),
      paidTopupCount: paidTopups.length,
      pendingTopupAmount: pendingTopups.reduce((sum, item) => sum + item.amount, 0),
      pendingTopupCount: pendingTopups.length,
      platformCommissionAmount: Math.abs(commissionTransactions.reduce((sum, item) => sum + item.amount, 0)),
      platformCommissionCount: commissionTransactions.length,
      customerPaymentAmount: Math.abs(customerPayments.reduce((sum, item) => sum + item.amount, 0)),
      refundAmount: refunds.reduce((sum, item) => sum + item.amount, 0),
      walletLiability: walletRows.reduce((sum, item) => sum + item.balance, 0),
      customerWalletBalance: walletRows.filter((item) => item.role === "CUSTOMER").reduce((sum, item) => sum + item.balance, 0),
      partnerDepositBalance: walletRows.filter((item) => item.role === "PARTNER").reduce((sum, item) => sum + item.balance, 0)
    },
    recentAuditLogs,
    recentTransactions: transactions.slice(0, 50),
    pendingTopups: pendingTopups.slice(0, 50),
    checks: {
      hasAuditTrail: recentAuditLogs.length > 0,
      allPendingTopupsNeedAdminApproval: pendingTopups.every((item) => item.provider === "manual"),
      commissionRule: "20% dari total order untuk pembayaran cash/direct transfer; SERJAFAN Pay memicu payout manual admin."
    }
  });
}
