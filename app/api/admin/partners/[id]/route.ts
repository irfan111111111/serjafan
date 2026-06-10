import { eq } from "drizzle-orm";
import { client, db } from "@/db";
import { partnerProfiles, user } from "@/db/schema";
import { fail, ok, readJson, requireRole } from "@/lib/api";
import { ensurePartnerPaymentColumns } from "@/lib/partner-payments";

export const runtime = "nodejs";

type PartnerBody = {
  name?: string;
  category?: string;
  contactPhone?: string;
  priceFrom?: number;
  status?: "ONLINE" | "BUSY" | "OFFLINE";
  verificationStatus?: "PENDING" | "APPROVED" | "REJECTED";
  paymentBankName?: string | null;
  paymentBankAccount?: string | null;
  paymentBankHolder?: string | null;
  paymentDanaNumber?: string | null;
  paymentDanaName?: string | null;
  acceptsCash?: boolean;
};

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireRole(["ADMIN"]);
  if (response) return response;
  await ensurePartnerPaymentColumns();

  const { id } = await params;
  const body = await readJson<PartnerBody>(request);
  if (!body) return fail("Invalid JSON body.");

  const existing = await db.query.partnerProfiles.findFirst({ where: eq(partnerProfiles.id, id) });
  if (!existing) return fail("Partner tidak ditemukan.", 404);

  const name = body.name?.trim();
  const category = body.category?.trim();
  if (!name) return fail("Nama partner wajib diisi.");
  if (!category) return fail("Kategori partner wajib diisi.");

  const now = new Date();
  const updated = await db
    .update(partnerProfiles)
    .set({
      name,
      category,
      contactPhone: body.contactPhone?.trim() || null,
      priceFrom: Number(body.priceFrom ?? existing.priceFrom ?? 0),
      status: body.status ?? existing.status,
      verificationStatus: body.verificationStatus ?? existing.verificationStatus,
      verified: (body.verificationStatus ?? existing.verificationStatus) === "APPROVED",
      paymentBankName: body.paymentBankName?.trim() || null,
      paymentBankAccount: body.paymentBankAccount?.trim() || null,
      paymentBankHolder: body.paymentBankHolder?.trim() || null,
      paymentDanaNumber: body.paymentDanaNumber?.trim() || null,
      paymentDanaName: body.paymentDanaName?.trim() || null,
      acceptsCash: body.acceptsCash !== false,
      updatedAt: now
    })
    .where(eq(partnerProfiles.id, id))
    .returning();

  return ok({ partner: updated[0] });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireRole(["ADMIN"]);
  if (response) return response;

  const { id } = await params;
  const existing = await db.query.partnerProfiles.findFirst({ where: eq(partnerProfiles.id, id) });
  if (!existing) return fail("Partner tidak ditemukan.", 404);

  await client.execute({
    sql: "delete from messages where partner_id = ? or order_id in (select id from orders where partner_id = ?)",
    args: [id, id]
  });
  await client.execute({
    sql: "delete from order_tracking_events where order_id in (select id from orders where partner_id = ?)",
    args: [id]
  });
  await client.execute({
    sql: "delete from orders where partner_id = ?",
    args: [id]
  });
  await client.execute({
    sql: "delete from partner_profiles where id = ?",
    args: [id]
  });
  if (existing.userId) {
    const actor = await db.query.user.findFirst({ where: eq(user.id, existing.userId) });
    if (actor?.role === "PARTNER") {
      await client.execute({
        sql: "delete from wallet_transactions where wallet_id in (select id from wallets where user_id = ?)",
        args: [existing.userId]
      });
      await client.execute({
        sql: "delete from user where id = ? and role = 'PARTNER'",
        args: [existing.userId]
      });
    }
  }

  return ok({ deleted: true });
}
