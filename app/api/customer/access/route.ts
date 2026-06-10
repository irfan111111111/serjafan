import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { addresses, session as sessionTable, user, wallets } from "@/db/schema";
import { createId, fail, ok, readJson } from "@/lib/api";
import { ensureRegistrationDatabase } from "@/lib/db-bootstrap";

export const runtime = "nodejs";

type CustomerAccessBody = {
  deviceId?: string;
  name?: string;
  phone?: string;
  location?: string;
  profilePhoto?: string | null;
};

function cleanDeviceId(value?: string) {
  const cleaned = value?.replace(/[^a-zA-Z0-9]/g, "").slice(0, 24);
  return cleaned && cleaned.length >= 8 ? cleaned : crypto.randomUUID().replaceAll("-", "").slice(0, 24);
}

function cleanProfilePhoto(value?: string | null) {
  if (value === null) return null;
  const photo = value?.trim();
  if (!photo) return undefined;
  if (!(photo.startsWith("data:image/") || photo.startsWith("https://"))) throw new Error("Foto profil harus diupload langsung dari kamera atau galeri.");
  if (photo.startsWith("data:image/") && photo.length > 250_000) throw new Error("Foto profil terlalu besar. Pilih foto yang lebih kecil.");
  return photo;
}

export async function POST(request: Request) {
  try {
    await ensureRegistrationDatabase();

    const body = await readJson<CustomerAccessBody>(request);
    if (!body) return fail("Invalid JSON body.");

    const name = body.name?.trim();
    const phone = body.phone?.trim();
    const location = body.location?.trim();
    if (!name) return fail("Nama lengkap wajib diisi.");
    if (!phone) return fail("Nomor HP wajib diisi.");
    if (!location || location.length < 12 || location.toLowerCase() === "kota padang") {
      return fail("Alamat lengkap wajib diisi agar terbaca di maps.");
    }

    const profilePhoto = cleanProfilePhoto(body.profilePhoto);
    const deviceId = cleanDeviceId(body.deviceId);
    const userId = `usr_customer_${deviceId}`;
    const now = new Date();

    const existing = await db.query.user.findFirst({
      where: eq(user.id, userId)
    });

    const actor =
      existing ??
      (
        await db
          .insert(user)
          .values({
            id: userId,
            name,
            email: `${userId}@customer.serjafan.local`,
            emailVerified: true,
            image: profilePhoto ?? null,
            role: "CUSTOMER",
            createdAt: now,
            updatedAt: now
          })
          .returning()
      )[0];

    if (existing) {
      await db
        .update(user)
        .set({
          name,
          ...(profilePhoto !== undefined ? { image: profilePhoto } : {}),
          updatedAt: now
        })
        .where(eq(user.id, actor.id));
    }

    await db
      .insert(wallets)
      .values({
        id: createId("wal"),
        userId: actor.id,
        balance: 0,
        currency: "IDR",
        createdAt: now,
        updatedAt: now
      })
      .onConflictDoNothing();

    const existingAddress = await db.query.addresses.findFirst({
      where: eq(addresses.userId, actor.id),
      orderBy: [desc(addresses.isDefault), desc(addresses.updatedAt)]
    });

    if (existingAddress) {
      await db
        .update(addresses)
        .set({
          title: location,
          subtitle: phone,
          latitude: -0.9471,
          longitude: 100.4172,
          isDefault: true,
          updatedAt: now
        })
        .where(eq(addresses.id, existingAddress.id));
    } else {
      await db.insert(addresses).values({
        id: createId("addr"),
        userId: actor.id,
        title: location,
        subtitle: phone,
        latitude: -0.9471,
        longitude: 100.4172,
        isDefault: true,
        createdAt: now,
        updatedAt: now
      });
    }

    const token = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
    const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 365);

    await db.insert(sessionTable).values({
      id: createId("sess"),
      userId: actor.id,
      token,
      expiresAt,
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      userAgent: request.headers.get("user-agent"),
      createdAt: now,
      updatedAt: now
    });

    return ok({
      session: {
        userId: actor.id,
        name,
        email: actor.email,
        role: "CUSTOMER",
        home: "/customer",
        token,
        expiresAt: expiresAt.toISOString()
      },
      user: {
        id: actor.id,
        name,
        email: actor.email,
        role: "CUSTOMER",
        image: profilePhoto === undefined ? actor.image ?? null : profilePhoto,
        location,
        phone
      },
      deviceId
    });
  } catch (error) {
    console.error("Customer access failed", error);
    return fail(error instanceof Error ? error.message : "Akses customer gagal disimpan.", 400);
  }
}
