import { eq } from "drizzle-orm";
import { db } from "@/db";
import { wallets } from "@/db/schema";
import { fail, ok, requireRole } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const { session, response } = await requireRole(["PARTNER", "ADMIN"]);
  if (response || !session) return response;

  const wallet = await db.query.wallets.findFirst({
    where: eq(wallets.userId, session.user.id)
  });

  if (!wallet) return fail("Wallet not found.", 404);

  return ok({ wallet });
}
