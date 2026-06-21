import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { addresses, notifications, orderTrackingEvents, orders, partnerProfiles, user, wallets } from "@/db/schema";
import { createId, fail, ok, readJson, requireRole } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { ensureRegistrationDatabase } from "@/lib/db-bootstrap";
import { ensureOrderPaymentColumns } from "@/lib/order-payments";
import { getAppSettings } from "@/lib/settings";

export const runtime = "nodejs";

const SERJAFAN_OPS_PARTNER_ID = "ptr_serjafan_ops";

type ManualWhatsappOrderBody = {
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  serviceName?: string;
  finalPrice?: number;
  platformFee?: number;
  note?: string;
  paymentMethod?: "DIRECT_TRANSFER" | "CASH";
  paymentReference?: string;
  paymentProofImage?: string;
  paymentSenderName?: string;
};

function cleanPhone(value?: string) {
  return value?.replace(/[^\d+]/g, "").trim() ?? "";
}

function customerEmailFromPhone(phone: string) {
  const digits = phone.replace(/\D/g, "").slice(-16) || crypto.randomUUID().replaceAll("-", "").slice(0, 10);
  return `wa_${digits}@customer.serjafan.local`;
}

async function ensureSerjafanOpsPartner(now: Date) {
  const existing = await db.query.partnerProfiles.findFirst({
    where: eq(partnerProfiles.id, SERJAFAN_OPS_PARTNER_ID)
  });
  if (existing) return existing;

  await db.insert(partnerProfiles).values({
    id: SERJAFAN_OPS_PARTNER_ID,
    userId: null,
    name: "SERJAFAN Operasional",
    category: "Order SERJAFAN",
    distanceKm: 0,
    rating: 0,
    reviewCount: 0,
    completedOrders: 0,
    etaMinutes: 15,
    priceFrom: 0,
    status: "OFFLINE",
    verificationStatus: "APPROVED",
    verified: true,
    createdAt: now,
    updatedAt: now
  });

  const createdPartner = await db.query.partnerProfiles.findFirst({
    where: eq(partnerProfiles.id, SERJAFAN_OPS_PARTNER_ID)
  });
  if (!createdPartner) throw new Error("SERJAFAN operational partner could not be created.");
  return createdPartner;
}

async function findCustomerByPhone(phone: string) {
  if (!phone) return null;
  const addressRows = await db
    .select({ userId: addresses.userId })
    .from(addresses)
    .where(eq(addresses.subtitle, phone))
    .orderBy(desc(addresses.updatedAt))
    .limit(1);
  const userId = addressRows[0]?.userId;
  return userId ? await db.query.user.findFirst({ where: eq(user.id, userId) }) : null;
}

async function ensureCustomer(body: ManualWhatsappOrderBody, now: Date) {
  const phone = cleanPhone(body.customerPhone);
  const name = body.customerName?.trim();
  const address = body.customerAddress?.trim();
  if (!name) throw new Error("Nama customer wajib diisi.");
  if (!phone) throw new Error("Nomor HP customer wajib diisi.");
  if (!address || address.length < 8) throw new Error("Alamat customer wajib diisi.");

  const existingById = body.customerId?.trim() ? await db.query.user.findFirst({ where: eq(user.id, body.customerId.trim()) }) : null;
  const existingByPhone = existingById ? null : await findCustomerByPhone(phone);
  let customer = existingById ?? existingByPhone;

  if (!customer) {
    const userId = createId("usr");
    const email = customerEmailFromPhone(phone);
    const existingEmail = await db.query.user.findFirst({ where: eq(user.email, email) });
    customer =
      existingEmail ??
      (
        await db
          .insert(user)
          .values({
            id: userId,
            name,
            email,
            emailVerified: true,
            role: "CUSTOMER",
            image: null,
            createdAt: now,
            updatedAt: now
          })
          .returning()
      )[0];
  } else if (customer.name !== name) {
    await db.update(user).set({ name, updatedAt: now }).where(eq(user.id, customer.id));
    customer = { ...customer, name };
  }

  await db
    .insert(wallets)
    .values({
      id: createId("wal"),
      userId: customer.id,
      balance: 0,
      currency: "IDR",
      createdAt: now,
      updatedAt: now
    })
    .onConflictDoNothing();

  const existingAddress = await db.query.addresses.findFirst({
    where: and(eq(addresses.userId, customer.id), eq(addresses.isDefault, true))
  });
  if (existingAddress) {
    await db
      .update(addresses)
      .set({
        title: address,
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
      userId: customer.id,
      title: address,
      subtitle: phone,
      latitude: -0.9471,
      longitude: 100.4172,
      isDefault: true,
      createdAt: now,
      updatedAt: now
    });
  }

  return { customer, phone, address };
}

export async function POST(request: Request) {
  const { session, response } = await requireRole(["ADMIN"]);
  if (response || !session) return response;

  try {
    await ensureRegistrationDatabase();
    await ensureOrderPaymentColumns();

    const body = await readJson<ManualWhatsappOrderBody>(request);
    if (!body) return fail("Invalid JSON body.", 400);

    const serviceName = body.serviceName?.trim();
    const finalPrice = Number(body.finalPrice ?? 0);
    const paymentMethod = body.paymentMethod === "CASH" ? "CASH" : "DIRECT_TRANSFER";
    if (!serviceName) return fail("Nama layanan wajib diisi.");
    if (!Number.isFinite(finalPrice) || finalPrice <= 0) return fail("Harga final wajib lebih dari Rp 0.");

    const now = new Date();
    const settings = await getAppSettings();
    const platformFee = Math.max(0, Number(body.platformFee ?? settings.platformFee ?? 0));
    const serviceFee = Math.max(0, finalPrice - platformFee);
    const { customer, phone, address } = await ensureCustomer(body, now);
    const partner = await ensureSerjafanOpsPartner(now);
    const orderId = createId("ord");
    const paymentProofImage = body.paymentProofImage?.trim() || null;
    const note = [
      body.note?.trim(),
      `Order dibuat admin dari hasil konsultasi WhatsApp. Harga final disepakati: Rp ${new Intl.NumberFormat("id-ID").format(finalPrice)}.`
    ]
      .filter(Boolean)
      .join("\n");

    await db.insert(orders).values({
      id: orderId,
      customerId: customer.id,
      partnerId: partner.id,
      serviceCategoryId: serviceName,
      addressTitle: address,
      addressSubtitle: phone,
      scheduleType: "ASAP",
      scheduleTitle: "Dikonfirmasi Admin",
      scheduleSubtitle: "Order dibuat dari konsultasi WhatsApp",
      note,
      paymentMethod,
      paymentStatus: paymentMethod === "CASH" ? "CASH_ON_DELIVERY" : paymentProofImage ? "VERIFIED" : "WAITING_VERIFICATION",
      paymentProofImage,
      paymentSenderName: body.paymentSenderName?.trim() || null,
      paymentReference: body.paymentReference?.trim() || "Order dari WhatsApp",
      promoCode: null,
      serviceFee,
      platformFee,
      discount: 0,
      total: finalPrice,
      status: "CONFIRMED",
      createdAt: now,
      updatedAt: now
    });

    await db.insert(orderTrackingEvents).values({
      id: createId("trk"),
      orderId,
      status: "CONFIRMED",
      title: "Order WhatsApp dibuat admin",
      description: "Harga final sudah dicatat admin SERJAFAN dari hasil konsultasi WhatsApp.",
      latitude: -0.9471,
      longitude: 100.4172,
      createdAt: now
    });

    await db.insert(notifications).values({
      id: createId("notif"),
      userId: customer.id,
      kind: "ORDER",
      title: "Order SERJAFAN resmi dibuat",
      body: `Admin membuat order ${orderId} untuk ${serviceName}. Total Rp ${new Intl.NumberFormat("id-ID").format(finalPrice)}.`,
      targetUrl: "/customer?screen=orders",
      isRead: false,
      createdAt: now,
      updatedAt: now
    });

    await writeAuditLog({
      session,
      action: "ADMIN_WHATSAPP_ORDER_CREATED",
      entityType: "order",
      entityId: orderId,
      metadata: { customerId: customer.id, serviceName, finalPrice, paymentMethod }
    });

    return ok({
      order: {
        id: orderId,
        customerId: customer.id,
        customerName: customer.name,
        serviceCategoryId: serviceName,
        paymentMethod,
        total: finalPrice,
        status: "CONFIRMED"
      }
    });
  } catch (error) {
    console.error("Create WhatsApp order failed", error);
    return fail(error instanceof Error ? error.message : "Order WhatsApp gagal dibuat.", 400);
  }
}
