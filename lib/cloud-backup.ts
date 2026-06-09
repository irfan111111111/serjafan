import { objectStorageReady, putObject } from "@/lib/object-storage";

export function cloudBackupReady() {
  return objectStorageReady() && process.env.BACKUP_TO_OBJECT_STORAGE === "1";
}

export async function uploadJsonBackup(input: { name: string; payload: unknown }) {
  if (!cloudBackupReady()) return null;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return putObject({
    key: `serjafan/backups/${input.name}-${timestamp}.json`,
    body: JSON.stringify(input.payload, null, 2),
    contentType: "application/json",
    cacheControl: "private, max-age=0"
  });
}
