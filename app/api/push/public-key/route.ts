import { fail, ok } from "@/lib/api";
import { getVapidPublicKey } from "@/lib/push";

export const runtime = "nodejs";

export async function GET() {
  const publicKey = getVapidPublicKey();
  if (!publicKey) return fail("VAPID public key belum dikonfigurasi.", 503);
  return ok({ publicKey });
}
