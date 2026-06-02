import { ok, requireRole } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const { response } = await requireRole(["ADMIN"]);
  if (response) return response;

  return ok({
    issues: [
      {
        id: "issue_1",
        title: "Customer request refund",
        status: "OPEN",
        priority: "HIGH"
      },
      {
        id: "issue_2",
        title: "Partner verification pending too long",
        status: "OPEN",
        priority: "MEDIUM"
      }
    ]
  });
}
