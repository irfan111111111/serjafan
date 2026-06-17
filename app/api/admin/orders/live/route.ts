import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { ok, requireRole } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { response } = await requireRole(["ADMIN"]);
  if (response) return response;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  const query = db.select().from(orders);
  const rows = status
    ? await query.where(eq(orders.status, status as never)).orderBy(desc(orders.createdAt))
    : await query.where(and(ne(orders.status, "DONE"), ne(orders.status, "CANCELLED"))).orderBy(desc(orders.createdAt));

  return ok({ orders: rows });
}
