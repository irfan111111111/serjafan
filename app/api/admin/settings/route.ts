import { fail, ok, readJson, requireRole } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { getAppSettings, saveAppSettings, type SerjafanSettings } from "@/lib/settings";

export const runtime = "nodejs";

export async function GET() {
  const { response } = await requireRole(["ADMIN"]);
  if (response) return response;

  const settings = await getAppSettings();
  return ok({ settings });
}

export async function PUT(request: Request) {
  const { session, response } = await requireRole(["ADMIN"]);
  if (response) return response;

  const body = await readJson<SerjafanSettings>(request);
  if (!body) return fail("Invalid JSON body.");
  if (body.platformFee < 0 || body.promoDiscount < 0) return fail("Fees and discounts must be positive.");

  const settings = await saveAppSettings(body);
  await writeAuditLog({
    session,
    action: "APP_SETTINGS_UPDATED",
    entityType: "app_settings",
    entityId: "default",
    metadata: {
      serviceArea: settings.serviceArea,
      platformFee: settings.platformFee,
      promoCode: settings.promoCode,
      manualBankName: settings.manualBankName,
      manualDanaName: settings.manualDanaName
    }
  });
  return ok({ settings });
}
