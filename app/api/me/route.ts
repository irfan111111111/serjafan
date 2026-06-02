import { fail, getSession, ok } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) return fail("Authentication required.", 401);

  return ok({
    user: session.user
  });
}
