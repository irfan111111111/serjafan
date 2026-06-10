import { eq } from "drizzle-orm";
import { db } from "@/db";
import { account, partnerProfiles, partnerRegistrationDocuments, user } from "@/db/schema";
import { createId, fail, ok, readJson } from "@/lib/api";
import { getAdminConsoleSettings } from "@/lib/admin-console";
import { ensureRegistrationDatabase } from "@/lib/db-bootstrap";
import { hashAppPassword } from "@/lib/password";

export const runtime = "nodejs";

type PartnerRegisterBody = {
  ownerName?: string;
  phone?: string;
  email?: string;
  password?: string;
  businessName?: string;
  category?: string;
  serviceArea?: string;
  businessAddress?: string;
  priceFrom?: number;
  servicePhoto?: string;
  selfPhoto?: string;
  ktpPhoto?: string;
  portfolio?: string;
};

function cleanPhoto(value: string, label: string) {
  const photo = value.trim();
  if (!(photo.startsWith("data:image/") || photo.startsWith("https://"))) {
    throw new Error(`${label} harus berupa file foto yang diupload langsung.`);
  }
  if (photo.startsWith("data:image/") && photo.length > 250_000) {
    throw new Error(`${label} terlalu besar. Pilih foto yang lebih kecil atau kompres ulang.`);
  }
  return {
    storedValue: photo
  };
}

export async function POST(request: Request) {
  try {
    const body = await readJson<PartnerRegisterBody>(request);
    if (!body) return fail("Invalid JSON body.");

    const ownerName = body.ownerName?.trim();
    const phone = body.phone?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";
    const businessName = body.businessName?.trim();
    const category = body.category?.trim();
    const serviceArea = body.serviceArea?.trim() || "Kota Padang";
    const businessAddress = body.businessAddress?.trim();

    if (!ownerName) return fail("Nama pemilik wajib diisi.");
    if (!phone) return fail("Nomor HP aktif wajib diisi.");
    if (!email) return fail("Email wajib diisi.");
    if (password.length < 8) return fail("Password minimal 8 karakter.");
    if (!businessName) return fail("Nama usaha/jasa wajib diisi.");
    if (!category) return fail("Kategori jasa wajib diisi.");
    if (!businessAddress) return fail("Alamat usaha wajib diisi.");
    if (!body.servicePhoto?.trim()) return fail("Foto jasa/tempat usaha wajib diisi.");
    if (!body.selfPhoto?.trim()) return fail("Foto diri pemilik wajib diisi.");
    if (!body.ktpPhoto?.trim()) return fail("Foto KTP wajib diisi.");
    const servicePhoto = cleanPhoto(body.servicePhoto, "Foto jasa/tempat usaha");
    const selfPhoto = cleanPhoto(body.selfPhoto, "Foto diri pemilik");
    const ktpPhoto = cleanPhoto(body.ktpPhoto, "Foto KTP");
    const portfolio = body.portfolio?.trim() ? cleanPhoto(body.portfolio, "Portofolio") : "";

    await ensureRegistrationDatabase();

    const settings = await getAdminConsoleSettings();
    if (settings.partnerRegistrationLimited) {
      return fail("Pendaftaran partner sedang dibatasi. Kuota mitra SERJAFAN sudah cukup, silakan coba lagi setelah admin membuka pendaftaran.", 403);
    }

    const existing = await db.query.user.findFirst({ where: eq(user.email, email) });
    if (existing) return fail("Email sudah terdaftar.", 409);

    const userId = createId("usr");
    const partnerId = createId("ptr");
    const now = new Date();

    await db.insert(user).values({
      id: userId,
      name: ownerName,
      email,
      emailVerified: false,
      image: null,
      role: "PARTNER",
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

    await db.insert(partnerProfiles).values({
      id: partnerId,
      userId,
      name: businessName,
      category,
      contactPhone: phone,
      distanceKm: 0,
      rating: 0,
      reviewCount: 0,
      completedOrders: 0,
      etaMinutes: 20,
      priceFrom: body.priceFrom ?? 0,
      status: "OFFLINE",
      verificationStatus: "PENDING",
      verified: false,
      createdAt: now,
      updatedAt: now
    });

    const documentRows = [
      {
        id: createId("doc"),
        partnerId,
        type: "SERVICE_PHOTO" as const,
        label: "Foto jasa/tempat usaha",
        value: servicePhoto.storedValue,
        status: "PENDING" as const,
        createdAt: now,
        updatedAt: now
      },
      {
        id: createId("doc"),
        partnerId,
        type: "SELF_PHOTO" as const,
        label: "Foto diri pemilik",
        value: selfPhoto.storedValue,
        status: "PENDING" as const,
        createdAt: now,
        updatedAt: now
      },
      {
        id: createId("doc"),
        partnerId,
        type: "KTP" as const,
        label: "Foto KTP",
        value: ktpPhoto.storedValue,
        status: "PENDING" as const,
        createdAt: now,
        updatedAt: now
      },
      {
        id: createId("doc"),
        partnerId,
        type: "BUSINESS_ADDRESS" as const,
        label: `Area layanan: ${serviceArea}`,
        value: businessAddress,
        status: "PENDING" as const,
        createdAt: now,
        updatedAt: now
      },
      ...(portfolio
        ? [
            {
              id: createId("doc"),
              partnerId,
              type: "PORTFOLIO" as const,
              label: "Portofolio/contoh hasil kerja",
              value: portfolio.storedValue,
              status: "PENDING" as const,
              createdAt: now,
              updatedAt: now
            }
        ]
      : [])
    ];

    for (const documentRow of documentRows) {
      await db.insert(partnerRegistrationDocuments).values(documentRow);
    }

    return ok({
      partner: {
        id: partnerId,
        name: businessName,
        category,
        verificationStatus: "PENDING"
      }
    }, { status: 201 });
  } catch (error) {
    console.error("Partner registration failed", error);
    if (error instanceof Error && error.message.includes("Foto")) {
      return fail(error.message, 400);
    }
    return fail(
      "Pendaftaran partner belum bisa disimpan. Pastikan database production/Turso sudah aktif dan migration sudah dijalankan.",
      500
    );
  }
}
