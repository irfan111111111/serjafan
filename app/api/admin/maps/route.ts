import { desc } from "drizzle-orm";
import { db } from "@/db";
import { orderTrackingEvents, orders, partnerProfiles } from "@/db/schema";
import { ok, requireRole } from "@/lib/api";

export const runtime = "nodejs";

const customerFallback = {
  label: "Customer",
  address: "Kota Padang, Sumatera Barat",
  latitude: -0.9471,
  longitude: 100.4172
};

const partnerCoordinates: Record<string, { latitude: number; longitude: number; address: string }> = {
  default: { latitude: -0.9471, longitude: 100.4172, address: "Kota Padang, Sumatera Barat" }
};

export async function GET() {
  const { response } = await requireRole(["ADMIN"]);
  if (response) return response;

  const [orderRows, partnerRows, trackingRows] = await Promise.all([
    db.select().from(orders).orderBy(desc(orders.createdAt)),
    db.select().from(partnerProfiles).orderBy(desc(partnerProfiles.updatedAt)),
    db.select().from(orderTrackingEvents).orderBy(desc(orderTrackingEvents.createdAt))
  ]);

  const liveOrders = orderRows.filter((order) => !["DONE", "CANCELLED"].includes(order.status)).slice(0, 25);
  const partnersById = new Map(partnerRows.map((partner) => [partner.id, partner]));
  const trackingByOrder = new Map<string, typeof trackingRows>();

  for (const event of trackingRows) {
    const existing = trackingByOrder.get(event.orderId) ?? [];
    existing.push(event);
    trackingByOrder.set(event.orderId, existing);
  }

  const pairs = liveOrders.map((order) => {
    const partnerId = order.partnerId ?? "";
    const partner = partnerId ? partnersById.get(partnerId) : null;
    const partnerPoint = partnerId ? partnerCoordinates[partnerId] ?? partnerCoordinates.default : partnerCoordinates.default;
    const orderEvents = trackingByOrder.get(order.id) ?? [];
    const customerEvent =
      orderEvents.find((event) => event.status === "PENDING" && event.latitude !== null && event.longitude !== null) ??
      orderEvents
        .slice()
        .reverse()
        .find((event) => event.latitude !== null && event.longitude !== null && event.status !== "PARTNER_READY" && event.status !== "ON_THE_WAY");

    return {
      orderId: order.id,
      status: order.status,
      serviceCategoryId: order.serviceCategoryId,
      updatedAt: order.updatedAt,
      customer: {
        id: order.customerId,
        label: customerFallback.label,
        address: [order.addressTitle, order.addressSubtitle].filter(Boolean).join(", ") || customerFallback.address,
        latitude: customerEvent?.latitude ?? customerFallback.latitude,
        longitude: customerEvent?.longitude ?? customerFallback.longitude,
        lastSignal: customerEvent?.createdAt ?? order.createdAt
      },
      partner: {
        id: partnerId || "unassigned",
        label: partner?.name ?? "Menunggu assignment SERJAFAN",
        address: partnerPoint.address,
        latitude: partnerPoint.latitude,
        longitude: partnerPoint.longitude,
        status: partner?.status ?? "ONLINE",
        lastSignal: partner?.updatedAt ?? order.updatedAt
      }
    };
  });

  return ok({
    pairs,
    summary: {
      monitoredOrders: pairs.length,
      monitoredCustomers: new Set(pairs.map((pair) => pair.customer.id)).size,
      monitoredPartners: new Set(pairs.map((pair) => pair.partner.id)).size
    }
  });
}
