import { ok } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  return ok({
    status: "ok",
    service: "serjafan-api",
    timestamp: new Date().toISOString()
  });
}
