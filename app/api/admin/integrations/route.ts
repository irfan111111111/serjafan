import { ok, requireRole } from "@/lib/api";
import { cloudBackupReady } from "@/lib/cloud-backup";
import { objectStorageReady } from "@/lib/object-storage";
import { getProductionReadiness } from "@/lib/production-readiness";
import { uploadProviderReady } from "@/lib/uploads";

export const runtime = "nodejs";

function present(value?: string) {
  return Boolean(value && value.trim() && !value.startsWith("replace-with"));
}

async function checkGoogleMapsLive() {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!present(key)) return { ok: false, detail: "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY belum diisi." };
  const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=-0.9471,100.4172&key=${key}`, {
    cache: "no-store"
  });
  const payload = (await response.json().catch(() => ({}))) as { status?: string; error_message?: string };
  return {
    ok: response.ok && payload.status === "OK",
    status: payload.status ?? response.status,
    detail: payload.error_message ?? (payload.status === "OK" ? "Google Maps API aktif untuk koordinat Kota Padang." : "Google Maps API belum mengembalikan status OK.")
  };
}

async function checkXenditLive() {
  if (!present(process.env.XENDIT_SECRET_KEY)) return { ok: false, detail: "XENDIT_SECRET_KEY belum diisi." };
  const auth = Buffer.from(`${process.env.XENDIT_SECRET_KEY}:`).toString("base64");
  const response = await fetch("https://api.xendit.co/balance", {
    headers: { authorization: `Basic ${auth}` },
    cache: "no-store"
  });
  const payload = (await response.json().catch(() => ({}))) as { balance?: number; message?: string; error_code?: string };
  return {
    ok: response.ok && typeof payload.balance === "number",
    status: response.status,
    detail: response.ok ? "Xendit secret key valid untuk membaca balance." : payload.message ?? payload.error_code ?? "Xendit belum valid."
  };
}

export async function GET(request: Request) {
  const { response } = await requireRole(["ADMIN"]);
  if (response) return response;

  const live = new URL(request.url).searchParams.get("live") === "1";
  const readiness = getProductionReadiness();
  const integrations = {
    maps: {
      configured: present(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY),
      live: live ? await checkGoogleMapsLive() : null
    },
    xendit: {
      configured: present(process.env.XENDIT_SECRET_KEY) && present(process.env.XENDIT_CALLBACK_TOKEN),
      live: live ? await checkXenditLive() : null
    },
    upload: {
      configured: uploadProviderReady(),
      provider: objectStorageReady() && process.env.UPLOAD_PROVIDER === "s3" ? "s3" : present(process.env.CLOUDINARY_CLOUD_NAME) ? "cloudinary" : objectStorageReady() ? "s3" : "none"
    },
    push: {
      configured: present(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) && present(process.env.VAPID_PRIVATE_KEY) && present(process.env.VAPID_SUBJECT)
    },
    backup: {
      configured: cloudBackupReady(),
      objectStorageConfigured: objectStorageReady()
    }
  };

  return ok({ readiness, integrations });
}
