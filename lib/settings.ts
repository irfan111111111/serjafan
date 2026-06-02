import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appSettings } from "@/db/schema";

export type SerjafanSettings = {
  platformFee: number;
  promoCode: string;
  promoDiscount: number;
  serviceArea: string;
  supportPhone: string;
};

export const defaultSettings: SerjafanSettings = {
  platformFee: 3000,
  promoCode: "",
  promoDiscount: 0,
  serviceArea: "Kota Padang",
  supportPhone: "+62xxxxxxxxxx"
};

export async function getAppSettings() {
  const row = await db.query.appSettings.findFirst({
    where: eq(appSettings.key, "global")
  });

  if (!row) return defaultSettings;

  try {
    return { ...defaultSettings, ...(JSON.parse(row.value) as Partial<SerjafanSettings>) };
  } catch {
    return defaultSettings;
  }
}

export async function saveAppSettings(settings: SerjafanSettings) {
  const next = {
    ...defaultSettings,
    ...settings,
    promoCode: settings.promoCode.trim().toUpperCase(),
    serviceArea: settings.serviceArea.trim(),
    supportPhone: settings.supportPhone.trim()
  };
  await db
    .insert(appSettings)
    .values({
      key: "global",
      value: JSON.stringify(next),
      updatedAt: new Date()
    })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: {
        value: JSON.stringify(next),
        updatedAt: new Date()
      }
    });
  return next;
}
