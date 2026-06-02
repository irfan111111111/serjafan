import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appSettings } from "@/db/schema";

export type AdminConsoleSettings = {
  services: { id: string; name: string; fee: number; active: boolean; description: string }[];
  promos: { code: string; discount: number; active: boolean; note: string }[];
  partnerRequirements: { id: string; label: string; required: boolean }[];
  partnerFeatureCopy: { headline: string; description: string };
  customerFeatureCopy: { headline: string; description: string };
};

export const defaultAdminConsole: AdminConsoleSettings = {
  services: [
    { id: "svc_key", name: "Duplikat Kunci", fee: 30000, active: true, description: "Panggilan jasa duplikat kunci ke lokasi customer." },
    { id: "svc_shoes", name: "Cuci Sepatu", fee: 45000, active: true, description: "Jasa cuci sepatu pickup/dropoff." },
    { id: "svc_fan", name: "Servis Kipas", fee: 65000, active: true, description: "Perbaikan kipas dan elektronik ringan." }
  ],
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
  const row = await db.query.appSettings.findFirst({ where: eq(appSettings.key, "admin_console") });
  if (!row) return defaultAdminConsole;
  try {
    return { ...defaultAdminConsole, ...(JSON.parse(row.value) as Partial<AdminConsoleSettings>) };
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
