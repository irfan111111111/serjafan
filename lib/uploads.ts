import crypto from "node:crypto";

export type UploadPurpose = "profile" | "partner-document" | "topup-proof" | "chat" | "promo" | "ringtone";

const purposeLimits: Record<UploadPurpose, number> = {
  profile: 1_500_000,
  "partner-document": 2_500_000,
  "topup-proof": 2_500_000,
  chat: 2_500_000,
  promo: 8_000_000,
  ringtone: 5_000_000
};

const allowedMimePrefixes: Record<UploadPurpose, string[]> = {
  profile: ["image/"],
  "partner-document": ["image/", "application/pdf"],
  "topup-proof": ["image/"],
  chat: ["image/"],
  promo: ["image/", "video/"],
  ringtone: ["audio/"]
};

export class UploadConfigurationError extends Error {
  constructor() {
    super("Cloudinary belum dikonfigurasi. Isi CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, dan CLOUDINARY_API_SECRET di Vercel.");
  }
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) throw new Error("File upload harus dikirim sebagai data URL base64 yang valid.");
  const mime = match[1];
  const buffer = Buffer.from(match[2], "base64");
  return { mime, buffer };
}

function assertAllowed(purpose: UploadPurpose, mime: string, size: number) {
  if (!allowedMimePrefixes[purpose].some((prefix) => mime === prefix || mime.startsWith(prefix))) {
    throw new Error("Tipe file tidak didukung untuk menu ini.");
  }
  if (size > purposeLimits[purpose]) {
    throw new Error(`Ukuran file terlalu besar. Maksimal ${Math.round(purposeLimits[purpose] / 1_000_000)} MB.`);
  }
}

function cloudinaryResourceType(mime: string) {
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "video";
  if (mime === "application/pdf") return "raw";
  return "image";
}

export function uploadProviderReady() {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

export async function uploadDataUrlToCloudinary(input: {
  dataUrl: string;
  purpose: UploadPurpose;
  folder?: string;
  publicId?: string;
}) {
  const { mime, buffer } = parseDataUrl(input.dataUrl);
  assertAllowed(input.purpose, mime, buffer.byteLength);

  if (!uploadProviderReady()) throw new UploadConfigurationError();

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;
  const timestamp = Math.round(Date.now() / 1000);
  const folder = `serjafan/${(input.folder || input.purpose).replace(/[^a-z0-9/_-]/gi, "-").toLowerCase()}`;
  const publicId = input.publicId?.replace(/[^a-z0-9/_-]/gi, "-").toLowerCase();

  const signaturePayload = [`folder=${folder}`, publicId ? `public_id=${publicId}` : null, `timestamp=${timestamp}`]
    .filter(Boolean)
    .join("&");
  const signature = crypto.createHash("sha1").update(`${signaturePayload}${apiSecret}`).digest("hex");
  const form = new FormData();
  const blob = new Blob([buffer], { type: mime });
  form.set("file", blob, publicId || `serjafan-${timestamp}`);
  form.set("api_key", apiKey);
  form.set("timestamp", String(timestamp));
  form.set("folder", folder);
  form.set("signature", signature);
  if (publicId) form.set("public_id", publicId);

  const resourceType = cloudinaryResourceType(mime);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
    method: "POST",
    body: form
  });
  const payload = (await response.json()) as {
    secure_url?: string;
    public_id?: string;
    resource_type?: string;
    bytes?: number;
    error?: { message?: string };
  };

  if (!response.ok || !payload.secure_url) {
    throw new Error(payload.error?.message || "Upload ke Cloudinary gagal.");
  }

  return {
    url: payload.secure_url,
    publicId: payload.public_id,
    resourceType: payload.resource_type ?? resourceType,
    bytes: payload.bytes ?? buffer.byteLength,
    mime
  };
}
