import { eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications, partnerProfiles, user } from "@/db/schema";
import { createId, fail, ok, readJson, requireRole } from "@/lib/api";
import { ensurePartnerPaymentColumns } from "@/lib/partner-payments";

export const runtime = "nodejs";

export async function GET() {
  const { session, response } = await requireRole(["PARTNER", "ADMIN"]);
  if (response || !session) return response;
  await ensurePartnerPaymentColumns();

  const partner = await db.query.partnerProfiles.findFirst({
    where: eq(partnerProfiles.userId, session.user.id)
  });

  if (!partner) return fail("Partner profile not found.", 404);

  return ok({
    partner
  });
}

type PartnerPaymentBody = {
  paymentBankName?: string;
  paymentBankAccount?: string;
  paymentBankHolder?: string;
  paymentDanaNumber?: string;
  paymentDanaName?: string;
  acceptsCash?: boolean;
};

export async function PUT(request: Request) {
  const { session, response } = await requireRole(["PARTNER"]);
  if (response || !session) return response;
  await ensurePartnerPaymentColumns();

  const partner = await db.query.partnerProfiles.findFirst({
    where: eq(partnerProfiles.userId, session.user.id)
  });
  if (!partner) return fail("Partner profile not found.", 404);

  const body = await readJson<PartnerPaymentBody>(request);
  if (!body) return fail("Invalid JSON body.");

  const paymentBankName = body.paymentBankName?.trim() ?? "";
  const paymentBankAccount = body.paymentBankAccount?.trim() ?? "";
  const paymentBankHolder = body.paymentBankHolder?.trim() ?? "";
  const paymentDanaNumber = body.paymentDanaNumber?.trim() ?? "";
  const paymentDanaName = body.paymentDanaName?.trim() ?? "";
  const hasBankPayment = Boolean(paymentBankName && paymentBankAccount && paymentBankHolder);
  const hasDanaPayment = Boolean(paymentDanaNumber && paymentDanaName);

  if (!hasBankPayment && !hasDanaPayment) {
    return fail("Isi minimal rekening bank lengkap atau akun DANA teknisi lapangan lengkap.", 422);
  }

  const now = new Date();
  const updated = await db
    .update(partnerProfiles)
    .set({
      paymentBankName: paymentBankName || null,
      paymentBankAccount: paymentBankAccount || null,
      paymentBankHolder: paymentBankHolder || null,
      paymentDanaNumber: paymentDanaNumber || null,
      paymentDanaName: paymentDanaName || null,
      acceptsCash: body.acceptsCash !== false,
      updatedAt: now
    })
    .where(eq(partnerProfiles.id, partner.id))
    .returning();

  const admins = await db.select().from(user).where(eq(user.role, "ADMIN"));
  if (admins.length) {
    await db.insert(notifications).values(
      admins.map((admin) => ({
        id: createId("notif"),
        userId: admin.id,
        kind: "SYSTEM" as const,
        title: "Data pembayaran teknisi berubah",
        body: `${partner.name} memperbarui rekening/DANA/cash untuk operasional layanan. Periksa di dashboard admin.`,
        targetUrl: "/admin",
        isRead: false,
        createdAt: now,
        updatedAt: now
      }))
    );
  }

  return ok({ partner: updated[0] });
}
