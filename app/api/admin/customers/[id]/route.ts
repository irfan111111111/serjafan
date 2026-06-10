import { eq } from "drizzle-orm";
import { client, db } from "@/db";
import { addresses, user } from "@/db/schema";
import { createId, fail, ok, readJson, requireRole } from "@/lib/api";

export const runtime = "nodejs";

type CustomerBody = {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  image?: string | null;
};

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireRole(["ADMIN"]);
  if (response) return response;

  const { id } = await params;
  const body = await readJson<CustomerBody>(request);
  if (!body) return fail("Invalid JSON body.");

  const existing = await db.query.user.findFirst({ where: eq(user.id, id) });
  if (!existing || existing.role !== "CUSTOMER") return fail("Customer tidak ditemukan.", 404);

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const phone = body.phone?.trim();
  const location = body.location?.trim();
  if (!name) return fail("Nama customer wajib diisi.");
  if (!email) return fail("Email customer wajib diisi.");

  const now = new Date();
  await db
    .update(user)
    .set({ name, email, image: body.image ?? existing.image, updatedAt: now })
    .where(eq(user.id, id));

  if (phone || location) {
    const existingAddress = await db.query.addresses.findFirst({ where: eq(addresses.userId, id) });
    if (existingAddress) {
      await db
        .update(addresses)
        .set({
          title: location || existingAddress.title,
          subtitle: phone || existingAddress.subtitle,
          latitude: -0.9471,
          longitude: 100.4172,
          isDefault: true,
          updatedAt: now
        })
        .where(eq(addresses.id, existingAddress.id));
    } else {
      await db.insert(addresses).values({
        id: createId("addr"),
        userId: id,
        title: location || "Kota Padang",
        subtitle: phone || "",
        latitude: -0.9471,
        longitude: 100.4172,
        isDefault: true,
        createdAt: now,
        updatedAt: now
      });
    }
  }

  return ok({ customer: { id, name, email, phone, location } });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireRole(["ADMIN"]);
  if (response) return response;

  const { id } = await params;
  const existing = await db.query.user.findFirst({ where: eq(user.id, id) });
  if (!existing || existing.role !== "CUSTOMER") return fail("Customer tidak ditemukan.", 404);

  await client.execute({
    sql: "delete from messages where user_id = ? or order_id in (select id from orders where customer_id = ?)",
    args: [id, id]
  });
  await client.execute({
    sql: "delete from order_tracking_events where order_id in (select id from orders where customer_id = ?)",
    args: [id]
  });
  await client.execute({
    sql: "delete from wallet_transactions where wallet_id in (select id from wallets where user_id = ?)",
    args: [id]
  });
  await client.execute({
    sql: "delete from user where id = ? and role = 'CUSTOMER'",
    args: [id]
  });

  return ok({ deleted: true });
}
