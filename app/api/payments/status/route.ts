import { ok } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const provider = (process.env.PAYMENT_PROVIDER || "xendit").toLowerCase();
  const configured = provider === "xendit" && Boolean(process.env.XENDIT_SECRET_KEY && process.env.XENDIT_CALLBACK_TOKEN);

  return ok({
    provider,
    configured,
    requirements: {
      secretKey: Boolean(process.env.XENDIT_SECRET_KEY),
      callbackToken: Boolean(process.env.XENDIT_CALLBACK_TOKEN)
    },
    channels: ["QRIS", "BCA_VA", "BRI_VA", "BNI_VA", "MANDIRI_VA", "PERMATA_VA", "DANA", "OVO", "GOPAY", "SHOPEEPAY", "CARD"],
    webhookUrl: `${process.env.BETTER_AUTH_URL ?? "https://serjafan.vercel.app"}/api/payments/webhook`
  });
}
