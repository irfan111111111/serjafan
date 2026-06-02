import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";

export type ApiSession = {
  user: {
    id: string;
    name: string;
    email: string;
    role?: "CUSTOMER" | "PARTNER" | "ADMIN";
  };
};

export function ok<T>(data: T, init?: ResponseInit) {
  return Response.json({ data }, init);
}

export function created<T>(data: T) {
  return ok(data, { status: 201 });
}

export function fail(message: string, status = 400, details?: unknown) {
  return Response.json({ error: { message, details } }, { status });
}

export async function getSession() {
  const session = (await auth.api.getSession({
    headers: await headers()
  })) as ApiSession | null;

  if (session) return session;

  if (process.env.NODE_ENV === "production" && process.env.SERJAFAN_DEV_BYPASS_AUTH !== "1") {
    return null;
  }

  const requestHeaders = await headers();
  const roleHeader = requestHeaders.get("x-serjafan-role");
  const userIdHeader = requestHeaders.get("x-serjafan-user-id");
  const role = roleHeader === "PARTNER" || roleHeader === "ADMIN" ? roleHeader : "CUSTOMER";

  const fallbackUser =
    (userIdHeader
      ? await db.query.user.findFirst({ where: eq(user.id, userIdHeader) })
      : await db.query.user.findFirst({ where: eq(user.role, role) })) ??
    (await db.query.user.findFirst({ where: eq(user.role, "CUSTOMER") }));

  if (!fallbackUser) return null;

  return {
    user: {
      id: fallbackUser.id,
      name: fallbackUser.name,
      email: fallbackUser.email,
      role: (fallbackUser.role as ApiSession["user"]["role"]) ?? "CUSTOMER"
    }
  };
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    return { session: null, response: fail("Authentication required.", 401) };
  }
  return { session, response: null };
}

export async function requireRole(roles: Array<"CUSTOMER" | "PARTNER" | "ADMIN">) {
  const result = await requireSession();
  if (result.response || !result.session) return result;

  const role = result.session.user.role ?? "CUSTOMER";
  if (!roles.includes(role)) {
    return { session: result.session, response: fail("You do not have permission for this action.", 403) };
  }

  return result;
}

export function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 18)}`;
}

export async function readJson<T>(request: Request) {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
