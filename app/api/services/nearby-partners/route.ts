import { ok } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  return ok({
    partners: [],
    mode: "MANAGED_SERVICE",
    message: "SERJAFAN V1 tidak menampilkan teknisi terdekat ke customer. Tim SERJAFAN menerima order dan mengatur teknisi lapangan."
  });
}
