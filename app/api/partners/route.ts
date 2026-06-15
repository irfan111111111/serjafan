import { ok } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  return ok({
    partners: [],
    mode: "MANAGED_SERVICE",
    message: "Customer memesan layanan ke SERJAFAN. Admin SERJAFAN menugaskan teknisi lapangan secara operasional."
  });
}
