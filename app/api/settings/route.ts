import { ok } from "@/lib/api";
import { getAppSettings } from "@/lib/settings";

export const runtime = "nodejs";

export async function GET() {
  const settings = await getAppSettings();
  return ok({ settings });
}
