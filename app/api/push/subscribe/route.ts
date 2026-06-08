import { fail, ok, readJson, requireSession } from "@/lib/api";
import { savePushSubscription } from "@/lib/push";

export const runtime = "nodejs";

type PushSubscriptionBody = {
  endpoint?: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

export async function POST(request: Request) {
  const { session, response } = await requireSession();
  if (response || !session) return response;

  const body = await readJson<PushSubscriptionBody>(request);
  if (!body?.endpoint || !body.keys?.p256dh || !body.keys.auth) {
    return fail("Subscription push tidak lengkap.", 400);
  }

  const id = await savePushSubscription({
    userId: session.user.id,
    endpoint: body.endpoint,
    p256dh: body.keys.p256dh,
    auth: body.keys.auth,
    userAgent: request.headers.get("user-agent")
  });

  return ok({ subscriptionId: id });
}
