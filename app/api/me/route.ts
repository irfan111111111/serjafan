import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { addresses, user } from "@/db/schema";
import { createId, fail, getSession, ok, readJson, requireSession } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) return fail("Authentication required.", 401);

  const actor = await db.query.user.findFirst({
    where: eq(user.id, session.user.id)
  });

  const defaultAddress = await db.query.addresses.findFirst({
    where: eq(addresses.userId, session.user.id),
    orderBy: [desc(addresses.isDefault), desc(addresses.updatedAt)]
  });

  return ok({
    user: {
      ...session.user,
      name: actor?.name ?? session.user.name,
      image: actor?.image ?? null,
      location: defaultAddress?.title ?? "Kota Padang",
      phone: defaultAddress?.subtitle ?? ""
    }
  });
}

type ProfileUpdateBody = {
  name?: string;
  phone?: string;
  location?: string;
  profilePhoto?: string | null;
};

function cleanProfilePhoto(value?: string | null) {
  if (value === null) return null;
  const photo = value?.trim();
  if (!photo) return undefined;
  if (!(photo.startsWith("data:image/") || photo.startsWith("https://"))) throw new Error("Foto profil harus diupload langsung dari kamera atau galeri.");
  if (photo.startsWith("data:image/") && photo.length > 250_000) throw new Error("Foto profil terlalu besar. Pilih foto yang lebih kecil.");
  return photo;
}

export async function PUT(request: Request) {
  try {
    const { session, response } = await requireSession();
    if (response || !session) return response;

    const body = await readJson<ProfileUpdateBody>(request);
    if (!body) return fail("Invalid JSON body.");

    const name = body.name?.trim();
    const phone = body.phone?.trim();
    const location = body.location?.trim();
    if (!name) return fail("Nama lengkap wajib diisi.");
    if (!phone) return fail("Nomor HP wajib diisi.");
    if (!location) return fail("Kota/lokasi wajib diisi.");

    const profilePhoto = cleanProfilePhoto(body.profilePhoto);
    const now = new Date();

    await db
      .update(user)
      .set({
        name,
        ...(profilePhoto !== undefined ? { image: profilePhoto } : {}),
        updatedAt: now
      })
      .where(eq(user.id, session.user.id));

    const existingAddress = await db.query.addresses.findFirst({
      where: eq(addresses.userId, session.user.id)
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
        userId: session.user.id,
        title: location,
        subtitle: phone,
        latitude: -0.9471,
        longitude: 100.4172,
        isDefault: true,
        createdAt: now,
        updatedAt: now
      });
    }

    return ok({
      user: {
        id: session.user.id,
        name,
        email: session.user.email,
        role: session.user.role,
        image: profilePhoto === undefined ? undefined : profilePhoto,
        location,
        phone
      }
    });
  } catch (error) {
    console.error("Profile update failed", error);
    return fail(error instanceof Error ? error.message : "Profil gagal diperbarui.", 400);
  }
}
