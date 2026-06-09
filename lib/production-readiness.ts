export type ProductionCheck = {
  id: string;
  label: string;
  ready: boolean;
  detail: string;
};

function hasRealValue(value: string | undefined, placeholder: string) {
  return Boolean(value && value.trim() && !value.includes(placeholder) && !value.startsWith("replace-with"));
}

function cloudinaryReady() {
  return (
    hasRealValue(process.env.CLOUDINARY_CLOUD_NAME, "replace-with") &&
    hasRealValue(process.env.CLOUDINARY_API_KEY, "replace-with") &&
    hasRealValue(process.env.CLOUDINARY_API_SECRET, "replace-with")
  );
}

function s3Ready() {
  return (
    hasRealValue(process.env.S3_BUCKET, "replace-with") &&
    hasRealValue(process.env.S3_REGION, "replace-with") &&
    hasRealValue(process.env.S3_ACCESS_KEY_ID, "replace-with") &&
    hasRealValue(process.env.S3_SECRET_ACCESS_KEY, "replace-with")
  );
}

export function getProductionReadiness() {
  const checks: ProductionCheck[] = [
    {
      id: "database",
      label: "Database Turso",
      ready: hasRealValue(process.env.TURSO_DATABASE_URL, "your-database") && hasRealValue(process.env.TURSO_AUTH_TOKEN, "replace-with"),
      detail: "TURSO_DATABASE_URL dan TURSO_AUTH_TOKEN harus aktif di Vercel production."
    },
    {
      id: "auth",
      label: "Auth production",
      ready:
        hasRealValue(process.env.BETTER_AUTH_SECRET, "replace-with") &&
        hasRealValue(process.env.BETTER_AUTH_URL, "localhost") &&
        process.env.SERJAFAN_REQUIRE_AUTH === "1",
      detail: "BETTER_AUTH_SECRET, BETTER_AUTH_URL domain live, dan SERJAFAN_REQUIRE_AUTH=1 harus aktif."
    },
    {
      id: "payments",
      label: "Payment gateway Xendit",
      ready:
        (process.env.PAYMENT_PROVIDER || "xendit").toLowerCase() === "xendit" &&
        hasRealValue(process.env.XENDIT_SECRET_KEY, "replace-with") &&
        hasRealValue(process.env.XENDIT_CALLBACK_TOKEN, "replace-with"),
      detail: "XENDIT_SECRET_KEY dan XENDIT_CALLBACK_TOKEN merchant asli wajib diisi sebelum top up real."
    },
    {
      id: "maps",
      label: "Google Maps production",
      ready: hasRealValue(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, "replace-with"),
      detail: "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY harus aktif dan dibatasi untuk domain production."
    },
    {
      id: "domain",
      label: "Domain resmi",
      ready: Boolean(process.env.BETTER_AUTH_URL && !process.env.BETTER_AUTH_URL.includes("vercel.app") && !process.env.BETTER_AUTH_URL.includes("localhost")),
      detail: "Gunakan domain resmi, lalu update BETTER_AUTH_URL ke domain tersebut."
    },
    {
      id: "uploads",
      label: "Upload file production",
      ready: cloudinaryReady() || s3Ready(),
      detail: "Isi Cloudinary atau S3/R2 env agar foto, bukti transfer, promo media, chat image, dan ringtone tersimpan di cloud."
    },
    {
      id: "cloud-backup",
      label: "Backup cloud storage",
      ready: s3Ready() && process.env.BACKUP_TO_OBJECT_STORAGE === "1",
      detail: "Isi S3/R2 env dan BACKUP_TO_OBJECT_STORAGE=1 agar checkpoint/backup JSON tersimpan ke object storage."
    },
    {
      id: "push",
      label: "Web push notification",
      ready:
        hasRealValue(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, "replace-with") &&
        hasRealValue(process.env.VAPID_PRIVATE_KEY, "replace-with") &&
        hasRealValue(process.env.VAPID_SUBJECT, "replace-with"),
      detail: "VAPID key wajib untuk notifikasi web. Catatan: iOS/Android browser tetap punya batasan dibanding aplikasi native."
    },
    {
      id: "cron",
      label: "Cron checkpoint",
      ready: hasRealValue(process.env.CRON_SECRET, "replace-with"),
      detail: "CRON_SECRET direkomendasikan agar endpoint checkpoint harian tidak terbuka bebas."
    }
  ];

  const readyCount = checks.filter((check) => check.ready).length;
  return {
    ready: checks.every((check) => check.ready),
    score: Math.round((readyCount / checks.length) * 100),
    checks
  };
}
