import { fail, ok, readJson, requireSession } from "@/lib/api";

export const runtime = "nodejs";

type PreviewBody = {
  serviceFee?: number;
  platformFee?: number;
  discount?: number;
};

export async function POST(request: Request) {
  const { session, response } = await requireSession();
  if (response || !session) return response;

  const body = await readJson<PreviewBody>(request);
  if (!body) return fail("Invalid JSON body.", 400);

  const serviceFee = body.serviceFee ?? 0;
  const platformFee = body.platformFee ?? 0;
  const discount = body.discount ?? 0;
  const total = Math.max(0, serviceFee + platformFee - discount);

  return ok({
    pricing: {
      serviceFee,
      platformFee,
      discount,
      total
    }
  });
}
