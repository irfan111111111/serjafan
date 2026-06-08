import { fail, getSession, ok, readJson } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { uploadDataUrlToCloudinary, UploadConfigurationError, type UploadPurpose } from "@/lib/uploads";

export const runtime = "nodejs";

type UploadBody = {
  dataUrl?: string;
  purpose?: UploadPurpose;
  folder?: string;
};

const uploadPurposes: UploadPurpose[] = ["profile", "partner-document", "topup-proof", "chat", "promo", "ringtone"];

export async function POST(request: Request) {
  const session = await getSession();

  const body = await readJson<UploadBody>(request);
  if (!body?.dataUrl || !body.purpose) return fail("dataUrl dan purpose wajib diisi.");
  if (!uploadPurposes.includes(body.purpose)) return fail("Purpose upload tidak didukung.");
  if (!session && body.purpose !== "profile" && body.purpose !== "partner-document") {
    return fail("Login wajib untuk upload jenis file ini.", 401);
  }

  try {
    const upload = await uploadDataUrlToCloudinary({
      dataUrl: body.dataUrl,
      purpose: body.purpose,
      folder: body.folder
    });

    await writeAuditLog({
      session,
      action: "UPLOAD_CREATED",
      entityType: "upload",
      entityId: upload.publicId,
      metadata: { purpose: body.purpose, bytes: upload.bytes, mime: upload.mime }
    });

    return ok({ upload });
  } catch (error) {
    await writeAuditLog({
      session,
      action: "UPLOAD_FAILED",
      entityType: "upload",
      severity: "WARN",
      metadata: { purpose: body.purpose, message: error instanceof Error ? error.message : "Upload gagal" }
    });

    return fail(
      error instanceof Error ? error.message : "Upload gagal.",
      error instanceof UploadConfigurationError ? 503 : 422
    );
  }
}
