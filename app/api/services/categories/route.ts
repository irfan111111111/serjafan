import { ok } from "@/lib/api";
import { serviceCategories } from "@/lib/catalog";
import { getAdminConsoleSettings } from "@/lib/admin-console";

export const runtime = "nodejs";

export async function GET() {
  const consoleSettings = await getAdminConsoleSettings();
  const adminCategories = consoleSettings.services
    .filter((service) => service.active)
    .map((service) => ({
      id: service.id,
      name: service.name,
      icon: "Wrench",
      basePrice: service.fee,
      description: service.description
    }));

  return ok({ categories: [...adminCategories, ...serviceCategories] });
}
