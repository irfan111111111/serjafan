import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { messages, notifications, orderTrackingEvents, orders, partnerProfiles } from "@/db/schema";
import { createId, created, fail, ok, readJson, requireSession } from "@/lib/api";

export const runtime = "nodejs";

type CreateOrderBody = {
  partnerId?: string;
  serviceCategoryId?: string;
  fulfillmentMode?: "PARTNER_TO_CUSTOMER" | "CUSTOMER_TO_PARTNER";
  address?: {
    title?: string;
    subtitle?: string;
    latitude?: number;
    longitude?: number;
  };
  schedule?: {
    type?: string;
    title?: string;
    subtitle?: string;
  };
  note?: string;
  paymentMethod?: "SERJAFAN_PAY" | "CARD" | "CASH";
  promoCode?: string | null;
  prices?: {
    serviceFee?: number;
    platformFee?: number;
    discount?: number;
  };
};

export async function GET() {
  const { session, response } = await requireSession();
  if (response || !session) return response;

  const customerOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.customerId, session.user.id))
    .orderBy(desc(orders.createdAt));

  return ok({ orders: customerOrders });
}

export async function POST(request: Request) {
  const { session, response } = await requireSession();
  if (response || !session) return response;

  const body = await readJson<CreateOrderBody>(request);
  if (!body) return fail("Invalid JSON body.", 400);

  if (!body.partnerId) return fail("partnerId is required.");
  if (!body.serviceCategoryId) return fail("serviceCategoryId is required.");
  if (!body.address?.title) return fail("address.title is required.");
  if (!body.paymentMethod) return fail("paymentMethod is required.");

  const serviceFee = body.prices?.serviceFee ?? 0;
  const platformFee = body.prices?.platformFee ?? 0;
  const discount = body.prices?.discount ?? 0;
  const total = Math.max(0, serviceFee + platformFee - discount);

  if (total <= 0) return fail("Order total must be greater than zero.");

  const orderId = createId("ord");
  const now = new Date();
  const partner = await db.query.partnerProfiles.findFirst({
    where: eq(partnerProfiles.id, body.partnerId)
  });

  if (!partner) return fail("Partner not found.", 404);

  await db.insert(orders).values({
    id: orderId,
    customerId: session.user.id,
    partnerId: body.partnerId,
    serviceCategoryId: body.serviceCategoryId,
    addressTitle: body.address.title,
    addressSubtitle: body.address.subtitle ?? "",
    scheduleType: body.schedule?.type ?? "ASAP",
    scheduleTitle: body.schedule?.title ?? "Sekarang (ASAP)",
    scheduleSubtitle: body.schedule?.subtitle ?? "Estimasi tiba segera",
    note: body.note ?? null,
    paymentMethod: body.paymentMethod,
    promoCode: body.promoCode ?? null,
    serviceFee,
    platformFee,
    discount,
    total,
    status: "PENDING",
    createdAt: now,
    updatedAt: now
  });

  await db.insert(orderTrackingEvents).values({
    id: createId("trk"),
    orderId,
    status: "PENDING",
    title: "Menunggu konfirmasi mitra",
    description: "Permintaan jasa sudah dikirim. Mitra perlu menerima pesanan sebelum proses dimulai.",
    latitude: body.address.latitude ?? null,
    longitude: body.address.longitude ?? null,
    createdAt: now
  });

  await db.insert(notifications).values({
    id: createId("notf"),
    userId: session.user.id,
    kind: "ORDER",
    title: "Menunggu konfirmasi mitra",
    body: `Pesanan ${orderId} sudah dikirim ke ${partner?.name ?? "mitra"}. Tunggu mitra menerima pesanan.`,
    targetUrl: `/orders/${orderId}`,
    createdAt: now,
    updatedAt: now
  });

  if (partner?.userId) {
    await db.insert(notifications).values({
      id: createId("notf"),
      userId: partner.userId,
      kind: "ORDER",
      title: "Pesanan baru menunggu konfirmasi",
      body: `Customer ${session.user.name} meminta jasa. Terima atau tolak pesanan ${orderId}.`,
      targetUrl: `/partner/orders`,
      createdAt: now,
      updatedAt: now
    });

    await db.insert(messages).values({
      id: createId("msg"),
      userId: partner.userId,
      sender: session.user.name,
      title: "Permintaan jasa baru",
      body: `Pesanan ${orderId} menunggu konfirmasi Anda sebelum customer bisa lanjut proses. Arah layanan: ${
        body.fulfillmentMode === "CUSTOMER_TO_PARTNER" ? "customer menuju lokasi partner/jasa" : "partner/jasa menuju lokasi customer"
      }.`,
      unread: true,
      createdAt: now,
      updatedAt: now
    });
  }

  return created({
    order: {
      id: orderId,
      total,
      status: "PENDING"
    }
  });
}
