import { eq } from "drizzle-orm";
import { db } from "@/db";
import { account, addresses, user, wallets } from "@/db/schema";
import { createId, fail, ok, readJson } from "@/lib/api";
import { ensureRegistrationDatabase } from "@/lib/db-bootstrap";
import { hashAppPassword } from "@/lib/password";

export const runtime = "nodejs";

type CustomerRegisterBody = {
  name?: string;
  phone?: string;
  email?: string;
  password?: string;
  addressTitle?: string;
  addressSubtitle?: string;
  profilePhoto?: string;
};

function cleanOptionalPhoto(value?: string) {
  const photo = value?.trim();
  if (!photo) return null;
  if (!(photo.startsWith("data:image/") || photo.startsWith("https://"))) throw new Error("Foto profil harus berupa file foto yang diupload langsung.");
  if (photo.startsWith("data:image/") && photo.length > 250_000) throw new Error("Foto profil terlalu besar. Pilih foto yang lebih kecil.");
  return photo;
}

export async function POST(request: Request) {
  try {
    const body = await readJson<CustomerRegisterBody>(request);
    if (!body) return fail("Invalid JSON body.");

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";
    if (!name) return fail("Nama lengkap wajib diisi.");
    if (!email) return fail("Email wajib diisi.");
    if (password.length < 8) return fail("Password minimal 8 karakter.");
    const profilePhoto = cleanOptionalPhoto(body.profilePhoto);

    await ensureRegistrationDatabase();

    const existing = await db.query.user.findFirst({ where: eq(user.email, email) });
    if (existing) return fail("Email sudah terdaftar.", 409);

    const userId = createId("usr");
    const now = new Date();

    await db.insert(user).values({
      id: userId,
      name,
      email,
      emailVerified: false,
      image: profilePhoto,
      role: "CUSTOMER",
      createdAt: now,
      updatedAt: now
    });

    await db.insert(account).values({
      id: createId("acc"),
      userId,
      accountId: email,
      providerId: "credential",
      password: await hashAppPassword(password),
      createdAt: now,
      updatedAt: now
    });

    await db.insert(wallets).values({
      id: createId("wal"),
      userId,
      balance: 0,
      currency: "IDR",
      createdAt: now,
      updatedAt: now
    });

    if (body.addressTitle?.trim()) {
      await db.insert(addresses).values({
        id: createId("addr"),
        userId,
        title: body.addressTitle.trim(),
        subtitle: body.addressSubtitle?.trim() || "Kota Padang, Sumatera Barat",
        latitude: -0.9471,
        longitude: 100.4172,
        isDefault: true,
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
          role: "CUSTOMER"
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Customer registration failed", error);
    if (error instanceof Error && error.message.includes("Foto")) return fail(error.message, 400);
    return fail(
      "Pendaftaran belum bisa disimpan. Pastikan database production/Turso sudah aktif dan migration sudah dijalankan.",
      500
    );
  }
}
