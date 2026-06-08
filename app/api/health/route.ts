export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    status: "ok",
    service: "serjafan-api",
    timestamp: new Date().toISOString()
  });
}
