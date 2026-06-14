import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { messages, notifications, orderTrackingEvents, orders, partnerProfiles, user, wallets } from "@/db/schema";
import { createId, created, fail, ok, readJson, requireSession } from "@/lib/api";
import { ensureMessageThreadColumns } from "@/lib/message-threads";
import { sendPushToUser } from "@/lib/push";

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
  paymentMethod?: "SERJAFAN_PAY" | "DIRECT_TRANSFER" | "CARD" | "CASH";
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
  await ensureMessageThreadColumns();

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

  if (!partner) return fail("Teknisi SERJAFAN tidak ditemukan.", 404);
  if (partner.verificationStatus !== "APPROVED" || partner.status !== "ONLINE" || !partner.userId) {
    return fail("Tim SERJAFAN belum siap menugaskan teknisi untuk layanan ini. Silakan coba layanan lain atau hubungi admin.", 409);
  }
  const hasPartnerBankPayment = Boolean(partner.paymentBankName && partner.paymentBankAccount && partner.paymentBankHolder);
  const hasPartnerDanaPayment = Boolean(partner.paymentDanaNumber && partner.paymentDanaName);
  if (body.paymentMethod === "DIRECT_TRANSFER" && !hasPartnerBankPayment && !hasPartnerDanaPayment) {
    return fail("Metode transfer manual SERJAFAN belum siap untuk layanan ini.", 409);
  }
  if (body.paymentMethod === "CASH" && partner.acceptsCash === false) {
    return fail("Pembayaran tunai belum tersedia untuk layanan ini.", 409);
  }
  const partnerWallet = await db.query.wallets.findFirst({ where: eq(wallets.userId, partner.userId) });
  if (!partnerWallet || partnerWallet.balance < 20_000) {
    return fail("Teknisi internal belum memenuhi saldo kerja minimum untuk menerima penugasan.", 409);
  }

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
    title: "Pesanan diterima SERJAFAN",
    description: "Tim SERJAFAN sedang memeriksa detail kebutuhan dan menugaskan teknisi internal.",
    latitude: body.address.latitude ?? null,
    longitude: body.address.longitude ?? null,
    createdAt: now
  });

  await db.insert(notifications).values({
    id: createId("notf"),
    userId: session.user.id,
    kind: "ORDER",
    title: "Pesanan diterima SERJAFAN",
    body: `Pesanan ${orderId} sudah diterima SERJAFAN. Metode pembayaran: ${
      body.paymentMethod === "CASH" ? "tunai" : body.paymentMethod === "DIRECT_TRANSFER" ? "transfer manual SERJAFAN" : "SERJAFAN Pay"
    }. Tim operasional akan menugaskan teknisi internal.`,
    targetUrl: `/orders/${orderId}`,
    createdAt: now,
    updatedAt: now
  });
  await sendPushToUser(session.user.id, {
    title: "Pesanan diterima SERJAFAN",
    body: `Pesanan ${orderId} sedang diproses tim SERJAFAN.`,
    url: "/customer",
    tag: `order-${orderId}`,
    kind: "notification"
  });

  if (partner?.userId) {
    await db.insert(notifications).values({
      id: createId("notf"),
      userId: partner.userId,
      kind: "ORDER",
      title: "Tugas SERJAFAN baru",
      body: `Operasional SERJAFAN menugaskan order ${orderId}. Terima atau tolak tugas ini.`,
      targetUrl: `/partner/orders`,
      createdAt: now,
      updatedAt: now
    });

    await db.insert(messages).values({
      id: createId("msg"),
      userId: partner.userId,
      sender: session.user.name,
      title: `Tugas SERJAFAN - ${partner.category}`,
      body: `Pesanan ${orderId} menunggu konfirmasi Anda sebelum customer bisa lanjut proses. Arah layanan: ${
        body.fulfillmentMode === "CUSTOMER_TO_PARTNER" ? "customer menuju titik SERJAFAN" : "teknisi menuju lokasi customer"
      }. Pembayaran: ${body.paymentMethod === "CASH" ? "tunai sesuai operasional" : body.paymentMethod === "DIRECT_TRANSFER" ? "transfer manual SERJAFAN" : "SERJAFAN Pay"}.`,
      orderId,
      partnerId: partner.id,
      partnerName: partner.name,
      serviceName: partner.category,
      attachmentImage: null,
      unread: true,
      createdAt: now,
      updatedAt: now
    });
    await sendPushToUser(partner.userId, {
      title: "Tugas SERJAFAN baru",
      body: `Order ${orderId} untuk layanan ${partner.category}. Terima atau tolak tugas ini.`,
      url: "/partner",
      tag: `order-${orderId}`,
      kind: "notification"
    });
  }

  const admins = await db.select().from(user).where(eq(user.role, "ADMIN"));
  if (admins.length) {
    await db.insert(notifications).values(
      admins.map((admin) => ({
        id: createId("notf"),
        userId: admin.id,
        kind: "ORDER" as const,
        title: "Pesanan customer baru",
        body: `${session.user.name} membuat pesanan ${orderId} untuk layanan ${partner.category}. Pantau assignment teknisi di dashboard admin.`,
        targetUrl: "/admin",
        createdAt: now,
        updatedAt: now
      }))
    );
    await Promise.all(
      admins.map((admin) =>
        sendPushToUser(admin.id, {
          title: "Pesanan customer baru",
          body: `${session.user.name} membuat pesanan ${orderId} untuk layanan ${partner.category}.`,
          url: "/admin",
          tag: `admin-order-${orderId}`,
          kind: "notification"
        })
      )
    );
  }

  return created({
    order: {
      id: orderId,
      total,
      status: "PENDING"
    }
  });
}
