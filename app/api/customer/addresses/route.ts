import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { addresses } from "@/db/schema";
import { createId, created, fail, ok, readJson, requireSession } from "@/lib/api";

export const runtime = "nodejs";

type CreateAddressBody = {
  title?: string;
  subtitle?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
};

export async function GET() {
  const { session, response } = await requireSession();
  if (response || !session) return response;

  const items = await db
    .select()
    .from(addresses)
    .where(eq(addresses.userId, session.user.id))
    .orderBy(desc(addresses.isDefault));

  return ok({ addresses: items });
}

export async function POST(request: Request) {
  const { session, response } = await requireSession();
  if (response || !session) return response;

  const body = await readJson<CreateAddressBody>(request);
  if (!body?.title || !body.subtitle) return fail("title and subtitle are required.");

  const now = new Date();
  const id = createId("addr");

  if (body.isDefault) {
    await db.update(addresses).set({ isDefault: false, updatedAt: now }).where(eq(addresses.userId, session.user.id));
  }

  await db.insert(addresses).values({
    id,
    userId: session.user.id,
    title: body.title,
    subtitle: body.subtitle,
    latitude: body.latitude ?? null,
    longitude: body.longitude ?? null,
    isDefault: body.isDefault ?? false,
    createdAt: now,
    updatedAt: now
  });

  return created({ address: { id, ...body } });
}
