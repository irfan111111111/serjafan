import { asc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { addresses, partnerProfiles, user } from "@/db/schema";
import { defaultAdminConsole, getAdminConsoleSettings, saveAdminConsoleSettings } from "@/lib/admin-console";
import { ok, readJson, requireRole } from "@/lib/api";
import { ensurePartnerPaymentColumns } from "@/lib/partner-payments";

export const runtime = "nodejs";
const SERJAFAN_OPS_PARTNER_ID = "ptr_serjafan_ops";

type AdminConsoleBody = Partial<typeof defaultAdminConsole>;

export async function GET() {
  const { response } = await requireRole(["ADMIN"]);
  if (response) return response;
  await ensurePartnerPaymentColumns();

  const [settings, customerRows, addressRows, partners] = await Promise.all([
    getAdminConsoleSettings(),
    db.select().from(user).where(eq(user.role, "CUSTOMER")).orderBy(asc(user.name)),
    db.select().from(addresses),
    db.select().from(partnerProfiles).where(ne(partnerProfiles.id, SERJAFAN_OPS_PARTNER_ID)).orderBy(asc(partnerProfiles.name))
  ]);
  const customers = customerRows.map((customer) => {
    const address = addressRows.find((item) => item.userId === customer.id);
    return {
      ...customer,
      phone: address?.subtitle ?? "",
      location: address?.title ?? ""
    };
  });

  return ok({ settings, customers, partners });
}

export async function PUT(request: Request) {
  const { response } = await requireRole(["ADMIN"]);
  if (response) return response;

  const body = await readJson<AdminConsoleBody>(request);
  const next = await saveAdminConsoleSettings({ ...defaultAdminConsole, ...(body ?? {}) });

  return ok({ settings: next });
}
