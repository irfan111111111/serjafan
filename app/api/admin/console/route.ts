import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { partnerProfiles, user } from "@/db/schema";
import { defaultAdminConsole, getAdminConsoleSettings, saveAdminConsoleSettings } from "@/lib/admin-console";
import { ok, readJson, requireRole } from "@/lib/api";

export const runtime = "nodejs";

type AdminConsoleBody = Partial<typeof defaultAdminConsole>;

export async function GET() {
  const { response } = await requireRole(["ADMIN"]);
  if (response) return response;

  const [settings, customers, partners] = await Promise.all([
    getAdminConsoleSettings(),
    db.select().from(user).where(eq(user.role, "CUSTOMER")).orderBy(asc(user.name)),
    db.select().from(partnerProfiles).orderBy(asc(partnerProfiles.name))
  ]);

  return ok({ settings, customers, partners });
}

export async function PUT(request: Request) {
  const { response } = await requireRole(["ADMIN"]);
  if (response) return response;

  const body = await readJson<AdminConsoleBody>(request);
  const next = await saveAdminConsoleSettings({ ...defaultAdminConsole, ...(body ?? {}) });

  return ok({ settings: next });
}
