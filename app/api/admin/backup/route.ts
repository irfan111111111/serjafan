import { desc } from "drizzle-orm";
import { db } from "@/db";
import {
  addresses,
  appSettings,
  auditLogs,
  messages,
  notifications,
  orderTrackingEvents,
  orders,
  partnerProfiles,
  partnerRegistrationDocuments,
  paymentIntents,
  user,
  walletTransactions,
  wallets
} from "@/db/schema";
import { ok, requireRole } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET() {
  const { session, response } = await requireRole(["ADMIN"]);
  if (response || !session) return response;

  const exportedAt = new Date();
  const backup = {
    version: 1,
    exportedAt: exportedAt.toISOString(),
    tables: {
      users: await db.select().from(user),
      partners: await db.select().from(partnerProfiles),
      partnerDocuments: await db.select().from(partnerRegistrationDocuments),
      addresses: await db.select().from(addresses),
      orders: await db.select().from(orders),
      tracking: await db.select().from(orderTrackingEvents),
      wallets: await db.select().from(wallets),
      walletTransactions: await db.select().from(walletTransactions).orderBy(desc(walletTransactions.createdAt)),
      paymentIntents: await db.select().from(paymentIntents).orderBy(desc(paymentIntents.createdAt)),
      notifications: await db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(1000),
      messages: await db.select().from(messages).orderBy(desc(messages.createdAt)).limit(1000),
      settings: await db.select().from(appSettings),
      auditLogs: await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(2000)
    }
  };

  await writeAuditLog({
    session,
    action: "DATABASE_BACKUP_EXPORTED",
    entityType: "backup",
    entityId: exportedAt.toISOString(),
    severity: "WARN",
    metadata: {
      tables: Object.keys(backup.tables)
    }
  });

  return ok({ backup });
}
