import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { account, user } from "@/db/schema";
import { createId, fail, ok, readJson } from "@/lib/api";
import { ensureRegistrationDatabase } from "@/lib/db-bootstrap";
import { hashAppPassword } from "@/lib/password";

export const runtime = "nodejs";

type AdminRegisterBody = {
  name?: string;
  email?: string;
  password?: string;
  profilePhoto?: string;
};

function cleanOptionalPhoto(value?: string) {
  const photo = value?.trim();
  if (!photo) return null;
  if (!(photo.startsWith("data:image/") || photo.startsWith("https://"))) throw new Error("Foto profil admin harus berupa file foto yang diupload langsung.");
  if (photo.startsWith("data:image/") && photo.length > 250_000) throw new Error("Foto profil admin terlalu besar. Pilih foto yang lebih kecil.");
  return photo;
}

export async function GET() {
  try {
    await ensureRegistrationDatabase();
    const firstAdmin = await db.query.user.findFirst({ where: eq(user.role, "ADMIN") });
    const firstAdminAccount = firstAdmin
      ? await db.query.account.findFirst({
          where: and(eq(account.userId, firstAdmin.id), eq(account.providerId, "credential"))
        })
      : null;

    return ok({
      canRegister: !firstAdminAccount?.password,
      adminExists: Boolean(firstAdminAccount?.password)
    });
  } catch {
    return ok({
      canRegister: false,
      adminExists: true
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJson<AdminRegisterBody>(request);
    if (!body) return fail("Invalid JSON body.");

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";
    if (!name) return fail("Nama admin wajib diisi.");
    if (!email) return fail("Email admin wajib diisi.");
    if (password.length < 8) return fail("Password minimal 8 karakter.");
    const profilePhoto = cleanOptionalPhoto(body.profilePhoto);

    await ensureRegistrationDatabase();

    const firstAdmin = await db.query.user.findFirst({ where: eq(user.role, "ADMIN") });
    const firstAdminAccount = firstAdmin
      ? await db.query.account.findFirst({
          where: and(eq(account.userId, firstAdmin.id), eq(account.providerId, "credential"))
        })
      : null;
    if (firstAdminAccount?.password) return fail("Akun admin sudah ada. Hanya admin pertama yang boleh dibuat.", 403);

    const existing = await db.query.user.findFirst({ where: eq(user.email, email) });
    if (existing && existing.id !== firstAdmin?.id) return fail("Email sudah terdaftar.", 409);

    const userId = firstAdmin?.id ?? createId("usr");
    const now = new Date();

    if (firstAdmin) {
      await db
        .update(user)
        .set({
          name,
          email,
          emailVerified: true,
          image: profilePhoto || firstAdmin.image,
          updatedAt: now
        })
        .where(eq(user.id, firstAdmin.id));
    } else {
      await db.insert(user).values({
        id: userId,
        name,
        email,
        emailVerified: true,
        image: profilePhoto,
        role: "ADMIN",
        createdAt: now,
        updatedAt: now
      });
    }

    const passwordHash = await hashAppPassword(password);
    if (firstAdminAccount) {
      await db
        .update(account)
        .set({
          accountId: email,
          password: passwordHash,
          updatedAt: now
        })
        .where(eq(account.id, firstAdminAccount.id));
    } else {
      await db.insert(account).values({
        id: createId("acc"),
        userId,
        accountId: email,
        providerId: "credential",
        password: passwordHash,
        createdAt: now,
        updatedAt: now
      });
    }

    return ok(
      {
        user: {
          id: userId,
          name,
          email,
          role: "ADMIN"
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin registration failed", error);
    if (error instanceof Error && error.message.includes("Foto")) return fail(error.message, 400);
    return fail("Pendaftaran admin belum bisa disimpan. Pastikan database production aktif.", 500);
  }
}
