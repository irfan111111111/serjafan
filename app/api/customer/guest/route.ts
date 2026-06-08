import { eq } from "drizzle-orm";
import { db } from "@/db";
import { session as sessionTable, user, wallets } from "@/db/schema";
import { createId, fail, ok, readJson } from "@/lib/api";
import { ensureRegistrationDatabase } from "@/lib/db-bootstrap";

export const runtime = "nodejs";

type GuestBody = {
  deviceId?: string;
};

function cleanDeviceId(value?: string) {
  const cleaned = value?.replace(/[^a-zA-Z0-9]/g, "").slice(0, 24);
  return cleaned && cleaned.length >= 8 ? cleaned : crypto.randomUUID().replaceAll("-", "").slice(0, 24);
}

export async function POST(request: Request) {
  try {
    await ensureRegistrationDatabase();

    const body = await readJson<GuestBody>(request);
    const deviceId = cleanDeviceId(body?.deviceId);
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
            name: "Customer",
            email: `${userId}@customer.serjafan.local`,
            emailVerified: true,
            role: "CUSTOMER",
            createdAt: now,
            updatedAt: now
          })
          .returning()
      )[0];

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
        name: actor.name,
        email: actor.email,
        role: "CUSTOMER",
        home: "/customer",
        token,
        expiresAt: expiresAt.toISOString()
      },
      deviceId
    });
  } catch (error) {
    console.error("Guest customer session failed", error);
    return fail(error instanceof Error ? error.message : "Gagal menyiapkan akses customer.", 500);
  }
}
