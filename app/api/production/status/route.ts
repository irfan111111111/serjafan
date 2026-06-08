import { ok } from "@/lib/api";
import { getProductionReadiness } from "@/lib/production-readiness";

export const runtime = "nodejs";

export async function GET() {
  return ok(getProductionReadiness());
}
