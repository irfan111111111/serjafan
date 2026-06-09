import { ok, requireRole } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { uploadJsonBackup } from "@/lib/cloud-backup";
import { recordError } from "@/lib/monitoring";
import { uploadDataUrlToStorage } from "@/lib/uploads";

export const runtime = "nodejs";

const tinyPng =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";

async function runStep<T>(name: string, fn: () => Promise<T>) {
  try {
    const result = await fn();
    return { name, ok: true, result };
  } catch (error) {
    return {
      name,
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export async function POST() {
  const { session, response } = await requireRole(["ADMIN"]);
  if (response || !session) return response;

  const startedAt = new Date();
  const uploadCheck = await runStep("upload", () =>
    uploadDataUrlToStorage({
      dataUrl: tinyPng,
      purpose: "profile",
      folder: "health-check",
      publicId: `storage-health-${startedAt.getTime()}`
    })
  );

  const backupCheck = await runStep("backup", () =>
    uploadJsonBackup({
      name: "storage-health-check",
      payload: {
        source: "SERJAFAN storage self-test",
        createdAt: startedAt.toISOString(),
        actorId: session.user.id
      }
    }).then((result) => {
      if (!result) throw new Error("Cloud backup belum aktif. Isi S3/R2 env dan BACKUP_TO_OBJECT_STORAGE=1.");
      return result;
    })
  );

  const allOk = uploadCheck.ok && backupCheck.ok;
  await writeAuditLog({
    session,
    action: allOk ? "STORAGE_SELF_TEST_PASSED" : "STORAGE_SELF_TEST_FAILED",
    entityType: "integration",
    entityId: "storage",
    severity: allOk ? "INFO" : "WARN",
    metadata: { uploadCheck, backupCheck }
  });

  if (!allOk) {
    await recordError({
      source: "admin.integrations.storage-test",
      error: new Error("Storage self-test failed"),
      severity: "WARN",
      session,
      metadata: { uploadCheck, backupCheck }
    });
  }

  return ok({
    ready: allOk,
    uploadCheck,
    backupCheck,
    nextAction: allOk
      ? "Storage dan backup cloud sudah aktif."
      : "Isi Cloudinary atau S3/R2 untuk upload, lalu isi S3/R2 + BACKUP_TO_OBJECT_STORAGE=1 untuk backup cloud."
  });
}
