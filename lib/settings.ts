import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appSettings } from "@/db/schema";

export type SerjafanSettings = {
  platformFee: number;
  promoCode: string;
  promoDiscount: number;
  serviceArea: string;
  supportPhone: string;
  manualBankName: string;
  manualBankAccount: string;
  manualBankHolder: string;
  manualDanaNumber: string;
  manualDanaName: string;
  manualQrisName: string;
};

export const defaultSettings: SerjafanSettings = {
  platformFee: 3000,
  promoCode: "",
  promoDiscount: 0,
  serviceArea: "Kota Padang",
  supportPhone: "+62xxxxxxxxxx",
  manualBankName: "Bank SERJAFAN",
  manualBankAccount: "Isi nomor rekening usaha SERJAFAN di admin",
  manualBankHolder: "SERJAFAN",
  manualDanaNumber: "Isi nomor DANA SERJAFAN di admin",
  manualDanaName: "Isi nama akun DANA SERJAFAN di admin",
  manualQrisName: "QRIS usaha SERJAFAN"
};

export async function getAppSettings() {
  let row;
  try {
    row = await db.query.appSettings.findFirst({
      where: eq(appSettings.key, "global")
    });
  } catch {
    return defaultSettings;
  }

  if (!row) return defaultSettings;

  try {
    return { ...defaultSettings, ...(JSON.parse(row.value) as Partial<SerjafanSettings>) };
  } catch {
    return defaultSettings;
  }
}

export async function saveAppSettings(settings: SerjafanSettings) {
  const merged = { ...defaultSettings, ...settings };
  const next = {
    ...defaultSettings,
    ...merged,
    promoCode: merged.promoCode.trim().toUpperCase(),
    serviceArea: merged.serviceArea.trim(),
    supportPhone: merged.supportPhone.trim(),
    manualBankName: merged.manualBankName.trim(),
    manualBankAccount: merged.manualBankAccount.trim(),
    manualBankHolder: merged.manualBankHolder.trim(),
    manualDanaNumber: merged.manualDanaNumber.trim(),
    manualDanaName: merged.manualDanaName.trim(),
    manualQrisName: merged.manualQrisName.trim()
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
