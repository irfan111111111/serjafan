import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { serviceCategories } from "@/lib/catalog";

export type AdminConsoleSettings = {
  services: { id: string; name: string; fee: number; active: boolean; description: string }[];
  promos: {
    code: string;
    discount: number;
    active: boolean;
    note: string;
    title?: string;
    description?: string;
    mediaUrl?: string;
    mediaType?: "image" | "video" | null;
  }[];
  partnerRequirements: { id: string; label: string; required: boolean }[];
  partnerFeatureCopy: { headline: string; description: string };
  customerFeatureCopy: { headline: string; description: string };
};

export const defaultAdminConsole: AdminConsoleSettings = {
  services: serviceCategories.map((service) => ({
    id: service.id,
    name: service.name,
    fee:
      service.id === "SC-DUPLIKAT"
        ? 30000
        : service.id === "SC-CUCI-SEPATU"
          ? 45000
          : service.id === "SC-SERVIS-KIPAS"
            ? 65000
            : service.id === "SC-FOTOKOPI"
              ? 5000
              : service.id === "SC-PLAT-NOMOR"
                ? 85000
                : service.id === "SC-CLEANING"
                  ? 75000
                  : 25000,
    active: true,
    description: service.description
  })),
  promos: [],
  partnerRequirements: [
    { id: "photo_service", label: "Foto tempat/foto jasa", required: true },
    { id: "selfie", label: "Foto diri pemilik jasa", required: true },
    { id: "ktp", label: "Foto KTP", required: true },
    { id: "portfolio", label: "Contoh hasil kerja", required: false }
  ],
  partnerFeatureCopy: {
    headline: "Gabung Partner SERJAFAN",
    description: "Daftar sebagai penyedia jasa terverifikasi dengan dokumen lengkap dan area layanan jelas."
  },
  customerFeatureCopy: {
    headline: "Customer App",
    description: "Alur customer sederhana seperti aplikasi layanan on-demand: cari jasa, pesan, tracking, chat, telepon, dan bayar."
  }
};

export async function getAdminConsoleSettings() {
  let row;
  try {
    row = await db.query.appSettings.findFirst({ where: eq(appSettings.key, "admin_console") });
  } catch {
    return defaultAdminConsole;
  }
  if (!row) return defaultAdminConsole;
  try {
    const stored = JSON.parse(row.value) as Partial<AdminConsoleSettings>;
    return {
      ...defaultAdminConsole,
      ...stored,
      services: stored.services?.length ? stored.services : defaultAdminConsole.services,
      promos: stored.promos ?? defaultAdminConsole.promos,
      partnerRequirements: stored.partnerRequirements?.length
        ? stored.partnerRequirements
        : defaultAdminConsole.partnerRequirements
    };
  } catch {
    return defaultAdminConsole;
  }
}

export async function saveAdminConsoleSettings(settings: AdminConsoleSettings) {
  const next = { ...defaultAdminConsole, ...settings };
  await db
    .insert(appSettings)
    .values({ key: "admin_console", value: JSON.stringify(next), updatedAt: new Date() })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value: JSON.stringify(next), updatedAt: new Date() }
    });
  return next;
}
