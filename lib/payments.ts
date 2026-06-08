import { db } from "@/db";
import { notifications, paymentIntents, walletTransactions, wallets } from "@/db/schema";
import { createId } from "@/lib/api";
import { eq } from "drizzle-orm";

export const paymentChannels = [
  "BANK_TRANSFER",
  "QRIS",
  "BCA_VA",
  "BRI_VA",
  "BNI_VA",
  "MANDIRI_VA",
  "PERMATA_VA",
  "DANA",
  "OVO",
  "GOPAY",
  "SHOPEEPAY",
  "CARD"
] as const;

export type PaymentChannel = (typeof paymentChannels)[number];

export type CreatePaymentInput = {
  intentId: string;
  amount: number;
  channel: PaymentChannel;
  customer: {
    name: string;
    email: string;
  };
};

export type CreatedPayment = {
  provider: string;
  providerReference: string;
  checkoutUrl?: string | null;
  qrString?: string | null;
  rawPayload?: unknown;
};

export class PaymentConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentConfigurationError";
  }
}

const xenditMethodByChannel: Record<PaymentChannel, string[]> = {
  BANK_TRANSFER: ["BCA"],
  QRIS: ["QRIS"],
  BCA_VA: ["BCA"],
  BRI_VA: ["BRI"],
  BNI_VA: ["BNI"],
  MANDIRI_VA: ["MANDIRI"],
  PERMATA_VA: ["PERMATA"],
  DANA: ["DANA"],
  OVO: ["OVO"],
  GOPAY: ["GOPAY"],
  SHOPEEPAY: ["SHOPEEPAY"],
  CARD: ["CREDIT_CARD"]
};

export function assertPaymentConfigured() {
  const provider = (process.env.PAYMENT_PROVIDER || "xendit").toLowerCase();
  if (provider !== "xendit") {
    throw new PaymentConfigurationError("Payment provider belum didukung. Gunakan PAYMENT_PROVIDER=xendit.");
  }
  if (!process.env.XENDIT_SECRET_KEY) {
    throw new PaymentConfigurationError("XENDIT_SECRET_KEY belum diisi di Vercel Environment Variables.");
  }
  if (!process.env.XENDIT_CALLBACK_TOKEN) {
    throw new PaymentConfigurationError("XENDIT_CALLBACK_TOKEN belum diisi di Vercel Environment Variables.");
  }
}

export async function createGatewayPayment(input: CreatePaymentInput): Promise<CreatedPayment> {
  assertPaymentConfigured();

  const auth = Buffer.from(`${process.env.XENDIT_SECRET_KEY}:`).toString("base64");
  const response = await fetch("https://api.xendit.co/v2/invoices", {
    method: "POST",
    headers: {
      authorization: `Basic ${auth}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      external_id: input.intentId,
      amount: input.amount,
      payer_email: input.customer.email,
      description: `Top Up SERJAFAN Rp ${new Intl.NumberFormat("id-ID").format(input.amount)}`,
      currency: "IDR",
      payment_methods: xenditMethodByChannel[input.channel],
      success_redirect_url: `${process.env.BETTER_AUTH_URL ?? "https://serjafan.vercel.app"}/customer`,
      failure_redirect_url: `${process.env.BETTER_AUTH_URL ?? "https://serjafan.vercel.app"}/customer`
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message ?? "Gateway pembayaran menolak transaksi.");
  }

  return {
    provider: "xendit",
    providerReference: payload.id ?? input.intentId,
    checkoutUrl: payload.invoice_url ?? null,
    qrString: payload.qr_string ?? null,
    rawPayload: payload
  };
}

export async function settlePaymentIntent(intentId: string, providerPayload: unknown) {
  const intent = await db.query.paymentIntents.findFirst({
    where: eq(paymentIntents.id, intentId)
  });
  if (!intent || intent.status === "PAID") return intent;

  const wallet = await db.query.wallets.findFirst({
    where: eq(wallets.id, intent.walletId)
  });
  if (!wallet) throw new Error("Wallet payment intent tidak ditemukan.");

  const now = new Date();
  const nextBalance = wallet.balance + intent.amount;

  await db.update(wallets).set({ balance: nextBalance, updatedAt: now }).where(eq(wallets.id, wallet.id));
  await db
    .update(paymentIntents)
    .set({
      status: "PAID",
      rawPayload: JSON.stringify(providerPayload),
      updatedAt: now
    })
    .where(eq(paymentIntents.id, intent.id));
  await db.insert(walletTransactions).values({
    id: createId("wtx"),
    walletId: wallet.id,
    type: "TOPUP",
    amount: intent.amount,
    description: `Top Up ${intent.channel} sukses`,
    createdAt: now
  });
  await db.insert(notifications).values({
    id: createId("notif"),
    userId: intent.userId,
    kind: "SYSTEM",
    title: "Top Up berhasil",
    body: `Saldo SERJAFAN bertambah Rp ${new Intl.NumberFormat("id-ID").format(intent.amount)}.`,
    targetUrl: "/customer",
    isRead: false,
    createdAt: now,
    updatedAt: now
  });

  return { ...intent, status: "PAID" as const };
}
