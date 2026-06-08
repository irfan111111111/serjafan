import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { account, session, user } from "@/db/schema";
import { createId, fail, ok, readJson } from "@/lib/api";
import { ensureRegistrationDatabase } from "@/lib/db-bootstrap";
import { verifyAppPassword } from "@/lib/password";

export const runtime = "nodejs";

type LoginBody = {
  email?: string;
  password?: string;
  role?: "CUSTOMER" | "PARTNER" | "ADMIN";
};

const homeByRole = {
  CUSTOMER: "/customer",
  PARTNER: "/partner",
  ADMIN: "/admin"
};

export async function POST(request: Request) {
  try {
    const body = await readJson<LoginBody>(request);
    if (!body) return fail("Invalid JSON body.");

    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";
    if (!email) return fail("Email wajib diisi.");
    if (!password) return fail("Password wajib diisi.");

    await ensureRegistrationDatabase();

    const existingUser = await db.query.user.findFirst({ where: eq(user.email, email) });
    if (!existingUser) return fail("Email atau password salah.", 401);
    if (body.role && existingUser.role !== body.role) {
      return fail("Akun ini tidak sesuai dengan aplikasi yang dipilih.", 403);
    }

    const credential = await db.query.account.findFirst({
      where: and(eq(account.userId, existingUser.id), eq(account.providerId, "credential"))
    });
    if (!credential?.password) return fail("Akun ini belum memiliki password.", 401);

    const validPassword = await verifyAppPassword(credential.password, password);
    if (!validPassword) return fail("Email atau password salah.", 401);

    const role = existingUser.role as keyof typeof homeByRole;
    const token = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30);

    await db.insert(session).values({
      id: createId("ses"),
      userId: existingUser.id,
      token,
      expiresAt,
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      userAgent: request.headers.get("user-agent"),
      createdAt: now,
      updatedAt: now
    });

    return ok({
      session: {
        userId: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        role,
        home: homeByRole[role] ?? "/customer",
        token,
        expiresAt: expiresAt.toISOString()
      }
    });
  } catch (error) {
    console.error("Login failed", error);
    return fail("Login belum bisa diproses. Pastikan database production aktif.", 500);
  }
}
