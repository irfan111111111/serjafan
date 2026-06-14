import { eq } from "drizzle-orm";
import { db } from "@/db";
import { partnerProfiles, wallets } from "@/db/schema";
import { fail, ok, readJson, requireRole } from "@/lib/api";

export const runtime = "nodejs";
const MIN_PARTNER_WORK_BALANCE = 20_000;

type StatusBody = {
  status?: "ONLINE" | "BUSY" | "OFFLINE";
};

export async function PUT(request: Request) {
  const { session, response } = await requireRole(["PARTNER", "ADMIN"]);
  if (response || !session) return response;

  const body = await readJson<StatusBody>(request);
  if (!body?.status) return fail("status is required.");

  const partner = await db.query.partnerProfiles.findFirst({
    where: eq(partnerProfiles.userId, session.user.id)
  });

  if (!partner) return fail("Profil teknisi SERJAFAN tidak ditemukan.", 404);

  if (body.status === "ONLINE") {
    const wallet = await db.query.wallets.findFirst({
      where: eq(wallets.userId, session.user.id)
    });
    if (!wallet || wallet.balance < MIN_PARTNER_WORK_BALANCE) {
      return fail("Saldo deposit teknisi minimal Rp 20.000 sebelum bisa online menerima tugas SERJAFAN.", 422);
    }
  }

  const updated = await db
    .update(partnerProfiles)
    .set({ status: body.status, updatedAt: new Date() })
    .where(eq(partnerProfiles.id, partner.id))
    .returning();

  return ok({ partner: updated[0] });
}
